# V5.41 – Local Model Pack / On-demand FBX cache

## Implemented
- Added `src/lib/racing/ModelAssetCache.ts` using browser Cache Storage.
- External FBX loader now reads cached raw bytes first, downloads only on cache miss, then parses via FBXLoader.
- Cache quota/storage failure never blocks gameplay; the network response/fallback path remains available.
- Cache namespace is versioned (`v5.41`), and old model-pack cache namespaces are cleaned when Garage opens.
- Garage now exposes:
  - Download current model.
  - Download model pack compatible with the current device class.
  - Delete downloaded model cache.
  - Progress/count feedback.
- Idle neighbor prefetch only caches raw bytes; it does not parse neighboring FBXs.
- Neighbor prefetch respects Data Saver and 2G connections.
- Existing per-device external-model policies remain authoritative, so phone/TV do not automatically fetch desktop-only heavy models.

## Performance effect
This removes repeated GitHub/network transfer after the first successful download. ASCII FBX parsing and GPU upload still cost time on the first parse of a page session. Converting heavy runtime FBXs to optimized GLB/LOD remains the next major performance improvement.

## Safety
- No existing FBX was recompressed in this pass.
- Vespa high-precision file is untouched.
- Existing procedural fallback remains intact.
- No Firebase/GitHub deployment or repository settings were changed.
