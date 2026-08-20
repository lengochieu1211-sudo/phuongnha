# V5.35 - Character FBX framing / scale fix

- Fixed Magic Mirror static FBX character framing when an FBX contains exporter helpers or stray meshes far from the visible character.
- `StaticFbxAvatar` no longer blindly uses the full root bounding box for scale and centering.
- Added robust dominant-mesh bounds used only for camera/scale calculations.
- Geometry is not deleted by this fix; valid model parts/materials remain intact.
- Falls back to full bounds if the model has too few meshes or the robust filter would exclude too much geometry.
- Existing Capybara / ng1 / Child+girl paths remain unchanged and old data compatibility is unaffected.
