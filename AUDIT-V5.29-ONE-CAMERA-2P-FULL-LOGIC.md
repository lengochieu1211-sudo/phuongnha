# AUDIT V5.29 — 1 CAMERA / 2 PLAYER RACING + FULL LOGIC AUDIT

Version: 5.29.0

## 1. Racing modes

The racing hub now explicitly lets the player choose:

- **1 PLAYER** — keeps the original single-player pipeline. Dual pose detection is not loaded/run.
- **2 PLAYERS · 1 CAMERA** — local head-to-head mode using one physical camera, P1 on the **left side of the mirrored preview**, P2 on the **right side**.

2P mode uses **upper body only**. It does not require ankles/legs. The dual controller mainly needs shoulders + both wrists and uses hips only as optional support for torso steering.

## 2. Gesture guide added

The racing setup and guide now visibly explain:

- 👐 Steering: tilt the two-hand/wrist line left/right.
- 🙌 Nitro: raise both hands above the shoulders.
- 🪽 Shield: spread both arms.
- 🙇 Brake: lower shoulders / duck clearly.

The 2P calibration page also states P1 left / P2 right and tells players to stand apart. If one player briefly disappears, that ID is held for a short grace window; after that the missing player is marked missing instead of being replaced by the other person.

## 3. One-camera 2P tracking architecture

The current project uses legacy `@mediapipe/pose`, which is a single-person detector. V5.29 does **not falsely claim** that this legacy API has native multi-pose support.

Instead, `DualRacePoseController`:

1. takes the single real camera frame;
2. splits it into two halves;
3. runs one lightweight Pose instance per half;
4. maps landmarks back to the full mirrored camera coordinate system;
5. keeps P1/P2 identity stable by screen side.

Adaptive pose inference targets:

- Desktop: about 18 pose FPS.
- Android TV/tablet: about 12 pose FPS.
- Phone: about 9 pose FPS.

Game rendering remains independent from pose inference.

## 4. Split-screen rendering

2P does **not** create two complete Three.js scenes.

It uses:

- one scene;
- one renderer;
- shared road/scenery/AI/models;
- two cameras;
- `setViewport()` + `setScissor()` for split screen.

Landscape uses a vertical split. Portrait uses a horizontal split and the P2 HUD moves to the lower half.

2P adaptive reductions:

- desktop target render cap ~55 FPS;
- non-desktop target render cap ~36 FPS;
- lower DPR in 2P;
- shadows disabled on non-desktop 2P;
- reduced scenery density/particles;
- heavy external FBX is not parsed for 2P on phone/TV; procedural fallback is used.

## 5. Logic bugs found and fixed during full audit

### Racing

- **Brake vs Auto-gas**: brake previously lost to auto-throttle, so S/down/duck could fail to slow the car. Brake now has higher priority for P1 and P2.
- **Missing 2P player**: a player who disappears from camera is steered neutral and braked instead of continuing indefinitely on auto-gas.
- **P1/P2 collision double-count risk**: P1 generic AI collision processing now skips the local P2 entry; P1↔P2 collision is resolved once in the dedicated local-player path.
- **Local collision feedback**: P1 and P2 both receive collision pulse/damage/shake when the local collision is accepted by their collision cooldown rules.
- **Race profile duplicate write**: profile statistics were being persisted by both RaceEngine and the React screen. Engine now computes the result; the screen owns persistence.
- **Invalid best-lap 0**: a P2 win before P1 completes a timed lap can no longer overwrite an old best-lap record with `0`.
- **2P AI count**: Quick Race uses P1 + P2 + 2 normal AI, rather than accidentally keeping the old 3 AI plus P2.
- **2P item pickup**: pickups are awarded to whichever local player is closest; Nitro/Shield are applied to that player.
- **Keyboard pause stale closure**: Escape/P now checks the engine phase rather than stale modal state.
- **Dual pose resource load**: multi-pose inference is paused outside Duo Setup/live Race. During track selection/loading the lightweight pose models can stay warm without submitting camera frames, preventing a MediaPipe initialization hitch during 3-2-1. Garage/menu/podium release the dual detector.
- **Camera watchdog**: if the dual detector provides no new frame for ~900 ms during racing, both cars enter neutral steering + brake safety state.

### Camera routing / calibration

- Pet Care contained gesture logic but App previously stopped camera on that screen. Camera routing now includes Pet Care.
- Racing and Ludo were being blocked by App-level single-player calibration before their own mode selection. They now manage their own calibration flow internally.
- In 2P mode the normal single-pose loop is actually suspended, reducing CPU/GPU contention.
- Camera PiP now draws the live raw camera video while the normal single-pose processor is suspended, so the PiP does not freeze in 2P mode.

### Pose Mimic

- Prevented success and timer expiry from advancing two poses in the same timing edge.
- Fixed the final successful pose not being included in the completion bonus due to asynchronous React state.
- Cheer/hold timers are cleaned up.

### Fashion Show

- Fixed the final snapshot using stale `score`/`poseStreak`, which could omit the last pose from final score/reward/high score.
- Added cleanup for flash/confetti/transition timers.

### Workout / Pet Care

- Workout delayed safety voice timer now clears when exiting.
- Pet Care feedback/action timers now clear on cleanup.

### Android TV mode

- `?tv=1` now forces the TV graphics profile rather than only changing UI sizing.
- TV instructions now match the actual upper-body camera rules and document one-camera 2P placement.

## 6. Runtime/static validation performed

- 81 TS/TSX/config source files parsed with TypeScript 5.8.3 transpile diagnostics: **0 syntax errors**.
- Relative local import resolution: **0 missing relative imports**.
- Full `tsc --noEmit`: 174 diagnostics, all attributable to unavailable installed dependencies/types in this sandbox:
  - TS2307 missing external modules: 111
  - TS2875 missing React JSX runtime: 51
  - TS2580 Node globals/types: 10
  - TS2552 `Buffer`: 1
  - TS2304 `__dirname`: 1
- `npm install` was attempted for 180 seconds but the environment timed out and produced no `node_modules`. Therefore a real Vite `npm run build` cannot honestly be marked PASS here.
- 397 literal `public/assets` / `public/audio` references scanned: **0 missing**.
- Required FBX/HD/audio status assets: **PASS** and within V5.28 optimized FBX size limits.
- 366/366 voice MP3 files exist, are >1 KB, and `ffprobe` decodes all 366 as MP3 / 22050 Hz / mono: **0 invalid**.
- GitHub Pages workflow still builds with `--base=/phuongnha/`: **PASS**.
- `setInterval` users: 19 files, all include cleanup.
- Three.js renderers: StaticFbxAvatar, GarageScreen and Race3DCanvas all dispose renderer and force context loss on teardown.
- Fashion RAF loops use an `active` guard on cleanup instead of explicit RAF id cancellation.

### Pure racing smoke tests

Node smoke tests using transpiled pure racing modules verified:

- car catalog: 22 entries;
- all six race tracks return finite 72-point waypoint sets;
- brake overrides throttle for both local players;
- P1 generic AI collision loop does not treat P2 as an AI collision;
- fresh P1↔P2 overlap produces one local collision pulse for each player;
- RaceEngine initializes P1 + P2 + two normal AI and responds to P2 steering input.

## 7. Hardware recommendations

These are practical targets, not hard browser guarantees. Actual performance depends on browser/WebView, thermal throttling, camera driver and GPU.

### PC — 1 player minimum

- 64-bit Windows/macOS/Linux
- modern 4-core CPU
- 8 GB RAM
- WebGL2-capable integrated GPU
- current Chrome/Edge
- 720p webcam

### PC — 2 players recommended

- modern 6-core CPU or better
- 16 GB RAM
- Intel Iris Xe / GTX 1050–1650 / RX 560-class GPU or better
- current Chrome/Edge with hardware acceleration enabled
- 720p30 webcam minimum; 1080p30 is useful only if the browser/camera remains stable
- enough distance for both players to fit in frame with head, shoulders, elbows and wrists visible

### Android phone — 1 player minimum

- Android 10+
- 4 GB RAM
- WebGL2
- current Chrome
- front/rear camera that can provide a stable 720p stream

### Android phone — 2 players recommended

- Android 12+
- 6 GB RAM or more
- Snapdragon 778G / Snapdragon 7-series, Dimensity 900-class or better is a sensible target
- landscape orientation strongly recommended
- keep the device cool; thermal throttling is more important than peak benchmark score
- heavy FBX/shadows are automatically reduced/fallback in 2P

### Android TV / Xiaomi TV Box

Direct one-camera 2P requires the browser to expose the USB webcam through `getUserMedia()` and support WebGL2.

- 2 GB RAM: reasonable for 1P Balanced; 2P is best-effort and uses aggressive fallback.
- **4 GB RAM+ recommended for 2P**.
- modern Android TV browser/Chromium/WebView with WebGL2.
- USB webcam 720p30 recommended.
- 2P pose inference target ~12 FPS; render target ~36 FPS with lower DPR, reduced scenery, shadows off and heavy FBX fallback.

If the Android TV browser does not expose the USB webcam, direct camera control cannot be forced by source code. The game must fall back to another control mode / 1P, or the screen can be mirrored/cast from a camera-capable device. A separate “phone computes pose and TV renders independently” network-controller architecture is **not implemented in V5.29**.

## 8. Known model limits unchanged

- `Child+girl` and `ng1` still have no skeleton/skin/animation rig. They can follow whole-body transform but cannot truthfully retarget independent arms/legs until rigged.
- Some imported vehicle wheel hierarchies/pivots remain intentionally static where unsafe to infer. This avoids wheel explosion/jumping.

## 9. What cannot be physically proven in this sandbox

A real two-person webcam session, Android TV USB camera driver behavior, thermal throttling, touch latency and actual WebGL FPS cannot be physically exercised here. The source logic, data paths, pure race engine behavior, asset integrity, TypeScript syntax and packaging are validated; real-device acceptance testing is still required after GitHub Pages deployment.
