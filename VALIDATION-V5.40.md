# Validation V5.40

- Package version: `5.40.0`.
- Changed-file TypeScript/TSX syntax transpile: **0 diagnostics**.
- Full `tsc --noEmit`: only missing external dependency/type diagnostics because `node_modules` is not installed in this container; no additional internal/source diagnostic remained after filtering those dependency errors.
- Relative TS/TSX imports: **0 missing**.
- `CarModelId`: **42 IDs**; `CAR_CATALOG`: **42 unique IDs**; mismatch: **0**.
- External FBX runtime configs: **27**; missing runtime FBX file: **0**.
- Asset-check required set: **34 files**, missing: **0**, budget overflow: **0**.
- `public/`: **401 files**, largest runtime asset `zora-nao-racer.fbx` = **23,731,404 bytes**, no file exceeds **25 MiB**.
- Capybara race visual yaw correction: **180°** applied.
- Character racers use robust height-based bounds; Robot 4 collision/export helper groups named `convexhull` are hidden.
- P2 real external FBX is permitted on desktop; regular AI remains procedural to protect performance.
- Final GitHub ZIP must exclude `assets-source-heavy/`, `node_modules/`, `dist/`, and `.git/`.
