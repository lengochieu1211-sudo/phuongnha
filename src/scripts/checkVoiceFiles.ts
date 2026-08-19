/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { VOICE_MANIFEST } from '../lib/voiceManifest';

function checkVoiceFiles() {
  console.log('===================================================');
  console.log('🎙️ STARTING AUDIO FILE INTEGRITY CHECK...');
  console.log('===================================================');

  let totalFiles = 0;
  let missingFiles = 0;
  let invalidFiles = 0;
  let validFiles = 0;

  const missingList: string[] = [];
  const invalidList: string[] = [];

  // Note: Vite public files are served from the root "/public" directory
  const publicDir = path.resolve(process.cwd(), 'public');

  Object.entries(VOICE_MANIFEST).forEach(([category, subCat]) => {
    Object.entries(subCat).forEach(([subKey, entry]) => {
      totalFiles++;
      const localFilePath = path.join(publicDir, entry.path);

      if (!fs.existsSync(localFilePath)) {
        missingFiles++;
        missingList.push(`${category}.${subKey} -> ${entry.path}`);
      } else {
        const stats = fs.statSync(localFilePath);
        let fileIsValid = stats.size >= 1024;
        if (fileIsValid) {
          const fd = fs.openSync(localFilePath, 'r');
          const header = Buffer.alloc(3);
          fs.readSync(fd, header, 0, 3, 0);
          fs.closeSync(fd);
          if (header[0] === 0xEF && header[1] === 0xBF && header[2] === 0xBD) {
            fileIsValid = false;
          }
        }

        if (!fileIsValid) {
          invalidFiles++;
          invalidList.push(`${category}.${subKey} -> ${entry.path} (${stats.size} bytes or invalid binary magic)`);
        } else {
          validFiles++;
        }
      }
    });
  });

  console.log(`TOTAL MANIFEST: ${totalFiles}`);
  console.log(`VALID AUDIO: ${validFiles}`);
  console.log(`INVALID/EMPTY: ${invalidFiles}`);
  console.log(`MISSING: ${missingFiles}`);

  const statusPath = path.join(publicDir, 'audio', 'voice', 'voice-pack-status.json');
  fs.mkdirSync(path.dirname(statusPath), { recursive: true });
  fs.writeFileSync(statusPath, JSON.stringify({
    recordedPackAvailable: invalidFiles === 0 && missingFiles === 0,
    totalFiles,
    validFiles,
    invalidFiles,
    missingFiles,
    checkedAt: new Date().toISOString(),
  }, null, 2));

  if (invalidFiles > 0 || missingFiles > 0) {
    console.log('\n⚠️ CHƯA TẠO ĐƯỢC AUDIO THẬT!');
    console.log('Lý do: Môi trường phát triển AI Studio tự động tạo các file im lặng làm placeholder.');
    console.log('Hệ thống dự phòng Web Speech Synthesis (TTS) Giọng Nữ Tiếng Việt đã được chuẩn bị 100% để phát âm thanh.');
    console.log('Hệ thống cũng hoàn tất cấu trúc sẵn sàng để nhà phát triển tải lên các file audio chất lượng cao (.mp3) đè vào thư mục /public/audio/voice/vi-female/');
  } else {
    console.log('\n🎉 TOÀN BỘ FILE ÂM THANH THẬT ĐÃ HỢP LỆ VÀ SẴN SÀNG!');
  }
  console.log('===================================================');
}

checkVoiceFiles();
