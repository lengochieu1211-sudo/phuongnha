import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { RacingTrackConfig } from '../../types';
import { RaceEngine } from './RaceEngine';
import { getInterpolatedTrackPoint } from './TrackData';
import { GraphicsProfile } from '../../utils/graphicsQuality';

export interface FbxSceneryHandle {
  root: THREE.Group;
  dispose: () => void;
}

type ScenicAssetId = 'pine' | 'tank' | 'police' | 'ambulance' | 'helicopter';

interface ScenicAssetConfig {
  file: string;
  scaleMode: 'height' | 'length';
  targetSize: number;
  yawOffset?: number;
}

const WHITE_PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z7iEAAAAASUVORK5CYII=';

const SCENIC_ASSETS: Record<ScenicAssetId, ScenicAssetConfig> = {
  pine: { file: 'assets/scenery/pine-tree-low.fbx', scaleMode: 'height', targetSize: 7.2 },
  tank: { file: 'assets/scenery/tank-static-low.fbx', scaleMode: 'length', targetSize: 6.2 },
  police: { file: 'assets/scenery/police-car-static.fbx', scaleMode: 'length', targetSize: 4.35 },
  ambulance: { file: 'assets/scenery/ambulance-static.fbx', scaleMode: 'length', targetSize: 5.1 },
  helicopter: { file: 'assets/scenery/helicopter-static.fbx', scaleMode: 'length', targetSize: 8.5 },
};

function createManager() {
  const manager = new THREE.LoadingManager();
  manager.setURLModifier((url) => {
    if (/\.(png|jpe?g|bmp|tga|gif|webp)(\?.*)?$/i.test(url)) return WHITE_PIXEL;
    return url;
  });
  return manager;
}

async function loadAsset(id: ScenicAssetId): Promise<THREE.Group> {
  const cfg = SCENIC_ASSETS[id];
  const base = ((import.meta as any).env?.BASE_URL || '/');
  const url = `${base}${cfg.file}`;
  const loader = new FBXLoader(createManager());
  return await new Promise<THREE.Group>((resolve, reject) => loader.load(url, resolve, undefined, reject));
}

function normalizeModel(model: THREE.Group, cfg: ScenicAssetConfig) {
  model.traverse((obj: any) => {
    if (!obj.isMesh) return;
    obj.castShadow = false;
    obj.receiveShadow = true;
    const mats = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [];
    const next = mats.map((m: any) => {
      const c = m?.color?.isColor ? m.color.clone() : new THREE.Color(0x9ca3af);
      return new THREE.MeshStandardMaterial({
        color: c,
        roughness: /glass|window/i.test(`${obj.name} ${m?.name || ''}`) ? 0.18 : 0.78,
        metalness: /metal|steel|chrome|rim/i.test(`${obj.name} ${m?.name || ''}`) ? 0.55 : 0.08,
        transparent: Number(m?.opacity) < 0.92,
        opacity: Number(m?.opacity) < 0.92 ? Math.max(0.2, Number(m.opacity)) : 1,
        side: THREE.DoubleSide,
      });
    });
    obj.material = Array.isArray(obj.material) ? next : next[0];
  });

  model.updateWorldMatrix(true, true);
  let box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const current = cfg.scaleMode === 'height' ? Math.max(0.001, size.y) : Math.max(0.001, size.x, size.z);
  model.scale.setScalar(cfg.targetSize / current);
  model.updateWorldMatrix(true, true);
  box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  model.position.set(-center.x, -box.min.y, -center.z);
}

function placeAtTrack(
  root: THREE.Group,
  model: THREE.Group,
  engine: RaceEngine,
  progress: number,
  side: -1 | 1,
  distance: number,
  yOffset = 0,
  yawOffset = 0,
) {
  const pt = getInterpolatedTrackPoint(engine.waypoints, progress);
  const holder = new THREE.Group();
  holder.position.set(
    pt.pos.x + pt.normal.x * side * distance,
    pt.pos.y + yOffset,
    pt.pos.z + pt.normal.z * side * distance,
  );
  holder.rotation.y = Math.atan2(pt.tangent.x, pt.tangent.z) + yawOffset;
  holder.add(model);
  root.add(holder);
}

function clonePrepared(template: THREE.Group): THREE.Group {
  return template.clone(true) as THREE.Group;
}

function disposeTree(root: THREE.Object3D) {
  root.traverse((obj: any) => {
    obj.geometry?.dispose?.();
    const mats = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [];
    mats.forEach((m: any) => m.dispose?.());
  });
}

/**
 * Decorative FBX scenery is intentionally optional. Procedural scenery remains the
 * gameplay-safe fallback, while small real FBXs are layered in according to device budget.
 */
export async function attachFbxScenery(
  scene: THREE.Scene,
  track: RacingTrackConfig,
  engine: RaceEngine,
  profile: GraphicsProfile,
): Promise<FbxSceneryHandle> {
  const root = new THREE.Group();
  root.name = 'AP_FBX_Scenery';
  scene.add(root);

  try {
    if (track.environmentType === 'mountain') {
      const pineTemplate = await loadAsset('pine');
      normalizeModel(pineTemplate, SCENIC_ASSETS.pine);
      const pineCount = profile.deviceClass === 'phone' ? 2 : profile.deviceClass === 'tv' ? 4 : profile.quality === 'high' ? 8 : 5;
      for (let i = 0; i < pineCount; i++) {
        placeAtTrack(root, clonePrepared(pineTemplate), engine, (0.08 + i * 0.13) % 0.96, i % 2 ? 1 : -1, 21 + (i % 3) * 5, 0, i * 0.55);
      }
      if (profile.deviceClass === 'desktop' && profile.quality === 'high') {
        const tank = await loadAsset('tank');
        normalizeModel(tank, SCENIC_ASSETS.tank);
        placeAtTrack(root, tank, engine, 0.57, 1, 34, 0, Math.PI * 0.1);
      }
    }

    if (track.environmentType === 'city_night' && profile.deviceClass !== 'phone') {
      const [police, ambulance] = await Promise.all([loadAsset('police'), loadAsset('ambulance')]);
      normalizeModel(police, SCENIC_ASSETS.police);
      normalizeModel(ambulance, SCENIC_ASSETS.ambulance);
      placeAtTrack(root, police, engine, 0.22, -1, 19.5, 0.02, Math.PI);
      placeAtTrack(root, ambulance, engine, 0.68, 1, 21, 0.02, Math.PI);
    }

    if ((track.environmentType === 'sunset_coast' || track.environmentType === 'sky_clouds') && profile.deviceClass !== 'phone') {
      const helicopter = await loadAsset('helicopter');
      normalizeModel(helicopter, SCENIC_ASSETS.helicopter);
      placeAtTrack(root, helicopter, engine, 0.46, -1, 48, 17, Math.PI * 0.35);
    }
  } catch (error) {
    console.warn('FBX scenery failed; procedural scenery remains active.', error);
  }

  return {
    root,
    dispose: () => {
      scene.remove(root);
      disposeTree(root);
    },
  };
}
