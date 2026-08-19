# AUDIT V5.7 – Racing FBX Cars

## Model được tích hợp
### CANIS MESA 3D
- File: `public/assets/cars/canis-mesa-cronoz.fbx`
- Dung lượng: 6.75 MB
- Mesh: 49
- Material: 41
- Ước tính vertex: 34,895
- Texture reference: 33
- Không có texture ảnh đi kèm trong file upload, nên runtime dựng lại vật liệu PBR.

### V12 SV 3D
- File: `public/assets/cars/v12-sv-supercar.fbx`
- Dung lượng: 37.65 MB
- Mesh: 69
- Material: 30
- Ước tính vertex: 181,061
- Texture reference: 2
- Một số texture ảnh ngoài không đi kèm; runtime dựng lại vật liệu PBR.

## Cách chạy thích ứng
- Điện thoại: không tải FBX nặng; dùng xe procedural fallback.
- TV/Tablet: cho Canis Mesa FBX; V12 SV dùng fallback để tránh tải/parse ~39 MB.
- PC: Canis Mesa + V12 SV dùng FBX thật.
- Model chỉ tải khi đúng xe được chọn, không tải lúc vào trang.
- FBX được cache trong phiên để chuyển Garage → Race không parse lại từ đầu.
- Nếu FBX lỗi, xe procedural vẫn còn nên game không crash.

## Vật liệu
- Kính: MeshPhysicalMaterial trong suốt/clearcoat.
- Lốp: vật liệu cao su tối.
- Kim loại/mâm/chrome: metalness cao.
- Đèn: emissive.
- Thân xe: PBR clearcoat và nhận màu tùy chỉnh trong Garage.

## Lưu ý
- Đây là FBX người dùng cung cấp. Không có texture gốc đầy đủ nên màu/livery có thể khác model nguồn.
- Chưa tạo LOD geometry thật cho V12; vì vậy TV/Phone bị chặn model nặng và dùng fallback.
