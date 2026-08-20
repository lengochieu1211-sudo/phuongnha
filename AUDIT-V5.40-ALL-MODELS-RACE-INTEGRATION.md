# V5.40 – All requested FBX models integrated into Garage / Race

## Added selectable vehicles
- Police Patrol 3D
- Police Motorcycle 3D
- Ambulance Rescue 3D
- Battle Tank 3D
- Helicopter Racer 3D
- Dodge WC-51 3D

The existing police / ambulance / tank / helicopter scenery files are reused where possible instead of duplicating the same FBX in `public/`.

## Added selectable character / robot racers
- Spider Hero
- Robot 19
- Robot 4
- Prime 1
- Iron Man Mark III
- Zora Nao Robot
- Armor Mark
- Hulk
- Captain
- Knut
- US Soldier
- Human
- Drag Driver

These uploaded character FBXs do not have confirmed skeleton/skin rigs, so race motion moves the whole model along the track. No fake limb animation is claimed.

## Capybara direction fix
The race Capybara receives a 180° visual yaw correction after the user screenshot showed the head facing backward.

## Runtime safety
- Lightweight assets: real FBX may load on phone/TV/PC.
- Medium assets: TV/PC or desktop depending on mesh count.
- Heavy Iron Man / Zora / Prime / Dodge: real FBX only on desktop; lower devices retain procedural fallback.
- Character models use robust height-based bounds so stray mesh groups do not make the model tiny or off-center.
- Robot 4 hides `convexhull` exporter/helper groups from the visible model.
- P2 real external FBX is enabled on desktop only; regular AI remains procedural to protect frame rate.
- Existing mobile Garage selector remains outside the 3D viewport.

## Source duplication cleanup
FBXs promoted to runtime paths were removed from their duplicate `assets-source/model-library` locations. Historical manifests remain as audit history; V5.40 runtime paths are authoritative in `RUNTIME_MODEL_MANIFEST_V5.40.json`.
