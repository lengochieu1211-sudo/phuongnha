# AUDIT V5.11 – Full Body Camera + Real Gameplay + FBX Orientation

## 1. Camera toàn thân
Đã sửa lỗi đứng khoảng 2 m nhưng giao diện/camera vẫn cắt chân:
- Camera trước ưu tiên khung 4:3 để giữ nhiều chiều cao sensor hơn 16:9.
- Portrait: yêu cầu 720x960; landscape/PC: 960x720.
- `resizeMode: none` khi trình duyệt hỗ trợ để tránh crop/zoom số.
- Nếu camera Android expose zoom capability, tự ép về `zoom.min`.
- Master canvas không còn cố định 640x480; tự theo aspect ratio thật của video.
- Màn Calibration và CameraStatus đổi `object-cover` -> `object-contain`.
- Calibration video đổi khung 16:9 -> 4:3.
- Ninja, Goalkeeper và Magic Academy đều yêu cầu full body ở bước calibration.
- Full-body chỉ báo OK khi **cả hai mắt cá** nhìn thấy và không dính sát đáy frame (`y < 0.97`).

## 2. Ninja Né Chướng Ngại
Trước đây chỉ là prompt chữ.
V5.11:
- Có chướng ngại lao từ xa tới gần.
- 4 loại: nhảy, cúi, né trái, né phải.
- Có timing window: làm đúng động tác nhưng phải đúng lúc.
- Có va chạm/trượt/combo/điểm.
- Chướng ngại đổi vị trí và loại sau mỗi lượt.

## 3. Thủ Môn Siêu Nhí
Trước đây chỉ là prompt chữ.
V5.11:
- Có quả bóng bay từ xa vào khung thành.
- Bóng nhắm 4 vùng: trái, phải, cao, thấp.
- Có xoay/phóng to theo khoảng cách.
- Cản đúng timing -> `CẢN PHÁ`.
- Không cản -> `VÀO`.
- Có combo, điểm, lượt trượt.

## 4. Học Viện Phép Thuật
Trước đây chỉ là prompt chữ.
V5.11:
- Có pháp sư + quái vật thật trên sân chơi.
- Ánh sáng: projectile bay tới quái.
- Khiên: đòn lửa từ quái bay tới người chơi; dang tay đúng lúc dựng khiên.
- Sấm sét: sét đánh từ trên xuống.
- Cầu vồng: hiệu ứng cầu vồng quét mục tiêu.
- Có thành công/trượt/timing/combo.

## 5. FBX quay ngược
Nguyên nhân chung:
- Loader cũ áp `Math.PI` 180° cho nhiều model.
- Với model dài theo X, loader còn dùng +90° làm +X -> -Z nên hướng bị ngược.

V5.11:
- Bỏ đảo 180° mặc định cho tất cả model thật.
- Tin trục FBX +Z forward.
- Model dài theo X dùng -90° để map +X -> +Z.
- 883/Vespa vẫn tắt nhận diện bánh hình học để không xoay nhầm ghi-đông/phuộc.
- Mobile/TV/PC fallback vẫn giữ.

## 6. Kiểm tra
- Không phát hiện lỗi TypeScript nội bộ trong các file V5.11 sau khi loại lỗi thiếu `node_modules` của môi trường audit.
- Giữ nguyên toàn bộ asset V5.10: 4 FBX vehicle + ng1 avatar.
- Giữ workflow GitHub Pages.
