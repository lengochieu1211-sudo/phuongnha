import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const publicDir = path.join(root, 'public');
const required = [
  'assets/cars/canis-mesa-cronoz.fbx',
  'assets/cars/v12-sv-supercar.fbx',
  'assets/cars/roadster-883-3d.fbx',
  'assets/cars/vespa-studio-3d.fbx',
  'assets/avatars/ng1-human-static.fbx',
  'assets/pc-hd/asphalt-hd.webp',
  'assets/pc-hd/carbon-hd.webp',
  'audio/voice/voice-pack-status.json',
];

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
    console.log(`[asset] OK ${rel} (${size} bytes)`);
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
