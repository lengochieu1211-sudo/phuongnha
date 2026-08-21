## V5.5 – AR body-rig + Companion Pro + sửa nguồn giọng nữ

- **Gương Phép Thuật:** áo tự fit vai/hông/thân, xoay phối cảnh theo hướng người; ống tay tách vai→khuỷu→cổ tay và tự đi theo tay. Có Z-order tay gần/tay xa và tự giảm tần suất rig trên điện thoại/TV để đỡ lag.
- **Bạn Đồng Hành:** dựng lại Cinnamoroll, Kuromi và Capybara theo đặc điểm hình dáng tham khảo; sửa material/gradient thiếu và bỏ balô mặc định của Capybara. Toàn bộ vẫn là SVG procedural nhẹ, không nhúng ảnh web.
- **Giọng nữ:** ưu tiên giọng nữ Việt tự nhiên của thiết bị; 366 MP3 hiện có chỉ được dùng làm **fallback tổng hợp offline**, không còn mô tả sai là bản thu người thật và không tự đổi sang giọng nam.
- Xem chi tiết: `AUDIT-V5.5.md`.

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

## V5.4 – Giọng nữ offline + Racing Ultra + cấu hình Điện thoại/TV/PC

- **Giọng nữ đóng sẵn trong app:** 366 MP3 hợp lệ (~4.4 MB audio), không còn 221 placeholder cũ. Các câu thoại tĩnh và hướng dẫn hiện có đã được ánh xạ sang pack offline. Khi chọn **Giọng nữ**, app không tự rơi về Web Speech của thiết bị nữa để tránh đổi sang giọng nam giữa game.
- Lưu ý chất lượng: pack hiện tại là **giọng nữ tổng hợp offline (female-formant)**, không phải giọng người thật/neural studio. Male/Em bé vẫn dùng Web Speech theo voice có trên thiết bị.
- **GitHub Pages:** audio offline tự ghép `BASE_URL`, nên đường dẫn vẫn đúng khi app chạy dưới `/phuongnha/`.
- **Xe đua:** thêm mức `ultra` trên PC với thân xe aerodynamic nhiều segment hơn, canopy kính, nội thất, intake, diffuser fin, DRL, panel line, mâm/phanh chi tiết, vật liệu clearcoat và phản xạ môi trường. Camera `Close Chase` đưa xe gần hơn để nhìn rõ.
- **Đồ họa:** có 4 nút `Tự động / Điện thoại / TV-Mi Box / PC đẹp`. Tự động nhận nhóm thiết bị. Trong lúc đua, nếu FPS giảm, renderer tự hạ pixel ratio; nếu cần sẽ tắt shadow trước khi giảm chi tiết xe người chơi.
- **Ưu tiên hiệu năng:** điện thoại/TV vẫn giữ xe người chơi ở mức High nhưng giảm shadow, mật độ cảnh, texture và chi tiết xe AI. PC đẹp mới bật Ultra + bóng 2048 + cảnh dày hơn.


This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/23852ece-ae4d-444b-a6ac-86708908f446

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Nâng cấp 2026-08-19 – Racing / AR Fashion / Camera Challenges

- Nâng chi tiết xe 3D: kính hông, gương chiếu hậu, đường ghép cửa, ốp hông, vòm bánh, lưới tản nhiệt, biển số, đèn emissive, bóng mềm và ACES tone mapping trong gara.
- Gương Phép Thuật AR không còn dùng emoji làm lớp quần áo trực tiếp. Camera dùng SVG vector có gradient, bóng, chi tiết vật liệu cho nón/mũ, vương miện, kính, áo/đầm/giáp, giày trái-phải, cánh và balô. Emoji chỉ dùng làm icon danh mục.
- Thêm 3 mini game camera chơi thật: Ninja Né Chướng Ngại, Thủ Môn Siêu Nhí, Học Viện Phép Thuật. Các game dùng chung CameraPoseContext/calibration để tránh mở nhiều camera song song.
- Giữ các nâng cấp trước: xe hiển thị lớn hơn, HUD tránh che xe, tối ưu landscape điện thoại, voice nữ/nam/em bé theo preset đúng logic.

Lưu ý: source vẫn là WebGL/Three.js procedural, không nhúng model xe thương mại có bản quyền hoặc model 3D nặng từ Internet. Mục tiêu là tăng độ thật nhưng vẫn chạy được trên điện thoại.

## Audit bổ sung – tự động chất lượng đồ họa theo thiết bị

- Thêm `GraphicsProfile` tự nhận diện theo mobile/desktop, RAM trình duyệt, số luồng CPU, WebGL MAX_TEXTURE_SIZE và kích thước landscape.
- 3 mức tự động: **3D cao (PC mạnh)** / **Cân bằng** / **Nhẹ (mobile/tablet yếu)**.
- PC mạnh: model xe procedural chi tiết hơn (nội thất, ghế, vô-lăng, tay nắm, badge, DRL, mâm nhiều segment và bu-lông), texture asphalt HD 1024 và carbon HD, shadow map 2048, pixel ratio tới 2x, nhiều scenery/particle hơn.
- Mobile yếu: giảm pixel ratio, tắt bóng nặng, giảm scenery/particle và camera AR xuống 480×360 để giữ FPS/nhiệt/pin.
- Khi đua, nếu FPS trung bình sau vài giây thấp hơn khoảng 38 FPS, renderer tự hạ pixel ratio và tắt shadow mà không cần thoát game.
- Sửa calibration cho Ninja/Thủ môn/Học viện phép thuật; bật Landscape/PiP camera cho cả 3 game mới.
- Sửa 3 mini game camera để vừa màn hình landscape thấp và nút **Chơi lại** reset tại chỗ, không reload toàn app.

## V4 – Adaptive realistic racing model audit

- Desktop/high graphics now uses a sculpted procedural aerodynamic body shell instead of relying on stacked box primitives for the visible upper body.
- Vehicle proportions vary by JDM, GT, supercar, hypercar, EV and roadster families (width, length, roofline, wheelbase, track width and canopy).
- High mode adds curved glass canopy, belt-line surround, larger detailed wheels/sidewalls/multi-spoke rims, brake hardware, interior and showroom/race environment reflections.
- Lights, exhaust, splitter, diffuser, spoiler, nitro and wheels now position relative to each vehicle's body proportions.
- Mobile/lite mode keeps the existing lightweight geometry to protect frame rate.
- Fixed duplicate requestAnimationFrame scheduling in the race renderer and disabled race shadows when the detected graphics profile says shadows are off.
- High-quality race/garage scenes use local procedural cube reflections; no external HDR/model download is required.

## V5.29 — 1 camera / 2-player racing + full logic audit

V5.29 adds an explicit **1 Player / 2 Players · 1 Camera** choice for racing. Two-player mode uses one shared camera with P1 on the left and P2 on the right, upper-body-only pose control, visible gesture instructions, stable side-based identity, split-screen rendering with one shared Three.js scene, separate HUDs, adaptive device performance and safety braking when a player disappears.

The same pass also fixes brake priority with Auto-gas, duplicate race-profile persistence, invalid `0` best-lap saves, P1/P2 collision double-processing, Pet Care camera routing, racing/Ludo calibration routing, Pose Mimic double-advance/final bonus, Fashion Show stale final score, several timer cleanup issues, and TV `?tv=1` graphics detection.

See `AUDIT-V5.29-ONE-CAMERA-2P-FULL-LOGIC.md` and `VALIDATION-V5.29.md` for validation and recommended PC/phone/Android TV hardware.

## V5.32 — Bulk FBX library import + optimization

- Added a new import library for extra user FBX assets under `assets-source/model-library/` with 3 buckets: `characters`, `vehicles`, `props`.
- Imported and optimized the new uploaded FBX files by trimming ASCII noise/comments and reducing numeric precision where safe, to lower parse size without deleting core mesh content.
- Generated `FBX_LIBRARY_MANIFEST_V5.32.json` with per-file size before/after, material/texture counts and usage notes.
- Generated `AUDIT-V5.32-BULK-FBX-LIBRARY-OPTIMIZATION.md` summarizing the new assets and which ones are still heavy enough that TV/mobile should use fallback logic or a future lowpoly/GLB version.
- This pass prepares the extra models cleanly inside the source tree so they can be wired into Garage, Racing, Fashion Mirror or scene props in later passes without re-uploading them.


## V5.34 — FBX scenery layer

Race scenery can now layer small real FBX props over the existing procedural world without blocking gameplay. Mountain uses the optimized Pine Tree model and optionally a Tank on Desktop High; City Night uses lightweight police/ambulance props; Coast/Sky can show a lightweight helicopter. Huge house/canon masters stay out of runtime and are kept as source-only/heavy assets for later splitting or GLB decimation.

## V5.35 — Vehicle ground fix + robust avatar framing + NBN scenery streaming split

- Fixes race/map transitions where player/AI vehicles could briefly appear below a high-elevation road: cars now spawn immediately at track Y and keep a small model-specific ground clearance while shadows remain on the road plane.
- `StaticFbxAvatar` now uses robust main-mesh bounds so stray/outlier meshes no longer shrink or offset the visible character.
- The large NBN guard-house scene is split into 20 strongly-compressed FBX streaming chunks rather than one monolithic runtime asset. Heavy source chunks remain excluded from GitHub Pages by `.gitignore` until a dedicated streamed map is enabled.

## V5.36 — Regression fix: companion display + road ground occlusion

- Fixed blank companion bubble for Cinnamoroll, Kuromi, Capybara Cà Vạt and Po.
- Centralized companion emoji/display labels across Main Menu, Wardrobe, Pet Care and Ludo.
- Fixed the root cause of cars/roads disappearing under scenery terrain on tracks with negative elevation: terrain ground plane is now positioned below the minimum road height per track.
- Player, AI and local P2 now share the same bank-aware road surface Y calculation.
- Corrected P2 fallback car category from `sports` to `sport`.

## v5.37.0
- Mobile Garage layout fix: visible 3D car preview + car selector on phone screens.
- Selective FBX size reduction for Rescue Truck, V12 and city bicycle.
- Vespa deliberately left untouched to preserve visual quality.
- Heavy scenery kept source-only/split instead of destructive recompression.


## V5.38 – Vespa visual fix
- Dedicated Vespa glossy material tuning, garage camera preset, and race framing/grounding tweaks.


## V5.39 – Full regression + mobile Garage + Vespa restore
- Restored high-precision Vespa FBX, fixed phone fallback camera, moved phone car selector outside the 3D viewport, and excluded heavy source-only scenery from the GitHub ZIP.


## V5.40 – FBX Garage/Race expansion
- Adds police car/motorcycle, ambulance, tank, helicopter, Dodge WC-51, Spider, robots and character FBXs as selectable Garage/Race entries.
- Fixes Capybara race direction by 180° and adds robust height-based framing for character racers.
- Device-aware loading keeps the heaviest FBXs desktop-only.


## V5.41 – Local Model Pack & On-Demand Cache
- Large external FBX bytes now use persistent browser Cache Storage before Three.js parsing.
- Garage adds controls to download the current 3D model, download a device-compatible model pack, and clear downloaded models.
- The pack is device-aware: phone/TV do not automatically download desktop-only heavy FBXs.
- Garage idle-prefetches neighboring compatible models only when Data Saver/2G is not active; prefetch warms raw bytes without parsing.
- Model loading still uses procedural fallback when an external FBX is not permitted or fails.
- This removes repeat network downloads; it does not hide the remaining ASCII-FBX parse cost. GLB/LOD remains the next recommended asset-format upgrade.
