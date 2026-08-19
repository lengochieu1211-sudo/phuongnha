<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

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
