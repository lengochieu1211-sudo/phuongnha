# V5.38 – Vespa visual fix

## What changed
- Vespa FBX remains at the current ~13.5 MB size; no extra recompression was applied to avoid further visual degradation.
- Added a dedicated `scooter_gloss` material profile so the Vespa body renders like glossy enamel rather than generic metallic car paint.
- Added a Vespa-specific body-paint material matcher for names such as `FrontColor`, `BIANCOSPINO`, `Color_A06`, `Color_A11`, and related exported material families.
- Raised Vespa `rideHeight` slightly and increased target length a touch so the model feels more planted and readable without visibly floating.
- Added a dedicated Garage camera preset for Vespa (close 3/4 angle) so the front apron, handlebar, and seat are easier to see.
- Tweaked race camera distance/height plus ground lift/contact shadow specifically for Vespa so it reads more clearly on-track and does not appear sunk into the road.
- Mirror materials (`specchio`) are now recognized as metallic/chrome instead of being shaded like painted bodywork.

## Intention
This pass improves perceived Vespa quality without damaging the source geometry through extra compression.
