# AUDIT V5.18 – Gương Phép Thuật / Bố trí chọn đồ

## Đã sửa trực tiếp
- Tách “Đổi nhanh cả bộ” khỏi thanh danh mục; không còn DOM lồng sai khiến thanh chọn đồ cuộn lộn xộn.
- Mobile: camera AR giữ vùng 4:3 phía trên, bảng chọn đồ ở dưới, tối đa 48vh để không chiếm hết gameplay.
- Danh mục có thanh cuộn ngang riêng, nút cao tối thiểu 40px, hỗ trợ snap khi vuốt.
- Hiển thị rõ danh mục đang chọn.
- Grid món đồ: 3 cột mobile, 4 cột màn hình vừa, 2 cột ở panel desktop bên phải.
- Preset “Đổi nhanh cả bộ” có vùng riêng, vuốt ngang độc lập.
- Header được gom lại để tránh chồng nút trên màn hình hẹp; Stars/Diamonds ẩn trên mobile nhỏ, Avatar 3D chuyển xuống panel chọn đồ.
- Camera canvas tiếp tục object-contain, không stretch/crop.
- Không thay đổi logic pose, Fashion AR mapping, đồ đã mở khóa, sao/kim cương, lưu outfit hay Fashion Show.

## Kiểm tra
- npx tsc --noEmit: môi trường source không có node_modules; lỗi dependency/module resolution như React/Three/Lucide/@types Node. Không thấy lỗi cú pháp mới riêng từ FashionGame.tsx.
- ZIP loại node_modules/dist/.git và giữ GitHub workflow.
