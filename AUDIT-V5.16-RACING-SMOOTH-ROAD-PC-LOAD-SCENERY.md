# AUDIT V5.16 – Racing: giảm lag PC, đường ổn định, cảnh đẹp hơn

## 1. Lỗi xác nhận trong V5.15

### Lag trước lúc xuất phát
Race screen cũ làm cùng lúc trên main thread:
- dựng road geometry,
- dựng rất nhiều Mesh/Group cảnh vật riêng lẻ,
- tạo material riêng cho nhiều rooftop/palm/frond,
- parse FBX thật nếu chưa có trong cache,
- compile shader/shadow,
- đồng thời countdown đã bắt đầu.

Kết quả: trên PC có thể thấy khựng ngay lúc chuyển vào cuộc đua hoặc trong 3-2-1.

### Đường nhảy lên/xuống
TrackData cũ có cao độ quá mạnh:
- Neon City: range khoảng 28 m và có tunnel dip đột ngột khoảng 12 m.
- Coastal: range khoảng 37.8 m.
- Mountain: khoảng 48 m.
- Candy: khoảng 23.6 m.
- Sky: khoảng 36 m.
- Space: khoảng 60 m.

Ngoài ra Y dùng Catmull-Rom nên có thể overshoot giữa waypoint.

---

## 2. Sửa cao độ đường V5.16

### Cao độ mới
- Neon City: range ~3.5 m.
- Coastal: ~7.1 m.
- Mountain: ~10.4 m.
- Candy: ~4.2 m.
- Sky: ~7.4 m.
- Space: ~10.4 m.

### Neon tunnel
- Bỏ hoàn toàn hard dip `y -= 12`.
- Tunnel giờ chỉ là phần cảnh/kiến trúc, không làm mặt đường tụt xuống đột ngột.

### Smoothing
- 4 pass smoothing vòng kín trên waypoint Y.
- Capping thay đổi cao độ giữa waypoint.
- X/Z vẫn Catmull-Rom để cua mượt.
- Y đổi sang Smoothstep monotonic giữa 2 waypoint để không bị Catmull-Rom overshoot.

### Banking
Giảm banking quá mạnh xuống khoảng 3.5–5.5% rad visual range để xe không lắc nghiêng quá mức trên một road mesh vốn không bank theo cross-section.

---

## 3. Giảm lag khi vào cuộc đua

### Countdown không chạy trong lúc dựng scene
V5.16:
1. Chuyển sang race -> hiện màn `Chuẩn Bị Đường Đua`.
2. Dựng road/scenery.
3. Nạp/clone FBX thật nếu có.
4. Render frame ẩn đầu tiên.
5. `renderer.compileAsync()` nếu Three.js/browser hỗ trợ, fallback `renderer.compile()`.
6. Chờ thêm 1 animation frame.
7. Báo `onReady`.
8. Lúc đó mới bắt đầu 3-2-1.

=> Không còn countdown bị khựng vì shader/FBX đang dựng.

### FBX
- Track select chỉ warm HTTP cache của đúng model đang chọn.
- Không parse tất cả FBX trong background vì ASCII FBX 20–40 MB parse trên main thread có thể tự gây lag menu.
- Garage/Race dùng chung `FBX_CACHE`, nên model đã mở trong Garage không parse lại khi vào đua.

### Asphalt HD
- PC prefetch `assets/pc-hd/asphalt-hd.webp` sớm vào browser cache.
- Không upload texture lên GPU cho đến lúc scene cần.

### PC High allocation
Cũ:
- DPR cap 1.75
- shadow map 2048
- sceneryDensity 1.28

Mới:
- DPR cap 1.60
- shadow map 1536
- sceneryDensity 1.10
- vẫn giữ carDetail `ultra`, AI high, texture 1024
- target 60 FPS

---

## 4. Cảnh vật đẹp hơn nhưng ít draw-call hơn

### Sky
Thêm sky dome gradient theo từng map:
- Neon City: đêm xanh sâu + horizon glow + stars.
- Coast: hoàng hôn cam.
- Mountain: trời lạnh.
- Candy: tím/hồng.
- Sky: xanh sáng.
- Space: cosmic purple + stars.

### City
Cũ: rất nhiều Building Mesh + Roof Mesh + Lamp Group riêng.
Mới:
- Buildings = 1 InstancedMesh.
- Roofs = 1 InstancedMesh.
- Poles = 1 InstancedMesh.
- Bulbs = 1 InstancedMesh.
- Tunnel arches = 1 InstancedMesh.

Mật độ nhìn được tăng nhưng draw-call giảm mạnh.

### Coast
- Water plane clearcoat.
- Palm trunks instanced.
- Palm crowns instanced.

### Mountain
- Mountain range instanced.
- Pine trees gần đường instanced.

### Candy
- Donut props instanced + per-instance color.

### Sky
- Cloud masses instanced.

### Space
- Asteroids instanced.

---

## 5. Mặt đường đẹp hơn
- Curb không còn nổi 0.15 m trên asphalt; hạ sát còn ~0.035 m.
- Thêm solid white edge lines.
- Thêm rumble strips chia đoạn:
  - map thường: đỏ / trắng,
  - map neon: cyan / violet.
- Giữ center dashes.
- Giữ guard rails.
- Tất cả phần lặp dùng InstancedMesh.

---

## 6. Giữ nguyên các sửa trước
- V5.15: hướng FBX đúng theo metadata từng model.
- V5.15: pivot bánh Canis/V12 đặt tại tâm thật.
- 883/Vespa giữ wheel animation safe mode.
- V5.14: camera không stretch/crop + chế độ nửa người trên/2 tay.
- V5.13: camera Cờ Cá Ngựa.
- Ninja/Goalkeeper/Magic Academy gameplay vẫn giữ.

---

## 7. Kiểm tra
- Không phát hiện lỗi TypeScript nội bộ trong các file racing V5.16 sau khi loại lỗi package/module do môi trường audit không có `node_modules`.
- Workflow GitHub Pages giữ nguyên.
