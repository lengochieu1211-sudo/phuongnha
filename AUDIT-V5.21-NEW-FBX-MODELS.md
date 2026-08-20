# AUDIT V5.21 – NEW FBX MODELS

## 1. Source files inspected directly

| Uploaded FBX | Size (bytes) | FBX | Models | Meshes | Vertices | Materials | Textures | Skeleton / Skin | Animation |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Child+girl.fbx | 14,165,808 | 7.7 | 3 | 1 | 66,454 | 49 | 40 | none | none |
| s14.fbx | 9,277,031 | 7.7 | 150 | 74 | 69,123 | 19 | 7 | none | none |
| Ban tai.fbx | 52,899,633 | 7.7 | 600 | 260 | 306,636 | 53 | 12 | none | none |
| XEDAP.fbx | 29,968,721 | 7.7 | 132 | 50 | 154,962 | 16 | 0 | none | none |

All four files are ASCII FBX 7.7. No camera/light nodes were found. No embedded texture payload was found (`Content:` = 0).

## 2. Child+girl.fbx

- Added as `public/assets/avatars/child-girl-static.fbx`.
- Contains semantic materials such as `Face1`, `Hands1`, `Dress1`, hair/eye materials, etc.
- The 40 image maps are external file references such as `Documents/Child+girl/*.jpg`; those JPG files were not included in the upload.
- `StaticFbxAvatar` now intercepts missing image-map URLs and supplies a one-pixel fallback instead of allowing texture-load failures to break the avatar.
- Diffuse FBX material colors are preserved as the visual fallback.
- There is **no Deformer/Skin/Cluster/Animation**, therefore this model cannot honestly retarget elbows/knees/wrists. V5.21 only follows whole-body yaw/roll until a rigged model is supplied.

## 3. s14.fbx

- Added as `public/assets/cars/s14-sport-coupe.fbx` and catalog id `s14_sport_3d`.
- Direct point-cloud/bounding inspection confirms the vehicle front is toward **+Z**.
- The hierarchy is mostly generic SketchUp `Component_*` / `Mesh*`; no trustworthy named wheel groups exist.
- Wheel animation is therefore disabled (`wheelMode: none`) rather than guessing nodes and causing wheels to orbit/jump.
- Verified exterior paint-material family is matched separately so Garage paint selection recolors the actual body while glass/metal/tyres/lights remain untouched.
- External PNG maps are not embedded; runtime uses material-color fallback so missing files do not crash the loader.

## 4. Ban tai.fbx

- Added as `public/assets/cars/rescue-truck-hauler.fbx` and catalog id `rescue_truck_hauler_3d`.
- This is not a simple pickup. The hierarchy identifies a **Fire Rescue Smart Truck Hauler / International truck + long trailer**.
- Direct geometry inspection shows the cab/front at **+Z** and the trailer extending toward -Z.
- It contains truck wheels `wheel_2_1...wheel_2_6` plus seven trailer wheel assemblies (`trailer_wheel1...7` and tyre groups). Auto-selecting four wheels would be incorrect, so wheel animation remains disabled.
- At ~52.9 MB ASCII / 260 meshes, the real FBX is `desktop_only`; phone/TV uses the existing procedural fallback to avoid a long main-thread parse or GPU spike.
- Garage and Race use dedicated camera distance/height metadata because the normalized vehicle is much longer than a normal car.
- Contact shadow is widened/lengthened for the hauler.

## 5. XEDAP.fbx

- Added as `public/assets/cars/xedap-city-bike.fbx` and catalog id `xedap_city_3d`.
- Hierarchy contains `mamachari_dxf`, identifying a city bicycle.
- Direct side-silhouette inspection confirms fork/front wheel/handlebar toward **-X**.
- No skeleton/animation and no reliable named wheel groups were found; wheel animation is disabled rather than risking bad pivots.
- There are no external texture references, so this model is material-color only.
- At ~30 MB ASCII / 154,962 vertices, real FBX loading is desktop-only; lighter devices fall back automatically.
- Dedicated Garage/Race framing prevents the bicycle appearing tiny with car-sized camera offsets.

## 6. FBX paint-color hardening

`ExternalCarModelLoader.ts` now marks imported FBX materials with `userData.apPaintable` after classification. `applyCustomization()` changes only those marked materials.

Explicit exclusions include glass/window, tyres/rubber, wheel/rim, steering/handlebar, seats/interior, chrome/metal, grille/exhaust and lamps. This prevents the previous failure mode where selecting a color could affect the wrong visual object while the actual car body stayed unchanged.

The Garage turntable/floor is a separate Three.js object and is never traversed by FBX `applyCustomization()`.

## 7. Safety / preserved logic

- Existing Canis +Z, V12 +Z, Roadster -X and Vespa -X metadata preserved.
- Existing Vespa v5.20 visual yaw/upright fix preserved.
- Existing bbox-center wheel pivot repair preserved for the two models whose wheel groups are verified.
- No wheel-group guessing was introduced for the four new uploads.
- GitHub Pages runtime paths still use `import.meta.env.BASE_URL`; workflow retains `--base=/phuongnha/`.
