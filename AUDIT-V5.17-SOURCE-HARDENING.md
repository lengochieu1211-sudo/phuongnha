# Phương Nhã – Phiêu Lưu Kỳ Diệu v5.17

## Thay đổi trực tiếp
- Giữ toàn bộ gameplay/camera/Fashion AR/Ludo/racing/FBX hiện có của v5.16.
- Race warm-up chờ **2 animation frame** sau render + shader compile trước khi báo scene ready và bắt đầu 3-2-1.
- Thêm `check:assets` để kiểm tra 4 FBX xe, ng1 avatar, texture PC, voice status và GitHub Pages `/phuongnha/`.
- Thêm `npm run check` gom TypeScript + asset + voice integrity.
- Package version tăng thành 5.17.0.

## Xác nhận source hiện có được giữ
- Camera xin sensor 4:3, `resizeMode:none`, zoom min khi browser hỗ trợ, canvas theo videoWidth/videoHeight.
- Calibration game chuyển động dùng đầu + hai vai + hai tay; chân không bắt buộc.
- Fashion calibration có upper-body mode và full-body bổ sung.
- Cờ Cá Ngựa tự start/stop camera theo tùy chọn gesture và nhận clap/both_arms_up/hands_spread.
- Ninja/Goalkeeper/Magic Academy có arena, timing, score/combo/miss thay vì màn chữ tĩnh.
- FBX metadata: Canis +Z, V12 +Z, Roadster -X, Vespa -X; Roadster/Vespa wheel animation tắt an toàn.
- Wheel rig named loại steering wheel/handlebar, lấy bbox center, tạo AP_SteerPivot/AP_SpinPivot và attach giữ world transform.
- Track Y dùng nội suy monotonic/smoothing thay vì Catmull-Rom Y overshoot.
- Race chỉ bắt đầu countdown sau selected FBX + first render + shader compile.

## Giới hạn model
`ng1-human-static.fbx` không có skeleton/skin/animation nên chỉ được xoay/nghiêng toàn model; không giả lập retarget tay/chân.
