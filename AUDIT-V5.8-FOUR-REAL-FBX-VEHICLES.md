# AUDIT V5.8 – 4 Real FBX Racing Vehicles

## Xe/model thật đang có trong game

### 1. CANIS MESA 3D
- FBX thật.
- Khoảng 6.75 MB.
- 49 mesh, khoảng 34.9k vertex.
- TV/Tablet/PC: ưu tiên model thật.
- Phone: fallback nhẹ để giữ FPS.

### 2. V12 SV 3D
- FBX thật.
- Khoảng 37.65 MB.
- 69 mesh, khoảng 181k vertex.
- PC: model thật.
- TV/Phone: fallback nhẹ vì model quá nặng.

### 3. 883 ROADSTER 3D
- FBX thật.
- Khoảng 11.37 MB.
- 119 mesh, khoảng 70.5k vertex.
- Nhóm Motorcycle.
- TV/Tablet/PC: model thật.
- Phone: fallback nhẹ.
- Có logic lean khi ôm cua.
- Vì node bánh đặt tên Group/Mesh chung chung, runtime có thêm nhận diện bánh theo hình học.

### 4. VESPA STUDIO 3D
- FBX thật.
- Khoảng 22.25 MB.
- 238 mesh, khoảng 92.7k vertex.
- Nhóm Motorcycle / Retro Scooter.
- TV/Tablet/PC: model thật.
- Phone: fallback nhẹ.
- Camera Garage được kéo gần riêng cho xe hai bánh.
- Có logic lean khi ôm cua.

## Material / texture
Các FBX mới tham chiếu texture JPG ngoài nhưng ảnh texture không được upload cùng model.
V5.8 xử lý:
- Texture ngoài thiếu không được phép làm model crash.
- Glass -> MeshPhysicalMaterial trong suốt.
- Tire/rubber -> cao su tối.
- Chrome/cromado/aluminum/brass -> kim loại PBR.
- Seat/interior/handle -> vật liệu nhám.
- Light -> emissive.
- Vật liệu lạ giữ màu diffuse gốc của FBX thay vì sơn toàn bộ model thành một màu.
- Chỉ material có dấu hiệu body/paint/fairing/tank mới nhận màu tùy chỉnh Garage.

## Hiệu năng
- FBX lazy-load: chỉ tải khi chọn đúng xe.
- Cache FBX trong phiên: Garage -> Race không parse lại từ đầu.
- Phone không tải FBX nặng.
- TV không tải V12 37.65 MB.
- Nếu model thật lỗi/tải thất bại, procedural fallback vẫn giữ game chạy.

## Tương thích save
- Save mới và save cũ đều tự mở khóa 4 model FBX để thử.
- Không thay đổi cấu trúc race progress cũ.

## Kiểm tra code
- Các file vừa sửa không có lỗi TypeScript logic/type nội bộ sau khi loại các lỗi thiếu package do môi trường audit không cài node_modules.
- GitHub Pages workflow được giữ nguyên.
