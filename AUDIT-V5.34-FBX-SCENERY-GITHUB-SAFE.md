# AUDIT V5.34 — FBX SCENERY / GITHUB SAFE

## Đã thực hiện
- Thêm hệ thống `SceneryFbxLoader` để dùng FBX thật làm lớp cảnh quan bổ sung trên nền scenery procedural.
- Cảnh FBX không chặn countdown/gameplay; lỗi tải FBX thì game vẫn chạy bằng scenery cũ.
- Mountain: Pine Tree FBX theo ngân sách thiết bị; Tank FBX chỉ Desktop High.
- City Night: Police Car + Ambulance FBX nhẹ đỗ hai bên đường (không chạy physics).
- Sunset Coast / Sky: Helicopter FBX nhẹ làm cảnh xa.
- Không parse nhà/cảnh 74MB trong runtime.

## Nén model mới
- Pine Tree: 931,440 -> 585,929 bytes.
- Tank: 11,942,013 -> 6,865,727 bytes.
- Canon: 91,457,264 -> 43,270,727 bytes (source-only).
- Robot 4: 15,083,383 -> 8,600,673 bytes (source-only).
- NHA BAO CANH: 136,576,638 -> 74,281,802 bytes (source-heavy, không đưa web).
- Prime 1: 22,204,518 -> 12,658,169 bytes (source-only).

## Quy tắc an toàn
- `assets-source-heavy/` được giữ trong ZIP để không mất model master nhưng `.gitignore` loại khỏi commit GitHub.
- Chỉ model cảnh đủ nhẹ mới nằm trong `public/assets/scenery/`.
- Nhà lớn 13,765 node chưa phù hợp web FBX; muốn dùng thật cần tách module nhà hoặc decimate/GLB.
- `canon.fbx` không tự gán là khẩu pháo vì hierarchy có dấu hiệu steering wheel; cần xem trực quan trước khi bố trí.

## Đề xuất tiếp theo
1. Tách nhà lớn thành 3–8 module (nhà chính, mái, cây, hàng rào, cổng, nội thất) rồi chỉ dùng phần ngoại cảnh.
2. Chuyển scenery master sang GLB/meshopt sau khi có Blender để giảm parse time mạnh hơn ASCII FBX.
3. Cảnh xa dùng LOD: 1 FBX gần + proxy procedural/instanced ở xa.
4. Cảnh chuyển động chỉ nên animation transform nhẹ (helicopter bay, xe cứu thương chạy theo spline), không chạy physics cho toàn bộ props.
