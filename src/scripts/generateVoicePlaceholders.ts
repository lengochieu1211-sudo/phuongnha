/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { VOICE_MANIFEST } from '../lib/voiceManifest';

// Valid base64 encoding of a 1-second silent MP3 file
const SILENT_MP3_BASE64 = 
  '//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACSAALCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCw' +
  'AAAFNleHQAAAACAAAAAAAAYgAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQxAMAAADvYAr4AQAAGOwB' +
  'bwAgAALXvBfxhgAAXleC3jDAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

function generateVoicePlaceholders() {
  console.log('🎙️ GENERATING DEVELOPMENT OFFLINE VOICE CLIPS PLACEHOLDERS...');
  const publicDir = path.resolve(process.cwd(), 'public');
  const targetDir = path.join(publicDir, 'audio', 'voice', 'vi-female');

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const mp3Buffer = Buffer.from(SILENT_MP3_BASE64, 'base64');
  let generatedCount = 0;

  Object.values(VOICE_MANIFEST).forEach((category) => {
    Object.values(category).forEach((entry) => {
      const fileName = path.basename(entry.path);
      const filePath = path.join(targetDir, fileName);

      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, mp3Buffer);
        generatedCount++;
      }
    });
  });

  console.log(`🎉 SUCCESS: Generated ${generatedCount} offline placeholder MP3 files in /public/audio/voice/vi-female/!`);
}

generateVoicePlaceholders();
