# V5.2 — Racing / Voice / Audio lifecycle fix

## Lỗi đã sửa

### 1. Giọng nữ vẫn thành giọng nam
- Không còn khôi phục mù `selectedVoiceName` cũ nếu voice đó không phù hợp với `voiceStyle` hiện tại.
- Nhận diện các biến thể Google Vietnamese Android phổ biến theo `voiceURI`:
  - nữ: `vi-vn-x-vic`, `vi-vn-x-vid`, `vi-vn-x-vif`;
  - nam: `vi-vn-x-vie`, `vi-vn-x-gft`.
- Bổ sung nhận diện HoaiMy/Linh và một số tên voice tiếng Việt phổ biến.
- Refresh danh sách `speechSynthesis.getVoices()` ngay trước khi đọc vì Chrome/Android thường nạp voice bất đồng bộ.
- Màn Cài đặt giọng hiển thị tên system voice thực tế đang dùng.

### 2. Thoát game/cài đặt nhưng âm thanh còn chạy
- `App` dừng VoiceGuide, recorded voice, RaceAudio và AudioEngine khi trở về menu.
- Đóng màn Cài đặt giọng cũng dừng preview và audio tức thì.
- `AudioEngine` và `RaceAudio` quản lý toàn bộ timeout SFX bằng registry; khi thoát, timer chưa chạy bị hủy.
- `RaceEngine.destroy()` gọi `raceAudio.stopAll()` nên thoát lúc countdown/drift/nitro không để âm thanh chạy ngầm.

### 3. Xe quá xa / khó nhìn
- Camera mặc định đổi sang `close_chase`.
- FOV thường: 54°; Nitro: 62°.
- Close chase: khoảng cách ~4.05 đơn vị, cao ~1.75.
- Chase thường: khoảng cách ~5.15, cao ~2.10.
- Xe chiếm khung hình lớn hơn rõ rệt, gần phong cách chase camera game đua xe hiện đại.

### 4. Cảnh đua thiếu thật
- Thêm vạch đường đứt đoạn bằng InstancedMesh.
- Thêm mặt đất ngoài đường đua để không còn cảm giác đường nằm trong khoảng trống.
- City Night: tòa nhà có texture cửa sổ phát sáng thay vì cả khối hộp neon; tăng mật độ công trình trên PC High; thêm rooftop và đèn đường.
- Sunset Coast: mặt nước vật liệu physical và cây cọ nhiều tán hơn.
- Mountain: bổ sung cảnh núi (trước đó branch mountain hầu như không có scenery riêng).
- Các cảnh nặng chỉ tăng mạnh ở profile High; Lite/Balanced vẫn giảm mật độ.

## Kiểm tra tĩnh
- `npx tsc --noEmit`: không phát hiện lỗi TypeScript nội bộ mới sau khi loại lỗi dependency/type môi trường.
- Không còn `speechSynthesis` trực tiếp ngoài `VoiceGuideService`.
- AudioEngine/RaceAudio chỉ còn 1 `setTimeout` trực tiếp trong helper quản lý timer.
- Không thay đổi schema save game.

## Lưu ý
Web Speech phụ thuộc các voice đã cài trên hệ điều hành. Nếu thiết bị hoàn toàn không có voice nữ tiếng Việt, app không thể tạo một giọng nữ neural thật chỉ bằng đổi pitch; cần cài thêm Vietnamese female voice trên Android/Windows hoặc bổ sung một bộ audio/TTS nữ thật.
