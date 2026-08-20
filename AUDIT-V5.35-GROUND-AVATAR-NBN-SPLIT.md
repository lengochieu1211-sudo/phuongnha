# AUDIT V5.35 — VEHICLE GROUND FIX + AVATAR FRAMING + NBN SCENERY SPLIT

## 1. Sửa xe tụt xuống dưới đường khi chuyển cảnh

- Xe người chơi được đặt đúng waypoint/cao độ đường **ngay khi tạo scene**, trước frame render đầu tiên.
- AI/P2 cũng được spawn ngay đúng cao độ thay vì mặc định ở world Y=0.
- Thêm `getRaceVehicleGroundLift()` để chừa khoảng hở nhỏ giữa bánh/model và mặt road ribbon.
- Contact shadow vẫn nằm sát mặt đường, không cộng lift, nên xe không nhìn như đang bay.
- Camera P2 dùng cùng cao độ đã hiệu chỉnh.

## 2. Sửa model nhân vật bị lệch/thu nhỏ/tách rời trong Gương Ma Thuật

- `StaticFbxAvatar` không còn dùng bounding box toàn file một cách mù quáng.
- Thêm robust avatar bounds dựa trên cụm mesh chính; mesh rác/nằm rất xa không được làm hỏng scale và center của nhân vật.
- Sau khi scale, center/ground được tính lại bằng robust bounds.

## 3. Nhà + cảnh NBN

- File scene lớn được tách thành **20 FBX stream chunks**.
- Chunk lớn nhất: **16,850,080 bytes**.
- Tổng dữ liệu các chunk: **82,252,584 bytes**.
- Precision cảnh tĩnh được hạ mạnh: Vertices=1 decimal, Normals=2, UV=3, Transform=3.
- Không giảm polygon/topology bừa; mục tiêu là nén ASCII và chia nhỏ parse workload.
- Bản master nguyên khối được **loại khỏi ZIP phân phối**, tránh mang thêm một bản trùng 70+ MB.
- Các chunk nằm trong `assets-source-heavy/` và đang bị `.gitignore`, nên **không tự push/deploy lên GitHub Pages** trước khi có map chuyên dụng để stream chúng.

## 4. canon.fbx

- Bản scenery master nén mạnh còn **38,827,826 bytes**.
- Vẫn để trong `assets-source-heavy/`, không auto-load vào web vì còn lớn và chưa xác nhận đúng vai trò hình học để đưa trực tiếp vào gameplay.

## 5. Nguyên tắc runtime

- Cảnh FBX nhỏ hiện dùng trong game vẫn load theo budget thiết bị.
- Cảnh cực lớn không được parse cùng lúc với MediaPipe/đua 2P.
- Nếu sau này dùng NBN scene trong map riêng, loader phải tải chunk theo vùng/camera và unload chunk ở xa.
