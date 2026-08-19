# AUDIT V5.4 — Female Offline Voice / Racing Ultra / Adaptive Graphics

Ngày audit: 2026-08-19

## 1. Giọng nói

- Voice manifest: **366** đường dẫn MP3, **366 đường dẫn duy nhất**.
- Kiểm tra binary: **366 hợp lệ / 0 thiếu / 0 lỗi**; tổng dữ liệu audio khoảng **4.45 MB**.
- Bổ sung các câu thoại trực tiếp của Calibration, Dance, Pose Mimic, Gương Phép Thuật, Fashion Show và Ludo vào manifest.
- Các câu Fashion/Ludo có tên động được thay bằng câu hướng dẫn cố định ở những vị trí cần thiết để có thể phát MP3 offline.
- Khi chọn `female_gentle`, `VoiceGuideService` chỉ dùng pack offline; câu động chưa ánh xạ sẽ bỏ qua thay vì rơi về giọng hệ thống nam.
- `RecordedVoiceService` ghép asset theo `import.meta.env.BASE_URL`, tương thích GitHub Pages `/phuongnha/`.
- Giọng offline hiện tại là giọng nữ tổng hợp female-formant, không phải thu âm người thật/neural studio.

## 2. Racing / xe 3D

- `Car3DBuilder` hỗ trợ `lite | high | ultra`.
- Ultra tăng độ mịn thân aerodynamic và bổ sung intake, diffuser fin, đèn hậu segment, undertray, panel/hood crease, nội thất và chi tiết bánh/phanh.
- Player car trên Phone/TV vẫn giữ `high`; PC đẹp dùng `ultra`; AI giảm chi tiết theo profile để tiết kiệm GPU.
- Close Chase: FOV thường 49°, khoảng lùi camera 3.25 đơn vị; xe hiện lớn hơn bản trước.
- Tất cả profile có environment reflection nhẹ và contact shadow rẻ để xe bớt cảm giác “nổi”.

## 3. Đồ họa / chống lag

- Preset UI: `Tự động`, `Điện thoại`, `TV / Mi Box`, `PC đẹp`.
- Phone: pixel ratio cap 1.15 (máy mạnh có thể 1.35), tắt realtime shadow, giảm scenery/texture, player car High.
- TV/Mi Box: cap 1.20, tắt realtime shadow, cảnh cân bằng, player High.
- PC cân bằng: cap 1.45, shadow 1024. PC đẹp: cap 1.75, shadow 2048, player Ultra.
- Runtime FPS guard kiểm tra theo cửa sổ ~3.2 giây; khi thấp hơn target sẽ hạ render scale từng bước và có thể tắt shadow.

## 4. Kiểm tra source

- Relative imports: **0 đường dẫn hỏng**.
- Static `/audio` references: **0 thiếu**.
- Braces / parentheses của các file chỉnh chính cân bằng.
- `tsc --noEmit` trong môi trường audit không có `node_modules`: chỉ còn lỗi dự kiến do thiếu package/type declarations; sau khi lọc nhóm thiếu dependency/type-env, **0 lỗi nội bộ mới** trong source chỉnh sửa.
- `npm install` trong môi trường audit bị timeout nên chưa chạy được full Vite bundle tại đây. GitHub Actions là bước build thực tế cuối sau khi push.

## 5. GitHub Pages

- ZIP kèm `.github/workflows/deploy.yml`.
- Workflow dùng Node 22, `npm install`, `npm run build -- --base=/phuongnha/`, sau đó deploy `dist` lên Pages.
