## V5.21 – Bổ sung 4 FBX người/xe và hardening đổi màu

- Thêm **Child+girl.fbx** vào Avatar 3D tĩnh. Model có 1 mesh / 49 material / 40 texture tham chiếu ngoài nhưng **không có Skeleton/Skin/Animation**, vì vậy chỉ xoay/nghiêng toàn thân; texture thiếu được thay bằng fallback an toàn để không crash.
- Thêm **S14 SPORT 3D** vào Garage/Race; hướng thật đã kiểm tra là **+Z**. Hierarchy SketchUp không có wheel group đáng tin nên bánh để tĩnh.
- Thêm **RESCUE TRUCK HAULER 3D**; đây là xe cứu hộ kéo moóc rất dài, nhiều bánh xe tải + bánh trailer, hướng thật **+Z**. Chỉ parse FBX thật trên desktop để tránh đứng điện thoại/TV.
- Thêm **XE ĐẠP THÀNH PHỐ 3D**; hướng thật **-X**, không có rig/bone và không có wheel group an toàn. FBX thật chỉ bật desktop; thiết bị yếu dùng fallback.
- Cơ chế đổi màu FBX được siết lại: chỉ material thân xe được đánh dấu mới đổi màu; kính/lốp/mâm/đèn/nội thất không bị nhuộm theo và bục Garage không liên quan material xe.
- Camera Garage/Race và contact shadow có metadata riêng cho xe tải/xe đạp để tránh camera chui vào model hoặc model quá nhỏ.
- Xem chi tiết: `AUDIT-V5.21-NEW-FBX-MODELS.md`.

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
