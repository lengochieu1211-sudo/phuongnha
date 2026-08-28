# Phương Nhã – Changelog

## v5.43.0 — Release Gate / 2 người chơi

**Ngày chứng nhận:** 28/08/2026

### Điểm chính

- Đua xe 2 người dùng một camera, P1/P2 là hai người chơi local độc lập.
- Bỏ khóa bắt buộc phải nhận đủ hai Pose trước khi tiếp tục; luôn có fallback bàn phím/cảm ứng.
- Chỉ dùng một MediaPipe Pose cho hai crop tuần tự và giảm nhịp inference theo thiết bị.
- Sửa vòng đời camera/MediaPipe khi vào/thoát Racing; Garage/menu/track select/podium không giữ camera không cần thiết.
- Thêm fallback WebGL cho Garage và Race để UI/điều khiển vẫn sống trên thiết bị không tạo được context.
- Giữ 42 CarModelId/CAR_CATALOG và 27 FBX runtime; model nặng dùng policy theo thiết bị.
- Bổ sung cleanup timeout/RAF/audio ở các game liên quan để giảm callback chạy ngầm sau unmount.
- Bổ sung focus/responsive cho mobile và Android TV.
- Thêm hiển thị Version + Build time + Commit + Release Notes trực tiếp trong ứng dụng.

### Release certification

Runtime Golden V2 đã PASS 4/4 cấu hình:

1. Desktop 1440×900 — WebGL bình thường.
2. Desktop 1440×900 — ép tắt WebGL.
3. Mobile 390×844 — WebGL bình thường.
4. Mobile 390×844 — ép tắt WebGL.

Mỗi ca kiểm Home → Racing Hub → Garage → 2P setup → Track Select → Race → P1/P2 HUD → fallback → exit → camera cleanup.

Ngoài ra runner sạch đã PASS `npm ci`, Release Gate, TypeScript, asset checks, voice checks và Vite production build.
