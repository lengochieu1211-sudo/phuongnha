# VALIDATION V5.23

## Model audit
- 9 FBX files checked directly from `public/assets/cars` and `public/assets/avatars`.
- Required model files: PASS (all exist, non-empty, exact case).
- No FBX contains Camera, Light, Deformer/Skeleton or AnimationStack records.
- XEDAP: no table/platform geometry exists in the FBX point cloud.
- The table-like object seen in the race screenshot is the procedural AI `sport_wing` (wide wing + two posts). AI spoiler changed to compact `stock`.
- Vespa wheel-centre source forward vector: raw XZ angle ~139.89°. Final holder yaw ~49.9° gives ~89.99° (+Z), fixing the residual diagonal export angle.
- Canis spare wheel remains visual but is excluded from the four road wheels.
- V12 `Steering_wheel` remains excluded from wheel detection.
- Unsafe wheel hierarchies remain static instead of being guessed.

## Paint
- V12 `c1` exterior shell is explicitly paintable.
- Canis `desert_camo_256*` material family is explicitly paintable because the original texture maps are absent.
- Glass/tyres/rims/lights/interior/steering/metal exclusions remain active.

## Assets / GitHub Pages
- Required assets checked: 12/12 PASS.
- `.github/workflows/deploy.yml` retained.
- Workflow still contains `--base=/phuongnha/`: PASS.

## TypeScript
Command executed:

`tsc --noEmit --pretty false`

Result: exit 2 because this source archive intentionally has no `node_modules`.
The 165 diagnostics are dependency/global-type diagnostics only (`TS2307`, `TS2875`, `TS2580`, `TS2552`, `TS2304`) for React, Three, Lucide, Node typings, Vite, etc.
The modified files have no additional source-internal TypeScript diagnostic beyond missing module/JSX runtime types.

## Dependency / build
`npm install --ignore-scripts --no-audit --no-fund` was attempted but did not complete within the environment timeout.
`npm run build` was then executed and stopped at `tsx: not found` because dependencies were not installed. This is an environment/dependency availability failure, not recorded as a successful Vite build.

## Packaging policy
The release ZIP excludes:
- `node_modules`
- `dist`
- `.git`

and retains the GitHub Pages workflow and all source/assets.
