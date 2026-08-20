# AUDIT V5.32 - BULK FBX LIBRARY OPTIMIZATION

Đã nhập thêm các FBX mới vào thư viện source, tối ưu ASCII để giảm dung lượng, giữ nguyên hình học/material logic gốc, không xoá mesh vận hành quan trọng.

## Thư mục mới
- `assets-source/model-library/characters/`
- `assets-source/model-library/vehicles/`
- `assets-source/model-library/props/`

## Kết quả từng file

### Nhân vật Cap
- Nguồn: `cap.fbx`
- Đích: `assets-source/model-library/characters/cap-figure.fbx`
- Dung lượng: 2,925,576 → 1,842,892 bytes (37.01% giảm)
- Model/Material/Texture: 7 / 4 / 4
- Gợi ý: Dung lượng chấp nhận được sau tối ưu ASCII. Có texture/material tham chiếu; cần giữ cùng gói asset nếu muốn hiển thị đủ màu gốc.

### Hulk Character
- Nguồn: `hub.fbx`
- Đích: `assets-source/model-library/characters/hulk-character.fbx`
- Dung lượng: 5,472,563 → 3,271,278 bytes (40.22% giảm)
- Model/Material/Texture: 10 / 4 / 4
- Gợi ý: Dung lượng chấp nhận được sau tối ưu ASCII. Có texture/material tham chiếu; cần giữ cùng gói asset nếu muốn hiển thị đủ màu gốc.

### Nhân vật Nhện
- Nguồn: `nhen.fbx`
- Đích: `assets-source/model-library/characters/nhen-character.fbx`
- Dung lượng: 1,289,969 → 826,248 bytes (35.95% giảm)
- Model/Material/Texture: 3 / 4 / 4
- Gợi ý: Dung lượng chấp nhận được sau tối ưu ASCII. Có texture/material tham chiếu; cần giữ cùng gói asset nếu muốn hiển thị đủ màu gốc.

### Mark 6 Armor
- Nguồn: `mark+6.fbx`
- Đích: `assets-source/model-library/characters/mark-6-armor.fbx`
- Dung lượng: 11,133,253 → 6,403,050 bytes (42.49% giảm)
- Model/Material/Texture: 132 / 15 / 4
- Gợi ý: Dung lượng chấp nhận được sau tối ưu ASCII. Có texture/material tham chiếu; cần giữ cùng gói asset nếu muốn hiển thị đủ màu gốc.

### Iron Man Mark III
- Nguồn: `IRON+MAN+Mark+III.fbx`
- Đích: `assets-source/model-library/characters/iron-man-mark-iii.fbx`
- Dung lượng: 40,629,340 → 22,918,540 bytes (43.59% giảm)
- Model/Material/Texture: 519 / 21 / 5
- Gợi ý: Rất nặng, nên chỉ bật trên PC mạnh hoặc cần thêm bản lowpoly/GLB. Có texture/material tham chiếu; cần giữ cùng gói asset nếu muốn hiển thị đủ màu gốc.

### Zora Nao Robot
- Nguồn: `Zora+Nao+Robot+Boeckx.fbx`
- Đích: `assets-source/model-library/characters/zora-nao-robot-boeckx.fbx`
- Dung lượng: 36,915,072 → 23,731,404 bytes (35.71% giảm)
- Model/Material/Texture: 87 / 14 / 1
- Gợi ý: Rất nặng, nên chỉ bật trên PC mạnh hoặc cần thêm bản lowpoly/GLB. Có texture/material tham chiếu; cần giữ cùng gói asset nếu muốn hiển thị đủ màu gốc.

### Knut Character
- Nguồn: `Knut.fbx`
- Đích: `assets-source/model-library/characters/knut-character.fbx`
- Dung lượng: 3,178,821 → 1,928,334 bytes (39.34% giảm)
- Model/Material/Texture: 21 / 6 / 1
- Gợi ý: Dung lượng chấp nhận được sau tối ưu ASCII. Có texture/material tham chiếu; cần giữ cùng gói asset nếu muốn hiển thị đủ màu gốc.

### MMDA Scene Asset
- Nguồn: `mmda.fbx`
- Đích: `assets-source/model-library/props/mmda-scene.fbx`
- Dung lượng: 20,408,312 → 11,770,672 bytes (42.32% giảm)
- Model/Material/Texture: 296 / 22 / 1
- Gợi ý: Khá nặng, TV/điện thoại nên dùng fallback hoặc preload chậm. Có texture/material tham chiếu; cần giữ cùng gói asset nếu muốn hiển thị đủ màu gốc.

### Dodge WC-51 Truck
- Nguồn: `dodge_wc-51.fbx`
- Đích: `assets-source/model-library/vehicles/dodge-wc-51-truck.fbx`
- Dung lượng: 36,307,930 → 20,566,268 bytes (43.36% giảm)
- Model/Material/Texture: 344 / 46 / 0
- Gợi ý: Rất nặng, nên chỉ bật trên PC mạnh hoặc cần thêm bản lowpoly/GLB. Không có texture rời, chủ yếu màu/material nội bộ trong FBX. Có node bánh xe/tire; có thể rig bánh sau này nếu cần đưa vào gara/đua xe.

### Người Character
- Nguồn: `nguoi.fbx`
- Đích: `assets-source/model-library/characters/nguoi-character.fbx`
- Dung lượng: 615,418 → 370,281 bytes (39.83% giảm)
- Model/Material/Texture: 2 / 18 / 3
- Gợi ý: Dung lượng chấp nhận được sau tối ưu ASCII. Có texture/material tham chiếu; cần giữ cùng gói asset nếu muốn hiển thị đủ màu gốc.

### US Soldier
- Nguồn: `us_soldier.fbx`
- Đích: `assets-source/model-library/characters/us-soldier.fbx`
- Dung lượng: 1,576,847 → 949,074 bytes (39.81% giảm)
- Model/Material/Texture: 3 / 7 / 5
- Gợi ý: Dung lượng chấp nhận được sau tối ưu ASCII. Có texture/material tham chiếu; cần giữ cùng gói asset nếu muốn hiển thị đủ màu gốc.

### Robot 19
- Nguồn: `Robot_19.fbx`
- Đích: `assets-source/model-library/characters/robot-19.fbx`
- Dung lượng: 7,659,036 → 4,599,167 bytes (39.95% giảm)
- Model/Material/Texture: 3 / 15 / 1
- Gợi ý: Dung lượng chấp nhận được sau tối ưu ASCII. Có texture/material tham chiếu; cần giữ cùng gói asset nếu muốn hiển thị đủ màu gốc.

### Người Xe NBN Archi
- Nguồn: `NGUOI+XE+NBN+ARCHI.fbx`
- Đích: `assets-source/model-library/vehicles/nguoi-xe-nbn-archi.fbx`
- Dung lượng: 21,218,621 → 12,062,466 bytes (43.15% giảm)
- Model/Material/Texture: 332 / 32 / 8
- Gợi ý: Khá nặng, TV/điện thoại nên dùng fallback hoặc preload chậm. Có texture/material tham chiếu; cần giữ cùng gói asset nếu muốn hiển thị đủ màu gốc. Không thấy node bánh xe rõ ràng; nếu đưa vào gameplay nên để dạng tĩnh hoặc kiểm tra thủ công.

### Trực Thăng Helicopter
- Nguồn: `truc thang.fbx`
- Đích: `assets-source/model-library/vehicles/truc-thang-helicopter.fbx`
- Dung lượng: 338,858 → 192,303 bytes (43.25% giảm)
- Model/Material/Texture: 33 / 5 / 0
- Gợi ý: Dung lượng chấp nhận được sau tối ưu ASCII. Không có texture rời, chủ yếu màu/material nội bộ trong FBX. Không thấy node bánh xe rõ ràng; nếu đưa vào gameplay nên để dạng tĩnh hoặc kiểm tra thủ công.

### Police Car
- Nguồn: `cs.fbx`
- Đích: `assets-source/model-library/vehicles/police-car.fbx`
- Dung lượng: 229,268 → 144,781 bytes (36.85% giảm)
- Model/Material/Texture: 15 / 9 / 0
- Gợi ý: Dung lượng chấp nhận được sau tối ưu ASCII. Không có texture rời, chủ yếu màu/material nội bộ trong FBX. Có node bánh xe/tire; có thể rig bánh sau này nếu cần đưa vào gara/đua xe.

### Police Motorcycle
- Nguồn: `mt cs.fbx`
- Đích: `assets-source/model-library/vehicles/police-motorcycle.fbx`
- Dung lượng: 543,042 → 303,130 bytes (44.18% giảm)
- Model/Material/Texture: 67 / 9 / 0
- Gợi ý: Dung lượng chấp nhận được sau tối ưu ASCII. Không có texture rời, chủ yếu màu/material nội bộ trong FBX. Có node bánh xe/tire; có thể rig bánh sau này nếu cần đưa vào gara/đua xe.

### Ambulance
- Nguồn: `cuu thuong.fbx`
- Đích: `assets-source/model-library/vehicles/ambulance.fbx`
- Dung lượng: 275,488 → 172,739 bytes (37.3% giảm)
- Model/Material/Texture: 29 / 9 / 0
- Gợi ý: Dung lượng chấp nhận được sau tối ưu ASCII. Không có texture rời, chủ yếu màu/material nội bộ trong FBX. Có node bánh xe/tire; có thể rig bánh sau này nếu cần đưa vào gara/đua xe.

### OilAge Machine
- Nguồn: `OilAge.fbx`
- Đích: `assets-source/model-library/props/oil-age-machine.fbx`
- Dung lượng: 2,749,222 → 1,857,624 bytes (32.43% giảm)
- Model/Material/Texture: 9 / 24 / 0
- Gợi ý: Dung lượng chấp nhận được sau tối ưu ASCII. Không có texture rời, chủ yếu màu/material nội bộ trong FBX.

### Drag Driver
- Nguồn: `Drag-Driver.fbx`
- Đích: `assets-source/model-library/characters/drag-driver.fbx`
- Dung lượng: 3,562,678 → 2,382,246 bytes (33.13% giảm)
- Model/Material/Texture: 15 / 24 / 0
- Gợi ý: Dung lượng chấp nhận được sau tối ưu ASCII. Không có texture rời, chủ yếu màu/material nội bộ trong FBX.

## Gợi ý tiếp theo
- Các file trên 20MB nên có thêm bản lowpoly hoặc đổi sang GLB để dùng trên TV/điện thoại.
- Với model xe muốn đưa thẳng vào Gara/Đua Xe, nên kiểm tra thêm forward axis, ride height và node bánh xe bằng viewer 3D trước khi gắn metadata vào race loader.
- Với model nhân vật lái xe, nên ưu tiên bản đã rig/skeleton nếu muốn bám tay/chân theo xe; còn FBX tĩnh chỉ hợp cho trưng bày hoặc gắn cố định.
- Toàn bộ chi tiết có trong `FBX_LIBRARY_MANIFEST_V5.32.json`.
