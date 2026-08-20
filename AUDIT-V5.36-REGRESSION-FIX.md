# AUDIT V5.36 — REGRESSION FIX SAU V5.35

## Lỗi thực tế tìm thấy và đã sửa

### 1. Bạn đồng hành bị vòng tròn trống ở Main Menu
- Nguyên nhân: MainMenu chỉ render icon cho 5 CharacterId cũ (`bara/may/bong/miu/lumi`).
- Khi chọn `cinnamoroll`, `kuromi`, `capy_tie` hoặc `po`, bubble vẫn có nền nhưng không có nội dung.
- Sửa: tạo helper tập trung `getCharacterEmoji()` bao phủ toàn bộ CharacterId và dùng lại tại MainMenu/PetCare/Ludo.

### 2. Tủ đồ ghi sai tên nhân vật mới thành Lumi
- Nguyên nhân: label trong WardrobeScreen dùng chuỗi điều kiện chỉ có 4 nhân vật đầu, còn lại fallback thành Lumi.
- Sửa: `getCharacterDisplayLabel()` đọc trực tiếp từ `CHARACTERS_CONFIG`.

### 3. Xe/đường có thể bị mặt đất che khi track có Y âm
- Nguyên nhân gốc: ground plane của map thường cố định `Y=-0.18`, trong khi Neon/Mountain/Candy/Coastal có waypoint thấp hơn nhiều (Mountain khoảng -5.18).
- Kết quả: ở đoạn thấp, ground plane có thể nằm trên asphalt và xe, tạo cảm giác xe chìm/mất khi đổi cảnh.
- Sửa: ground plane đặt tại `minTrackY - 0.45` cho từng track.

### 4. Cao độ AI/P2 chưa đồng nhất với người chơi trên đoạn banked
- Sửa: thêm `getRoadSurfaceY()` và dùng chung cho Player/AI/P2/spawn để cùng tính bank + lateral offset.

### 5. Fallback category P2 sai từ `sports` thành `sport`
- Sửa để thống nhất với `CarCategory`.

### 6. Màu card Capybara trong Companion Selector không bao giờ chạy
- Code cũ kiểm tra id `capybara` nhưng CharacterId thật là `bara`/`capy_tie`.
- Đã sửa hai case đúng.

## Kiểm tra hồi quy
- 82 file TS/TSX/config transpile syntax: 0 lỗi.
- Relative imports: 0 thiếu.
- Static asset refs: 52, thiếu 0.
- Car catalog: 23 xe, ID trùng 0.
- Character config: 9 nhân vật, emoji/label thiếu 0.
- 6 track: 72 waypoint/track, tọa độ hữu hạn; terrain plane mới luôn thấp hơn min road Y.
- Pure RaceEngine smoke test 1P/2P: state hữu hạn; 2P có local P2 đúng.
- Full `tsc --noEmit`: không có diagnostic source nội bộ ngoài nhóm dependency/type package chưa cài trong container.

