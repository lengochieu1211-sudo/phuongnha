# AUDIT V5.10 – Motorcycle Orientation / Front Assembly Fix

## Lỗi quan sát từ ảnh thực tế
- Xe máy 883 xuất hiện quay ngược so với hướng chạy.
- Một cụm ngang phía trước trông như ghi-đông/phuộc bị xoay bất thường.

## Nguyên nhân
- Hai FBX xe máy xuất từ SketchUp có forward-axis ngược với hai FBX ô tô.
- Node xe máy đặt tên chung `Group...` / `Mesh...`, không có tên bánh xe.
- Bộ nhận diện bánh bằng hình học có nguy cơ chọn nhầm cụm ghi-đông/phuộc hoặc group khác rồi áp animation quay bánh.

## Sửa V5.10
- `roadster_883_3d`: đổi `defaultYaw` từ `Math.PI` -> `0`.
- `vespa_studio_3d`: đổi `defaultYaw` từ `Math.PI` -> `0`.
- Thêm `wheelMode`.
- 883/Vespa dùng `wheelMode: none` để tuyệt đối không xoay nhầm group.
- Canis/V12 vẫn dùng nhận diện bánh theo tên nếu có.
- Lean toàn thân của xe máy khi ôm cua vẫn giữ.
- Mobile/TV/PC fallback vẫn giữ nguyên.

## Ghi chú
Muốn bánh 883/Vespa quay thật chính xác, cần model có node bánh được đặt tên rõ hoặc tách/rig lại bánh trước và bánh sau.
