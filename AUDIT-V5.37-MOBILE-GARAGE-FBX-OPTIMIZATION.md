# V5.37 – Mobile Garage + selective FBX optimization

## Mobile Garage
- Mobile layout no longer clips the 3D showroom/customization area with a fixed overflow-hidden column.
- Showroom uses 46svh (min 270px, max 390px) on phones and retains the desktop 500px layout.
- Car selector ribbon is kept inside the visible showroom with higher z-index and narrower 132px cards on phones.
- Header is compact on phones to preserve vertical space.
- Main content can scroll vertically on phones; desktop behavior remains unchanged.

## FBX optimization policy
Vespa is intentionally NOT recompressed in V5.37 because visual quality was reported degraded. Its FBX bytes are unchanged from V5.36.

Selective optimization only:
- rescue-truck-hauler.fbx: 25,428,312 -> 23,224,114 bytes (-8.67%); geometry precision 2 decimals, transforms 4.
- v12-sv-supercar.fbx: 21,775,002 -> 19,918,714 bytes (-8.52%); geometry precision 4, transforms 5.
- xedap-city-bike.fbx: 18,142,935 -> 16,965,468 bytes (-6.49%); geometry precision 4, transforms 5.

Topology/hierarchy counts are unchanged for all three optimized FBXs. Polygon index arrays were not rewritten.

## Heavy scenery
- Canon remains a heavy source-only asset; it was already quantized to 1 decimal in the prior pass. Further numeric quantization to integer precision was rejected because it would risk visible shape loss.
- NBN scenery remains split into stream chunks. Further reduction should be done by spatial/semantic splitting or mesh decimation in a DCC tool, not by additional coordinate destruction.
