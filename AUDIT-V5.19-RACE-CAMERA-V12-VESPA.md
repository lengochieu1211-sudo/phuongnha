# V5.19 – Race camera fix for V12 SV / Vespa

- Verified from user recording: V12 SV renders correctly in Garage but Close Chase camera enters/approaches the vehicle underside in Race.
- Vespa is too small because the same car chase distance was used for motorcycles.
- Added explicit per-model close/chase distances for V12 SV, Canis Mesa, 883 Roadster and Vespa.
- Added motorcycle-specific camera height, look height and FOV.
- No FBX forward-axis, wheel-rig, sanitizer, cache, road or gameplay logic removed.
