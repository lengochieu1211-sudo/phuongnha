# AUDIT V5.15 – FBX hướng xe, rác model và bánh xe nhảy

## Kết luận kiểm tra trực tiếp 4 FBX

### CANIS MESA
- Hướng thật của model: **+Z là đầu xe**.
- Bằng chứng hình học:
  - bonnet/đầu xe khoảng Z = -0.82
  - cản sau khoảng Z = -4.66
  - thân xe trải dài về phía +Z ở đầu xe.
- V5.14 dùng quy tắc chung Z-long => quay 180°, nên model này có nguy cơ bị đảo sai.
- Có 5 group `wheel_34_*`:
  - `wheel_34_2..5`: 4 bánh chạy, tâm Y ≈ 0.572.
  - `wheel_34_1`: bánh sơ-cua gắn cao phía sau, tâm Y ≈ 1.647.
- Pivot của các group bánh đều là (0,0,0), không nằm ở tâm hình bánh.
- Code cũ lấy 4 node tên wheel đầu tiên => có thể quay bánh sơ-cua và bỏ sót 1 bánh chạy.

### V12 SV
- Hướng thật của model: **+Z là đầu xe**.
- Steering wheel khoảng Z = 3.09; engine khoảng Z = 0.99.
- 4 bánh chạy có tên rõ `w2_1..w2_4`.
- Đồng thời model có `Steering_wheel_1_1`.
- Regex V5.14 chứa từ `wheel`, nên steering wheel cũng lọt vào danh sách wheel candidate.
- Pivot `w2_1..w2_4` đều nằm ở origin thay vì tâm bánh.
- Quay trực tiếp node cũ => bánh quay vòng quanh gốc xe, gây hiện tượng nhảy/văng.

### 883 ROADSTER
- Hướng thật của model: **-X là đầu xe**.
- Hierarchy SketchUp rất chung (`Group...`, `Mesh...`), wheel parts bị chia thành nhiều group.
- Không đủ an toàn để tự động quay bánh mà không tách/rig lại.
- V5.15 giữ bánh tĩnh, tránh nhảy. Toàn thân xe vẫn nghiêng khi ôm cua.

### VESPA STUDIO
- Hướng thật của model: **-X là đầu xe**.
- Front wheel khoảng X = -4453; engine/rear region khoảng X = -3290.
- Có 2 group `ruota_vp300_2_1/2`.
- Pivot các group này cũng ở origin, không ở tâm bánh.
- V5.15 giữ bánh tĩnh để không phát sinh orbit/jump cho tới khi rig/tách bánh sạch.

## Rác / đối tượng lạ
Kiểm tra source FBX:
- Không có Camera node.
- Không có Light node.
- Không có animation/skeleton gây biến dạng xe.
- Không phát hiện ground plane rất lớn hoặc mesh rời nằm xa khỏi bbox chính của xe.
- Tất cả model hiện tại chủ yếu là `Null + Mesh`.
- Canis có một số group tên `______...` / `extra...`, nhưng bbox vẫn nằm trong thân xe; không đủ bằng chứng để xóa vì có thể là chi tiết thật.
- `wheel_34_1` của Canis là bánh sơ-cua, **không phải rác**, chỉ không được phép quay như bánh chạy.

## Sửa V5.15

### Hướng xe
Không còn suy đoán theo “trục nào dài hơn”.
Mỗi model có metadata `forwardAxis` đã kiểm chứng:
- Canis: `+z`
- V12: `+z`
- 883: `-x`
- Vespa: `-x`

Loader map forward axis này về local `+Z` của RaceEngine.

### Bánh xe
- Loại `steer`, `steering`, `handlebar` khỏi wheel detection.
- Canis nếu thấy 5 bánh thì lấy 4 tâm bánh thấp nhất => bỏ bánh sơ-cua.
- V12 dùng đúng `w2_1..w2_4`.
- Không quay trực tiếp node FBX nữa.
- Tạo:
  - `AP_SteerPivot_*`
  - `AP_SpinPivot_*`
  tại **tâm bbox thật của từng bánh**.
- Dùng `Object3D.attach()` để re-parent mà không làm model nhảy vị trí.
- Bánh trước mới nhận góc lái.
- Bánh sau chỉ quay.
- 883/Vespa giữ bánh tĩnh vì hierarchy chưa đủ sạch để quay an toàn.

### Sanitizer
Loader tự ẩn Camera/Light/Line/Points/Helper nếu file FBX tương lai có kèm các node không phải thân xe.

## Kết quả mong đợi
- Không còn model bị xoay dựa trên heuristic sai.
- Canis/V12 không còn bánh orbit quanh gốc xe.
- Không quay nhầm vô-lăng hoặc bánh sơ-cua.
- 883/Vespa không còn nguy cơ bánh nhảy vì wheel animation bị khóa an toàn.
