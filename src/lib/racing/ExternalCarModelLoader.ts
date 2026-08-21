/**
 * Lazy loader for user-provided FBX racing vehicles.
 * V5.8 supports cars + motorcycles with device-aware fallbacks.
 */
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { CarModelId, CarCustomization } from '../../types';
import { Car3DInstance } from './Car3DBuilder';
import { cacheModelAsset, getModelAssetArrayBuffer } from './ModelAssetCache';

export interface ExternalCarHandle {
  root: THREE.Group;
  dispose: () => void;
}

type DeviceClass = 'phone' | 'tablet' | 'tv' | 'desktop';
type VehicleKind = 'car' | 'motorcycle';
type ForwardAxis = '+x' | '-x' | '+z' | '-z';
type WheelMode = 'named' | 'none';

interface ExternalVehicleConfig {
  file: string;
  targetLength: number;
  forwardAxis: ForwardAxis;
  kind: VehicleKind;
  policy: 'tv_up' | 'desktop_only' | 'all_devices';
  rideHeight: number;
  wheelMode: WheelMode;
  /** Extra visual yaw applied after FBXLoader axis conversion. Keep raw forwardAxis metadata intact. */
  visualYawOffset?: number;
  /** Per-model lean cap. Use 0 for models whose exported transform makes lean look crooked. */
  maxLeanRad?: number;
  /** Optional verified material-name matcher for models exported with generic material names. */
  paintMaterialPattern?: RegExp;
  /** Material tuning preset for models that need a more specific shading recipe. */
  materialProfile?: 'default' | 'scooter_gloss';
  /** Character/robot racers scale against height instead of horizontal vehicle length. */
  scaleBasis?: 'horizontal' | 'height';
  /** Preserve source colors for character/robot/special models that should not be repainted. */
  allowPaint?: boolean;
  /** Hide exporter helper/collision groups that are not part of the visible model. */
  hideNodePattern?: RegExp;
}

interface WheelRigNode {
  spinPivot: THREE.Group;
  steerPivot: THREE.Group;
  axis: 'x' | 'y' | 'z';
  steer: boolean;
  baseSteerY: number;
}

const WHITE_PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z7iEAAAAASUVORK5CYII=';

const FBX_CACHE = new Map<string, Promise<THREE.Group>>();

const DEFAULT_PAINT_MATERIAL_RE =
  /body|paint|carroz|carroceria|fairing|tank|serb|frontcolor|biancospino|color[_ ]|_color/;

function shouldPaintMaterial(
  name: string,
  sourceMaterial: any,
  cfg: ExternalVehicleConfig,
): boolean {
  if (cfg.allowPaint === false) return false;
  const n = name.toLowerCase();
  const opacity = Number.isFinite(sourceMaterial?.opacity) ? Number(sourceMaterial.opacity) : 1;

  // Never turn glass, lamps, tyres, cabin trim or metal hardware into body paint.
  if (opacity < 0.92) return false;
  if (/glass|vidro|wind|window|translucent|pneu|tire|tyre|rubber|gomma|seat|sella|saddle|interior|dash|steer|handle|grip|chrome|cromado|metal|aluminum|aluminium|ottone|brass|calota|rim|wheel|exhaust|scarico|grade|grille|fork|light|farol|lamp|head|tail|faro|fanale/.test(n)) {
    return false;
  }

  if (cfg.materialProfile === 'scooter_gloss' && cfg.paintMaterialPattern) {
    return cfg.paintMaterialPattern.test(n);
  }
  return DEFAULT_PAINT_MATERIAL_RE.test(n) || (cfg.paintMaterialPattern?.test(n) ?? false);
}


const EXTERNAL_CARS: Partial<Record<CarModelId, ExternalVehicleConfig>> = {
  canis_mesa_3d: {
    file: 'assets/cars/canis-mesa-cronoz.fbx',
    targetLength: 4.65,
    // Verified from source geometry: bonnet/front is toward +Z; rear bumper is toward -Z.
    forwardAxis: '+z',
    kind: 'car',
    policy: 'tv_up',
    rideHeight: 0.18,
    wheelMode: 'named',
    // The original desert-camo textures are not bundled. Treat their diffuse material family as body paint.
    paintMaterialPattern: /desert_camo_256/i,
  },
  v12_sv_3d: {
    file: 'assets/cars/v12-sv-supercar.fbx',
    targetLength: 4.75,
    // Verified: steering wheel/front cabin is at larger Z; engine is toward smaller Z.
    forwardAxis: '+z',
    kind: 'car',
    policy: 'desktop_only',
    rideHeight: 0.14,
    wheelMode: 'named',
    // Verified from the FBX material assignment: c1 is the large yellow exterior shell (Mesh62).
    paintMaterialPattern: /(?:^|\s)c1(?:\s|$)/i,
  },
  roadster_883_3d: {
    file: 'assets/cars/roadster-883-3d.fbx',
    targetLength: 2.22,
    // Verified from side silhouette: front wheel/fork is toward -X.
    forwardAxis: '-x',
    kind: 'motorcycle',
    policy: 'tv_up',
    rideHeight: 0.10,
    // Generic SketchUp hierarchy splits wheel parts across groups; keep static rather than jump.
    wheelMode: 'none',
  },
  vespa_studio_3d: {
    file: 'assets/cars/vespa-studio-3d.fbx',
    targetLength: 1.9,
    // Verified: front wheel is near X=-4453; engine/rear wheel is near X=-3290.
    forwardAxis: '-x',
    kind: 'motorcycle',
    // V5.28: optimized to ~13.5 MB, but 238 meshes still make ASCII parsing expensive on Mi Box.
    // PC uses the real FBX; TV/tablet/phone use the lightweight procedural fallback.
    policy: 'desktop_only',
    // Lift the scooter a touch more so the belly/floorboard never visually sinks into the turntable or road.
    rideHeight: 0.11,
    // Source wheel pivots are at world origin; keep static until a clean separated wheel rig is supplied.
    wheelMode: 'none',
    // The two verified wheel centres show this SketchUp export is actually ~40.1° off the nominal -X axis.
    // Correct only that residual export angle so the scooter points exactly along local +Z in Race.
    visualYawOffset: -THREE.MathUtils.degToRad(40.1),
    // This particular FBX has a messy exported transform/pivot. Dynamic whole-model lean exaggerates the
    // crooked appearance, so keep it upright until the model is cleanly re-exported/rigged.
    maxLeanRad: 0,
    // Vespa body paint looks better with a glossy enamel recipe than the generic metallic-car preset.
    materialProfile: 'scooter_gloss',
    paintMaterialPattern: /(frontcolor|biancospino|color(?:_| )a(?:01|06|11)|color(?:_| )00(?:2|3|6)|_color_00(?:7|8))/i,
  },

  s14_sport_3d: {
    file: 'assets/cars/s14-sport-coupe.fbx',
    targetLength: 4.45,
    // V5.21 verified from the actual uploaded point-cloud silhouette: bonnet/front is toward +Z.
    forwardAxis: '+z',
    kind: 'car',
    policy: 'tv_up',
    rideHeight: 0.14,
    // SketchUp nodes are only Component/Mesh names; no trustworthy wheel group names.
    wheelMode: 'none',
    // Red source-material family is the painted exterior. Keep glass/metal/grey materials untouched.
    paintMaterialPattern: /(?:^|\s)_auto_(?:11|12|2|5|7)?(?:\s|$)/i,
  },
  rescue_truck_hauler_3d: {
    file: 'assets/cars/rescue-truck-hauler.fbx',
    targetLength: 9.0,
    // Verified from uploaded side silhouette: cab/nose is at larger +Z, trailer extends toward -Z.
    forwardAxis: '+z',
    kind: 'car',
    // 50+ MB ASCII FBX with 260 meshes: parse only on desktop; lighter fallback elsewhere.
    policy: 'desktop_only',
    rideHeight: 0.20,
    // The file contains truck wheels PLUS many trailer wheels; selecting four by name would be unsafe.
    wheelMode: 'none',
    paintMaterialPattern: /(frontcolor|color_d01|(?:^|\s)_11(?:\s|$)|(?:^|\s)_8(?:\s|$))/i,
  },
  xedap_city_3d: {
    file: 'assets/cars/xedap-city-bike.fbx',
    targetLength: 1.82,
    // Verified from actual uploaded side silhouette: front wheel/fork/handlebar are toward -X.
    forwardAxis: '-x',
    kind: 'motorcycle',
    // 29 MB ASCII FBX; keep phone/TV responsive by using the procedural fallback there.
    policy: 'desktop_only',
    rideHeight: 0.07,
    wheelMode: 'none',
    maxLeanRad: 0.16,
    paintMaterialPattern: /(color_a06|m_0047_khaki|_redwood_)/i,
  },
  capybara_parade_3d: {
    file: 'assets/cars/capybara-lowpoly-racer.fbx',
    targetLength: 3.35,
    // V5.40: user screenshot confirmed the capybara head faced backward in race.
    forwardAxis: '+z',
    visualYawOffset: Math.PI,
    kind: 'car',
    policy: 'all_devices',
    rideHeight: 0.11,
    wheelMode: 'none',
    allowPaint: false,
  },

  police_car_3d: {
    file: 'assets/scenery/police-car-static.fbx',
    targetLength: 4.35,
    forwardAxis: '+z',
    kind: 'car',
    policy: 'all_devices',
    rideHeight: 0.11,
    wheelMode: 'named',
    paintMaterialPattern: /white|mediumblue|frontcolor/i,
  },
  police_motorcycle_3d: {
    file: 'assets/vehicles-extra/police-motorcycle-racer.fbx',
    targetLength: 2.25,
    forwardAxis: '+z',
    kind: 'motorcycle',
    policy: 'all_devices',
    rideHeight: 0.09,
    wheelMode: 'none',
    maxLeanRad: 0.16,
  },
  ambulance_3d: {
    file: 'assets/scenery/ambulance-static.fbx',
    targetLength: 5.25,
    forwardAxis: '+z',
    kind: 'car',
    policy: 'all_devices',
    rideHeight: 0.13,
    wheelMode: 'named',
    paintMaterialPattern: /white|ghostwhite|frontcolor/i,
  },
  tank_racer_3d: {
    file: 'assets/scenery/tank-static-low.fbx',
    targetLength: 6.2,
    forwardAxis: '+z',
    kind: 'car',
    policy: 'tv_up',
    rideHeight: 0.16,
    wheelMode: 'none',
    allowPaint: false,
  },
  helicopter_racer_3d: {
    file: 'assets/scenery/helicopter-static.fbx',
    targetLength: 5.7,
    forwardAxis: '+z',
    kind: 'car',
    policy: 'all_devices',
    // Hover above the road while the race root follows the track.
    rideHeight: 1.55,
    wheelMode: 'none',
    allowPaint: false,
  },
  dodge_wc51_3d: {
    file: 'assets/vehicles-extra/dodge-wc51-racer.fbx',
    targetLength: 5.1,
    forwardAxis: '+z',
    kind: 'car',
    policy: 'desktop_only',
    rideHeight: 0.16,
    wheelMode: 'none',
    allowPaint: false,
  },

  spider_racer_3d: {
    file: 'assets/racers-extra/spider-racer.fbx',
    targetLength: 1.82,
    scaleBasis: 'height',
    forwardAxis: '+z',
    kind: 'car',
    policy: 'all_devices',
    rideHeight: 0.03,
    wheelMode: 'none',
    allowPaint: false,
  },
  robot19_racer_3d: {
    file: 'assets/racers-extra/robot19-racer.fbx',
    targetLength: 1.88,
    scaleBasis: 'height',
    forwardAxis: '+z',
    kind: 'car',
    policy: 'all_devices',
    rideHeight: 0.03,
    wheelMode: 'none',
    allowPaint: false,
  },
  robot4_racer_3d: {
    file: 'assets/racers-extra/robot4-racer.fbx',
    targetLength: 1.95,
    scaleBasis: 'height',
    forwardAxis: '+z',
    kind: 'car',
    policy: 'tv_up',
    rideHeight: 0.03,
    wheelMode: 'none',
    allowPaint: false,
    hideNodePattern: /convexhull/i,
  },
  prime1_racer_3d: {
    file: 'assets/racers-extra/prime1-racer.fbx',
    targetLength: 2.05,
    scaleBasis: 'height',
    forwardAxis: '+z',
    kind: 'car',
    policy: 'desktop_only',
    rideHeight: 0.03,
    wheelMode: 'none',
    allowPaint: false,
  },
  ironman_mark3_racer_3d: {
    file: 'assets/racers-extra/ironman-mark3-racer.fbx',
    targetLength: 1.92,
    scaleBasis: 'height',
    forwardAxis: '+z',
    kind: 'car',
    policy: 'desktop_only',
    rideHeight: 0.03,
    wheelMode: 'none',
    allowPaint: false,
  },
  zora_nao_racer_3d: {
    file: 'assets/racers-extra/zora-nao-racer.fbx',
    targetLength: 1.55,
    scaleBasis: 'height',
    forwardAxis: '+z',
    kind: 'car',
    policy: 'desktop_only',
    rideHeight: 0.03,
    wheelMode: 'none',
    allowPaint: false,
  },
  mark6_racer_3d: {
    file: 'assets/racers-extra/mark6-racer.fbx',
    targetLength: 1.92,
    scaleBasis: 'height',
    forwardAxis: '+z',
    kind: 'car',
    policy: 'tv_up',
    rideHeight: 0.03,
    wheelMode: 'none',
    allowPaint: false,
  },
  hulk_racer_3d: {
    file: 'assets/racers-extra/hulk-racer.fbx',
    targetLength: 2.15,
    scaleBasis: 'height',
    forwardAxis: '+z',
    kind: 'car',
    policy: 'all_devices',
    rideHeight: 0.03,
    wheelMode: 'none',
    allowPaint: false,
  },
  captain_racer_3d: {
    file: 'assets/racers-extra/captain-racer.fbx',
    targetLength: 1.9,
    scaleBasis: 'height',
    forwardAxis: '+z',
    kind: 'car',
    policy: 'all_devices',
    rideHeight: 0.03,
    wheelMode: 'none',
    allowPaint: false,
  },
  knut_racer_3d: {
    file: 'assets/racers-extra/knut-racer.fbx',
    targetLength: 1.45,
    scaleBasis: 'height',
    forwardAxis: '+z',
    kind: 'car',
    policy: 'all_devices',
    rideHeight: 0.03,
    wheelMode: 'none',
    allowPaint: false,
  },
  us_soldier_racer_3d: {
    file: 'assets/racers-extra/us-soldier-racer.fbx',
    targetLength: 1.82,
    scaleBasis: 'height',
    forwardAxis: '+z',
    kind: 'car',
    policy: 'all_devices',
    rideHeight: 0.03,
    wheelMode: 'none',
    allowPaint: false,
  },
  human_racer_3d: {
    file: 'assets/racers-extra/human-racer.fbx',
    targetLength: 1.78,
    scaleBasis: 'height',
    forwardAxis: '+z',
    kind: 'car',
    policy: 'all_devices',
    rideHeight: 0.03,
    wheelMode: 'none',
    allowPaint: false,
  },
  drag_driver_racer_3d: {
    file: 'assets/racers-extra/drag-driver-racer.fbx',
    targetLength: 1.8,
    scaleBasis: 'height',
    forwardAxis: '+z',
    kind: 'car',
    policy: 'all_devices',
    rideHeight: 0.03,
    wheelMode: 'none',
    allowPaint: false,
  },

};

const EXTERNAL_ASSET_BYTES: Partial<Record<CarModelId, number>> = {
  canis_mesa_3d: 3991186,
  v12_sv_3d: 19918714,
  roadster_883_3d: 6375849,
  vespa_studio_3d: 23327246,
  s14_sport_3d: 5629877,
  rescue_truck_hauler_3d: 23224114,
  xedap_city_3d: 16965468,
  capybara_parade_3d: 512271,
  police_car_3d: 144781,
  police_motorcycle_3d: 303130,
  ambulance_3d: 172739,
  tank_racer_3d: 6865727,
  helicopter_racer_3d: 192303,
  dodge_wc51_3d: 20566268,
  spider_racer_3d: 826248,
  robot19_racer_3d: 4599167,
  robot4_racer_3d: 8600673,
  prime1_racer_3d: 12658169,
  ironman_mark3_racer_3d: 22918540,
  zora_nao_racer_3d: 23731404,
  mark6_racer_3d: 6403050,
  hulk_racer_3d: 3271278,
  captain_racer_3d: 1842892,
  knut_racer_3d: 1928334,
  us_soldier_racer_3d: 949074,
  human_racer_3d: 370281,
  drag_driver_racer_3d: 2382246,
};

export function getExternalCarAssetBytes(ids?: CarModelId[]): number {
  const source = ids || (Object.keys(EXTERNAL_CARS) as CarModelId[]);
  return source.reduce((sum, id) => sum + (EXTERNAL_ASSET_BYTES[id] || 0), 0);
}

export function isExternalCar(modelId: CarModelId): boolean {
  return !!EXTERNAL_CARS[modelId];
}

export function isMotorcycleExternal(modelId: CarModelId): boolean {
  return EXTERNAL_CARS[modelId]?.kind === 'motorcycle';
}

export function shouldUseExternalCar(modelId: CarModelId, deviceClass: DeviceClass): boolean {
  const cfg = EXTERNAL_CARS[modelId];
  if (!cfg) return false;
  if (cfg.policy === 'all_devices') return true;
  if (deviceClass === 'phone') return false;
  if (cfg.policy === 'desktop_only') return deviceClass === 'desktop';
  return deviceClass === 'desktop' || deviceClass === 'tv' || deviceClass === 'tablet';
}

function sourceColorOf(material: any, fallback: THREE.Color): THREE.Color {
  if (material?.color?.isColor) return material.color.clone();
  return fallback.clone();
}

function classifyMaterial(name: string, paint: THREE.Color, sourceMaterial?: any, forcePaint = false, cfg?: ExternalVehicleConfig): THREE.Material {
  const n = name.toLowerCase();
  const original = sourceColorOf(sourceMaterial, paint);
  const sourceOpacity = Number.isFinite(sourceMaterial?.opacity) ? Number(sourceMaterial.opacity) : 1;

  if (/glass|vidro|wind|windscre|window|translucent/.test(n) || sourceOpacity < 0.92) {
    return new THREE.MeshPhysicalMaterial({
      color: original.clone().lerp(new THREE.Color(0x17202d), 0.55),
      metalness: 0.08,
      roughness: 0.07,
      transmission: 0.38,
      transparent: true,
      opacity: Math.max(0.18, Math.min(0.82, sourceOpacity < 0.92 ? sourceOpacity : 0.55)),
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      side: THREE.DoubleSide,
    });
  }

  if (/pneu|tire|tyre|rubber|gomma/.test(n)) {
    return new THREE.MeshStandardMaterial({
      color: 0x111214,
      roughness: 0.94,
      metalness: 0.02,
    });
  }

  if (/seat|sella|saddle|interior|dash|steer|handle|grip/.test(n)) {
    return new THREE.MeshStandardMaterial({
      color: original.getHex() === 0xffffff ? 0x16181c : original,
      roughness: 0.72,
      metalness: 0.06,
    });
  }

  if (/chrome|cromado|metal|aluminum|aluminium|ottone|brass|calota|rim|wheel|exhaust|scarico|grade|grille|fork|specchio|mirror/.test(n)) {
    return new THREE.MeshStandardMaterial({
      color: original.getHex() === 0xffffff ? 0xb8bec8 : original,
      roughness: 0.2,
      metalness: 0.9,
    });
  }

  if (/light|farol|lamp|head|tail|faro|fanale/.test(n)) {
    const red = /rear|tail|red|rosso/.test(n);
    const c = red ? 0xff2338 : 0xeaf8ff;
    return new THREE.MeshStandardMaterial({
      color: c,
      emissive: c,
      emissiveIntensity: 1.25,
      roughness: 0.18,
      metalness: 0.04,
    });
  }

  // Paint only likely body/paint materials; preserve original FBX diffuse colors
  // for unknown materials so scooters/motorcycles do not become one solid color.
  const looksPainted = forcePaint || DEFAULT_PAINT_MATERIAL_RE.test(n);

  const scooterGloss = cfg?.materialProfile === 'scooter_gloss';
  const paintColor = looksPainted
    ? (scooterGloss ? paint.clone().lerp(new THREE.Color(0xffffff), 0.06) : paint.clone())
    : original;

  return new THREE.MeshPhysicalMaterial({
    color: paintColor,
    map: sourceMaterial?.map || null,
    normalMap: sourceMaterial?.normalMap || null,
    alphaMap: sourceMaterial?.alphaMap || null,
    metalness: looksPainted ? (scooterGloss ? 0.38 : 0.64) : 0.28,
    roughness: looksPainted ? (scooterGloss ? 0.10 : 0.18) : (scooterGloss ? 0.34 : 0.4),
    clearcoat: looksPainted ? 1 : 0.45,
    clearcoatRoughness: looksPainted ? (scooterGloss ? 0.028 : 0.055) : (scooterGloss ? 0.12 : 0.18),
  });
}

function hideProceduralVisuals(instance: Car3DInstance) {
  instance.root.traverse((obj: THREE.Object3D) => {
    if ((obj as THREE.Mesh).isMesh) obj.visible = false;
  });
}

function sanitizeFbxScene(root: THREE.Object3D) {
  // Current uploaded FBXs contain only Mesh/Null nodes, but keep the loader safe
  // for future files that may contain cameras, lights, helpers, lines or point clouds.
  root.traverse((obj: any) => {
    if (
      obj.isCamera ||
      obj.isLight ||
      obj.isLine ||
      obj.isLineSegments ||
      obj.isPoints ||
      obj.type?.toLowerCase?.().includes('helper')
    ) {
      obj.visible = false;
      obj.userData.apHiddenAsNonVehicle = true;
    }
  });
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) * 0.5;
}

function robustObjectBounds(root: THREE.Object3D): THREE.Box3 {
  root.updateWorldMatrix(true, true);
  const boxes: THREE.Box3[] = [];
  root.traverse((obj: any) => {
    if (!obj.isMesh || obj.visible === false) return;
    const b = new THREE.Box3().setFromObject(obj);
    if (!b.isEmpty()) boxes.push(b);
  });
  if (boxes.length <= 2) return new THREE.Box3().setFromObject(root);

  const centers = boxes.map((b) => b.getCenter(new THREE.Vector3()));
  const med = new THREE.Vector3(
    median(centers.map((c) => c.x)),
    median(centers.map((c) => c.y)),
    median(centers.map((c) => c.z)),
  );
  const distances = centers.map((c) => c.distanceTo(med));
  const sorted = [...distances].sort((a, b) => a - b);
  const p88 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.88))] || 0;
  const threshold = Math.max(p88 * 1.9, 1e-4);
  const robust = new THREE.Box3();
  let kept = 0;
  boxes.forEach((b, i) => {
    if (distances[i] <= threshold) {
      robust.union(b);
      kept += 1;
    }
  });
  return kept >= Math.max(2, Math.floor(boxes.length * 0.55)) && !robust.isEmpty()
    ? robust
    : new THREE.Box3().setFromObject(root);
}

function forwardYaw(axis: ForwardAxis): number {
  // Race root.lookAt() points local +Z along the track tangent.
  switch (axis) {
    case '+z': return 0;
    case '-z': return Math.PI;
    case '+x': return -Math.PI / 2;
    case '-x': return Math.PI / 2;
    default: return 0;
  }
}

interface WheelCandidate {
  obj: THREE.Object3D;
  center: THREE.Vector3;
  size: THREE.Vector3;
  axis: 'x' | 'y' | 'z';
}

function smallestAxis(size: THREE.Vector3): 'x' | 'y' | 'z' {
  const dims = [
    { axis: 'x' as const, value: Math.abs(size.x) },
    { axis: 'y' as const, value: Math.abs(size.y) },
    { axis: 'z' as const, value: Math.abs(size.z) },
  ].sort((a, b) => a.value - b.value);
  return dims[0].axis;
}

function sourceForwardScore(center: THREE.Vector3, axis: ForwardAxis): number {
  switch (axis) {
    case '+x': return center.x;
    case '-x': return -center.x;
    case '+z': return center.z;
    case '-z': return -center.z;
  }
}

function namedRoadWheelCandidates(
  root: THREE.Object3D,
  kind: VehicleKind,
): WheelCandidate[] {
  const raw: WheelCandidate[] = [];

  root.updateWorldMatrix(true, true);

  root.traverse((obj) => {
    const n = obj.name.toLowerCase();

    // Explicitly reject steering wheel / handlebar related nodes.
    if (/steer|steering|handlebar/.test(n)) return;

    if (!/wheel|pneu|tire|tyre|gomma|ruota|roda|w2[_-]?\d/.test(n)) return;

    const box = new THREE.Box3().setFromObject(obj);
    if (box.isEmpty()) return;

    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const largest = Math.max(size.x, size.y, size.z);
    if (!Number.isFinite(largest) || largest <= 1e-5) return;

    raw.push({
      obj,
      center,
      size,
      axis: smallestAxis(size),
    });
  });

  const expected = kind === 'motorcycle' ? 2 : 4;

  // Deduplicate nested/duplicate names by center. Prefer the candidate with
  // the larger bbox because it is more likely to be the complete wheel assembly.
  const clusters: WheelCandidate[][] = [];
  const modelBox = new THREE.Box3().setFromObject(root);
  const modelSize = modelBox.getSize(new THREE.Vector3());
  const horizontalLength = Math.max(modelSize.x, modelSize.z, 0.001);
  const mergeDistance = horizontalLength * 0.035;

  for (const cand of raw) {
    const cluster = clusters.find((items) => items[0].center.distanceTo(cand.center) < mergeDistance);
    if (cluster) cluster.push(cand);
    else clusters.push([cand]);
  }

  let unique = clusters.map((items) =>
    items.sort((a, b) => {
      const av = a.size.x * a.size.y * a.size.z;
      const bv = b.size.x * b.size.y * b.size.z;
      return bv - av;
    })[0]
  );

  if (unique.length > expected) {
    // Canis contains 5 named wheels: 4 road wheels + 1 high-mounted spare.
    // Road wheels are the lowest wheel centers in the vehicle.
    unique = unique
      .sort((a, b) => a.center.y - b.center.y)
      .slice(0, expected);
  }

  return unique;
}

function createCenteredWheelRig(
  candidate: WheelCandidate,
  steer: boolean,
): WheelRigNode | null {
  const obj = candidate.obj;
  const parent = obj.parent;
  if (!parent) return null;

  // Critical fix: SketchUp-exported FBX wheel groups often have pivot=(0,0,0)
  // while wheel geometry is far away. Rotating the original node makes the wheel
  // orbit around the whole vehicle. Create a new pivot at the actual bbox center.
  parent.updateWorldMatrix(true, false);
  obj.updateWorldMatrix(true, true);

  const centerWorld = candidate.center.clone();
  const centerLocal = parent.worldToLocal(centerWorld.clone());

  const steerPivot = new THREE.Group();
  steerPivot.name = `AP_SteerPivot_${obj.name}`;
  steerPivot.position.copy(centerLocal);
  parent.add(steerPivot);
  steerPivot.updateWorldMatrix(true, false);

  const spinPivot = new THREE.Group();
  spinPivot.name = `AP_SpinPivot_${obj.name}`;
  steerPivot.add(spinPivot);
  spinPivot.updateWorldMatrix(true, false);

  // attach() preserves the object's world transform while re-parenting.
  spinPivot.attach(obj);

  return {
    spinPivot,
    steerPivot,
    axis: candidate.axis,
    steer,
    baseSteerY: steerPivot.rotation.y,
  };
}

function buildNamedWheelRig(
  root: THREE.Object3D,
  kind: VehicleKind,
  forwardAxis: ForwardAxis,
): WheelRigNode[] {
  const candidates = namedRoadWheelCandidates(root, kind);
  const expected = kind === 'motorcycle' ? 2 : 4;
  if (candidates.length !== expected) return [];

  // Mark the most-forward half as steerable.
  const sortedForward = [...candidates].sort(
    (a, b) => sourceForwardScore(b.center, forwardAxis) - sourceForwardScore(a.center, forwardAxis)
  );
  const steerCount = kind === 'motorcycle' ? 1 : 2;
  const steerSet = new Set(sortedForward.slice(0, steerCount).map((c) => c.obj));

  return candidates
    .map((cand) => createCenteredWheelRig(cand, steerSet.has(cand.obj)))
    .filter((x): x is WheelRigNode => Boolean(x));
}

function disposeObject(root: THREE.Object3D) {
  root.traverse((obj: any) => {
    const mats = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [];
    mats.forEach((m: any) => {
      m.map?.dispose?.();
      m.normalMap?.dispose?.();
      m.roughnessMap?.dispose?.();
      m.metalnessMap?.dispose?.();
      m.dispose?.();
    });
  });
}

function spinWheel(
  wheel: WheelRigNode,
  spin: number,
  steerAngleRad: number,
) {
  const spinRot: any = wheel.spinPivot.rotation;
  spinRot[wheel.axis] -= spin;

  wheel.steerPivot.rotation.y = wheel.baseSteerY + (wheel.steer ? steerAngleRad * 0.35 : 0);
}


function createExternalLoadingManager(): THREE.LoadingManager {
  const manager = new THREE.LoadingManager();
  manager.setURLModifier((url) => {
    if (/\.(png|jpe?g|bmp|tga|gif|webp)(\?.*)?$/i.test(url)) return WHITE_PIXEL;
    return url;
  });
  return manager;
}

export function getExternalVehicleUrl(modelId: CarModelId): string | null {
  const cfg = EXTERNAL_CARS[modelId];
  if (!cfg) return null;
  const base = ((import.meta as any).env?.BASE_URL || '/');
  return `${base}${cfg.file}`;
}

function loadExternalTemplate(modelId: CarModelId): Promise<THREE.Group> | null {
  const url = getExternalVehicleUrl(modelId);
  if (!url) return null;

  let cached = FBX_CACHE.get(url);
  if (!cached) {
    const loader = new FBXLoader(createExternalLoadingManager());
    cached = getModelAssetArrayBuffer(url)
      .then((buffer) => {
        // Parse from locally cached bytes. `path` is retained for any embedded relative refs;
        // external image refs are intentionally substituted by the LoadingManager fallback.
        const resolved = typeof window !== 'undefined' ? new URL(url, window.location.href).href : url;
        const slash = resolved.lastIndexOf('/');
        const path = slash >= 0 ? resolved.slice(0, slash + 1) : '';
        return loader.parse(buffer, path) as THREE.Group;
      })
      .catch((error) => {
        FBX_CACHE.delete(url);
        throw error;
      });
    FBX_CACHE.set(url, cached);
  }
  return cached;
}

/**
 * Warm only the browser HTTP cache. Unlike FBX parsing, fetch does not block the
 * UI with a large synchronous ASCII-FBX parse. Useful while the player chooses a track.
 */
export async function prefetchExternalCarAsset(modelId: CarModelId): Promise<boolean> {
  const url = getExternalVehicleUrl(modelId);
  if (!url) return false;
  return cacheModelAsset(url);
}

/** IDs/URLs exposed to the Garage model-pack UI. */
export function getExternalCarModelIds(): CarModelId[] {
  return Object.keys(EXTERNAL_CARS) as CarModelId[];
}

export function getCompatibleExternalCarModelIds(deviceClass: DeviceClass): CarModelId[] {
  return getExternalCarModelIds().filter((id) => shouldUseExternalCar(id, deviceClass));
}

export function getExternalCarAssetUrls(ids?: CarModelId[]): string[] {
  const source = ids || getExternalCarModelIds();
  return source
    .map((id) => getExternalVehicleUrl(id))
    .filter((url): url is string => Boolean(url));
}

/**
 * Parse the selected external FBX into the in-memory Three.js cache.
 * Garage already does this naturally; race loading uses the same cache.
 */
export async function preloadExternalCarModel(modelId: CarModelId): Promise<boolean> {
  const pending = loadExternalTemplate(modelId);
  if (!pending) return false;
  try {
    await pending;
    return true;
  } catch (error) {
    console.warn('FBX preload failed; race will use the procedural fallback.', error);
    return false;
  }
}

export async function attachExternalCarModel(
  instance: Car3DInstance,
  modelId: CarModelId,
  custom: CarCustomization,
  detail: 'lite' | 'high' | 'ultra',
): Promise<ExternalCarHandle | null> {
  const cfg = EXTERNAL_CARS[modelId];
  if (!cfg || detail === 'lite') return null;

  const cached = loadExternalTemplate(modelId);
  if (!cached) return null;

  const template = await cached;
  const fbx = template.clone(true) as THREE.Group;

  const holder = new THREE.Group();
  holder.name = `ExternalVehicle_${modelId}`;
  holder.add(fbx);

  sanitizeFbxScene(fbx);
  if (cfg.hideNodePattern) {
    fbx.traverse((obj: any) => {
      if (cfg.hideNodePattern?.test(obj.name || '')) {
        obj.visible = false;
        obj.userData.apHiddenAsExporterHelper = true;
      }
    });
  }

  // Build wheel pivots while the FBX is still in its native coordinate system.
  // This lets us classify the real spin axis and repair SketchUp pivots safely.
  const wheelRig =
    cfg.wheelMode === 'named'
      ? buildNamedWheelRig(fbx, cfg.kind, cfg.forwardAxis)
      : [];

  // Do NOT guess the visual front from bbox length. Different FBX exporters use
  // different forward signs. V5.15 stores the verified source forward axis per model.
  holder.rotation.y = forwardYaw(cfg.forwardAxis) + (cfg.visualYawOffset ?? 0);

  let box = cfg.scaleBasis === 'height' ? robustObjectBounds(holder) : new THREE.Box3().setFromObject(holder);
  let size = box.getSize(new THREE.Vector3());

  const scaleBasis = cfg.scaleBasis === 'height'
    ? Math.max(size.y, 0.001)
    : Math.max(size.x, size.z, 0.001);
  const scale = cfg.targetLength / scaleBasis;
  holder.scale.setScalar(scale);

  box = cfg.scaleBasis === 'height' ? robustObjectBounds(holder) : new THREE.Box3().setFromObject(holder);
  const center = box.getCenter(new THREE.Vector3());
  holder.position.set(-center.x, cfg.rideHeight - box.min.y, -center.z);

  const paint = new THREE.Color(custom.paintColor || '#ef4444');

  fbx.traverse((obj: any) => {
    if (!obj.isMesh) return;
    obj.castShadow = detail === 'ultra';
    obj.receiveShadow = true;

    const sourceMats = Array.isArray(obj.material) ? obj.material : [obj.material];
    const nextMats = sourceMats.map((m: any) => {
      const sourceName = `${obj.name} ${m?.name || ''}`;
      const paintable = shouldPaintMaterial(sourceName, m, cfg);
      const next = classifyMaterial(sourceName, paint, m, paintable, cfg);
      next.name = sourceName;
      next.userData.apPaintable = paintable;
      return next;
    });
    obj.material = Array.isArray(obj.material) ? nextMats : nextMats[0];
  });

  holder.updateWorldMatrix(true, true);
  const originalUpdate = instance.updateAnimation;
  const baseHolderZ = holder.rotation.z;

  instance.updateAnimation = (speed, steerAngleRad, isDrifting, isNitro, delta) => {
    originalUpdate(speed, steerAngleRad, isDrifting, isNitro, delta);

    const spin = Math.max(-1.0, Math.min(1.0, speed / 90)) * delta * (cfg.kind === 'motorcycle' ? 15.5 : 10.5);
    wheelRig.forEach((wheel) => {
      spinWheel(wheel, spin, steerAngleRad);
    });

    if (cfg.kind === 'motorcycle') {
      const speedFactor = Math.min(1, Math.abs(speed) / 45);
      const leanCap = cfg.maxLeanRad ?? 0.42;
      const normalizedSteer = THREE.MathUtils.clamp(steerAngleRad, -0.55, 0.55) / 0.55;
      const targetLean = -normalizedSteer * leanCap * speedFactor;
      holder.rotation.z += (baseHolderZ + targetLean - holder.rotation.z) * Math.min(1, delta * 7.5);
    }
  };

  const originalApply = instance.applyCustomization;
  instance.applyCustomization = (next) => {
    originalApply(next);
    const nextPaint = new THREE.Color(next.paintColor || '#ef4444');

    fbx.traverse((obj: any) => {
      if (!obj.isMesh) return;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((m: any) => {
        if (m?.userData?.apPaintable === true && m?.color) m.color.copy(nextPaint);
      });
    });
  };

  hideProceduralVisuals(instance);
  instance.root.add(holder);

  return {
    root: holder,
    dispose: () => {
      instance.updateAnimation = originalUpdate;
      instance.applyCustomization = originalApply;
      instance.root.remove(holder);
      disposeObject(holder);
    },
  };
}
