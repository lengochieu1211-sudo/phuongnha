# AUDIT V5.20 – Vespa Upright / Orientation Fix

## Lỗi xác nhận từ ảnh người dùng
- Vespa hiển thị xiên/ngang so với hướng chạy trong Race.
- Whole-model motorcycle lean làm lỗi nhìn rõ hơn khi có steering input.

## Nguyên nhân
- `forwardAxis: -x` mô tả hướng của geometry nguồn SketchUp.
- FBXLoader đã thực hiện axis conversion khi đọc FBX.
- Sau đó loader của game lại áp `forwardYaw(-x) = +90°`, khiến Vespa bị quarter-turn thừa trong runtime.
- Vespa còn có pivot/transform xuất từ SketchUp chưa sạch, nên nghiêng toàn thân theo steering làm xe trông xiên thêm.

## Sửa
- Giữ `forwardAxis: -x` làm metadata nguồn.
- Thêm `visualYawOffset` cho từng model.
- Vespa dùng `visualYawOffset = -PI/2` để triệt quarter-turn runtime thừa.
- Thêm `maxLeanRad` theo model.
- Vespa tạm đặt `maxLeanRad = 0` để xe đứng thẳng, không nghiêng sai do pivot/transform nguồn.
- 883 vẫn giữ lean mặc định; Canis/V12 không đổi.
- Không thay wheelMode, sanitizer, camera, physics, track hoặc Garage.

## Kỳ vọng
- Vespa chạy thẳng theo tim đường, không còn nằm xiên/ngang.
- Không còn nghiêng thân bất thường khi đánh lái.
