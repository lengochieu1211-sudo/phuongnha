# V5.39 – Full regression, mobile Garage and Vespa restoration

## Critical findings fixed
- The v5.38 GitHub-ready ZIP accidentally still contained `assets-source-heavy/`; the v5.39 GitHub ZIP excludes that directory entirely.
- Heavy external motorcycles on phones use a procedural car fallback. v5.38 still applied the close Vespa/motorcycle camera to that fallback, which could crop or hide the vehicle. Garage camera now distinguishes real FBX vs fallback.
- On phones the model selector is now outside the 3D viewport, so it cannot cover the vehicle or disappear below overlay controls.
- Vespa is restored from the pre-v5.28 high-precision FBX (23,327,246 bytes) instead of the 13,531,508-byte quantized copy because the user reported visible degradation. It remains below GitHub's 25 MiB per-file web-upload threshold.
- Vespa body repaint no longer relies on the generic `color_` wildcard; the scooter uses only its verified paint-material family. Logo material is not recolored.
- If FBXLoader successfully resolves texture maps, the new physical material preserves the source diffuse/normal/alpha maps.

## Known source limitation
The Vespa FBX references 52 external JPG texture paths from the original creator folder, but those JPG files are not bundled in the project or available in the current uploads. Geometry is restored, but exact original textured appearance cannot be reconstructed until those texture files are supplied.
