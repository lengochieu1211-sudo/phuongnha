# Validation V5.27

- `tsc --noEmit`: 165 diagnostics, unchanged from V5.26; all are missing dependency/type environment errors (`react`, `three`, `lucide-react`, Node/Vite types) because `node_modules` is not bundled.
- Changed-file TypeScript transpile/syntax check: **0 errors** for:
  - `src/lib/VoiceGuideService.ts`
  - `src/lib/RecordedVoiceService.ts`
  - `src/components/VoiceSettingsModal.tsx`
  - `src/components/racing/GarageScreen.tsx`
  - `src/components/fashion/StaticFbxAvatar.tsx`
- Voice files: 366/366 MP3 files decode successfully with ffprobe; sample rate 22050 Hz, mono.
- GitHub Pages base remains `/phuongnha/`.
- `.github/workflows/deploy.yml` retained.
- `npm run build`: cannot execute in this extracted source because dependencies are not installed; it stops at `tsx: not found`. This is an environment/dependency error, not a newly detected source syntax error.
