# V5.24 — Garage FBX Names & Draggable Model Selector

## Changes
- Renamed user-facing Garage titles for all drivable FBX models without changing stable IDs or asset filenames:
  - Roadster 883 Heritage
  - Vespa Classic Studio
  - Canis Mesa Trail 4x4
  - V12 SV Strada
  - S14 Street Spec
  - Rescue Hauler XT
  - Urban City Bicycle
- Removed technical-looking `3D` / `FBX thật` wording from the visible model names/subtitles.
- Rebuilt the bottom Garage model selector as a true horizontal carousel:
  - finger swipe on touch devices;
  - mouse drag on desktop;
  - mouse-wheel horizontal scrolling;
  - visible draggable scrollbar thumb;
  - left/right strip scroll buttons retained for TV/keyboard-style use;
  - selected vehicle auto-scrolls into the center;
  - snap-to-card behavior;
  - compact fixed-width cards with professional title + subtitle.
- Main previous/next vehicle arrows remain available and still switch the selected model.
- Existing model IDs, save data keys, FBX paths, customizations, unlock status and race logic were not changed.

## Validation
- TypeScript 5.8.3 `tsc --noEmit` executed.
- 165 diagnostics remain dependency/type-environment related because the source ZIP has no installed React/Three/Lucide/Node type packages.
- No new GarageScreen/CarData diagnostic beyond missing external modules / JSX runtime.
- `npm run build` attempted; stops at `tsx: not found` because dependencies are not installed.
