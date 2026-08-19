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
import { attachExternalCarModel, isExternalCar, shouldUseExternalCar, ExternalCarHandle } from '../../lib/racing/ExternalCarModelLoader';
import { raceAudio } from '../../lib/racing/RaceAudio';
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
  const carInstanceRef = useRef<Car3DInstance | null>(null);
  const graphicsProfile = useRef(resolveRacingGraphicsProfile(qualitySetting)).current;
  const actualDeviceClass = useRef(detectDeviceClass()).current;
  const isDraggingRef = useRef(false);
  const prevMouseXRef = useRef(0);
  const turntableAngleRef = useRef(0.6);

  // Setup 3D Turntable Scene
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

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    if (currentCar.category === 'motorcycle') {
      camera.position.set(0, 1.28, 3.25);
      camera.lookAt(0, 0.72, 0);
    } else {
      camera.position.set(0, 1.85, 5.7);
      camera.lookAt(0, 0.4, 0);
    }

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
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

    // Studio Lighting
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

    // Studio Floor Grid & Reflection Disc
    const floorGeo = new THREE.CylinderGeometry(4.5, 4.5, 0.2, graphicsProfile.quality === 'high' ? 64 : 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.1,
      metalness: 0.85,
    });
    const floorDisc = new THREE.Mesh(floorGeo, floorMat);
    floorDisc.position.y = -0.1;
    floorDisc.receiveShadow = true;
    scene.add(floorDisc);

    // Neon Rim on Disc
    const rimGeo = new THREE.TorusGeometry(4.5, 0.06, graphicsProfile.quality === 'high' ? 20 : 12, graphicsProfile.quality === 'high' ? 96 : 48);
    rimGeo.rotateX(Math.PI * 0.5);
    const rimMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.position.y = 0.01;
    scene.add(rimMesh);

    // Build 3D Car Instance
    const carInst = buildCar3D(currentCar.id, currentCustomization, graphicsProfile.carDetail);
    scene.add(carInst.root);
    carInstanceRef.current = carInst;

    let externalGarageHandle: ExternalCarHandle | null = null;
    let externalGarageCancelled = false;
    if (
      isExternalCar(currentCar.id) &&
      shouldUseExternalCar(currentCar.id, actualDeviceClass)
    ) {
      attachExternalCarModel(carInst, currentCar.id, currentCustomization, graphicsProfile.carDetail)
        .then((handle) => {
          if (!handle) return;
          if (externalGarageCancelled) {
            handle.dispose();
            return;
          }
          externalGarageHandle = handle;
        })
        .catch((err) => {
          console.warn('Garage FBX preview failed; keeping procedural fallback.', err);
        });
    }

    let animId: number;
    const animate = () => {
      if (!isDraggingRef.current) {
        turntableAngleRef.current += 0.005; // Gentle slow rotation
      }
      if (carInstanceRef.current) {
        carInstanceRef.current.root.rotation.y = turntableAngleRef.current;
      }
      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    return () => {
      externalGarageCancelled = true;
      externalGarageHandle?.dispose();
      cancelAnimationFrame(animId);
      ro.disconnect();
      renderer.dispose();
    };
  }, [currentCar.id]);

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
    if (!rendererRef.current) return;
    const dataUrl = rendererRef.current.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `bara_racing_${currentCar.id}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div
      id="garage-showroom-screen"
      className="relative w-full h-full min-h-screen bg-slate-950 text-white flex flex-col justify-between select-none overflow-x-hidden"
    >
      {/* 1. TOP HEADER: Back, Currencies, Car Title */}
      <header className="relative z-10 flex items-center justify-between p-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            id="garage-back-btn"
            onClick={onBack}
            className="px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold flex items-center gap-2 transition-all shadow-md active:scale-95"
          >
            <ChevronLeft className="w-5 h-5 text-cyan-400" />
            <span>Quay lại</span>
          </button>

          <div>
            <h1 className="text-xl md:text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-400 to-cyan-400">
              GARA BARA SPEED RACING
            </h1>
            <p className="text-xs text-slate-400">Tùy chỉnh, nâng cấp và chiêm ngưỡng siêu xe của bạn</p>
          </div>
        </div>

        {/* Currency balances */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-amber-500/40 px-3.5 py-1.5 rounded-full shadow-lg">
            <span className="text-amber-400 text-lg">⭐</span>
            <span className="font-black text-amber-400">{playerProgress.stars}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-cyan-500/40 px-3.5 py-1.5 rounded-full shadow-lg">
            <span className="text-cyan-400 text-lg">💎</span>
            <span className="font-black text-cyan-400">{playerProgress.diamonds}</span>
          </div>
        </div>
      </header>

      {/* 2. MAIN 3D SHOWROOM & CAR SELECTOR */}
      <div className="relative flex-1 flex flex-col md:flex-row items-center justify-between p-4 gap-4 overflow-hidden">
        {/* Left: 3D Turntable Viewport */}
        <div className="relative flex-1 w-full h-[320px] md:h-[500px] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-gradient-to-b from-slate-900 to-slate-950">
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
          <div className="absolute bottom-3 right-3 left-32 flex items-center gap-1.5 overflow-x-auto p-1.5 bg-slate-950/80 backdrop-blur-md rounded-2xl border border-slate-800/80 scrollbar-none z-10">
            {CAR_CATALOG.map((carItem, idx) => {
              const isSelected = idx === selectedCarIndex;
              const isItemUnlocked = profile.unlockedCars.includes(carItem.id);
              return (
                <button
                  key={carItem.id}
                  onClick={() => setSelectedCarIndex(idx)}
                  className={`flex-shrink-0 px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 border transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 border-white shadow-md scale-105'
                      : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-black/30 flex-shrink-0"
                    style={{ backgroundColor: carItem.defaultColor }}
                  />
                  <span className="whitespace-nowrap">{carItem.name}</span>
                  {!isItemUnlocked && <Lock className="w-3 h-3 text-amber-300 ml-0.5" />}
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
              {/* Spoilers */}
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
