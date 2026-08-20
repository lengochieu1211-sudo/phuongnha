# AUDIT V5.14 – Toàn bộ game + Camera thích ứng, không méo hình

## Mục tiêu
1. Không ép người chơi phải đứng xa đến mức camera thấy toàn thân nếu game không cần chân.
2. Camera preview phải giữ đúng tỷ lệ hình thật, không kéo dãn người, không crop chỉ để lấp đầy khung.
3. Landmark/AR overlay phải khớp đúng vùng ảnh camera đang hiển thị.
4. Game vẫn tận dụng toàn thân nếu camera thật sự thấy đủ.

---

## Phân loại game sau V5.14

| Game / tính năng | Chế độ camera mặc định | Ghi chú |
|---|---|---|
| Chém Trái Cây | Tay / cổ tay | Không cần chân |
| Bắn Gà | Tay / cổ tay | Điều khiển ngắm bằng tay; gesture phụ vẫn hoạt động |
| Zombie Kẹo Ngọt | Tay / cổ tay | Không bắt buộc chân |
| Bắt Sao | Tay / cổ tay | Không bắt buộc chân |
| Bắt Chước Tư Thế | Nửa người trên + 2 tay | Các pose hiện tại dùng vai/tay/duck/tilt |
| Dance | Nửa người trên + 2 tay | Jump/duck có thể nhận từ chuyển động vai |
| Phiêu Lưu | Nửa người trên + 2 tay | Jump/duck/né không còn khóa vì thiếu mắt cá |
| Cha Mẹ Chơi Cùng | Nửa người trên + 2 tay | Gesture motion |
| Ninja Né Chướng Ngại | Nửa người trên + 2 tay | Chướng ngại thật + timing; jump/duck/né từ torso |
| Thủ Môn | Nửa người trên + 2 tay | Trái/phải/cao/thấp; không cần chân |
| Học Viện Phép Thuật | Nửa người trên + 2 tay | Hai tay/dang tay/vỗ tay/cầu vồng |
| Buổi Tập 5/10 phút | Nửa người trên + 2 tay | Các segment hiện tại chủ yếu tay/torso; không khóa vì chân ngoài FOV |
| Đua Xe | Nửa người trên + 2 tay | Hai tay như vô lăng |
| Cờ Cá Ngựa | Nửa người trên + 2 tay (tùy chọn) | Camera chỉ chạy khi bật tung xúc xắc bằng cử chỉ |
| Gương Phép Thuật AR | Thích ứng | Nửa người: tóc/kính/áo/găng/phụ kiện; toàn thân: thêm lower-body/giày |
| Chăm Thú Cưng | Không cần camera | UI/touch |
| Camera Test | Chẩn đoán | Hiển thị feed đúng tỷ lệ |

---

## Camera: sửa méo / sai tỷ lệ

### Nguồn camera
- Ưu tiên sensor 4:3 (1280x960 ideal) thay vì 16:9 để giữ nhiều vùng ảnh theo chiều dọc hơn.
- `resizeMode: none` nếu Chromium/Android hỗ trợ.
- Nếu camera expose zoom capability, ép về `zoom.min` để dùng góc nhìn rộng nhất phần cứng cho phép.
- Không giả định điện thoại dọc/ngang để kéo khung; dùng kích thước thật mà browser trả về.

### Master canvas
- `poseDetector` đồng bộ canvas theo aspect ratio thật của `results.image` mỗi frame.
- Chỉ mirror ảnh trái/phải.
- Không thay đổi tỷ lệ X/Y riêng biệt.
- Landmark vẫn nằm trong cùng hệ tọa độ với ảnh.

### Preview
Đã dùng `drawImageContain()` cho:
- Calibration
- Camera PiP
- Camera Test
- Gương Phép Thuật AR
- Fashion Show

`Contain` có thể tạo viền đen khi khung UI khác tỷ lệ camera. Đây là chủ ý: viền đen tốt hơn kéo dãn cơ thể hoặc crop mất tay/chân.

### Fashion AR
- Camera được contain, không cover.
- Pose anchors được remap vào đúng content rectangle sau letterbox/pillarbox.
- Kích thước áo/phụ kiện cũng scale theo content rectangle.
- Sleeve segments và debug skeleton dùng cùng mapping.
=> Camera không bị méo mà đồ AR vẫn bám đúng người.

---

## Nửa người trên + 2 tay

### Calibration mới
Các motion game chính chỉ yêu cầu:
- mặt/đầu nhìn thấy,
- hai vai nhìn thấy,
- cả hai cổ tay nhìn thấy.

Không bắt buộc:
- đầu gối,
- mắt cá,
- bàn chân.

### Jump / Duck
`poseDetector` trước đây chỉ cập nhật baseline jump/duck tốt khi có cả hông.
V5.14:
- baseline vai được cập nhật ngay cả khi hông/ chân ngoài khung,
- hông là tín hiệu bổ sung nếu có,
- jump/duck vẫn hoạt động trong chế độ nửa người.

### Tracking feedback
- Thiếu chân không còn bị coi là lỗi camera.
- `fullBodyDetected` vẫn được giữ riêng để tính năng nào cần toàn thân có thể tận dụng.
- PiP hiển thị rõ:
  - TOÀN THÂN
  - NỬA NGƯỜI + 2 TAY
  - ĐANG TÌM 2 TAY
  - CHƯA SẴN SÀNG

---

## Gương Phép Thuật
Calibration nội bộ đã đổi sang thích ứng:
- Mặt + 2 vai + 2 khuỷu + 2 cổ tay ổn định khoảng 1.2 giây -> vào chế độ nửa người.
- Nếu thấy thêm hông + gối + mắt cá -> vào chế độ toàn thân.
- Không bắt người chơi tiếp tục lùi chỉ để thấy bàn chân.
- Feedback trong gương ghi rõ đang ở chế độ nửa người hay toàn thân.

---

## Audit gameplay tổng quát
Kiểm tra tĩnh source xác nhận các game chính đều có vòng gameplay / timer / scoring hoặc state progression phù hợp:
- Phiêu lưu: entity spawn + obstacle + score + RAF.
- Fruit Slash: object spawn + slash collision + score.
- Chicken Blaster: target/projectile gameplay + score.
- Sweet Zombie: target/combat state + score.
- Star Catcher: star spawn/timer/score.
- Pose Mimic: pose target/timer/score.
- Dance: gesture sequence/score.
- Parent Play: cooperative timed flow.
- Ninja/Goalkeeper/Magic Academy: object animation + timing window + success/miss/combo/score.
- Ludo: board engine + dice + AI + camera gesture option.
- Racing: physics + 3D + Garage + FBX vehicles + controls.
- Fashion: AR anchor engine + wardrobe + fashion show + avatar mode.
- Workout: timed sequence of motion games.
- Pet Care: interaction/progression without camera.

---

## Giới hạn vật lý cần hiểu
Phần mềm không thể nhìn ra ngoài góc nhìn thật của ống kính camera.
V5.14 có thể:
- chọn 4:3,
- dùng zoom nhỏ nhất khi thiết bị cho phép,
- không crop/stretch,
- cho game hoạt động bằng nửa người + hai tay.

Nhưng nếu camera phần cứng ở khoảng cách 2 m thật sự chỉ thu được nửa người thì app không thể tự tạo phần chân không có trong ảnh. Vì vậy thiết kế game đã được đổi để không phụ thuộc chân trong phần lớn trường hợp.

---

## Kiểm tra code
- 24/24 kiểm tra logic camera/adaptive mode đạt.
- Không phát hiện lỗi TypeScript nội bộ trong các file V5.14 sau khi loại lỗi module dependency do môi trường audit không cài `node_modules`.
- Giữ toàn bộ sửa V5.13: Ludo camera.
- Giữ toàn bộ sửa V5.12: hướng FBX.
- Giữ 4 FBX xe + ng1 avatar.
- Giữ workflow GitHub Pages.
