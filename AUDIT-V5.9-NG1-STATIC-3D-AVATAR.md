# AUDIT V5.9 – ng1 Real FBX Avatar

## File mới
- `public/assets/avatars/ng1-human-static.fbx`
- Dung lượng khoảng 1.07 MB
- 5 mesh
- khoảng 5,087 vertex
- 5 material
- 3 texture reference ngoài

## Kết quả kiểm tra rig
- Skeleton/Bone: 0
- Skin/Deformer: 0
- Animation stack: 0
- Animation curve: 0

=> Đây là nhân vật 3D thật nhưng tĩnh, chưa rig.

## Tích hợp trong Gương Ma Thuật
- Thêm lựa chọn **Người Mẫu 3D Thật**.
- FBX được render bằng Three.js/FBXLoader.
- Model tự chuẩn hóa kích thước theo chiều cao.
- Xoay trái/phải theo torso yaw của người trước camera.
- Nghiêng toàn thân theo torso rotation.
- PC dùng antialias + shadow tốt hơn.
- TV cân bằng chất lượng.
- Phone dùng render scale nhẹ hơn.

## Giới hạn
- Vì model không có xương nên tay/chân không thể retarget riêng.
- Không gắn tủ đồ 2D lên model thật để tránh lệch/chồng sai.
- Muốn tay/chân chuyển động đầy đủ cần Auto Rig model rồi xuất lại FBX/GLB có skeleton.

## Racing
- Giữ nguyên toàn bộ V5.8:
  - Canis Mesa 3D
  - V12 SV 3D
  - 883 Roadster 3D
  - Vespa Studio 3D
- Device-aware fallback Mobile / TV / PC vẫn giữ nguyên.

## Kiểm tra
- Không phát hiện lỗi TypeScript nội bộ trong các file V5.9 sau khi loại lỗi thiếu package do môi trường audit không cài node_modules.
- GitHub Pages workflow được giữ nguyên.
