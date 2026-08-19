# Audit chuyên sâu V5.1

Các sửa lỗi chính sau audit V5.0:

- Camera chỉ bật ở các màn hình thực sự cần pose/camera; tắt ở menu, pet, board game và màn không cần camera để giảm pin/GPU.
- Sửa timer đếm 3-2-1 của RaceEngine: destroy/thoát đua sẽ clear countdown, không còn khả năng khởi động động cơ sau khi đã thoát.
- Sửa Fashion AR preset: đổi bộ cập nhật ngay state AR, không tự trang bị món đang khóa.
- Sửa Random Outfit: không lấy món khóa làm fallback.
- Bỏ timer 150ms sinh mỗi frame khi tracking phụ kiện mất; giảm nguy cơ hàng trăm timer/giây trong AR.
- Toàn bộ FashionGame/FashionCalibration/FashionShow dùng chung VoiceGuide, tôn trọng lựa chọn Nữ/Nam/Em bé.
- Xác nhận 221/221 MP3 bundled hiện là placeholder không phải MPEG audio thật (magic EF BF BD). Runtime không preload pack hỏng; tự dùng Web Speech TTS.
- check:voice tạo voice-pack-status.json để runtime chỉ bật audio thu sẵn khi toàn bộ pack hợp lệ.
- MediaPipe loader có timeout/failure exit khi nhiều luồng cùng chờ CDN; tránh poll vô hạn nếu CDN lỗi.
- Merge sâu schema tiến trình và hồ sơ đua xe để save cũ tương thích field mới.
- Relative imports: không phát hiện import gãy.
- Static public asset refs: không phát hiện đường dẫn tĩnh bị thiếu.
- Không phát hiện mẫu API key/secret thật trong source.

Giới hạn còn lại:

- MediaPipe Pose vẫn tải từ jsDelivr; offline hoàn toàn sẽ dùng fallback Pixel Motion, không tương đương full pose.
- Body segmentation chưa có; tóc/áo/cánh vẫn là overlay 2D theo landmark, chưa occlusion trước/sau cơ thể chính xác như AR thương mại.
- Model xe vẫn procedural Three.js; chưa có GLB/PBR 2K/4K AAA thật.
- TV/Mi Box hiện ưu tiên Cast/mirroring; chưa có signaling để điện thoại gửi pose riêng sang TV.
- Build Vite đầy đủ phụ thuộc việc cài dependency; môi trường audit hiện không có node_modules.
