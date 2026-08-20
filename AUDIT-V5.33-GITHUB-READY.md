# V5.33 - GitHub Ready Web Package

- Version bumped to 5.33.0.
- Preserved GitHub Pages base `/phuongnha/` and deploy workflow.
- Moved the 19 newly imported but not-yet-used FBX models from `public/assets/model-library/` to `assets-source/model-library/` so Vite/GitHub Pages does not copy ~111 MB of unused model masters into the deployed website.
- The model library remains committed in source for future Garage/Racing/Magic Mirror integration.
- Reduced `rescue-truck-hauler.fbx` numeric precision from the validated V5.28 5-decimal payload to 3 decimals only for geometry arrays, reducing it below the GitHub browser-upload single-file threshold while preserving topology/material/model counts.
- Added `.gitattributes` to treat FBX/audio/images as binary and avoid huge text diffs.
- GitHub Actions dependency install uses `npm install --no-audit --no-fund`.
- No `node_modules`, `dist` or `.git` included in the package.
