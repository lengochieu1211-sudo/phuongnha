# AUDIT V5.6 – Avatar 3D Mirror Mode

## Nâng cấp chính
- Thêm **Avatar 3D Mode** trong Gương Phép Thuật:
  - Không dùng người thật làm ma-nơ-canh.
  - Nhân vật ảo bắt chước cử chỉ tay/chân của người trước camera.
  - Quần áo/phụ kiện hiện tại trong tủ đồ được áp lên avatar.
- Thêm 4 avatar gốc tối ưu cho web:
  - Bé Gái 3D
  - Capy Bạn Đồng Hành
  - Thỏ Ma Thuật
  - Robo Cyber
- Có lựa chọn hiệu năng / đồ họa riêng:
  - Tự động
  - Điện thoại
  - TV
  - PC

## Kỹ thuật triển khai
- Retarget pose sang avatar bằng FashionBodyAnchorEngine.
- Dùng body rig 2.5D/pseudo-3D để chạy mượt trên web.
- Áo, tóc, mũ, kính, mặt nạ, dây chuyền, găng tay, giày, cánh và balô được gắn lại theo khung xương avatar.
- Tần số cập nhật pose được giới hạn theo thiết bị để tránh lag.

## Ghi chú
- Đây là bản gốc stylized của app, không phụ thuộc asset bản quyền từ internet.
- Bước tiếp theo có thể là thêm model GLB rigged thật cho PC, còn mobile dùng avatar nhẹ.
