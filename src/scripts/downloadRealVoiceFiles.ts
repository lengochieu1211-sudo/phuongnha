import fs from 'fs';
import path from 'path';
import { VOICE_MANIFEST } from '../lib/voiceManifest';

async function downloadRealVoiceFiles() {
  console.log('🎙️ STARTING REAL FEMALE VIETNAMESE VOICE DOWNLOAD...');
  const publicDir = path.resolve(process.cwd(), 'public');
  const targetDir = path.join(publicDir, 'audio', 'voice', 'vi-female');

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  let totalFiles = 0;
  let downloadedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  // Gather all entries to process sequentially
  const entries: { category: string; subKey: string; path: string; text: string }[] = [];
  Object.entries(VOICE_MANIFEST).forEach(([category, subCat]) => {
    Object.entries(subCat).forEach(([subKey, entry]) => {
      entries.push({
        category,
        subKey,
        path: entry.path,
        text: entry.text,
      });
    });
  });

  totalFiles = entries.length;
  console.log(`Found ${totalFiles} manifest entries to check/download.`);

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const fileName = path.basename(entry.path);
    const filePath = path.join(targetDir, fileName);

    let existsAndValid = false;
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (stats.size >= 1024) {
        // Read first 3 bytes to verify it's not a corrupted UTF-8 replacement character
        const fd = fs.openSync(filePath, 'r');
        const header = Buffer.alloc(3);
        fs.readSync(fd, header, 0, 3, 0);
        fs.closeSync(fd);
        if (!(header[0] === 0xEF && header[1] === 0xBF && header[2] === 0xBD)) {
          existsAndValid = true;
        }
      }
    }

    if (existsAndValid) {
      skippedCount++;
      continue;
    }

    // Download the file
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=${encodeURIComponent(entry.text)}`;
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const buffer = await response.arrayBuffer();
      const nodeBuffer = Buffer.from(buffer);

      if (nodeBuffer.length < 1024) {
        throw new Error(`Downloaded file too small: ${nodeBuffer.length} bytes`);
      }

      fs.writeFileSync(filePath, nodeBuffer);
      downloadedCount++;
      console.log(`[${i + 1}/${totalFiles}] Downloaded real voice: ${entry.category}.${entry.subKey} -> ${fileName} (${nodeBuffer.length} bytes)`);

      // Gentle rate-limiting pause
      await new Promise((resolve) => setTimeout(resolve, 80));
    } catch (err: any) {
      failedCount++;
      console.error(`❌ Failed to download ${entry.category}.${entry.subKey}: ${err?.message || err}`);
    }
  }

  console.log('===================================================');
  console.log('🎙️ DOWNLOAD WORKFLOW SUMMARY:');
  console.log(`TOTAL ENTRIES: ${totalFiles}`);
  console.log(`DOWNLOADED NEW: ${downloadedCount}`);
  console.log(`SKIPPED (VALID): ${skippedCount}`);
  console.log(`FAILED: ${failedCount}`);
  console.log('===================================================');
}

downloadRealVoiceFiles();
