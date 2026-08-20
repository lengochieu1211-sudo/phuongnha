import fs from 'node:fs';
import path from 'node:path';

/**
 * V5.28 - Lossless-looking ASCII FBX size optimizer.
 * Does not decimate polygons or rewrite hierarchy/material assignments.
 * It removes FBX comment lines, trims trailing whitespace and quantizes
 * oversized decimal payloads in geometry arrays to 5 decimals
 * (transform arrays to 6 decimals).
 *
 * Keep indentation/newlines: Three.js FBXLoader's ASCII parser is
 * line/indentation sensitive.
 */

const root = process.cwd();
const assetRoot = path.join(root, 'public', 'assets');
const precisionByArray = {
  Vertices: 5,
  Normals: 5,
  NormalsW: 5,
  UV: 5,
  UVs: 5,
  Colors: 5,
  Tangents: 5,
  Binormals: 5,
  Weights: 5,
  Transform: 6,
  TransformLink: 6,
};

const arrayOpen = /^\s*([A-Za-z0-9_]+):\s*\*\d+\s*\{/;
const decimalNumber = /(?<![\w.])[-+]?(?:\d+\.\d+|\d+\.\d*|\.\d+)(?:[eE][-+]?\d+)?/g;

function formatNumber(raw, precision) {
  const value = Number(raw);
  if (!Number.isFinite(value)) return raw;
  const epsilon = 0.5 * 10 ** -precision;
  const safe = Math.abs(value) < epsilon ? 0 : value;
  let out = safe.toFixed(precision).replace(/0+$/, '').replace(/\.$/, '');
  if (out === '-0' || out === '+0' || out === '') out = '0';
  return out;
}

function listFbx(dir) {
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...listFbx(full));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.fbx')) result.push(full);
  }
  return result;
}

for (const file of listFbx(assetRoot)) {
  const before = fs.statSync(file).size;
  const source = fs.readFileSync(file, 'utf8').replace(/(?:\r?\n)+$/, '');
  const lines = source.split(/\r?\n/);
  const output = [];
  let active = null;

  for (let line of lines) {
    if (line.trimStart().startsWith(';')) continue;

    const open = line.match(arrayOpen);
    if (open && precisionByArray[open[1]] !== undefined) {
      active = { key: open[1], depth: 1 };
      output.push(line.trimEnd());
      continue;
    }

    if (active) {
      const precision = precisionByArray[active.key];
      line = line.replace(decimalNumber, (value) => formatNumber(value, precision));
      active.depth += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      if (active.depth <= 0) active = null;
    }

    output.push(line.trimEnd());
  }

  fs.writeFileSync(file, `${output.join('\n')}\n`, 'utf8');
  const after = fs.statSync(file).size;
  const saved = before > 0 ? ((before - after) / before) * 100 : 0;
  console.log(`[fbx] ${path.relative(root, file)}: ${before} -> ${after} bytes (${saved.toFixed(1)}% smaller)`);
}
