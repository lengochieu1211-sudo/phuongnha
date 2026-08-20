# AUDIT V5.13 – Khôi phục Camera cho Cờ Cá Ngựa

## Lỗi xác nhận trong V5.12
`LudoGame.tsx` vẫn nhận `gesture` và có logic:
- `clap`
- `both_arms_up`
- `hands_spread`

để tung xúc xắc khi `enableCameraClap = true`.

Nhưng `App.tsx` không có `ludo` trong `cameraScreens`.
Kết quả: chuyển sang màn Cờ Cá Ngựa -> lifecycle toàn app gọi `stopCamera()` -> Ludo nhận `standing` mãi.

## Sửa V5.13

### App
- Thêm `ludo` vào `cameraScreens`.
- Thêm `ludo` vào nhóm màn hình có Camera PiP / LandscapeNotice.
- Ludo dùng profile calibration `upper_body`.
- Đồng bộ lỗi logic cũ: `magicacademy` chuyển về `full_body` trong App để khớp CalibrationScreen V5.11.

### Ludo
- Giữ 3 cử chỉ tung xúc xắc:
  - Vỗ tay
  - Giơ hai tay
  - Dang hai tay
- Sau khi bắt đầu ván:
  - `enableCameraClap = true` -> tự `startCamera()`.
  - `enableCameraClap = false` -> tự `stopCamera()` để tiết kiệm pin/GPU.
- Thêm badge CAMERA CỬ CHỈ: BẬT / TẮT / ĐANG MỞ.
- Hiển thị gesture hiện tại + tracking feedback.
- Cập nhật dependency effect để thay đổi rule camera không bị dùng state cũ.

### Calibration
- Ludo: chỉ cần đầu + vai + tay, không bắt buộc toàn thân.
- Có lời hướng dẫn riêng cho Cờ Cá Ngựa.

## Kết quả mong đợi
1. Vào Cờ Cá Ngựa -> camera/calibration hoạt động.
2. Bật “Tung xúc xắc bằng cử chỉ” -> camera chạy.
3. Vỗ tay / giơ hai tay / dang hai tay khi đến lượt người -> xúc xắc tung đúng một lần.
4. Tắt tính năng camera -> camera dừng sau khi bắt đầu ván.
5. AI không bị cử chỉ của người làm tung xúc xắc.
