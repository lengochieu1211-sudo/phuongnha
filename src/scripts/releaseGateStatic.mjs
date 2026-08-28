import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
let failed = false;
const fail = (msg) => { failed = true; console.error(`[release-static] FAIL: ${msg}`); };
const ok = (msg) => console.log(`[release-static] ${msg}`);
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(root, rel));

// Source hygiene that is valid both before and after dependency installation.
// node_modules/dist/.git are delivery-artifact exclusions and are checked separately
// by the release workflow/ZIP verifier; npm check legitimately runs with node_modules present.
for (const rel of ['assets-source-heavy']) {
  if (exists(rel)) fail(`forbidden deploy/source directory present: ${rel}`);
}

const pkg = JSON.parse(read('package.json'));
if (pkg.version !== '5.43.0') fail(`package version is ${pkg.version}, expected 5.43.0`);
const vite = read('vite.config.ts');
const workflow = read('.github/workflows/deploy.yml');
if (!vite.includes("base: '/phuongnha/'")) fail('vite.config.ts base is not /phuongnha/');
if (!workflow.includes('--base=/phuongnha/')) fail('GitHub Pages workflow does not build with --base=/phuongnha/');
if (!workflow.includes('npm run check')) fail('GitHub Pages workflow does not run the release gate check');
if (!workflow.includes('pull_request:')) fail('GitHub workflow must certify pull requests before main');
if (!workflow.includes("if: github.event_name == 'push' && github.ref == 'refs/heads/main'")) fail('GitHub Pages deploy is not guarded to main pushes only');
if (!workflow.includes("contains(github.event.head_commit.message, '[deploy]')")) fail('GitHub Pages deploy requires explicit [deploy] opt-in marker');
if (!exists('package-lock.json') && workflow.includes('npm ci')) fail('workflow uses npm ci without package-lock.json');
ok(`package lock policy: ${exists('package-lock.json') ? 'package-lock present' : 'no npm lock; workflow uses npm install'}`);

// Resolve every relative source import without requiring node_modules.
const sourceFiles = [];
const walk = (dir) => {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full);
    else sourceFiles.push(full);
  }
};
walk(path.join(root, 'src'));
for (const rel of ['vite.config.ts']) sourceFiles.push(path.join(root, rel));
let importCount = 0;
const importRe = /(?:from\s*|import\s*\()\s*['"](\.{1,2}\/[^'"]+)['"]/g;
const candidates = (base) => [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.jsx`, `${base}.mjs`, `${base}.json`, `${base}.css`, path.join(base, 'index.ts'), path.join(base, 'index.tsx'), path.join(base, 'index.js')];
for (const file of sourceFiles.filter((f) => /\.(?:ts|tsx|js|jsx|mjs)$/.test(f))) {
  const text = fs.readFileSync(file, 'utf8');
  for (const m of text.matchAll(importRe)) {
    importCount++;
    const base = path.resolve(path.dirname(file), m[1]);
    if (!candidates(base).some(fs.existsSync)) fail(`missing relative import ${m[1]} from ${path.relative(root, file)}`);
  }
}
ok(`relative imports checked: ${importCount}`);

// Runtime asset/audio references present in source. Ignore templates/dynamic expressions.
let assetRefCount = 0;
const assetRefs = new Set();
const assetRe = /['"`]((?:assets|audio)\/[A-Za-z0-9_./()\-]+\.(?:fbx|glb|gltf|webp|png|jpe?g|svg|mp3|wav|json))['"`]/g;
for (const file of sourceFiles.filter((f) => /\.(?:ts|tsx|js|jsx|mjs)$/.test(f))) {
  const text = fs.readFileSync(file, 'utf8');
  for (const m of text.matchAll(assetRe)) assetRefs.add(m[1]);
}
for (const rel of assetRefs) {
  assetRefCount++;
  if (!exists(path.join('public', rel))) fail(`missing runtime asset public/${rel}`);
}
ok(`runtime asset/audio refs checked: ${assetRefCount}; missing: ${failed ? 'see failures above' : 0}`);

// CarModelId union must exactly match CAR_CATALOG IDs, with no duplicates.
const types = read('src/types.ts');
const carUnionMatch = types.match(/export type CarModelId\s*=([\s\S]*?);\s*\n\s*export type CarCategory/);
if (!carUnionMatch) fail('cannot parse CarModelId union');
const carTypeIds = carUnionMatch ? [...carUnionMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]) : [];
const carData = read('src/lib/racing/CarData.ts');
const catalogMatch = carData.match(/export const CAR_CATALOG: CarConfig\[\] = \[([\s\S]*?)\n\];/);
if (!catalogMatch) fail('cannot parse CAR_CATALOG');
const catalogIds = catalogMatch ? [...catalogMatch[1].matchAll(/^\s{4}id:\s*'([^']+)'/gm)].map((m) => m[1]) : [];
const duplicates = catalogIds.filter((id, i) => catalogIds.indexOf(id) !== i);
if (duplicates.length) fail(`duplicate CAR_CATALOG ids: ${[...new Set(duplicates)].join(', ')}`);
const missingCatalog = carTypeIds.filter((id) => !catalogIds.includes(id));
const extraCatalog = catalogIds.filter((id) => !carTypeIds.includes(id));
if (missingCatalog.length || extraCatalog.length) fail(`CarModelId/CAR_CATALOG mismatch missing=[${missingCatalog}] extra=[${extraCatalog}]`);
ok(`CarModelId/CAR_CATALOG: ${catalogIds.length} IDs`);

// External FBX map: file exists, declared byte metadata is exact, >15 MiB has desktop_only policy,
// and all deployed FBX files remain below 25 MiB.
const external = read('src/lib/racing/ExternalCarModelLoader.ts');
const configBlock = external.match(/const EXTERNAL_CARS:[\s\S]*?= \{([\s\S]*?)\n\};\n\nconst EXTERNAL_ASSET_BYTES/);
const bytesBlock = external.match(/const EXTERNAL_ASSET_BYTES:[\s\S]*?= \{([\s\S]*?)\n\};/);
if (!configBlock || !bytesBlock) fail('cannot parse external car config/bytes');
const bytesMap = new Map(bytesBlock ? [...bytesBlock[1].matchAll(/^\s{2}([a-zA-Z0-9_]+):\s*(\d+),/gm)].map((m) => [m[1], Number(m[2])]) : []);
const configs = [];
if (configBlock) {
  const keyRe = /^\s{2}([a-zA-Z0-9_]+): \{/gm;
  const matches = [...configBlock[1].matchAll(keyRe)];
  for (let i = 0; i < matches.length; i++) {
    const id = matches[i][1];
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : configBlock[1].length;
    const chunk = configBlock[1].slice(start, end);
    const file = chunk.match(/file:\s*'([^']+)'/)?.[1];
    const policy = chunk.match(/policy:\s*'([^']+)'/)?.[1];
    if (!file || !policy) { fail(`external config incomplete: ${id}`); continue; }
    configs.push({ id, file, policy });
  }
}
let largest = { id: '', bytes: 0 };
for (const cfg of configs) {
  const rel = path.join('public', cfg.file);
  if (!exists(rel)) { fail(`external model missing: ${rel}`); continue; }
  const size = fs.statSync(path.join(root, rel)).size;
  const declared = bytesMap.get(cfg.id);
  if (declared !== size) fail(`EXTERNAL_ASSET_BYTES mismatch ${cfg.id}: declared ${declared}, actual ${size}`);
  if (size > 15 * 1024 * 1024 && cfg.policy !== 'desktop_only') fail(`${cfg.id} is ${(size/1024/1024).toFixed(2)} MiB but policy=${cfg.policy}`);
  if (size > largest.bytes) largest = { id: cfg.id, bytes: size };
}
if (configs.length !== bytesMap.size) fail(`external config count ${configs.length} != byte map count ${bytesMap.size}`);
const allPublicFiles = [];
const walkPublic = (dir) => {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walkPublic(full); else allPublicFiles.push(full);
  }
};
walkPublic(path.join(root, 'public'));
for (const f of allPublicFiles.filter((f) => f.toLowerCase().endsWith('.fbx'))) {
  const size = fs.statSync(f).size;
  if (size >= 25 * 1024 * 1024) fail(`runtime FBX >=25 MiB: ${path.relative(root, f)} ${(size/1024/1024).toFixed(2)} MiB`);
}
ok(`external models checked: ${configs.length}; largest: ${largest.id} ${(largest.bytes/1024/1024).toFixed(2)} MiB`);

// Voice pack static integrity using the manifest paths, without tsx/node_modules.
const voiceManifest = read('src/lib/voiceManifest.ts');
const voicePaths = [...voiceManifest.matchAll(/path:\s*'([^']+\.mp3)'/g)].map((m) => m[1]);
let voiceInvalid = 0;
for (const rel of voicePaths) {
  const full = path.join(root, 'public', rel);
  if (!fs.existsSync(full)) { voiceInvalid++; fail(`voice missing: public/${rel}`); continue; }
  const stat = fs.statSync(full);
  if (stat.size < 1024) { voiceInvalid++; fail(`voice too small: public/${rel} (${stat.size})`); continue; }
  const fd = fs.openSync(full, 'r'); const h = Buffer.alloc(3); fs.readSync(fd, h, 0, 3, 0); fs.closeSync(fd);
  if (h[0] === 0xEF && h[1] === 0xBF && h[2] === 0xBD) { voiceInvalid++; fail(`voice corruption sentinel: public/${rel}`); }
}
ok(`voice files checked: ${voicePaths.length}; invalid: ${voiceInvalid}`);

// Basic high-confidence secret patterns. Public placeholder env variable names are allowed.
const textExt = new Set(['.ts','.tsx','.js','.jsx','.mjs','.json','.md','.yml','.yaml','.html','.css','.txt','.example','.gitignore','.gitattributes']);
const textFiles = [];
const walkText = (dir) => {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules','dist','.git','public'].includes(ent.name) && ent.isDirectory()) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walkText(full);
    else if (textExt.has(path.extname(ent.name)) || ent.name === '.env.example') textFiles.push(full);
  }
};
walkText(root);
const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/,
  /\bAIza[0-9A-Za-z_-]{30,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
];
for (const f of textFiles) {
  const text = fs.readFileSync(f, 'utf8');
  for (const re of secretPatterns) if (re.test(text)) fail(`possible secret ${re} in ${path.relative(root, f)}`);
}
ok(`secret scan files: ${textFiles.length}`);

// Required screen/game markers. This is a routing/static smoke gate, not a runtime browser claim.
const app = read('src/App.tsx');
const requiredScreens = ['racing','ludo','ninja','goalkeeper','magicacademy','sweetzombie','chickenblaster','fruitslash','starcatcher','dance','workout_session','mimic','petcare','dressing'];
for (const screen of requiredScreens) if (!app.includes(`'${screen}'`)) fail(`App route marker missing: ${screen}`);
const companion = read('src/components/CompanionSelectorModal.tsx');
if (!app.includes('CompanionSelectorModal') || !companion.includes('onSelectCompanion')) fail('Companion selector integration marker missing');
ok(`required route markers checked: ${requiredScreens.length + 1}`);

// P0 local 2P invariants: camera must never be a hard gate, P2 is a real local racer,
// only one dual-crop Pose instance is allocated, and split-screen uses the shared race renderer.
const duoSetup = read('src/components/racing/DuoRaceSetup.tsx');
if (/disabled=\{!props\.p1Detected\s*\|\|\s*!props\.p2Detected\}/.test(duoSetup)) fail('2P setup still hard-blocks Continue on pose detection');
if (!duoSetup.includes('TIẾP TỤC CHỌN ĐƯỜNG ĐUA')) fail('2P Continue action marker missing');
const dualPose = read('src/lib/racing/DualRacePoseController.ts');
if (dualPose.includes('poseP1') || dualPose.includes('poseP2')) fail('dual race controller still allocates duplicate Pose instances');
if ((dualPose.match(/new \(window as any\)\.Pose/g) || []).length !== 1) fail('dual race controller must allocate exactly one Pose instance');
const raceEngine = read('src/lib/racing/RaceEngine.ts');
const physics = read('src/lib/racing/VehiclePhysics.ts');
if (!raceEngine.includes('initLocalSecondPlayer') || !raceEngine.includes('setSecondPlayerSteeringInput')) fail('RaceEngine local P2 control path missing');
if (!physics.includes('isLocalPlayer: true') || !physics.includes('updateLocalSecondPlayer')) fail('P2 is not represented as a real local player in physics');
const raceCanvas = read('src/components/racing/Race3DCanvas.tsx');
if ((raceCanvas.match(/new THREE\.WebGLRenderer/g) || []).length !== 1) fail('Race3DCanvas must use exactly one WebGLRenderer/context');
const raceScreen = read('src/components/racing/BaraSpeedRacingGame.tsx');
for (const key of ['KeyA','KeyD','KeyS','KeyE','KeyQ','ArrowLeft','ArrowRight','ArrowDown','Enter','Slash']) {
  if (!raceScreen.includes(`'${key}'`)) fail(`2P manual fallback key missing: ${key}`);
}
for (const handler of ['onManualSteer','onManualBrake','onManualNitro','onManualShield']) {
  if (!raceScreen.includes(handler)) fail(`2P touch/manual fallback handler missing: ${handler}`);
}
if (!raceScreen.includes("currentSubScreen === 'duo_setup'") || !raceScreen.includes('void startCamera()') || !raceScreen.includes('else stopCamera()')) fail('Racing sub-screen camera lifecycle gate missing');
const appCameraList = app.match(/const cameraScreens: GameScreen\[\] = \[([\s\S]*?)\];/)?.[1] || '';
if (appCameraList.includes("'racing'")) fail('App still keeps camera alive for the whole racing screen');
ok('P0 2P invariants: no pose gate, one Pose, one WebGL renderer, P1/P2 local fallback paths and camera cleanup present');

// Save keys are deliberately pinned so V5.43 does not strand V5.42 browser saves.
const progression = read('src/utils/progression.ts');
const racing = read('src/lib/racing/CarData.ts');
const racingScreen = read('src/components/racing/BaraSpeedRacingGame.tsx');
for (const [name, text, key] of [
  ['adventure progress', progression, "phuong_nha_adventure_progress"],
  ['racing profile', racing, "bara_speed_racing_profile_v1"],
  ['racing settings', racingScreen, "phuong_nha_race_settings_v54"],
]) if (!text.includes(key)) fail(`legacy save key changed/missing: ${name} (${key})`);
ok('legacy save/storage keys preserved');

if (failed) process.exit(1);
console.log('[release-static] PASS');
