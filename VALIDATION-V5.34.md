# VALIDATION V5.34

- Version: 5.34.0
- New runtime FBX scenery loader wired into `Race3DCanvas`.
- Runtime FBX assets: pine, tank, police car, ambulance, helicopter.
- Heavy house/canon masters are not referenced by `src`/`public` runtime.
- GitHub Pages base remains `/phuongnha/`.
- `tsc --noEmit`: no new syntax/type errors were emitted for V5.34 files beyond missing dependency/module declarations because `node_modules` is absent.
- `npm run build`: cannot run in this container because `tsx` dependency is not installed (`tsx: not found`).
- Heavy master files >25MB are under `assets-source-heavy/` and ignored by Git for normal GitHub update.
