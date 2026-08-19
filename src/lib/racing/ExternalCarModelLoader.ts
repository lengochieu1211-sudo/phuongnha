/**
 * Lazy loader for user-provided FBX racing vehicles.
 * V5.8 supports cars + motorcycles with device-aware fallbacks.
 */
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { CarModelId, CarCustomization } from '../../types';
import { Car3DInstance } from './Car3DBuilder';

export interface ExternalCarHandle {
  root: THREE.Group;
  dispose: () => void;
}

type DeviceClass = 'phone' | 'tablet' | 'tv' | 'desktop';
type VehicleKind = 'car' | 'motorcycle';

interface ExternalVehicleConfig {
  file: string;
  targetLength: number;
  defaultYaw: number;
  kind: VehicleKind;
  policy: 'tv_up' | 'desktop_only';
  rideHeight: number;
}

interface WheelRigNode {
  obj: THREE.Object3D;
  axis: 'x' | 'y' | 'z';
  baseY: number;
}

const WHITE_PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z7iEAAAAASUVORK5CYII=';

const FBX_CACHE = new Map<string, Promise<THREE.Group>>();

const EXTERNAL_CARS: Partial<Record<CarModelId, ExternalVehicleConfig>> = {
  canis_mesa_3d: {
    file: 'assets/cars/canis-mesa-cronoz.fbx',
    targetLength: 4.65,
    defaultYaw: Math.PI,
    kind: 'car',
    policy: 'tv_up',
    rideHeight: 0.18,
  },
  v12_sv_3d: {
    file: 'assets/cars/v12-sv-supercar.fbx',
    targetLength: 4.75,
    defaultYaw: Math.PI,
    kind: 'car',
    policy: 'desktop_only',
    rideHeight: 0.14,
  },
  roadster_883_3d: {
    file: 'assets/cars/roadster-883-3d.fbx',
    targetLength: 2.22,
    defaultYaw: Math.PI,
    kind: 'motorcycle',
    policy: 'tv_up',
    rideHeight: 0.10,
  },
  vespa_studio_3d: {
    file: 'assets/cars/vespa-studio-3d.fbx',
    targetLength: 1.86,
    defaultYaw: Math.PI,
    kind: 'motorcycle',
    policy: 'tv_up',
    rideHeight: 0.09,
  },
};

export function isExternalCar(modelId: CarModelId): boolean {
  return !!EXTERNAL_CARS[modelId];
}

export function isMotorcycleExternal(modelId: CarModelId): boolean {
  return EXTERNAL_CARS[modelId]?.kind === 'motorcycle';
}

export function shouldUseExternalCar(modelId: CarModelId, deviceClass: DeviceClass): boolean {
  const cfg = EXTERNAL_CARS[modelId];
  if (!cfg || deviceClass === 'phone') return false;
  if (cfg.policy === 'desktop_only') return deviceClass === 'desktop';
  return deviceClass === 'desktop' || deviceClass === 'tv' || deviceClass === 'tablet';
}

function sourceColorOf(material: any, fallback: THREE.Color): THREE.Color {
  if (material?.color?.isColor) return material.color.clone();
  return fallback.clone();
}

function classifyMaterial(name: string, paint: THREE.Color, sourceMaterial?: any): THREE.Material {
  const n = name.toLowerCase();
  const original = sourceColorOf(sourceMaterial, paint);

  if (/glass|vidro|wind|windscre|window|translucent/.test(n)) {
    return new THREE.MeshPhysicalMaterial({
      color: original.clone().lerp(new THREE.Color(0x17202d), 0.55),
      metalness: 0.08,
      roughness: 0.07,
      transmission: 0.38,
      transparent: true,
      opacity: 0.55,
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

  if (/chrome|cromado|metal|aluminum|aluminium|ottone|brass|calota|rim|wheel|exhaust|scarico|grade|grille|fork/.test(n)) {
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
  const looksPainted =
    /body|paint|carroz|carroceria|fairing|tank|serb|frontcolor|biancospino|color[_ ]|_color/.test(n);

  return new THREE.MeshPhysicalMaterial({
    color: looksPainted ? paint.clone() : original,
    metalness: looksPainted ? 0.64 : 0.28,
    roughness: looksPainted ? 0.18 : 0.4,
    clearcoat: looksPainted ? 1 : 0.45,
    clearcoatRoughness: looksPainted ? 0.055 : 0.18,
  });
}

function hideProceduralVisuals(instance: Car3DInstance) {
  instance.root.traverse((obj: THREE.Object3D) => {
    if ((obj as THREE.Mesh).isMesh) obj.visible = false;
  });
}

function namedWheelNodes(root: THREE.Object3D): THREE.Object3D[] {
  const candidates: THREE.Object3D[] = [];
  root.traverse((obj) => {
    const n = obj.name.toLowerCase();
    if (/wheel|pneu|tire|tyre|gomma|ruota|roda|w2[_-]?\d/.test(n)) candidates.push(obj);
  });
  return candidates
    .filter((obj) => !candidates.some((other) => other !== obj && obj.parent === other))
    .slice(0, 8);
}

function inferWheelNodes(root: THREE.Object3D, kind: VehicleKind): WheelRigNode[] {
  root.updateWorldMatrix(true, true);
  const total = new THREE.Box3().setFromObject(root);
  const totalSize = total.getSize(new THREE.Vector3());
  const totalCenter = total.getCenter(new THREE.Vector3());
  const horizontalLength = Math.max(totalSize.x, totalSize.z, 0.001);
  const totalHeight = Math.max(totalSize.y, 0.001);
  const expected = kind === 'motorcycle' ? 2 : 4;

  const scored: { obj: THREE.Object3D; axis: 'x'|'y'|'z'; center: THREE.Vector3; score: number }[] = [];

  root.traverse((obj) => {
    if (obj === root || !(obj as any).isGroup) return;
    const box = new THREE.Box3().setFromObject(obj);
    if (box.isEmpty()) return;

    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const dims = [
      { axis: 'x' as const, value: Math.abs(size.x) },
      { axis: 'y' as const, value: Math.abs(size.y) },
      { axis: 'z' as const, value: Math.abs(size.z) },
    ].sort((a,b) => a.value - b.value);

    const thin = dims[0].value;
    const mid = dims[1].value;
    const large = dims[2].value;
    if (large <= 1e-6) return;

    const circularity = mid / large;
    const thinness = thin / large;
    const diameterRatio = large / horizontalLength;
    const yRatio = (center.y - total.min.y) / totalHeight;

    if (circularity < 0.68 || thinness > 0.48) return;
    if (diameterRatio < 0.07 || diameterRatio > (kind === 'motorcycle' ? 0.48 : 0.34)) return;
    if (yRatio > 0.62) return;

    const endDistance = Math.max(
      Math.abs(center.x - totalCenter.x) / Math.max(totalSize.x, 0.001),
      Math.abs(center.z - totalCenter.z) / Math.max(totalSize.z, 0.001),
    );

    const score =
      circularity * 3.1 +
      (1 - thinness) * 2.2 +
      Math.min(1, endDistance * 2.2) * 1.7 +
      (1 - yRatio) * 0.7;

    scored.push({ obj, axis: dims[0].axis, center, score });
  });

  scored.sort((a,b) => b.score - a.score);
  const chosen: typeof scored = [];
  const minSep = horizontalLength * (kind === 'motorcycle' ? 0.24 : 0.12);

  for (const cand of scored) {
    if (chosen.every((c) => c.center.distanceTo(cand.center) > minSep)) {
      chosen.push(cand);
      if (chosen.length >= expected) break;
    }
  }

  return chosen.map((c) => ({
    obj: c.obj,
    axis: c.axis,
    baseY: c.obj.rotation.y,
  }));
}

function collectWheelRig(root: THREE.Object3D, kind: VehicleKind): WheelRigNode[] {
  const named = namedWheelNodes(root);
  if (named.length >= (kind === 'motorcycle' ? 2 : 4)) {
    return named.slice(0, kind === 'motorcycle' ? 2 : 4).map((obj) => ({
      obj,
      axis: 'x' as const,
      baseY: obj.rotation.y,
    }));
  }

  // Several SketchUp-exported FBXs name everything Group1/Mesh1.
  // Fall back to cautious geometric wheel inference.
  return inferWheelNodes(root, kind);
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

function spinWheel(wheel: WheelRigNode, spin: number, steerAngleRad: number, allowSteer: boolean) {
  const rot: any = wheel.obj.rotation;
  rot[wheel.axis] -= spin;
  if (allowSteer && wheel.axis !== 'y') {
    rot.y = wheel.baseY + steerAngleRad * 0.35;
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

  const manager = new THREE.LoadingManager();
  manager.setURLModifier((url) => {
    // Missing external FBX textures must never break the model.
    if (/\.(png|jpe?g|bmp|tga|gif|webp)(\?.*)?$/i.test(url)) return WHITE_PIXEL;
    return url;
  });

  const loader = new FBXLoader(manager);
  const base = ((import.meta as any).env?.BASE_URL || '/');
  const url = `${base}${cfg.file}`;

  let cached = FBX_CACHE.get(url);
  if (!cached) {
    cached = new Promise<THREE.Group>((resolve, reject) => {
      loader.load(url, resolve, undefined, reject);
    });
    FBX_CACHE.set(url, cached);
  }

  const template = await cached;
  const fbx = template.clone(true) as THREE.Group;

  const holder = new THREE.Group();
  holder.name = `ExternalVehicle_${modelId}`;
  holder.rotation.y = cfg.defaultYaw;
  holder.add(fbx);

  let box = new THREE.Box3().setFromObject(holder);
  let size = box.getSize(new THREE.Vector3());

  // Long axis should run along Z in the racing world.
  if (size.x > size.z * 1.15) {
    holder.rotation.y += Math.PI / 2;
    box = new THREE.Box3().setFromObject(holder);
    size = box.getSize(new THREE.Vector3());
  }

  const horizontalLength = Math.max(size.x, size.z, 0.001);
  const scale = cfg.targetLength / horizontalLength;
  holder.scale.setScalar(scale);

  box = new THREE.Box3().setFromObject(holder);
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
      const next = classifyMaterial(sourceName, paint, m);
      next.name = sourceName;
      return next;
    });
    obj.material = Array.isArray(obj.material) ? nextMats : nextMats[0];
  });

  holder.updateWorldMatrix(true, true);
  const wheelRig = collectWheelRig(fbx, cfg.kind);
  const originalUpdate = instance.updateAnimation;
  const baseHolderZ = holder.rotation.z;

  instance.updateAnimation = (speed, steerAngleRad, isDrifting, isNitro, delta) => {
    originalUpdate(speed, steerAngleRad, isDrifting, isNitro, delta);

    const spin = Math.max(-1.0, Math.min(1.0, speed / 90)) * delta * (cfg.kind === 'motorcycle' ? 15.5 : 10.5);
    wheelRig.forEach((wheel, index) => {
      spinWheel(wheel, spin, steerAngleRad, index < (cfg.kind === 'motorcycle' ? 1 : 2));
    });

    if (cfg.kind === 'motorcycle') {
      const speedFactor = Math.min(1, Math.abs(speed) / 45);
      const targetLean = -THREE.MathUtils.clamp(steerAngleRad, -0.55, 0.55) * 0.42 * speedFactor;
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
        const n = `${obj.name} ${m?.name || ''}`.toLowerCase();
        const paintable =
          /body|paint|carroz|carroceria|fairing|tank|serb|frontcolor|biancospino|color[_ ]|_color/.test(n);
        if (paintable && m?.color) m.color.copy(nextPaint);
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
