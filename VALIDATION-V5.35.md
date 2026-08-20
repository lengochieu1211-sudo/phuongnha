# VALIDATION V5.35

## Source changes
- Version: 5.35.0
- Race vehicle spawn/ground clearance fix: applied to player, AI and local P2 camera tracking.
- Avatar robust bounds fix: applied to StaticFbxAvatar.
- NBN scenery split: 20 chunks, max 16,850,080 bytes.
- Heavy NBN/canon sources remain outside GitHub Pages deployment (`assets-source-heavy/`).

## Static checks
- Global TypeScript 5.8.3 `tsc --noEmit` was run.
- Modified files have no diagnostics other than missing React/Three/JSX runtime dependencies because node_modules is unavailable in this environment.
- Relative import audit: 0 missing imports.

## Build limitation
- Full Vite build cannot be claimed here because dependencies are not installed; prior npm install attempts in this environment timed out.
