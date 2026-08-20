# V5.27 – Voice MP3 + FBX Smooth Swap

## Voice MP3

- Verified all 366 bundled MP3 files are decodable MPEG audio.
- All 366 are mono 22.05 kHz synthetic fallback clips; they are not human recordings.
- MP3 fallback is now **disabled by default** instead of being selected automatically.
- Female mode now prefers:
  1. verified Vietnamese female Web Speech voice;
  2. Vietnamese system voice that is not identified as male;
  3. bundled MP3 only when the user explicitly enables **MP3 offline dự phòng**.
- Reduced artificial pitch fallback from 1.45x to 1.16x for neutral Vietnamese system voices.
- Removed eager preload of `common` + `camera` MP3 categories at app startup.
- MP3 HTMLAudio now uses `preload=metadata` and restarts cleanly at 0 after priority pre-emption.
- Voice Settings explains the real source and exposes the MP3 fallback toggle.

## FBX visual jitter carried from the preceding report

- Garage keeps the currently visible vehicle until the newly selected FBX is fully ready.
- Removed old `current -> fallback -> FBX` visual flash.
- Rapid car swipes wait 320 ms before starting a heavy FBX load/parse.
- Removed automatic `scrollIntoView({behavior:'smooth'})` after every car selection.
- Selector uses drag/swipe as the primary movement; drag cannot trigger an accidental vehicle click.
- Static Avatar keeps one WebGL renderer/canvas while switching FBXs.
- Avatar models are double-buffered: old model stays visible until the new model is ready.
- Parsed avatar FBX templates are cached for the session; switching back no longer reparses the same model.

## Important limitation

FBXLoader still parses ASCII FBX on the browser main thread. V5.27 eliminates the black/blink swap and repeated reparsing, but the *first ever parse* of a large FBX can still create a short CPU hitch. A true zero-blocking first parse would require converting the models to optimized GLB/glTF or using an offline preprocessing pipeline.
