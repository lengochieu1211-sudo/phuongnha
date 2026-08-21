# V5.42 – All FBX orientation + Garage performance audit

## Orientation fixes verified from source geometry / semantic nodes
- Police car: `+Z` -> `-X`. The body length axis is X and rear/brake-light geometry is at +X, so the nose is toward -X.
- Police motorcycle: `+Z` -> `-X`. Headlight nodes sit around X≈2.44 while tail-light nodes sit around X≈4.0, so the forward direction is toward decreasing X.
- Ambulance: `+Z` -> `-X`. Front-color/nose geometry is at minimum X.
- Helicopter: `+Z` -> `-X`. Cockpit/nose is at the -X end, tail boom extends toward +X.
- Dodge WC-51: `+Z` -> `-Z`. `farol1/farol2` headlamp nodes are at the negative-Z end.

## Models intentionally NOT blindly rotated
- Tank and static humanoid/robot/creature FBXs do not expose reliable front/back semantic nodes in the current export. Their current axes are preserved rather than guessed from bbox symmetry.
- Existing vehicles already verified in earlier audits (Canis, V12, 883, Vespa, S14, Rescue Truck, bicycle, Capybara) keep their previous orientation metadata.
- Capybara retains its explicit 180° visual yaw correction from the user screenshot.

## Garage/performance corrections retained in this source
- Large locally cached FBXs no longer auto-parse while the user swipes through Garage. Local Cache Storage removes network time but not FBXLoader CPU parse time.
- Heavy HD model preview is explicit (`Xem HD`) while the instant lightweight fallback remains visible during browsing.
- Parsed FBX template cache is bounded to 4 templates to reduce retained CPU/GPU memory.
- Character/robot fallback is humanoid rather than an automotive body and never receives an automotive spoiler.
- Mouse wheel over the car strip does not steal vertical page scrolling unless the gesture is horizontal or Shift+wheel.
