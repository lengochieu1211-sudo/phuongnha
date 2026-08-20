# V5.30 – Real-world vehicle names in Garage

Garage display names were updated without changing any CarModelId or FBX filenames, preserving saves, unlock state, paint, race selection and model mapping.

## Confirmed from FBX metadata
- V12 SV: `Lamborghini_Murcielago_LP670-4_SV` texture path -> **Lamborghini Murciélago LP 670-4 SV**.
- Rescue truck: node `G_2008_INTERNATIONAL_4400LP_Expeditor_truck1` -> **International 4400LP Expeditor**, Fire Rescue Hauler.
- Vespa: node `logo_vespa125` -> **Piaggio Vespa 125**.
- Bicycle: node `mamachari_dxf` -> **Mamachari city bicycle**; manufacturer not identifiable.
- Canis Mesa: source path explicitly identifies **Canis Mesa**; Canis is a fictional marque, visually Wrangler-style, so no Jeep badge is claimed.

## Identified by source name + silhouette, not brand metadata
- S14: displayed as **Nissan Silvia S14**; FBX source is named `s14`, but contains no explicit Nissan brand metadata.
- 883: displayed as **Harley-Davidson Sportster 883**; source is `883_3D`, but contains no explicit Harley-Davidson metadata. Description explicitly notes this recognition basis.

No internal IDs or asset paths changed.
