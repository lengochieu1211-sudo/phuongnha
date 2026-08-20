# VALIDATION V5.28

- Package version: `5.28.0`
- 9/9 FBX tồn tại đúng path và case.
- FBX structural/numeric comparison với v5.27: PASS.
- Geometry count / vertex count / numeric array lengths: PASS.
- Max numeric quantization error: <= 5e-6 source unit.
- FBX optimizer idempotency: PASS.
- `node --check src/scripts/optimizeAsciiFbx.mjs`: PASS.
- GitHub Pages workflow vẫn chứa `--base=/phuongnha/`: PASS.
- `tsc --noEmit`: 165 diagnostics, bằng nhóm dependency/type thiếu của v5.27; không tăng lỗi source nội bộ. Các diagnostic ở file sửa chỉ là thiếu `three` và `@types/node` do không có `node_modules`.
- `npm run build`: không thể hoàn tất trong sandbox vì `tsx: not found` (node_modules không có).
- Không chứa node_modules/dist/.git trong ZIP cuối.
