import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const publicDir = path.join(root, 'public');
const required = [
  'assets/cars/canis-mesa-cronoz.fbx',
  'assets/cars/v12-sv-supercar.fbx',
  'assets/cars/roadster-883-3d.fbx',
  'assets/cars/vespa-studio-3d.fbx',
  'assets/cars/s14-sport-coupe.fbx',
  'assets/cars/rescue-truck-hauler.fbx',
  'assets/cars/xedap-city-bike.fbx',
  'assets/avatars/ng1-human-static.fbx',
  'assets/avatars/child-girl-static.fbx',
  'assets/pc-hd/asphalt-hd.webp',
  'assets/pc-hd/carbon-hd.webp',
  'audio/voice/voice-pack-status.json',
];



// V5.28: keep optimized ASCII FBX assets from accidentally regressing to the huge originals.
// Limits include a small margin above the validated V5.28 outputs.
const maxFbxBytes: Record<string, number> = {
  'assets/cars/canis-mesa-cronoz.fbx': 4_100_000,
  'assets/cars/v12-sv-supercar.fbx': 22_000_000,
  'assets/cars/roadster-883-3d.fbx': 6_500_000,
  'assets/cars/vespa-studio-3d.fbx': 13_700_000,
  'assets/cars/s14-sport-coupe.fbx': 5_800_000,
  'assets/cars/rescue-truck-hauler.fbx': 30_000_000,
  'assets/cars/xedap-city-bike.fbx': 18_300_000,
  'assets/avatars/ng1-human-static.fbx': 700_000,
  'assets/avatars/child-girl-static.fbx': 9_600_000,
};

let failed = false;
for (const rel of required) {
  const full = path.join(publicDir, ...rel.split('/'));
  if (!fs.existsSync(full)) {
    console.error(`[asset] MISSING: public/${rel}`);
    failed = true;
    continue;
  }
  const exactName = path.basename(full);
  const siblings = fs.readdirSync(path.dirname(full));
  if (!siblings.includes(exactName)) {
    console.error(`[asset] CASE MISMATCH: public/${rel}`);
    failed = true;
  }
  const size = fs.statSync(full).size;
  if (size <= 0) {
    console.error(`[asset] EMPTY: public/${rel}`);
    failed = true;
  } else {
    const maxBytes = maxFbxBytes[rel];
    if (maxBytes && size > maxBytes) {
      console.error(`[asset] FBX TOO LARGE: public/${rel} (${size} > ${maxBytes} bytes). Run npm run optimize:fbx.`);
      failed = true;
    } else {
      console.log(`[asset] OK ${rel} (${size} bytes)`);
    }
  }
}

const vite = fs.readFileSync(path.join(root, 'vite.config.ts'), 'utf8');
const workflow = fs.readFileSync(path.join(root, '.github/workflows/deploy.yml'), 'utf8');
if (!workflow.includes('--base=/phuongnha/')) {
  console.error('[asset] GitHub Pages workflow must build with --base=/phuongnha/');
  failed = true;
}
if (!vite.includes('defineConfig')) {
  console.error('[asset] vite.config.ts is invalid/unexpected');
  failed = true;
}
if (failed) process.exit(1);
console.log('[asset] GitHub Pages base /phuongnha/ and required asset set verified.');
