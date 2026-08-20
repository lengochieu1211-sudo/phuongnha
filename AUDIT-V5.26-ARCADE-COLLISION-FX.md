# V5.26 - Arcade collision & impact FX

- Added lightweight player/AI and player/barrier collision proxies using track progress + lane distance.
- No heavy rigid-body engine or mesh-to-mesh collision.
- Added player damage 0..100, shield-reduced damage, speed loss and lateral bump response.
- Added pooled THREE.Points effects: sparks, smoke and short fire bursts.
- Damage >=35 emits light smoke; severe damage emits small fire on balanced/high only.
- Added short camera shake and existing soft bump audio on impact.
- Low quality uses sharply reduced particle counts and disables persistent fire.
- Added compact vehicle-condition bar to Race HUD.
- No FBX deformation, dynamic fire lights, per-particle meshes or shadow-casting fire.
