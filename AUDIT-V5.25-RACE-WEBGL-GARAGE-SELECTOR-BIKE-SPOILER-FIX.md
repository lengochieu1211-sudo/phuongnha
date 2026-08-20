# AUDIT V5.25 — Race WebGL / Garage Selector / Bicycle Spoiler Fix

## Các lỗi được xử lý

1. **Garage đổi xe giật / ảnh model reload liên tục**
   - Trước đây `GarageScreen` tạo `THREE.WebGLRenderer` mới mỗi lần `currentCar.id` đổi.
   - V5.25 giữ **một showroom scene + một WebGLRenderer duy nhất** trong suốt phiên Garage.
   - Khi đổi xe chỉ tháo model cũ và gắn model mới.
   - FBX thật chỉ bắt đầu parse sau 180 ms khi lựa chọn đã ổn định, tránh parse xe người dùng chỉ lướt ngang qua.
   - `preserveDrawingBuffer` tắt trong render thường; Photo Mode render lại đúng frame trước khi `toDataURL`.
   - Khi rời Garage gọi `renderer.dispose()` + `forceContextLoss()` để trả WebGL context cho Race.

2. **Nhấn card xe không chọn được**
   - Pointer capture của carousel có thể nuốt native click.
   - V5.25 ghi nhớ `data-car-index` lúc pointer-down và chọn xe ở pointer-up nếu không có thao tác kéo.
   - Drag vẫn hoạt động; tap/click và drag được phân biệt bằng ngưỡng dịch chuyển.

3. **Race camera / viewport đen**
   - Camera frame đầu bây giờ `snap` trực tiếp vào chase position thay vì lerp từ `(0,0,0)`.
   - Kiểm tra `NaN/Infinity` cho waypoint/tangent trước khi tạo view matrix.
   - Near plane giảm từ `0.5` xuống `0.12` để phù hợp xe nhỏ/xe máy.
   - Hood/Cockpit được đưa ra vị trí an toàn theo loại xe; không giả định FBX có nội thất rỗng. Camera không còn nằm trong vỏ opaque của FBX.
   - `cameraView` dùng ref cập nhật realtime, không giữ closure cũ.
   - Race renderer cũng `forceContextLoss()` khi cleanup.
   - FBX lớn có giới hạn chờ: 7 s desktop / 3.8 s thiết bị khác. Quá thời gian sẽ chạy fallback nhẹ; FBX đến trễ bị bỏ để không freeze giữa Race.

4. **Xe đạp thấy vật giống cái bàn**
   - Nguyên nhân chắc chắn trong source: procedural fallback của xe đạp vẫn dùng `DEFAULT_CUSTOMIZATION.spoilerStyle = sport_wing`; geometry sport wing là một tấm ngang + hai trụ nên nhìn giống cái bàn.
   - `roadster_883_3d`, `vespa_studio_3d`, `xedap_city_3d` nay **không dựng automotive spoiler** trong procedural fallback.
   - Garage cũng ẩn lựa chọn spoiler cho toàn bộ xe hai bánh và hiển thị giải thích rõ.

## File sửa

- `src/components/racing/GarageScreen.tsx`
- `src/components/racing/Race3DCanvas.tsx`
- `src/lib/racing/Car3DBuilder.ts`
- `package.json`

## Validation

- TypeScript 5.8.3 transpile syntax riêng 3 file sửa: **0 lỗi cú pháp**.
- `tsc --noEmit`: còn 165 diagnostics do ZIP không có dependency/type đã cài (`react`, `three`, `lucide-react`, `react/jsx-runtime`, Node types). Không thấy diagnostics code nội bộ mới ngoài nhóm dependency trên ở 3 file sửa.
- `npm install --ignore-scripts --no-audit --no-fund`: môi trường không hoàn tất trước timeout nên không thể chạy Vite build cục bộ.
- GitHub Pages workflow vẫn build với `--base=/phuongnha/`.
