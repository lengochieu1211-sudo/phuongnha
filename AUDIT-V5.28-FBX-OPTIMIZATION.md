# AUDIT V5.28 – FBX Optimization / TV & Mobile Load Reduction

## Mục tiêu

Giảm trực tiếp dung lượng 9 FBX đang dùng trong game mà không tự động decimate polygon, không đổi hierarchy, material assignment, wheel metadata hay hướng model đã xác minh.

## Phương pháp

- Giữ nguyên toàn bộ số Geometry / vertex / index và cấu trúc FBX.
- Xóa comment ASCII không cần thiết.
- Giữ nguyên tab + line break vì `FBXLoader` ASCII phụ thuộc cấu trúc dòng.
- Làm tròn payload hình học dư thừa: vertices/normals/UV/weights 5 chữ số thập phân; transform 6 chữ số.
- Không đụng ID, tên node, material name, connection, pivot hoặc forward-axis metadata.
- Thêm `npm run optimize:fbx` để có thể tối ưu lại model mới trong tương lai.
- `checkAssets.ts` có giới hạn kích thước FBX để tránh vô tình đưa lại bản gốc quá nặng.

## Kết quả

| Model | Trước | Sau | Giảm | Vertices |
|---|---:|---:|---:|---:|
| `child-girl-static.fbx` | 13.51 MB | 8.99 MB | **-33.5%** | 66,454 |
| `ng1-human-static.fbx` | 1.07 MB | 0.63 MB | **-41.3%** | 5,087 |
| `canis-mesa-cronoz.fbx` | 6.75 MB | 3.81 MB | **-43.6%** | 34,895 |
| `rescue-truck-hauler.fbx` | 50.45 MB | 28.36 MB | **-43.8%** | 306,636 |
| `roadster-883-3d.fbx` | 11.37 MB | 6.08 MB | **-46.5%** | 70,472 |
| `s14-sport-coupe.fbx` | 8.85 MB | 5.37 MB | **-39.3%** | 69,123 |
| `v12-sv-supercar.fbx` | 37.65 MB | 20.77 MB | **-44.8%** | 181,061 |
| `vespa-studio-3d.fbx` | 22.25 MB | 12.90 MB | **-42.0%** | 92,745 |
| `xedap-city-bike.fbx` | 28.58 MB | 17.30 MB | **-39.5%** | 154,962 |

**Tổng FBX:** 180.46 MB → 104.20 MB  
**Tiết kiệm:** 76.26 MB (42.3%).

## TV / Mi Box

- Mobile tiếp tục không parse FBX thật trong Race/Garage khi profile nhẹ.
- Canis, S14 và Roadster có bản FBX tối ưu đủ nhẹ để giữ trên TV/tablet theo policy hiện tại.
- Vespa sau tối ưu còn ~12.9 MB nhưng có tới 238 mesh; V5.28 đổi Vespa sang `desktop_only` để Mi Box không bị khựng do parse ASCII trên main thread.
- V12, Rescue Hauler và XEDAP tiếp tục chỉ dùng FBX thật trên desktop; TV/mobile dùng procedural fallback nhẹ.

## Xác minh hình học

Đã so sánh từng array block trước/sau cho toàn bộ 9 FBX:

- số array block: giữ nguyên;
- declared element count: giữ nguyên;
- số Geometry: giữ nguyên;
- số vertex: giữ nguyên;
- sai lệch số học tối đa ở các array hình học: <= `5e-6` đơn vị nguồn;
- bounding-box sai lệch tối đa: < `5e-6` đơn vị nguồn.

Do đó đây là tối ưu precision/ASCII, **không phải giảm polygon**; hình dáng và topology được giữ nguyên.
