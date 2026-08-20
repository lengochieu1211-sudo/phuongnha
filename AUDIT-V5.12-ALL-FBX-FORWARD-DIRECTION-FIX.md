# AUDIT V5.12 – Fix hướng tiến cho toàn bộ FBX xe

## Kết quả đo 4 model thật

### Canis Mesa
- Bounds thô: X≈2.303, Y≈2.983, Z≈5.292
- Trục dài: Z
- Đầu xe của asset: -Z
- Mapping đúng sang RaceEngine +Z: quay Y +180°

### V12 SV
- Bounds thô: X≈2.805, Y≈1.453, Z≈5.986
- Trục dài: Z
- Đầu xe của asset: -Z
- Mapping đúng: quay Y +180°

### 883 Roadster
- Bounds thô: X≈2.170, Y≈1.206, Z≈0.778
- Trục dài: X
- Đầu xe của asset: -X
- Mapping đúng sang +Z: quay Y +90°

### Vespa Studio
- Bounds thô: X≈1707.884, Y≈1467.092, Z≈1470.668
- Trục dài: X
- Đầu xe của asset: -X
- Mapping đúng: quay Y +90°

## Lỗi V5.11
V5.11 giả định +Z hoặc +X là đầu xe.
Trong Three.js, `Object3D.lookAt()` của root đưa local +Z theo hướng tangent của đường đua.
Do asset thực tế quay đầu theo trục âm nên model nhìn/chạy ngược.

## Sửa V5.12
- Không sửa riêng từng model.
- Nếu model dài theo X: tự map `-X -> +Z` bằng +90°.
- Nếu model dài theo Z: tự map `-Z -> +Z` bằng +180°.
- Garage và Race đều dùng cùng `ExternalCarModelLoader`, nên hướng nhất quán.
- 883/Vespa vẫn `wheelMode: none` để không xoay nhầm ghi-đông/phuộc.
- Fallback procedural vẫn chỉ dùng khi model thật không tải hoặc thiết bị bị giới hạn.

## Kiểm tra
- Giữ nguyên 4 FBX xe, ng1 avatar, camera full-body và gameplay V5.11.
- Giữ GitHub Pages workflow.
