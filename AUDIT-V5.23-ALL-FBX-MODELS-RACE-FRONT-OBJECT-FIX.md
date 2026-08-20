# AUDIT V5.23 – ALL FBX MODELS + RACE FRONT-OBJECT FIX

## Scope
Full geometry/source audit of every FBX currently shipped by the game after the report that a bicycle appeared to have a table/platform attached in front of it.

## Key finding: the object in front of XEDAP was NOT inside XEDAP.fbx
`public/assets/cars/xedap-city-bike.fbx` contains 50 mesh geometries and its complete vertex cloud stays inside the bicycle silhouette. No large table/platform, camera, light, helper, armature, animation, or detached oversized plane exists in the FBX.

The visible shape in Race matches the procedural AI `sport_wing` exactly: a wide horizontal wing plus two vertical posts. Every AI car was being created with `spoilerStyle: 'sport_wing'`, and the first AI starts close enough to the player that its rear wing can fill the chase-camera foreground.

### Fix
- `src/components/racing/Race3DCanvas.tsx`
- AI opponents now use compact `spoilerStyle: 'stock'` instead of the tall sport wing.
- Player spoiler customization is untouched.
- Race physics, AI count, player vehicle and track logic are unchanged.

## Full FBX audit

| Model | Bytes | Meshes | Materials | External textures | Rig/animation | Verified orientation / action |
|---|---:|---:|---:|---:|---|---|
| Canis Mesa | 7,073,343 | 49 | 41 | 33 missing | none | +Z; 5 wheel groups, lowest 4 are road wheels; high spare excluded |
| V12 SV | 39,479,796 | 69 | 30 | 2 missing | none | +Z; w2_1..w2_4 valid; Steering_wheel excluded |
| 883 Roadster | 11,919,480 | 119 | 9 | 6 missing | none | -X; generic SketchUp hierarchy, wheel animation remains disabled |
| Vespa Studio | 23,327,246 | 238 | 41 | 26 missing | none | exported diagonally; wheel-centre vector measured at ~139.89° in XZ; corrected to +Z with residual -40.1° visual yaw; wheel spin/lean remain disabled |
| S14 Sport | 9,277,031 | 74 | 19 | 7 missing | none | +Z; no trustworthy wheel group names, wheel animation disabled |
| Rescue Truck + Trailer | 52,899,633 | 260 | 53 | 12 missing | none | +Z; truck + long trailer + many wheel groups are intentional; wheel animation disabled; desktop-only real FBX |
| XEDAP City Bike | 29,968,721 | 50 | 16 | 0 | none | -X; no table/platform found; no safe named wheel groups, wheel animation disabled; desktop-only real FBX |
| Child+girl | 14,165,808 | 1 | 49 | 40 missing | none | static human mesh; no Skeleton/Skin/Bone/Animation; whole-body follow only |
| ng1 human | 1,119,921 | 5 | 5 | 3 missing | none | static human mesh; no Skeleton/Skin/Bone/Animation; whole-body follow only |

## Geometry / junk-object checks
- No FBX contains Camera, Light, Skeleton, Deformer, AnimationStack or Pose objects.
- No oversized detached table/platform was detected in XEDAP, S14, Canis, V12, Roadster or Vespa point-cloud silhouettes.
- Rescue Truck contains a very long enclosed cargo trailer by design; it is not treated as junk.
- Canis spare wheel is intentionally retained visually but excluded from rotating road-wheel selection.
- V12 steering wheel is explicitly rejected from road-wheel detection.

## Paint fixes included
- V12: material `c1` is confirmed on the large yellow exterior shell (`Mesh62`) and is now explicitly paintable.
- Canis: the `desert_camo_256*` diffuse material family is now paintable because its original texture files are not bundled.
- Existing per-model paint rules for Vespa, S14, Rescue Truck and XEDAP are retained.
- Glass, tyres, rims, lights, interior, steering wheel, handlebar and metal hardware remain excluded from body recoloring.

## Missing textures
All legacy/user FBXs except XEDAP reference texture files that were not supplied with the models. The runtime loading managers already replace missing image URLs with a 1x1 fallback and reconstruct materials from FBX diffuse colors, preventing load crashes and 404 storms. Missing files are not falsely reported as embedded textures.

## Files changed in V5.23
- `src/lib/racing/ExternalCarModelLoader.ts`
- `src/components/racing/Race3DCanvas.tsx`
- `package.json`
- `AUDIT-V5.23-ALL-FBX-MODELS-RACE-FRONT-OBJECT-FIX.md`
- `VALIDATION-V5.23.md`

## Important limitations
- No current human FBX has a rig. MediaPipe cannot bend arms/legs on these models until they are rigged/skinned.
- Roadster, Vespa, S14, Rescue Truck and XEDAP intentionally keep wheel animation off where a reliable wheel hierarchy/pivot cannot be proven.
- Missing original texture maps cannot be reconstructed from the FBX alone.
