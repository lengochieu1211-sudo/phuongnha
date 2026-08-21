/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  CarConfig,
  CarModelId,
  CarCustomization,
  CarUpgrades,
  PlayerRaceProfile,
  PlayerProgress,
  RaceSettings,
} from '../../types';
import {
  CAR_CATALOG,
  PAINT_PALETTES,
  WHEEL_STYLES,
  SPOILER_STYLES,
  NEON_UNDERGLOW_OPTIONS,
  DEFAULT_CUSTOMIZATION,
  DEFAULT_UPGRADES,
  calculateUpgradedStats,
  saveRaceProfile,
} from '../../lib/racing/CarData';
import { buildCar3D, Car3DInstance } from '../../lib/racing/Car3DBuilder';
import {
  attachExternalCarModel,
  isExternalCar,
  shouldUseExternalCar,
  ExternalCarHandle,
  getCompatibleExternalCarModelIds,
  getExternalCarAssetUrls,
  getExternalCarAssetBytes,
  getExternalCarAssetBytesForId,
  getExternalVehicleUrl,
  prefetchExternalCarAsset,
  shouldAutoPreviewExternalCar,
} from '../../lib/racing/ExternalCarModelLoader';
import {
  cacheModelAsset,
  cacheModelPack,
  cleanupOldModelCaches,
  clearPersistentModelCache,
  getCachedModelCount,
  isModelAssetCached,
  supportsPersistentModelCache,
  requestPersistentModelStorage,
} from '../../lib/racing/ModelAssetCache';
import { raceAudio } from '../../lib/racing/RaceAudio';
import { isCharacterRacerModel, supportsAutomotiveSpoilerForModel } from '../../lib/racing/RacerVisualPolicy';
import { resolveRacingGraphicsProfile, detectDeviceClass } from '../../utils/graphicsQuality';
import {
  Sparkles,
  Zap,
  Shield,
  Gauge,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Palette,
  Wrench,
  Camera,
  Volume2,
  Lock,
  Check,
  Star,
  Flame,
  Download,
  Trash2,
  HardDrive,
  Loader2,
} from 'lucide-react';

interface GarageScreenProps {
  profile: PlayerRaceProfile;
  playerProgress: PlayerProgress;
  onUpdateProfile: (newProfile: PlayerRaceProfile) => void;
  onUpdatePlayerProgress: (newProgress: PlayerProgress) => void;
  onBack: () => void;
  onSelectCarAndRace: (carId: CarModelId) => void;
  qualitySetting: RaceSettings['quality'];
}

function createStudioEnvironment(): THREE.CubeTexture {
  const faces: HTMLCanvasElement[] = [];
  for (let face = 0; face < 6; face++) {
    const c = document.createElement('canvas'); c.width = c.height = 384;
    const ctx = c.getContext('2d')!;
    const g = ctx.createLinearGradient(0, 0, 384, 384);
    g.addColorStop(0, face % 2 === 0 ? '#050816' : '#111827');
    g.addColorStop(0.45, face % 3 === 0 ? '#0ea5e9' : '#a855f7');
    g.addColorStop(0.72, '#f8fafc');
    g.addColorStop(1, '#0f172a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 384, 384);
    // Large soft-box strips create readable reflections on glossy clearcoat.
    ctx.fillStyle = 'rgba(255,255,255,0.78)';
    ctx.fillRect(48, 42 + face * 7, 18, 270);
    ctx.fillRect(280, 20 + face * 5, 30, 310);
    faces.push(c);
  }
  const tex = new THREE.CubeTexture(faces);
  tex.colorSpace = THREE.SRGBColorSpace; tex.needsUpdate = true;
  return tex;
}

export const GarageScreen: React.FC<GarageScreenProps> = ({
  profile,
  playerProgress,
  onUpdateProfile,
  onUpdatePlayerProgress,
  onBack,
  onSelectCarAndRace,
  qualitySetting,
}) => {
  const [selectedCarIndex, setSelectedCarIndex] = useState(() => {
    const idx = CAR_CATALOG.findIndex((c) => c.id === profile.selectedCarId);
    return idx >= 0 ? idx : 0;
  });

  const [activeTab, setActiveTab] = useState<'info' | 'paint' | 'parts' | 'upgrades' | 'photo'>('info');

  const currentCar = CAR_CATALOG[selectedCarIndex];
  const isUnlocked = profile.unlockedCars.includes(currentCar.id);

  const currentCustomization: CarCustomization =
    profile.carCustomizations[currentCar.id] || {
      ...DEFAULT_CUSTOMIZATION,
      paintColor: currentCar.defaultColor,
    };

  const currentUpgrades: CarUpgrades =
    profile.carUpgrades[currentCar.id] || { ...DEFAULT_UPGRADES };

  const stats = calculateUpgradedStats(currentCar, currentUpgrades);

  // 3D Canvas Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const carInstanceRef = useRef<Car3DInstance | null>(null);
  const externalGarageHandleRef = useRef<ExternalCarHandle | null>(null);
  const carSwapTokenRef = useRef(0);
  const graphicsProfile = useRef(resolveRacingGraphicsProfile(qualitySetting)).current;
  const actualDeviceClass = useRef(detectDeviceClass()).current;
  const isDraggingRef = useRef(false);
  const prevMouseXRef = useRef(0);
  const turntableAngleRef = useRef(0.6);

  // V5.41: persistent local model pack. Raw FBX bytes are cached on-device so
  // repeat visits do not re-download large files from GitHub Pages.
  const [modelCacheCount, setModelCacheCount] = useState(0);
  const [currentModelCached, setCurrentModelCached] = useState(false);
  const [modelCacheBusy, setModelCacheBusy] = useState(false);
  const [modelCacheMessage, setModelCacheMessage] = useState('');
  const [modelPackProgress, setModelPackProgress] = useState({ done: 0, total: 0 });
  const [manualHdPreviewId, setManualHdPreviewId] = useState<CarModelId | null>(null);
  const persistentCacheSupported = useRef(supportsPersistentModelCache()).current;
  const compatibleExternalIds = getCompatibleExternalCarModelIds(actualDeviceClass);
  const compatibleExternalUrls = getExternalCarAssetUrls(compatibleExternalIds);
  const compatiblePackMiB = getExternalCarAssetBytes(compatibleExternalIds) / (1024 * 1024);
  const currentExternalBytes = getExternalCarAssetBytesForId(currentCar.id);
  const currentExternalMiB = currentExternalBytes / (1024 * 1024);
  const currentExternalCompatible = isExternalCar(currentCar.id) && shouldUseExternalCar(currentCar.id, actualDeviceClass);
  const currentAutoHdPreview = currentExternalCompatible && shouldAutoPreviewExternalCar(currentCar.id, actualDeviceClass);
  const currentManualHdPreview = manualHdPreviewId === currentCar.id;
  const supportsCurrentSpoiler = supportsAutomotiveSpoilerForModel(currentCar.id, currentCar.category);
  const currentIsCharacterRacer = isCharacterRacerModel(currentCar.id);

  const refreshModelCacheStatus = async () => {
    const count = await getCachedModelCount(compatibleExternalUrls);
    setModelCacheCount(count);
    const currentUrl = getExternalVehicleUrl(currentCar.id);
    setCurrentModelCached(currentUrl ? await isModelAssetCached(currentUrl) : false);
  };

  // V5.24: the model ribbon is a real draggable/swipeable carousel instead of
  // hiding its scrollbar and forcing users to step through with arrow buttons.
  const carSelectorRef = useRef<HTMLDivElement>(null);
  const selectorDraggingRef = useRef(false);
  const selectorMovedRef = useRef(false);
  const selectorStartXRef = useRef(0);
  const selectorStartScrollLeftRef = useRef(0);
  const selectorPointerCarIndexRef = useRef<number | null>(null);

  useEffect(() => {
    void cleanupOldModelCaches().then(refreshModelCacheStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void refreshModelCacheStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCar.id]);

  // Idle neighbor prefetch: only warm raw bytes, never parse them here. Respect
  // data-saver/slow connections and device policy so phones do not silently pull PC-only FBXs.
  useEffect(() => {
    const connection = (navigator as any).connection;
    if (connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || '')) return;
    const timer = window.setTimeout(() => {
      const neighbors = [
        CAR_CATALOG[(selectedCarIndex + 1) % CAR_CATALOG.length],
        CAR_CATALOG[(selectedCarIndex - 1 + CAR_CATALOG.length) % CAR_CATALOG.length],
      ];
      for (const item of neighbors) {
        if (isExternalCar(item.id) && shouldUseExternalCar(item.id, actualDeviceClass)) {
          void prefetchExternalCarAsset(item.id);
        }
      }
    }, 1600);
    return () => window.clearTimeout(timer);
  }, [selectedCarIndex, actualDeviceClass]);

  const downloadCurrentModel = async () => {
    const url = getExternalVehicleUrl(currentCar.id);
    if (!url) {
      setModelCacheMessage('Xe này dùng model nhẹ có sẵn trong game.');
      return;
    }
    setModelCacheBusy(true);
    setModelCacheMessage(`Đang tải ${currentCar.name} về máy…`);
    const ok = await cacheModelAsset(url);
    setModelCacheBusy(false);
    setModelCacheMessage(ok ? 'Đã lưu model này trên thiết bị ✓' : 'Không thể lưu model. Kiểm tra mạng/dung lượng.');
    await refreshModelCacheStatus();
  };

  const downloadCompatibleModelPack = async () => {
    if (!compatibleExternalUrls.length) return;
    setModelCacheBusy(true);
    // Best-effort request; browsers may deny it without affecting the download.
    void requestPersistentModelStorage();
    setModelPackProgress({ done: 0, total: compatibleExternalUrls.length });
    setModelCacheMessage(`Đang tải gói 3D phù hợp thiết bị: ${compatibleExternalUrls.length} model…`);
    const result = await cacheModelPack(compatibleExternalUrls, (progress) => {
      setModelPackProgress({ done: progress.done, total: progress.total });
    });
    setModelCacheBusy(false);
    setModelCacheMessage(
      result.failed === 0
        ? `Đã tải cục bộ ${result.ok}/${compatibleExternalUrls.length} model ✓`
        : `Đã tải ${result.ok}; lỗi ${result.failed} model.`,
    );
    await refreshModelCacheStatus();
  };

  const clearDownloadedModels = async () => {
    setModelCacheBusy(true);
    const ok = await clearPersistentModelCache();
    setModelCacheBusy(false);
    setModelCacheMessage(ok ? 'Đã xóa gói model tải cục bộ.' : 'Không có cache model để xóa.');
    setModelPackProgress({ done: 0, total: 0 });
    await refreshModelCacheStatus();
  };

  // Setup one persistent 3D showroom. V5.25: do NOT recreate a WebGLRenderer
  // every time a car is selected; doing so caused visible flicker and could exhaust
  // the browser WebGL-context limit before entering a race.
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);
    if (graphicsProfile.quality === 'high') {
      scene.environment = createStudioEnvironment();
    }
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 120);
    camera.position.set(0, 1.85, 5.7);
    camera.lookAt(0, 0.55, 0);
    cameraRef.current = camera;

    // preserveDrawingBuffer=false is materially lighter while rotating large FBXs.
    // Photo capture explicitly renders immediately before toDataURL().
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, graphicsProfile.pixelRatioCap));
    renderer.shadowMap.enabled = graphicsProfile.shadows;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.HemisphereLight(0xdbeafe, 0x111827, 1.35);
    scene.add(ambientLight);

    const spotLight1 = new THREE.SpotLight(0x38bdf8, 2.5, 20, Math.PI * 0.3, 0.4);
    spotLight1.position.set(5, 8, 5);
    spotLight1.castShadow = graphicsProfile.shadows;
    spotLight1.shadow.mapSize.width = graphicsProfile.shadowMapSize;
    spotLight1.shadow.mapSize.height = graphicsProfile.shadowMapSize;
    scene.add(spotLight1);

    const spotLight2 = new THREE.SpotLight(0xa855f7, 2.0, 20, Math.PI * 0.3, 0.4);
    spotLight2.position.set(-5, 8, -4);
    scene.add(spotLight2);

    const topWhiteLight = new THREE.DirectionalLight(0xffffff, 1.2);
    topWhiteLight.position.set(0, 10, 0);
    scene.add(topWhiteLight);

    const floorGeo = new THREE.CylinderGeometry(4.5, 4.5, 0.2, graphicsProfile.quality === 'high' ? 64 : 32);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.1, metalness: 0.85 });
    const floorDisc = new THREE.Mesh(floorGeo, floorMat);
    floorDisc.position.y = -0.1;
    floorDisc.receiveShadow = true;
    scene.add(floorDisc);

    const rimGeo = new THREE.TorusGeometry(4.5, 0.06, graphicsProfile.quality === 'high' ? 20 : 12, graphicsProfile.quality === 'high' ? 96 : 48);
    rimGeo.rotateX(Math.PI * 0.5);
    const rimMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.position.y = 0.01;
    scene.add(rimMesh);

    let animId = 0;
    const animate = () => {
      if (!isDraggingRef.current) turntableAngleRef.current += 0.005;
      if (carInstanceRef.current) carInstanceRef.current.root.rotation.y = turntableAngleRef.current;
      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = Math.max(1, containerRef.current.clientWidth);
      const h = Math.max(1, containerRef.current.clientHeight);
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h, false);
    };

    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    return () => {
      carSwapTokenRef.current += 1;
      externalGarageHandleRef.current?.dispose();
      externalGarageHandleRef.current = null;
      cancelAnimationFrame(animId);
      ro.disconnect();
      scene.traverse((obj: any) => {
        obj.geometry?.dispose?.();
        const mats = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [];
        mats.forEach((m: any) => m.dispose?.());
      });
      scene.environment?.dispose?.();
      renderer.dispose();
      renderer.forceContextLoss?.();
      if (renderer.domElement.parentElement === container) container.removeChild(renderer.domElement);
      rendererRef.current = null;
      cameraRef.current = null;
      sceneRef.current = null;
    };
  }, []);

  // V5.27: double-buffer showroom vehicle swaps. Keep the current car visible
  // while the new FBX is loading/parsing, then replace it once. This removes the
  // old -> procedural fallback -> FBX flash that looked like the car was blinking.
  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!scene || !camera) return;

    const token = ++carSwapTokenRef.current;
    let cancelled = false;
    let attachTimer: number | null = null;
    let stagedExternalHandle: ExternalCarHandle | null = null;
    let committed = false;

    const nextCarInst = buildCar3D(currentCar.id, currentCustomization, graphicsProfile.carDetail);
    nextCarInst.root.rotation.y = turntableAngleRef.current;

    const disposeCarInstance = (inst: Car3DInstance) => {
      inst.root.traverse((obj: any) => {
        obj.geometry?.dispose?.();
        const mats = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [];
        mats.forEach((m: any) => m.dispose?.());
      });
    };

    const applyCameraForCar = () => {
      // Move only when the new model is committed, not while it is loading.
      // On phone/TV some heavy FBXs use a procedural CAR fallback. Never apply a tiny
      // motorcycle/FBX camera preset to that fallback or the camera can end up inside it.
      const usingRealExternal = !!stagedExternalHandle;
      const characterRacer = [
        'spider_racer_3d', 'robot19_racer_3d', 'robot4_racer_3d', 'prime1_racer_3d',
        'ironman_mark3_racer_3d', 'zora_nao_racer_3d', 'mark6_racer_3d',
        'hulk_racer_3d', 'captain_racer_3d', 'knut_racer_3d', 'us_soldier_racer_3d', 'human_racer_3d', 'drag_driver_racer_3d',
      ].includes(currentCar.id);

      if (isExternalCar(currentCar.id) && !usingRealExternal) {
        // Real FBX was skipped/failed: frame the procedural fallback as a normal car.
        camera.position.set(0, 1.85, 5.7);
        camera.lookAt(0, 0.52, 0);
      } else if (characterRacer) {
        camera.position.set(0.45, 1.55, 4.15);
        camera.lookAt(0, 0.95, 0);
      } else if (currentCar.id === 'helicopter_racer_3d') {
        camera.position.set(0.75, 2.9, 7.8);
        camera.lookAt(0, 1.75, 0);
      } else if (currentCar.id === 'tank_racer_3d') {
        camera.position.set(0.6, 2.45, 8.4);
        camera.lookAt(0, 1.0, 0);
      } else if (currentCar.id === 'dodge_wc51_3d') {
        camera.position.set(0.5, 2.5, 7.4);
        camera.lookAt(0, 0.9, 0);
      } else if (currentCar.id === 'ambulance_3d') {
        camera.position.set(0.35, 2.15, 6.4);
        camera.lookAt(0, 0.8, 0);
      } else if (currentCar.id === 'police_car_3d') {
        camera.position.set(0.35, 1.9, 5.6);
        camera.lookAt(0, 0.62, 0);
      } else if (currentCar.id === 'police_motorcycle_3d') {
        camera.position.set(0.35, 1.28, 3.05);
        camera.lookAt(0, 0.76, 0);
      } else if (currentCar.id === 'rescue_truck_hauler_3d') {
        camera.position.set(0, 3.55, 13.2);
        camera.lookAt(0, 1.45, 0);
      } else if (currentCar.id === 'xedap_city_3d') {
        camera.position.set(0, 1.18, 3.0);
        camera.lookAt(0, 0.72, 0);
      } else if (currentCar.id === 'vespa_studio_3d') {
        camera.position.set(0.52, 1.24, 2.82);
        camera.lookAt(0.06, 0.86, 0);
      } else if (currentCar.id === 'roadster_883_3d') {
        camera.position.set(0.22, 1.26, 3.05);
        camera.lookAt(0.04, 0.78, 0);
      } else if (currentCar.category === 'motorcycle') {
        camera.position.set(0, 1.28, 3.25);
        camera.lookAt(0, 0.72, 0);
      } else {
        camera.position.set(0, 1.85, 5.7);
        camera.lookAt(0, 0.4, 0);
      }
    };

    const commitSwap = () => {
      if (cancelled || committed || token !== carSwapTokenRef.current) return;
      committed = true;

      const previous = carInstanceRef.current;
      if (previous) {
        externalGarageHandleRef.current?.dispose();
        externalGarageHandleRef.current = null;
        scene.remove(previous.root);
        disposeCarInstance(previous);
      }

      scene.add(nextCarInst.root);
      carInstanceRef.current = nextCarInst;
      externalGarageHandleRef.current = stagedExternalHandle;
      applyCameraForCar();
    };

    const externalCompatible =
      isExternalCar(currentCar.id) && shouldUseExternalCar(currentCar.id, actualDeviceClass);
    const autoPreview = externalCompatible && shouldAutoPreviewExternalCar(currentCar.id, actualDeviceClass);
    const wantsExternal = externalCompatible && (autoPreview || manualHdPreviewId === currentCar.id);

    if (!wantsExternal) {
      // V5.42: large cached FBXs stay on the instant fallback while browsing. Cache Storage
      // removes network latency but NOT the synchronous FBXLoader parse that caused the white
      // flashes/stutters in the user's Garage video. Real HD is opt-in for heavy models.
      commitSwap();
    } else {
      // Let rapid swipes settle before starting an expensive ASCII-FBX parse.
      attachTimer = window.setTimeout(() => {
        if (cancelled || token !== carSwapTokenRef.current) return;
        attachExternalCarModel(nextCarInst, currentCar.id, currentCustomization, graphicsProfile.carDetail)
          .then((handle) => {
            if (cancelled || token !== carSwapTokenRef.current) {
              handle?.dispose();
              return;
            }
            stagedExternalHandle = handle;
            if (handle && manualHdPreviewId === currentCar.id) {
              setModelCacheMessage(`Đã mở model 3D HD ${currentCar.name} ✓`);
            }
            // If the external model cannot be used, the prepared procedural car is still valid.
            commitSwap();
          })
          .catch((err) => {
            console.warn('Garage FBX preview failed; swapping to procedural fallback.', err);
            if (!cancelled && token === carSwapTokenRef.current) commitSwap();
          });
      }, 320);
    }

    return () => {
      cancelled = true;
      if (attachTimer !== null) window.clearTimeout(attachTimer);
      // A committed model belongs to the persistent showroom and is removed only
      // when the *next* model is ready. Dispose only uncommitted staging objects.
      if (!committed) {
        stagedExternalHandle?.dispose();
        disposeCarInstance(nextCarInst);
      }
    };
    // currentCustomization intentionally does not trigger FBX reload; paint/parts use applyCustomization().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCar.id, manualHdPreviewId]);

  // Pointer drag listeners for 360 degree turntable rotation
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    prevMouseXRef.current = e.clientX;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - prevMouseXRef.current;
    prevMouseXRef.current = e.clientX;
    turntableAngleRef.current += deltaX * 0.01;
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  // V5.27: do not auto-center the ribbon on every selection. The user controls
  // the strip directly by drag/swipe, so selection no longer causes a second smooth scroll.

  const handleSelectorPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const strip = carSelectorRef.current;
    if (!strip) return;
    selectorDraggingRef.current = true;
    selectorMovedRef.current = false;
    selectorStartXRef.current = e.clientX;
    selectorStartScrollLeftRef.current = strip.scrollLeft;
    const card = (e.target as HTMLElement).closest<HTMLElement>('[data-car-index]');
    selectorPointerCarIndexRef.current = card ? Number(card.dataset.carIndex) : null;
    strip.setPointerCapture?.(e.pointerId);
  };

  const handleSelectorPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!selectorDraggingRef.current) return;
    const strip = carSelectorRef.current;
    if (!strip) return;
    const dx = e.clientX - selectorStartXRef.current;
    if (Math.abs(dx) > 4) selectorMovedRef.current = true;
    strip.scrollLeft = selectorStartScrollLeftRef.current - dx;
  };

  const handleSelectorPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    const strip = carSelectorRef.current;
    const wasMoved = selectorMovedRef.current;
    const pressedIndex = selectorPointerCarIndexRef.current;
    selectorDraggingRef.current = false;
    selectorPointerCarIndexRef.current = null;
    if (strip?.hasPointerCapture?.(e.pointerId)) strip.releasePointerCapture(e.pointerId);
    // Pointer capture used for dragging can suppress the button's native click.
    // Select explicitly on pointer-up when this was a tap/click, never after a drag.
    if (!wasMoved && pressedIndex !== null && Number.isFinite(pressedIndex)) {
      setSelectedCarIndex(pressedIndex);
    }
    window.setTimeout(() => { selectorMovedRef.current = false; }, 0);
  };

  const handleSelectorWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const strip = carSelectorRef.current;
    if (!strip) return;
    // A normal mouse-wheel gesture must continue scrolling the Garage page vertically.
    // Only an actual horizontal wheel/trackpad gesture (or Shift+wheel) moves the model strip.
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      strip.scrollLeft += e.deltaX;
      return;
    }
    if (e.shiftKey && e.deltaY !== 0) {
      e.preventDefault();
      strip.scrollLeft += e.deltaY;
    }
  };

  const scrollCarSelector = (direction: -1 | 1) => {
    carSelectorRef.current?.scrollBy({
      left: direction * Math.max(220, (carSelectorRef.current?.clientWidth || 320) * 0.7),
      behavior: 'smooth',
    });
  };

  // Update Customization in State and 3D Model
  const updateCustomization = (changes: Partial<CarCustomization>) => {
    const updated: CarCustomization = {
      ...currentCustomization,
      ...changes,
    };
    const newProfile: PlayerRaceProfile = {
      ...profile,
      carCustomizations: {
        ...profile.carCustomizations,
        [currentCar.id]: updated,
      },
    };
    onUpdateProfile(newProfile);
    saveRaceProfile(newProfile);

    if (carInstanceRef.current) {
      carInstanceRef.current.applyCustomization(updated);
    }
  };

  // Unlock Car logic
  const handleUnlockCar = () => {
    const costStars = currentCar.unlockCostStars;
    const costDiamonds = currentCar.unlockCostDiamonds;

    if (playerProgress.stars < costStars || playerProgress.diamonds < costDiamonds) {
      alert('Bạn cần thêm Sao ⭐ hoặc Kim Cương 💎 để mở khóa chiếc xe này nhé!');
      return;
    }

    const updatedProgress = {
      ...playerProgress,
      stars: playerProgress.stars - costStars,
      diamonds: playerProgress.diamonds - costDiamonds,
      highScores: {
        ...playerProgress.highScores,
        lumi_hyper_unlocked: currentCar.id === 'lumi_hyper' ? 1 : (playerProgress.highScores?.lumi_hyper_unlocked || 0),
      }
    };
    onUpdatePlayerProgress(updatedProgress);

    const updatedProfile: PlayerRaceProfile = {
      ...profile,
      unlockedCars: [...profile.unlockedCars, currentCar.id],
      selectedCarId: currentCar.id,
    };
    onUpdateProfile(updatedProfile);
    saveRaceProfile(updatedProfile);

    raceAudio.playRevEngine();
  };

  // Upgrade Part Logic
  const handleUpgradePart = (part: keyof CarUpgrades) => {
    const currentLvl = currentUpgrades[part];
    if (currentLvl >= 5) return;

    const starCost = currentLvl * 8;
    const diamondCost = currentLvl * 2;

    if (playerProgress.stars < starCost || playerProgress.diamonds < diamondCost) {
      alert(`Cần ${starCost} Sao ⭐ và ${diamondCost} Kim Cương 💎 để nâng cấp!`);
      return;
    }

    const updatedProgress = {
      ...playerProgress,
      stars: playerProgress.stars - starCost,
      diamonds: playerProgress.diamonds - diamondCost,
    };
    onUpdatePlayerProgress(updatedProgress);

    const newUpgrades = {
      ...currentUpgrades,
      [part]: currentLvl + 1,
    };

    const newProfile: PlayerRaceProfile = {
      ...profile,
      carUpgrades: {
        ...profile.carUpgrades,
        [currentCar.id]: newUpgrades,
      },
    };
    onUpdateProfile(newProfile);
    saveRaceProfile(newProfile);

    raceAudio.playRevEngine();
  };

  // Photo Mode Snapshot Export
  const handleCapturePhoto = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    const dataUrl = rendererRef.current.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `bara_racing_${currentCar.id}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div
      id="garage-showroom-screen"
      className="relative w-full h-[100svh] max-h-[100svh] bg-slate-950 text-white flex flex-col select-none overflow-x-hidden overflow-y-auto overscroll-y-contain"
    >
      {/* 1. TOP HEADER: Back, Currencies, Car Title */}
      <header className="relative z-30 flex items-center justify-between gap-2 p-2.5 sm:p-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            id="garage-back-btn"
            onClick={onBack}
            className="px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold flex items-center gap-2 transition-all shadow-md active:scale-95"
          >
            <ChevronLeft className="w-5 h-5 text-cyan-400" />
            <span className="hidden xs:inline sm:inline">Quay lại</span>
          </button>

          <div>
            <h1 className="text-sm sm:text-xl md:text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-400 to-cyan-400">
              GARA BARA SPEED RACING
            </h1>
            <p className="hidden sm:block text-xs text-slate-400">Tùy chỉnh, nâng cấp và chiêm ngưỡng siêu xe của bạn</p>
          </div>
        </div>

        {/* Currency balances */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <div className="flex items-center gap-1 bg-slate-950/80 border border-amber-500/40 px-2 sm:px-3.5 py-1.5 rounded-full shadow-lg">
            <span className="text-amber-400 text-lg">⭐</span>
            <span className="font-black text-amber-400">{playerProgress.stars}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-cyan-500/40 px-2 sm:px-3.5 py-1.5 rounded-full shadow-lg">
            <span className="text-cyan-400 text-lg">💎</span>
            <span className="font-black text-cyan-400">{playerProgress.diamonds}</span>
          </div>
        </div>
      </header>

      {/* 2. MAIN 3D SHOWROOM & CAR SELECTOR */}
      <div className="relative flex-none md:flex-row flex flex-col items-stretch md:items-start justify-start md:justify-between p-2.5 sm:p-4 gap-3 md:gap-4 overflow-visible pb-8">
        {/* Left: 3D Turntable Viewport */}
        <div className="relative flex-none md:flex-1 w-full h-[46svh] min-h-[270px] max-h-[390px] md:h-[500px] md:min-h-0 md:max-h-none rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-gradient-to-b from-slate-900 to-slate-950">
          <div
            ref={containerRef}
            id="garage-3d-canvas-container"
            className="w-full h-full cursor-grab active:cursor-grabbing"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />

          {/* Turntable hint overlay */}
          <div className="absolute top-4 left-4 bg-slate-950/70 backdrop-blur-md px-3 py-1 rounded-full text-[11px] text-slate-400 border border-slate-800 pointer-events-none">
            🔄 Kéo chuột / vuốt để xoay 360°
          </div>
          <div className="absolute top-4 right-4 bg-slate-950/75 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-black text-emerald-300 border border-emerald-500/30 pointer-events-none">
            {graphicsProfile.quality === 'high' ? '🖥️ 3D CAO • PC' : graphicsProfile.quality === 'balanced' ? '⚙️ CÂN BẰNG' : '📱 CHẾ ĐỘ NHẸ'}
          </div>

          {/* Sound rev button */}
          <div className="absolute bottom-4 left-4 flex gap-2">
            <button
              id="garage-rev-engine-btn"
              onClick={() => raceAudio.playRevEngine()}
              className="px-3.5 py-2 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all"
            >
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span>Nẹt Pô 🔊</span>
            </button>
          </div>

          {/* Carousel Arrows */}
          <button
            id="garage-prev-car-btn"
            onClick={() =>
              setSelectedCarIndex((prev) => (prev > 0 ? prev - 1 : CAR_CATALOG.length - 1))
            }
            className="absolute left-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 flex items-center justify-center shadow-xl active:scale-95 transition-all z-10"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>

          <button
            id="garage-next-car-btn"
            onClick={() =>
              setSelectedCarIndex((prev) => (prev < CAR_CATALOG.length - 1 ? prev + 1 : 0))
            }
            className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 flex items-center justify-center shadow-xl active:scale-95 transition-all z-10"
          >
            <ChevronRight className="w-7 h-7" />
          </button>

          {/* Bottom Quick Car Selector Ribbon */}
          <div className="hidden sm:block absolute bottom-2 right-2 left-2 sm:bottom-3 sm:right-3 sm:left-32 z-20">
            <div className="mb-1.5 flex items-center justify-between px-2 text-[10px] font-bold tracking-wide text-slate-400 pointer-events-none">
              <span>MODEL GARAGE</span>
              <span className="text-cyan-300">Kéo / vuốt để xem thêm</span>
            </div>
            <div className="relative flex items-center gap-1">
              <button
                type="button"
                aria-label="Cuộn danh sách xe sang trái"
                onClick={() => scrollCarSelector(-1)}
                className="flex-shrink-0 w-8 h-9 rounded-xl bg-slate-900/95 hover:bg-slate-800 border border-cyan-500/30 text-cyan-300 flex items-center justify-center shadow-lg active:scale-95 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div
                ref={carSelectorRef}
                id="garage-model-selector-strip"
                className="garage-car-strip min-w-0 flex-1 flex items-center gap-1.5 overflow-x-auto overscroll-x-contain snap-x snap-proximity p-1.5 pb-2 bg-slate-950/90 backdrop-blur-md rounded-2xl border border-slate-800/80 cursor-grab active:cursor-grabbing touch-pan-y"
                onPointerDown={handleSelectorPointerDown}
                onPointerMove={handleSelectorPointerMove}
                onPointerUp={handleSelectorPointerEnd}
                onPointerCancel={handleSelectorPointerEnd}
                onWheel={handleSelectorWheel}
              >
                {CAR_CATALOG.map((carItem, idx) => {
                  const isSelected = idx === selectedCarIndex;
                  const isItemUnlocked = profile.unlockedCars.includes(carItem.id);
                  return (
                    <button
                      key={carItem.id}
                      type="button"
                      data-car-index={idx}
                      onClick={(e) => {
                        if (selectorMovedRef.current) {
                          e.preventDefault();
                          return;
                        }
                        setSelectedCarIndex(idx);
                      }}
                      className={`snap-center flex-shrink-0 w-[158px] px-3 py-2 rounded-xl text-[11px] font-bold flex items-center gap-2 border transition-all ${
                        isSelected
                          ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 border-white shadow-md scale-[1.03]'
                          : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-cyan-500/40 hover:bg-slate-800/95'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-black/30 flex-shrink-0"
                        style={{ backgroundColor: carItem.defaultColor }}
                      />
                      <span className="min-w-0 text-left leading-tight">
                        <span className="block truncate whitespace-nowrap">{carItem.name}</span>
                        <span className={`block mt-0.5 truncate text-[9px] font-semibold whitespace-nowrap ${isSelected ? 'text-slate-800/75' : 'text-slate-500'}`}>
                          {carItem.subTitle}
                        </span>
                      </span>
                      {!isItemUnlocked && <Lock className="w-3 h-3 text-amber-300 ml-auto flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                aria-label="Cuộn danh sách xe sang phải"
                onClick={() => scrollCarSelector(1)}
                className="flex-shrink-0 w-8 h-9 rounded-xl bg-slate-900/95 hover:bg-slate-800 border border-cyan-500/30 text-cyan-300 flex items-center justify-center shadow-lg active:scale-95 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* V5.39: mobile selector lives OUTSIDE the 3D viewport so it can never cover the vehicle. */}
        <div className="sm:hidden w-full rounded-2xl border border-cyan-500/25 bg-slate-950/95 p-2 shadow-xl">
          <div className="mb-2 flex items-center justify-between gap-2 px-1">
            <div className="min-w-0">
              <div className="text-[10px] font-black tracking-wider text-cyan-300">CHỌN XE</div>
              <div className="truncate text-sm font-black text-white">{currentCar.name}</div>
            </div>
            <div className="flex gap-1">
              <button type="button" aria-label="Xe trước" onClick={() => setSelectedCarIndex((prev) => (prev > 0 ? prev - 1 : CAR_CATALOG.length - 1))} className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-cyan-300 flex items-center justify-center">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button type="button" aria-label="Xe sau" onClick={() => setSelectedCarIndex((prev) => (prev < CAR_CATALOG.length - 1 ? prev + 1 : 0))} className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-cyan-300 flex items-center justify-center">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto overscroll-x-contain snap-x snap-mandatory pb-1">
            {CAR_CATALOG.map((carItem, idx) => {
              const selected = idx === selectedCarIndex;
              const unlocked = profile.unlockedCars.includes(carItem.id);
              const vehicleIcon =
                carItem.id === 'xedap_city_3d' ? '🚲' :
                carItem.id === 'helicopter_racer_3d' ? '🚁' :
                carItem.id === 'tank_racer_3d' ? '🪖' :
                carItem.id === 'ambulance_3d' ? '🚑' :
                carItem.id === 'police_car_3d' ? '🚓' :
                carItem.id === 'dodge_wc51_3d' || carItem.id === 'rescue_truck_hauler_3d' ? '🚛' :
                ['spider_racer_3d','robot19_racer_3d','robot4_racer_3d','prime1_racer_3d','ironman_mark3_racer_3d','zora_nao_racer_3d','mark6_racer_3d','hulk_racer_3d','captain_racer_3d','knut_racer_3d'].includes(carItem.id) ? '🤖' :
                carItem.category === 'motorcycle' ? '🛵' : '🏎️';
              return (
                <button key={`mobile-${carItem.id}`} type="button" onClick={() => setSelectedCarIndex(idx)} className={`snap-center flex-shrink-0 w-[124px] rounded-xl border px-2 py-2 text-left ${selected ? 'border-amber-300 bg-gradient-to-br from-amber-500/90 to-rose-500/90 text-slate-950' : 'border-slate-800 bg-slate-900 text-slate-200'}`}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xl">{vehicleIcon}</span>
                    {!unlocked && <Lock className="w-3 h-3 text-amber-300" />}
                  </div>
                  <div className="truncate text-[11px] font-black">{carItem.name}</div>
                  <div className={`truncate text-[9px] ${selected ? 'text-slate-800/75' : 'text-slate-500'}`}>{carItem.subTitle}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Customization & Stats Panel */}
        <div className="w-full md:w-[420px] bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 flex flex-col gap-4 shadow-2xl">
          {/* Car Name & Category */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black italic text-white tracking-wide">{currentCar.name}</h2>
                {isUnlocked ? (
                  <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1">
                    <Check className="w-3 h-3" /> ĐÃ MỞ
                  </span>
                ) : (
                  <span className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/40 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> CHƯA MỞ
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-cyan-400">{currentCar.subTitle}</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center bg-slate-950/70 p-1 rounded-2xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 py-2 rounded-xl transition-all ${
                activeTab === 'info' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Chỉ số
            </button>
            <button
              onClick={() => setActiveTab('paint')}
              className={`flex-1 py-2 rounded-xl transition-all ${
                activeTab === 'paint' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Màu sơn
            </button>
            <button
              onClick={() => setActiveTab('parts')}
              className={`flex-1 py-2 rounded-xl transition-all ${
                activeTab === 'parts' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Phụ kiện
            </button>
            <button
              onClick={() => setActiveTab('upgrades')}
              className={`flex-1 py-2 rounded-xl transition-all ${
                activeTab === 'upgrades' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Nâng cấp
            </button>
          </div>

          {/* TAB 1: INFO & STATS */}
          {activeTab === 'info' && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-2xl border border-slate-800/80">
                {currentCar.description}
              </p>

              {currentCar.specialAura && (
                <div className="text-xs font-bold text-amber-400 bg-amber-950/30 border border-amber-500/30 px-3 py-1.5 rounded-xl">
                  {currentCar.specialAura}
                </div>
              )}

              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-[11px] font-black text-cyan-200">
                    <HardDrive className="h-4 w-4" /> MODEL 3D CỤC BỘ
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    {modelCacheCount}/{compatibleExternalUrls.length} đã tải
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={downloadCurrentModel}
                    disabled={modelCacheBusy || !isExternalCar(currentCar.id)}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-cyan-500/30 bg-slate-950/70 px-2 py-2 text-[10px] font-bold text-cyan-200 disabled:opacity-40"
                  >
                    {modelCacheBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                    {currentModelCached ? 'Đã có model ✓' : 'Tải xe này'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!currentExternalCompatible) return;
                      setModelCacheMessage(`Đang parse ${currentCar.name} HD từ ${currentModelCached ? 'bộ nhớ máy' : 'nguồn web'}…`);
                      setManualHdPreviewId(currentCar.id);
                    }}
                    disabled={modelCacheBusy || !currentExternalCompatible || currentAutoHdPreview || currentManualHdPreview}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-violet-500/30 bg-violet-950/30 px-2 py-2 text-[10px] font-bold text-violet-200 disabled:opacity-40"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {currentAutoHdPreview || currentManualHdPreview ? 'Đang dùng HD ✓' : `Xem HD${currentExternalMiB > 0 ? ` ${currentExternalMiB.toFixed(1)}MB` : ''}`}
                  </button>
                  <button
                    type="button"
                    onClick={downloadCompatibleModelPack}
                    disabled={modelCacheBusy || compatibleExternalUrls.length === 0}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-2 py-2 text-[10px] font-bold text-emerald-200 disabled:opacity-40"
                  >
                    <Download className="h-3.5 w-3.5" /> Tải gói ~{compatiblePackMiB.toFixed(0)} MB
                  </button>
                  <button
                    type="button"
                    onClick={clearDownloadedModels}
                    disabled={modelCacheBusy || !persistentCacheSupported}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/25 bg-rose-950/20 px-2 py-2 text-[10px] font-bold text-rose-200 disabled:opacity-40"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Xóa model tải
                  </button>
                </div>
                {modelPackProgress.total > 0 && modelCacheBusy && (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-cyan-400 transition-all"
                      style={{ width: `${Math.round((modelPackProgress.done / modelPackProgress.total) * 100)}%` }}
                    />
                  </div>
                )}
                <p className="mt-2 text-[10px] leading-snug text-slate-400">
                  {modelCacheMessage || (persistentCacheSupported
                    ? 'Model đã tải được dùng lại ở lần mở sau. Model lớn không tự parse khi lướt Garage; bấm Xem HD khi cần để tránh đứng hình.'
                    : 'Trình duyệt này không cho lưu model lâu dài; game vẫn dùng cache HTTP bình thường.')}
                </p>
              </div>

              {/* Stats Bars */}
              <div className="flex flex-col gap-2 bg-slate-950/40 p-3 rounded-2xl border border-slate-800/60">
                <StatBar label="Tốc Độ Tối Đa" value={stats.topSpeed} color="from-rose-500 to-amber-500" />
                <StatBar label="Tăng Tốc (0-100)" value={stats.acceleration} color="from-emerald-400 to-cyan-400" />
                <StatBar label="Xử Lý Ôm Cua" value={stats.handling} color="from-cyan-400 to-blue-500" />
                <StatBar label="Drift Khói Lốp" value={stats.drift} color="from-purple-400 to-pink-500" />
                <StatBar label="Bình Nitro" value={stats.nitro} color="from-amber-400 to-rose-500" />
              </div>
            </div>
          )}

          {/* TAB 2: PAINT COLORS */}
          {activeTab === 'paint' && (
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-slate-300">Chọn Màu Sơn Xe:</span>
              <div className="grid grid-cols-5 gap-2">
                {PAINT_PALETTES.map((p) => (
                  <button
                    key={p.hex}
                    onClick={() => updateCustomization({ paintColor: p.hex })}
                    className={`h-10 rounded-xl border-2 transition-all flex items-center justify-center ${
                      currentCustomization.paintColor === p.hex
                        ? 'border-white scale-105 shadow-lg'
                        : 'border-transparent hover:scale-95'
                    }`}
                    style={{ backgroundColor: p.hex }}
                    title={p.name}
                  >
                    {currentCustomization.paintColor === p.hex && (
                      <Check className="w-4 h-4 text-white drop-shadow-md" />
                    )}
                  </button>
                ))}
              </div>

              {/* Paint Finish */}
              <span className="text-xs font-bold text-slate-300 mt-2">Chất Liệu Bề Mặt:</span>
              <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                {(['metallic', 'glossy', 'matte'] as const).map((finish) => (
                  <button
                    key={finish}
                    onClick={() => updateCustomization({ paintFinish: finish })}
                    className={`py-2 rounded-xl border transition-all ${
                      currentCustomization.paintFinish === finish
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    {finish === 'metallic' ? 'Kim Loại Bóng' : finish === 'glossy' ? 'Sơn Bóng' : 'Sơn Mờ'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PARTS & ACCESSORIES */}
          {activeTab === 'parts' && (
            <div className="flex flex-col gap-3 overflow-y-auto max-h-[220px] pr-1">
              {/* Spoilers are automotive-only. Characters/robots/tank/helicopter/two-wheel racers never inherit a car wing. */}
              {!supportsCurrentSpoiler ? (
                <div className="rounded-xl border border-cyan-500/25 bg-cyan-950/25 px-3 py-2 text-[11px] font-bold text-cyan-200">
                  {currentIsCharacterRacer
                    ? '🧍 Nhân vật/robot không dùng cánh gió ô tô. Cản gió được tắt hoàn toàn cho model này.'
                    : '🚫 Model này không dùng cánh gió ô tô. Phần cản gió được tắt để tránh vật thể thừa.'}
                </div>
              ) : (
                <>
                  <span className="text-xs font-bold text-slate-300">Cánh Gió Đua (Spoiler):</span>
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                    {SPOILER_STYLES.map((sp) => (
                      <button
                        key={sp.id}
                        onClick={() => updateCustomization({ spoilerStyle: sp.id })}
                        className={`py-2 px-3 rounded-xl border text-left transition-all ${
                          currentCustomization.spoilerStyle === sp.id
                            ? 'bg-purple-500/20 border-purple-400 text-purple-300'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400'
                        }`}
                      >
                        {sp.name}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Neon Underglow */}
              <span className="text-xs font-bold text-slate-300 mt-2">Đèn Gầm Neon (Underglow):</span>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                {NEON_UNDERGLOW_OPTIONS.map((neon) => (
                  <button
                    key={neon.id}
                    onClick={() => updateCustomization({ neonUnderglow: neon.id })}
                    className={`py-2 px-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                      currentCustomization.neonUnderglow === neon.id
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span>{neon.name}</span>
                    {neon.color !== 'transparent' && (
                      <span
                        className="w-3 h-3 rounded-full shadow-md"
                        style={{ backgroundColor: neon.color }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: UPGRADES */}
          {activeTab === 'upgrades' && (
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[220px] pr-1">
              <UpgradeRow
                name="Động Cơ (Top Speed)"
                level={currentUpgrades.engine}
                onUpgrade={() => handleUpgradePart('engine')}
              />
              <UpgradeRow
                name="Tăng Tốc (Acceleration)"
                level={currentUpgrades.acceleration}
                onUpgrade={() => handleUpgradePart('acceleration')}
              />
              <UpgradeRow
                name="Xử Lý Lái (Handling)"
                level={currentUpgrades.handling}
                onUpgrade={() => handleUpgradePart('handling')}
              />
              <UpgradeRow
                name="Bình Nitro (Nitro Boost)"
                level={currentUpgrades.nitro}
                onUpgrade={() => handleUpgradePart('nitro')}
              />
              <UpgradeRow
                name="Hệ Thống Phanh (Brakes)"
                level={currentUpgrades.brakes}
                onUpgrade={() => handleUpgradePart('brakes')}
              />
            </div>
          )}

          {/* Action Bottom: Unlock or Select & Race */}
          <div className="mt-2">
            {isUnlocked ? (
              <button
                id="garage-select-and-race-btn"
                onClick={() => onSelectCarAndRace(currentCar.id)}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-slate-950 font-black text-base shadow-xl shadow-cyan-950/50 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Flame className="w-5 h-5 fill-current" />
                <span>CHỌN XE & VÀO ĐƯỜNG ĐUA</span>
              </button>
            ) : (
              <button
                id="garage-unlock-car-btn"
                onClick={handleUnlockCar}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-black text-base shadow-xl shadow-amber-950/50 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Lock className="w-5 h-5" />
                <span>
                  MỞ KHÓA XE ({currentCar.unlockCostStars} ⭐ + {currentCar.unlockCostDiamonds} 💎)
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatBar: React.FC<{ label: string; value: number; color: string }> = ({
  label,
  value,
  color,
}) => (
  <div className="flex flex-col gap-0.5">
    <div className="flex justify-between text-[11px] font-bold">
      <span className="text-slate-400">{label}</span>
      <span className="text-white">{value}/100</span>
    </div>
    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
      <div className={`h-full bg-gradient-to-r ${color} transition-all duration-300`} style={{ width: `${value}%` }} />
    </div>
  </div>
);

const UpgradeRow: React.FC<{ name: string; level: number; onUpgrade: () => void }> = ({
  name,
  level,
  onUpgrade,
}) => {
  const isMax = level >= 5;
  const starCost = level * 8;
  const diamondCost = level * 2;

  return (
    <div className="flex items-center justify-between p-2.5 bg-slate-950/60 border border-slate-800 rounded-2xl">
      <div className="flex flex-col">
        <span className="text-xs font-bold text-white">{name}</span>
        <div className="flex items-center gap-1 mt-1">
          {[1, 2, 3, 4, 5].map((lvl) => (
            <div
              key={lvl}
              className={`w-3.5 h-1.5 rounded-full ${
                lvl <= level ? 'bg-cyan-400 shadow-sm shadow-cyan-400' : 'bg-slate-800'
              }`}
            />
          ))}
          <span className="text-[10px] text-cyan-400 font-bold ml-1">Cấp {level}</span>
        </div>
      </div>

      <button
        onClick={onUpgrade}
        disabled={isMax}
        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all ${
          isMax
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 shadow-md active:scale-95'
        }`}
      >
        {isMax ? (
          'TỐI ĐA'
        ) : (
          <>
            <span>Nâng</span>
            <span className="text-[10px]">({starCost}⭐)</span>
          </>
        )}
      </button>
    </div>
  );
};
