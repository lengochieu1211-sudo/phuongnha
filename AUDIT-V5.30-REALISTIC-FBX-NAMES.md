# V5.30 — Realistic FBX Garage Names

Only display names/subtitles for the seven external vehicle FBX entries were changed. Stable IDs, FBX filenames, save keys, unlock state, paint state, camera metadata, physics and race links were not changed.

## Verified from FBX contents
- `v12-sv-supercar.fbx`: texture/source paths explicitly contain `Lamborghini_Murci_lago_LP670-4_SV` -> display name `Lamborghini Murciélago LP 670-4 SV`.
- `rescue-truck-hauler.fbx`: node `G_2008_INTERNATIONAL_4400LP_Expeditor_truck1` -> display name `International 4400LP Rescue Hauler`.
- `vespa-studio-3d.fbx`: nodes include `logo_vespa125` -> display name `Vespa 125 Classic`.
- `xedap-city-bike.fbx`: node `mamachari_dxf1` -> display name `Japanese Mamachari City Bike`.

## Shape/source classification
- `s14-sport-coupe.fbx`: source folder `s14`, JDM coupe silhouette -> `Nissan Silvia S14` / `JDM Rear-Wheel-Drive Drift Coupe`.
- `roadster-883-3d.fbx`: source folder `883_3D_01`, cruiser/roadster silhouette -> `883 Sportster Roadster` / `883cc Classic Cruiser Motorcycle`.
- `canis-mesa-cronoz.fbx`: fictional/source-specific model name, so no real manufacturer was invented; display is a factual type: `Classic 4×4 Utility SUV` / `Military-Style Off-Road 4×4`.

## Compatibility
No internal ID or FBX asset path was renamed, so existing saves and selected-car references remain compatible.
