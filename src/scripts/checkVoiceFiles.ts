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
    voiceStyle: 'female_offline_vi_optional_fallback',
    generator: 'bundled offline Vietnamese female-formant synthetic fallback (manual opt-in)',
    totalFiles,
    validFiles,
    invalidFiles,
    missingFiles,
    checkedAt: new Date().toISOString(),
    note: 'Synthetic offline fallback pack, not a human recording. V5.27 keeps MP3 fallback disabled by default; Web Speech Vietnamese non-male/female voices are preferred.',
  }, null, 2));

  if (invalidFiles > 0 || missingFiles > 0) {
    console.log('\n⚠️ CHƯA TẠO ĐƯỢC AUDIO THẬT!');
    console.log('Lý do: Môi trường phát triển AI Studio tự động tạo các file im lặng làm placeholder.');
    console.log('Chế độ Giọng Nữ sẽ không tự chuyển sang giọng hệ thống để tránh đổi sang giọng nam trên Android/Chrome.');
    console.log('Hãy bổ sung/khôi phục file MP3 hợp lệ trong /public/audio/voice/vi-female/ trước khi phát hành.');
  } else {
    console.log('\n🎉 TOÀN BỘ FILE MP3 OFFLINE ĐÃ HỢP LỆ VÀ SẴN SÀNG LÀM GIỌNG DỰ PHÒNG!');
  }
  console.log('===================================================');
}

checkVoiceFiles();
