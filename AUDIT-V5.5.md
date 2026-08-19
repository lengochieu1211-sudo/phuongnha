# AUDIT V5.5 — AR Body Rig / Companions / Voice Source Fix

## 1. Gương Phép Thuật — body-rig 2.5D theo người
- Body anchors dùng 33 mốc MediaPipe Pose và giữ thêm Z-depth của vai để ước lượng hướng xoay thân (yaw).
- Áo tự co giãn từ vai + hông + chiều cao thân, có nén phối cảnh khi người xoay trái/phải và clip theo silhouette thân.
- Bỏ phần ống tay áo cố định khỏi thân áo. Mỗi tay tách thành 2 bone riêng: vai→khuỷu và khuỷu→cổ tay.
- 4 lớp ống tay áo tự di chuyển, xoay, thay chiều dài theo tay; tay gần camera nằm trước áo, tay xa camera lùi sau áo.
- Kính/mặt nạ/tóc/nón tiếp tục dùng neo mặt riêng và nhận thêm hiệu ứng xoay theo hướng thân/đầu.
- Tối ưu cadence body-rig: điện thoại ~30 FPS, TV/tablet ~40 FPS, PC 48–60 FPS. Camera preview vẫn dùng requestAnimationFrame.

### Giới hạn kỹ thuật còn lại
Đây là AR body-rig 2.5D có phối cảnh và Z-order, chưa phải mô phỏng vải 3D thật với skinned mesh/cloth physics/occlusion từng phần cơ thể. Muốn mức như phòng thử đồ thương mại cần body segmentation + 3D garment mesh + skinning/cloth solver.

## 2. Bạn Đồng Hành
- Cinnamoroll: sửa thành chú cún trắng, mặt rộng, mắt xanh, má hồng, tai rất dài nằm ngang và đuôi cuộn.
- Kuromi: bổ sung material đen đúng cho hood/body, mặt trắng, đầu lâu hồng, hai chóp jester và đuôi quỷ; sửa bug gradient `kuromiGrad` trước đây chưa được định nghĩa.
- Bara/Capybara: bỏ balô mặc định, thân nâu dài hơn, tai tròn nhỏ, mõm vuông, mắt nhỏ và palette nâu tự nhiên hơn.
- Bổ sung gradient còn thiếu `poEarGrad` để tránh asset SVG tham chiếu material không tồn tại.
- Không nhúng/copy ảnh web vào source; nhân vật được dựng lại bằng SVG procedural để nhẹ, scale tốt và không phụ thuộc mạng.

## 3. Giọng nữ
- Xác nhận 366 MP3 hiện tại là **giọng nữ tổng hợp offline**, không phải bản thu người thật.
- Female mode ưu tiên giọng nữ tiếng Việt tự nhiên do hệ điều hành/browser cung cấp nếu xác định được đúng giọng nữ.
- Nếu máy không có giọng nữ Việt tự nhiên, mới dùng pack MP3 tổng hợp offline làm fallback.
- Không tự rơi về giọng nam khi người dùng đang chọn giọng nữ.
- UI/status/build checker đã sửa câu chữ để không còn gọi pack tổng hợp là “bản thu thật”.

### Giới hạn giọng offline
Không có model neural TTS/voice actor được nhúng trong V5.5. Vì vậy khi thiết bị không có giọng nữ tự nhiên, fallback offline vẫn có chất giọng tổng hợp. Đây là giới hạn được hiển thị rõ trong Cài đặt giọng.

## 4. Kiểm tra tĩnh
- Relative imports: 0 đường dẫn hỏng.
- TypeScript transpile syntax: 71 file, 0 syntax error.
- `tsc --noEmit`: không có lỗi nội bộ mới sau khi lọc các lỗi do môi trường audit không cài dependency (`react`, `three`, `vite`, types...).
- Các file AR/renderer đã cân bằng braces/parens.
- ZIP phải được CRC-check trước khi phát hành.
