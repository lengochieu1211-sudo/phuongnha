/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  RacingTrackConfig,
  CarConfig,
  CameraViewMode,
  CarCustomization,
  RaceSettings,
} from '../../types';
import { RaceEngine } from '../../lib/racing/RaceEngine';
import { CAR_CATALOG } from '../../lib/racing/CarData';
import { raceAudio } from '../../lib/racing/RaceAudio';
import { buildCar3D, Car3DInstance } from '../../lib/racing/Car3DBuilder';
import { attachExternalCarModel, isExternalCar, shouldUseExternalCar, ExternalCarHandle } from '../../lib/racing/ExternalCarModelLoader';
import { getInterpolatedTrackPoint } from '../../lib/racing/TrackData';
import { createAsphaltTexture, resolveRacingGraphicsProfile, GraphicsProfile, detectDeviceClass } from '../../utils/graphicsQuality';
import { attachFbxScenery, FbxSceneryHandle } from '../../lib/racing/SceneryFbxLoader';

interface Race3DCanvasProps {
  engine: RaceEngine;
  track: RacingTrackConfig;
  car: CarConfig;
  customization: CarCustomization;
  cameraView: CameraViewMode;
  qualitySetting: RaceSettings['quality'];
  secondCar?: CarConfig;
  secondCustomization?: CarCustomization;
  onReady?: () => void;
}

export const Race3DCanvas: React.FC<Race3DCanvasProps> = ({
  engine,
  track,
  car,
  customization,
  cameraView,
  qualitySetting,
  secondCar,
  secondCustomization,
  onReady,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const secondCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const playerCarRef = useRef<Car3DInstance | null>(null);
  const aiCarsRef = useRef<{ id: string; instance: Car3DInstance }[]>([]);
  const itemMeshesRef = useRef<{ id: number; mesh: THREE.Mesh }[]>([]);
  const particlesRef = useRef<THREE.Points | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const cameraViewRef = useRef<CameraViewMode>(cameraView);

  useEffect(() => {
    cameraViewRef.current = cameraView;
  }, [cameraView]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const profile = resolveRacingGraphicsProfile(qualitySetting);
    const actualDeviceClass = detectDeviceClass();
    const twoPlayer = engine.localPlayerCount === 2 && !!engine.physics.getLocalSecondPlayer();
    if (twoPlayer) {
      // Split-screen renders the same scene twice. Reduce scene cost before FPS drops,
      // especially on Android TV / phones where GPU bandwidth is the main bottleneck.
      profile.sceneryDensity *= actualDeviceClass === 'desktop' ? 0.82 : 0.52;
      profile.aiCarDetail = 'lite';
      profile.targetFps = actualDeviceClass === 'desktop' ? Math.min(profile.targetFps, 55) : 36;
    }

    // 1. Three.js Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Sky & Fog setup based on environment
    setupEnvironmentTheme(scene, track);
    addSkyDome(scene, track.environmentType, profile.quality);
    // Even phone/TV gets a tiny reflection environment so clearcoat paint does not look flat.
    const envSize = profile.quality === 'high' ? 256 : profile.quality === 'balanced' ? 128 : 64;
    scene.environment = createProceduralRaceEnvironment(track.environmentType, envSize);

    const camera = new THREE.PerspectiveCamera(54, width / height, 0.12, 1400);
    cameraRef.current = camera;
    const secondCamera = twoPlayer ? new THREE.PerspectiveCamera(54, width / height, 0.12, 1400) : null;
    secondCameraRef.current = secondCamera;

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    const splitRatioScale = twoPlayer ? (actualDeviceClass === 'desktop' ? 0.88 : 0.74) : 1;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, profile.pixelRatioCap * splitRatioScale));
    renderer.shadowMap.enabled = profile.shadows && (!twoPlayer || actualDeviceClass === 'desktop');
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = profile.quality === 'high' ? 1.12 : 1.0;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.2);
    dirLight.position.set(100, 180, 80);
    dirLight.castShadow = profile.shadows;
    dirLight.shadow.mapSize.width = profile.shadowMapSize;
    dirLight.shadow.mapSize.height = profile.shadowMapSize;
    scene.add(dirLight);

    if (profile.quality === 'high') {
      const rim = new THREE.DirectionalLight(0x9bdcff, 0.7);
      rim.position.set(-80, 70, -40);
      scene.add(rim);
    }

    // 4. Build 3D Track Mesh & Environment Props
    build3DTrackMesh(scene, engine, profile, track);
    buildScenery(scene, track, engine, profile);

    // V5.34: layer a small, device-budgeted set of real FBX scenery over the
    // procedural world. Gameplay never waits for these assets and keeps working
    // if an FBX fails to parse or is skipped on a weak device.
    let fbxSceneryHandle: FbxSceneryHandle | null = null;
    let fbxSceneryCancelled = false;
    void attachFbxScenery(scene, track, engine, profile).then((handle) => {
      if (fbxSceneryCancelled) handle.dispose();
      else fbxSceneryHandle = handle;
    });

    // 5. Build Player 3D Car
    const playerCar = buildCar3D(car.id, customization, profile.carDetail);
    scene.add(playerCar.root);
    playerCarRef.current = playerCar;

    // V5.35: spawn on the actual road height immediately. High-elevation maps
    // (Sky/Space/Mountain) previously showed the car at world Y=0 for the first
    // scene frames, which looked like it had fallen underneath the road.
    const initialSpawnPt = getInterpolatedTrackPoint(engine.waypoints, engine.physics.player.progress % 1.0);
    const initialSpawnX = initialSpawnPt.pos.x + initialSpawnPt.normal.x * engine.physics.player.lateralOffset;
    const initialSpawnRoadY = getRoadSurfaceY(initialSpawnPt, engine.physics.player.lateralOffset);
    const initialSpawnY = initialSpawnRoadY + getRaceVehicleGroundLift(car.id, car.category);
    const initialSpawnZ = initialSpawnPt.pos.z + initialSpawnPt.normal.z * engine.physics.player.lateralOffset;
    playerCar.root.position.set(initialSpawnX, initialSpawnY, initialSpawnZ);
    playerCar.root.lookAt(
      initialSpawnX + initialSpawnPt.tangent.x * 10,
      initialSpawnY + initialSpawnPt.tangent.y * 10,
      initialSpawnZ + initialSpawnPt.tangent.z * 10,
    );

    // V5.7: lazy-load user-provided FBX cars only when selected.
    // Phones / Low mode keep the procedural fallback so initial loading and FPS stay safe.
    let externalPlayerHandle: ExternalCarHandle | null = null;
    let externalLoadCancelled = false;
    let acceptLateExternalModel = true;
    let externalReadyPromise: Promise<void> = Promise.resolve();

    if (
      isExternalCar(car.id) &&
      shouldUseExternalCar(car.id, actualDeviceClass) && (!twoPlayer || actualDeviceClass === 'desktop')
    ) {
      externalReadyPromise = attachExternalCarModel(playerCar, car.id, customization, profile.carDetail)
        .then((handle) => {
          if (!handle) return;
          if (externalLoadCancelled || !acceptLateExternalModel) {
            handle.dispose();
            return;
          }
          externalPlayerHandle = handle;
        })
        .catch((err) => {
          console.warn('External FBX car failed; keeping procedural fallback.', err);
        });
    }

    // Cheap contact shadow keeps the car visually planted even when realtime shadows
    // are disabled on phones/TV. This costs one transparent quad instead of a shadow map.
    const contactShadow = new THREE.Mesh(
      new THREE.CircleGeometry(1.0, profile.quality === 'high' ? 36 : 20),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false })
    );
    if (car.id === 'rescue_truck_hauler_3d') {
      contactShadow.scale.set(1.8, 4.8, 1);
    } else if (car.id === 'xedap_city_3d') {
      contactShadow.scale.set(0.34, 0.92, 1);
    } else if (car.id === 'vespa_studio_3d') {
      contactShadow.scale.set(0.5, 1.24, 1);
    } else {
      contactShadow.scale.set(car.category === 'motorcycle' ? 0.42 : 1.15, car.category === 'motorcycle' ? 1.12 : 2.25, 1);
    }
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.renderOrder = 2;
    scene.add(contactShadow);

    // 6. Build AI 3D Cars
    const aiCars: { id: string; instance: Car3DInstance }[] = [];
    engine.physics.aiRacers.forEach((ai) => {
      const localP2Custom = ai.isLocalPlayer && secondCustomization ? secondCustomization : null;
      const aiInstance = buildCar3D(ai.carModelId as any, localP2Custom || {
        paintColor: ai.color,
        paintFinish: 'metallic',
        wheelStyle: 'sport',
        wheelColor: '#1e293b',
        // Keep AI spoilers compact; tall wings can look like a detached table from a chase camera.
        spoilerStyle: 'stock',
        neonUnderglow: ai.isLocalPlayer ? 'pink' : 'cyan',
        windowTint: 'smoke',
        decal: 'none',
      }, ai.isLocalPlayer ? profile.carDetail : profile.aiCarDetail);
      scene.add(aiInstance.root);
      const aiSpawnPt = getInterpolatedTrackPoint(engine.waypoints, ai.progress % 1.0);
      const aiSpawnConfig = CAR_CATALOG.find((cfg) => cfg.id === ai.carModelId);
      const aiSpawnX = aiSpawnPt.pos.x + aiSpawnPt.normal.x * ai.lateralOffset;
      const aiSpawnRoadY = getRoadSurfaceY(aiSpawnPt, ai.lateralOffset);
      const aiSpawnY = aiSpawnRoadY + getRaceVehicleGroundLift(ai.carModelId, aiSpawnConfig?.category);
      const aiSpawnZ = aiSpawnPt.pos.z + aiSpawnPt.normal.z * ai.lateralOffset;
      aiInstance.root.position.set(aiSpawnX, aiSpawnY, aiSpawnZ);
      aiInstance.root.lookAt(
        aiSpawnX + aiSpawnPt.tangent.x * 10,
        aiSpawnY + aiSpawnPt.tangent.y * 10,
        aiSpawnZ + aiSpawnPt.tangent.z * 10,
      );
      aiCars.push({ id: ai.id, instance: aiInstance });
    });
    aiCarsRef.current = aiCars;

    // 7. Build 3D Item Pickup Boxes
    const itemMeshes: { id: number; mesh: THREE.Mesh }[] = [];
    const itemGeo = new THREE.BoxGeometry(1.6, 1.6, 1.6);
    engine.items.forEach((item) => {
      const col =
        item.type === 'nitro'
          ? 0x06b6d4
          : item.type === 'shield'
          ? 0x3b82f6
          : item.type === 'rainbow'
          ? 0xec4899
          : 0xeab308;
      const mat = new THREE.MeshStandardMaterial({
        color: col,
        emissive: col,
        emissiveIntensity: 0.8,
        roughness: 0.2,
      });
      const mesh = new THREE.Mesh(itemGeo, mat);
      mesh.position.set(item.x, item.y, item.z);
      scene.add(mesh);
      itemMeshes.push({ id: item.id, mesh });
    });
    itemMeshesRef.current = itemMeshes;

    // 8. Speed Lines Particle System
    const particleBaseCount = profile.quality === 'high' ? 220 : profile.quality === 'balanced' ? 140 : 80;
    const particleCount = Math.round(particleBaseCount * (twoPlayer ? 0.62 : 1));
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 40;
      positions[i + 1] = Math.random() * 15;
      positions[i + 2] = (Math.random() - 0.5) * 40;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.4,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);
    particlesRef.current = particles;

    // V5.26: pooled arcade impact particles. One THREE.Points draw-call per effect type;
    // no per-impact Mesh creation, no realtime fire lights and no physics library.
    type ImpactParticle = {
      life: number; maxLife: number;
      x: number; y: number; z: number;
      vx: number; vy: number; vz: number;
    };
    const impactScale = profile.quality === 'high' ? 1 : profile.quality === 'balanced' ? 0.68 : 0.38;
    const makeImpactPool = (count: number, color: number, size: number, additive: boolean) => {
      const states: ImpactParticle[] = Array.from({ length: count }, () => ({
        life: 0, maxLife: 1, x: 0, y: -9999, z: 0, vx: 0, vy: 0, vz: 0,
      }));
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) positions[i * 3 + 1] = -9999;
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const material = new THREE.PointsMaterial({
        color,
        size,
        transparent: true,
        opacity: additive ? 0.92 : 0.34,
        depthWrite: false,
        blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
        sizeAttenuation: true,
      });
      const points = new THREE.Points(geometry, material);
      points.frustumCulled = false;
      scene.add(points);
      return { states, positions, geometry, points };
    };

    const sparkPool = makeImpactPool(Math.max(10, Math.round(42 * impactScale)), 0xffc23d, profile.quality === 'high' ? 0.20 : 0.16, true);
    const smokePool = makeImpactPool(Math.max(8, Math.round(30 * impactScale)), 0x94a3b8, profile.quality === 'high' ? 0.62 : 0.48, false);
    const firePool = makeImpactPool(Math.max(5, Math.round(18 * impactScale)), 0xff5a1f, profile.quality === 'high' ? 0.34 : 0.27, true);

    const spawnFromPool = (
      pool: ReturnType<typeof makeImpactPool>,
      count: number,
      x: number, y: number, z: number,
      spread: number,
      lift: number,
      duration: [number, number],
    ) => {
      let spawned = 0;
      for (const p of pool.states) {
        if (spawned >= count) break;
        if (p.life > 0) continue;
        p.maxLife = duration[0] + Math.random() * (duration[1] - duration[0]);
        p.life = p.maxLife;
        p.x = x + (Math.random() - 0.5) * spread;
        p.y = y + Math.random() * 0.45;
        p.z = z + (Math.random() - 0.5) * spread;
        p.vx = (Math.random() - 0.5) * spread * 2.2;
        p.vy = lift * (0.55 + Math.random() * 0.8);
        p.vz = (Math.random() - 0.5) * spread * 2.2;
        spawned += 1;
      }
    };

    const updateImpactPool = (pool: ReturnType<typeof makeImpactPool>, delta: number, drag: number, gravity: number) => {
      for (let i = 0; i < pool.states.length; i++) {
        const p = pool.states[i];
        if (p.life <= 0) {
          pool.positions[i * 3 + 1] = -9999;
          continue;
        }
        p.life -= delta;
        if (p.life <= 0) {
          pool.positions[i * 3 + 1] = -9999;
          continue;
        }
        p.vx *= Math.max(0, 1 - drag * delta);
        p.vz *= Math.max(0, 1 - drag * delta);
        p.vy += gravity * delta;
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.z += p.vz * delta;
        pool.positions[i * 3] = p.x;
        pool.positions[i * 3 + 1] = p.y;
        pool.positions[i * 3 + 2] = p.z;
      }
      (pool.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    };

    let lastCollisionPulse = engine.physics.player.collisionPulse;
    let lastSecondCollisionPulse = engine.physics.getLocalSecondPlayer()?.collisionPulse || 0;
    let cameraShakeSec = 0;
    let cameraShakeStrength = 0;
    let secondCameraShakeSec = 0;
    let secondCameraShakeStrength = 0;
    let damageFxAccumulator = 0;

    // Put camera at the start grid before shader compilation so the first visible
    // frame does not jump from the origin to the chase camera.
    const startPt = getInterpolatedTrackPoint(engine.waypoints, 0);
    updateCameraPosition(
      camera,
      startPt.pos.x,
      startPt.pos.y,
      startPt.pos.z,
      startPt.tangent,
      cameraView,
      false,
      car.id,
      car.category,
      true,
    );
    if (secondCamera) {
      const p2 = engine.physics.getLocalSecondPlayer();
      const p2CarId = (p2?.carModelId || secondCar?.id || car.id) as string;
      const p2Category = secondCar?.category || 'sport';
      updateCameraPosition(
        secondCamera, startPt.pos.x, startPt.pos.y, startPt.pos.z, startPt.tangent, cameraView, false,
        p2CarId, p2Category, true,
      );
    }

    // V5.17 warm-up: wait for the selected FBX (normally already preloaded), render a
    // hidden frame and compile materials/shaders before starting the countdown.
    let readyCancelled = false;
    void (async () => {
      // Never hold the race behind a huge ASCII FBX forever. If a selected model is
      // not ready quickly enough, start with the already-built procedural fallback.
      // A late FBX is discarded instead of being attached mid-race and causing a freeze.
      const maxExternalWaitMs = actualDeviceClass === 'desktop' ? 7000 : 3800;
      const externalLoadedInTime = await Promise.race([
        externalReadyPromise.then(() => true),
        new Promise<boolean>((resolve) => window.setTimeout(() => resolve(false), maxExternalWaitMs)),
      ]);
      if (!externalLoadedInTime) acceptLateExternalModel = false;
      if (readyCancelled || externalLoadCancelled) return;

      try {
        renderer.render(scene, camera);
        const compileAsync = (renderer as any).compileAsync;
        if (typeof compileAsync === 'function') {
          await compileAsync.call(renderer, scene, camera);
        } else {
          renderer.compile(scene, camera);
        }
      } catch (err) {
        console.warn('Race scene warm-up compile skipped:', err);
      }

      // Give the browser two presentation frames after shader compilation. This avoids
      // starting 3-2-1 in the same frame as the final GPU upload on slower PCs/TV boxes.
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      );
      if (!readyCancelled && !externalLoadCancelled) onReady?.();
    })();

    // 9. Main Render & Animation Loop
    let lastTime = performance.now();
    let fpsFrames = 0;
    let fpsWindowStart = lastTime;
    let autoDowngraded = false;

    const animate = (time: number) => {
      const delta = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      // Update engine physics and state step
      engine.step(delta);

      // Update Player Car 3D Transform
      const playerProg = engine.physics.player.progress % 1.0;
      const pt = getInterpolatedTrackPoint(engine.waypoints, playerProg);

      const px = pt.pos.x + pt.normal.x * engine.physics.player.lateralOffset;
      const roadY = getRoadSurfaceY(pt, engine.physics.player.lateralOffset);
      const vehicleLift = getRaceVehicleGroundLift(car.id, car.category);
      const py = roadY + vehicleLift;
      const pz = pt.pos.z + pt.normal.z * engine.physics.player.lateralOffset;

      playerCar.root.position.set(px, py, pz);
      // Shadow stays on the road plane; the vehicle itself gets a small clearance lift.
      contactShadow.position.set(px, roadY + 0.025, pz);

      // Car orientation along track tangent
      const targetLook = new THREE.Vector3(
        px + pt.tangent.x * 10,
        py + pt.tangent.y * 10,
        pz + pt.tangent.z * 10
      );
      playerCar.root.lookAt(targetLook);

      // Car drift yaw offset & bank tilt
      playerCar.root.rotateY(engine.physics.player.driftAngleRad);
      playerCar.root.rotateZ(pt.bankAngle || 0);

      // Wheels animation & nitro jet flame
      playerCar.updateAnimation(
        engine.physics.player.speedKmh,
        engine.physics.player.steerAngleRad,
        engine.physics.player.isDrifting,
        engine.physics.player.isNitroActive,
        delta
      );

      // Update AI Opponents 3D Transforms
      engine.physics.aiRacers.forEach((ai) => {
        const found = aiCars.find((a) => a.id === ai.id);
        if (!found) return;
        const aiPt = getInterpolatedTrackPoint(engine.waypoints, ai.progress % 1.0);
        const aix = aiPt.pos.x + aiPt.normal.x * ai.lateralOffset;
        const aiConfig = CAR_CATALOG.find((cfg) => cfg.id === ai.carModelId);
        const aiRoadY = getRoadSurfaceY(aiPt, ai.lateralOffset);
        const aiy = aiRoadY + getRaceVehicleGroundLift(ai.carModelId, aiConfig?.category);
        const aiz = aiPt.pos.z + aiPt.normal.z * ai.lateralOffset;

        found.instance.root.position.set(aix, aiy, aiz);
        found.instance.root.lookAt(
          new THREE.Vector3(aix + aiPt.tangent.x * 10, aiy + aiPt.tangent.y * 10, aiz + aiPt.tangent.z * 10)
        );
        found.instance.updateAnimation(ai.speedKmh, ai.steerAngleRad, false, ai.isNitroActive, delta);
      });

      // Update Items (Spinning & Visibility)
      itemMeshes.forEach((im) => {
        im.mesh.rotation.y += 2.0 * delta;
        im.mesh.rotation.x += 1.0 * delta;
        const it = engine.items.find((i) => i.id === im.id);
        im.mesh.visible = !!(it && it.active);
      });

      // Update Speed Particles (Visible when driving fast or nitro)
      if (particlesRef.current) {
        const speedRatio = engine.physics.player.speedKmh / engine.physics.player.maxSpeedKmh;
        (particlesRef.current.material as THREE.PointsMaterial).opacity =
          speedRatio > 0.6 ? (speedRatio - 0.6) * 2.0 : 0;
        particlesRef.current.position.set(px, py, pz);
      }

      // Arcade collisions -> sparks / smoke / short fire burst. Effects use pooled Points,
      // so repeated impacts do not allocate dozens of meshes or trigger GC spikes.
      const collisionPulse = engine.physics.player.collisionPulse;
      if (collisionPulse !== lastCollisionPulse) {
        lastCollisionPulse = collisionPulse;
        const severity = Math.max(0.15, engine.physics.player.lastCollisionSeverity);
        const side = engine.physics.player.lastCollisionSide || 1;
        const impactX = px + pt.normal.x * side * (car.category === 'motorcycle' ? 0.55 : 1.05);
        const impactY = py + (car.category === 'motorcycle' ? 0.58 : 0.72);
        const impactZ = pz + pt.normal.z * side * (car.category === 'motorcycle' ? 0.55 : 1.05);
        spawnFromPool(sparkPool, Math.max(3, Math.round((8 + severity * 22) * impactScale)), impactX, impactY, impactZ, 1.1 + severity, 2.7 + severity * 2.0, [0.25, 0.72]);
        if (severity > 0.36) {
          spawnFromPool(smokePool, Math.max(2, Math.round((3 + severity * 7) * impactScale)), impactX, impactY, impactZ, 0.8, 0.7, [0.8, 1.8]);
        }
        if (severity > 0.72 && profile.quality !== 'lite') {
          spawnFromPool(firePool, Math.max(2, Math.round((3 + severity * 5) * impactScale)), impactX, impactY, impactZ, 0.55, 1.45, [0.18, 0.55]);
        }
        cameraShakeSec = 0.12 + severity * 0.16;
        cameraShakeStrength = (profile.quality === 'lite' ? 0.06 : 0.11) + severity * 0.11;
        raceAudio.playSoftBump();
      }

      const localP2 = engine.physics.getLocalSecondPlayer();
      if (localP2 && (localP2.collisionPulse || 0) !== lastSecondCollisionPulse) {
        lastSecondCollisionPulse = localP2.collisionPulse || 0;
        const p2Pt = getInterpolatedTrackPoint(engine.waypoints, localP2.progress % 1.0);
        const p2x = p2Pt.pos.x + p2Pt.normal.x * localP2.lateralOffset;
        const p2z = p2Pt.pos.z + p2Pt.normal.z * localP2.lateralOffset;
        const severity = Math.max(0.15, localP2.lastCollisionSeverity || 0.25);
        const side = localP2.lastCollisionSide || 1;
        spawnFromPool(sparkPool, Math.max(3, Math.round((7 + severity * 16) * impactScale)), p2x + p2Pt.normal.x * side, p2Pt.pos.y + 0.7, p2z + p2Pt.normal.z * side, 1, 2.4, [0.25, 0.68]);
        if (severity > 0.42) spawnFromPool(smokePool, Math.max(2, Math.round((2 + severity * 5) * impactScale)), p2x, p2Pt.pos.y + 0.75, p2z, 0.65, 0.6, [0.8, 1.6]);
        if (severity > 0.74 && profile.quality !== 'lite') spawnFromPool(firePool, Math.max(1, Math.round((2 + severity * 3) * impactScale)), p2x, p2Pt.pos.y + 0.72, p2z, 0.5, 1.25, [0.18, 0.50]);
        secondCameraShakeSec = 0.10 + severity * 0.14;
        secondCameraShakeStrength = (profile.quality === 'lite' ? 0.05 : 0.09) + severity * 0.09;
      }

      // Progressive visual damage without deforming imported FBX meshes.
      damageFxAccumulator += delta;
      const damage = engine.physics.player.damage;
      const fxInterval = profile.quality === 'high' ? 0.12 : profile.quality === 'balanced' ? 0.20 : 0.32;
      if (damageFxAccumulator >= fxInterval) {
        damageFxAccumulator = 0;
        if (damage >= 35) {
          spawnFromPool(smokePool, damage >= 70 ? 2 : 1, px - pt.tangent.x * 0.55, py + 0.9, pz - pt.tangent.z * 0.55, 0.36, 0.52, [1.0, 2.2]);
        }
        if (damage >= 78 && profile.quality !== 'lite') {
          spawnFromPool(firePool, 1, px - pt.tangent.x * 0.45, py + 0.78, pz - pt.tangent.z * 0.45, 0.20, 0.85, [0.18, 0.46]);
        }
        const p2DamageState = engine.physics.getLocalSecondPlayer();
        if (p2DamageState && (p2DamageState.damage || 0) >= 35) {
          const p2PtFx = getInterpolatedTrackPoint(engine.waypoints, p2DamageState.progress % 1.0);
          const p2xFx = p2PtFx.pos.x + p2PtFx.normal.x * p2DamageState.lateralOffset;
          const p2zFx = p2PtFx.pos.z + p2PtFx.normal.z * p2DamageState.lateralOffset;
          spawnFromPool(smokePool, (p2DamageState.damage || 0) >= 70 ? 2 : 1, p2xFx - p2PtFx.tangent.x * 0.5, p2PtFx.pos.y + 0.86, p2zFx - p2PtFx.tangent.z * 0.5, 0.34, 0.5, [1.0, 2.0]);
          if ((p2DamageState.damage || 0) >= 78 && profile.quality !== 'lite') {
            spawnFromPool(firePool, 1, p2xFx - p2PtFx.tangent.x * 0.4, p2PtFx.pos.y + 0.76, p2zFx - p2PtFx.tangent.z * 0.4, 0.18, 0.78, [0.18, 0.44]);
          }
        }
      }
      updateImpactPool(sparkPool, delta, 3.4, -7.8);
      updateImpactPool(smokePool, delta, 1.3, 0.28);
      updateImpactPool(firePool, delta, 2.2, 0.5);

      // Update Camera Tracking View
      updateCameraPosition(
        camera, px, py, pz, pt.tangent, cameraViewRef.current, engine.physics.player.isNitroActive,
        car.id, car.category
      );
      if (secondCamera) {
        const p2 = engine.physics.getLocalSecondPlayer();
        if (p2) {
          const p2Pt = getInterpolatedTrackPoint(engine.waypoints, p2.progress % 1.0);
          const p2x = p2Pt.pos.x + p2Pt.normal.x * p2.lateralOffset;
          const p2CarId = (p2.carModelId || secondCar?.id || car.id) as string;
          const p2Category = secondCar?.category || CAR_CATALOG.find((cfg) => cfg.id === p2CarId)?.category || 'sport';
          const p2RoadY = getRoadSurfaceY(p2Pt, p2.lateralOffset);
          const p2y = p2RoadY + getRaceVehicleGroundLift(p2CarId, p2Category);
          const p2z = p2Pt.pos.z + p2Pt.normal.z * p2.lateralOffset;
          updateCameraPosition(
            secondCamera, p2x, p2y, p2z, p2Pt.tangent, cameraViewRef.current, p2.isNitroActive,
            p2CarId, p2Category
          );
        }
      }
      if (secondCamera && secondCameraShakeSec > 0) {
        secondCameraShakeSec = Math.max(0, secondCameraShakeSec - delta);
        const fade2 = Math.min(1, secondCameraShakeSec / 0.14);
        secondCamera.position.x += (Math.random() - 0.5) * secondCameraShakeStrength * fade2;
        secondCamera.position.y += (Math.random() - 0.5) * secondCameraShakeStrength * 0.6 * fade2;
      }
      if (cameraShakeSec > 0) {
        cameraShakeSec = Math.max(0, cameraShakeSec - delta);
        const fade = Math.min(1, cameraShakeSec / 0.16);
        camera.position.x += (Math.random() - 0.5) * cameraShakeStrength * fade;
        camera.position.y += (Math.random() - 0.5) * cameraShakeStrength * 0.65 * fade;
      }

      // Runtime safety net for PC / phone / Android TV. Do not wait for a crash:
      // reduce render resolution progressively if FPS falls below the profile target.
      fpsFrames += 1;
      if (time - fpsWindowStart >= 3200) {
        const fps = (fpsFrames * 1000) / (time - fpsWindowStart);
        const currentRatio = renderer.getPixelRatio();
        if (fps < profile.targetFps - 9) {
          const nextRatio = Math.max(profile.pixelRatioFloor, currentRatio - 0.16);
          if (nextRatio < currentRatio - 0.01) {
            renderer.setPixelRatio(nextRatio);
            renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight, false);
          }
          if (fps < profile.targetFps - 16 && renderer.shadowMap.enabled) {
            renderer.shadowMap.enabled = false;
            autoDowngraded = true;
          }
        }
        fpsFrames = 0;
        fpsWindowStart = time;
      }

      if (secondCamera && engine.physics.getLocalSecondPlayer()) {
        const rw = container.clientWidth || window.innerWidth;
        const rh = container.clientHeight || window.innerHeight;
        const verticalSplit = rw >= rh;
        renderer.setScissorTest(true);
        if (verticalSplit) {
          const half = Math.floor(rw / 2);
          camera.aspect = half / rh;
          secondCamera.aspect = (rw - half) / rh;
          camera.updateProjectionMatrix(); secondCamera.updateProjectionMatrix();
          renderer.setViewport(0, 0, half, rh); renderer.setScissor(0, 0, half, rh); renderer.render(scene, camera);
          renderer.setViewport(half, 0, rw - half, rh); renderer.setScissor(half, 0, rw - half, rh); renderer.render(scene, secondCamera);
        } else {
          const half = Math.floor(rh / 2);
          camera.aspect = rw / (rh - half);
          secondCamera.aspect = rw / half;
          camera.updateProjectionMatrix(); secondCamera.updateProjectionMatrix();
          renderer.setViewport(0, half, rw, rh - half); renderer.setScissor(0, half, rw, rh - half); renderer.render(scene, camera);
          renderer.setViewport(0, 0, rw, half); renderer.setScissor(0, 0, rw, half); renderer.render(scene, secondCamera);
        }
        renderer.setScissorTest(false);
      } else {
        renderer.setViewport(0, 0, container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
        renderer.render(scene, camera);
      }
      animFrameIdRef.current = requestAnimationFrame(animate);
    };

    animFrameIdRef.current = requestAnimationFrame(animate);

    // Window / Container Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth || window.innerWidth;
      const h = containerRef.current.clientHeight || window.innerHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      if (secondCameraRef.current) {
        secondCameraRef.current.aspect = w / h;
        secondCameraRef.current.updateProjectionMatrix();
      }
      rendererRef.current.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      readyCancelled = true;
      externalLoadCancelled = true;
      fbxSceneryCancelled = true;
      fbxSceneryHandle?.dispose();
      externalPlayerHandle?.dispose();
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      resizeObserver.disconnect();
      scene.traverse((obj: any) => {
        if (obj.geometry?.dispose) obj.geometry.dispose();
        const mats = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [];
        mats.forEach((m: any) => { m.map?.dispose?.(); m.dispose?.(); });
      });
      renderer.dispose();
      renderer.forceContextLoss?.();
      if (renderer.domElement.parentElement === container) container.removeChild(renderer.domElement);
    };
  }, [track.id, car.id, secondCar?.id, qualitySetting, engine.localPlayerCount]);

  // Update Customization in real-time if changed
  useEffect(() => {
    if (playerCarRef.current) {
      playerCarRef.current.applyCustomization(customization);
    }
  }, [customization]);

  return (
    <div
      ref={containerRef}
      id="race-3d-viewport"
      className="w-full h-full absolute inset-0 bg-slate-950 overflow-hidden"
    />
  );
};

function createProceduralRaceEnvironment(environmentType: string, size = 128): THREE.CubeTexture {
  const palette: Record<string, [string, string]> = {
    city_night: ['#07111f', '#38bdf8'], sunset_coast: ['#2b0b18', '#fb923c'],
    mountain: ['#111827', '#93c5fd'], candy: ['#3b082b', '#f9a8d4'],
    sky_clouds: ['#0c4a6e', '#e0f2fe'], cosmic_space: ['#020617', '#7c3aed'],
  };
  const [dark, glow] = palette[environmentType] || palette.city_night;
  const faces: HTMLCanvasElement[] = [];
  for (let face = 0; face < 6; face++) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const ctx = c.getContext('2d')!;
    const g = ctx.createLinearGradient(0, 0, size, size);
    g.addColorStop(0, dark); g.addColorStop(0.55, glow); g.addColorStop(1, '#ffffff');
    ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
    ctx.globalAlpha = 0.22; ctx.fillStyle = '#fff';
    for (let i = 0; i < Math.max(10, size / 8); i++) ctx.fillRect(Math.random()*size, Math.random()*size, 1 + Math.random()*4, 1 + Math.random()*4);
    faces.push(c);
  }
  const tex = new THREE.CubeTexture(faces);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}


function getRoadSurfaceY(
  point: { pos: { y: number }; bankAngle?: number },
  lateralOffset: number,
): number {
  const baseY = Number.isFinite(point.pos.y) ? point.pos.y : 0;
  const bank = Number.isFinite(point.bankAngle) ? (point.bankAngle || 0) : 0;
  const lateral = Number.isFinite(lateralOffset) ? lateralOffset : 0;
  return baseY + Math.abs(lateral) * bank * 0.2;
}

function getRaceVehicleGroundLift(modelId: string, category?: string): number {
  // Keep the vehicle slightly above the mathematical road ribbon. This prevents
  // imported FBX/procedural wheels from being depth-hidden by the road when a
  // scene/map changes elevation or when the source pivot sits a few cm low.
  if (modelId === 'rescue_truck_hauler_3d') return 0.16;
  if (modelId === 'xedap_city_3d') return 0.09;
  if (modelId === 'roadster_883_3d') return 0.10;
  if (modelId === 'vespa_studio_3d') return 0.12;
  if (modelId === 'capybara_parade_3d') return 0.12;
  if (category === 'motorcycle') return 0.10;
  return 0.08;
}

function updateCameraPosition(
  camera: THREE.PerspectiveCamera,
  px: number,
  py: number,
  pz: number,
  tangent: { x: number; y: number; z: number },
  viewMode: CameraViewMode,
  isNitro: boolean,
  carId: string,
  carCategory: string,
  snap = false,
) {
  // V5.19: chase camera is vehicle-size aware. A fixed 3.25 m offset placed the
  // camera inside the long V12 SV while making Vespa/883 motorcycles look tiny.
  // Keep per-model values explicit instead of guessing from FBX hierarchy/bounds at runtime.
  const isMotorcycle = carCategory === 'motorcycle';
  const closeDistanceByModel: Record<string, number> = {
    v12_sv_3d: 5.65,
    canis_mesa_3d: 5.15,
    roadster_883_3d: 2.75,
    vespa_studio_3d: 2.85,
    s14_sport_3d: 5.05,
    rescue_truck_hauler_3d: 10.8,
    xedap_city_3d: 2.45,
  };
  const chaseDistanceByModel: Record<string, number> = {
    v12_sv_3d: 6.65,
    canis_mesa_3d: 6.15,
    roadster_883_3d: 3.65,
    vespa_studio_3d: 3.7,
    s14_sport_3d: 6.05,
    rescue_truck_hauler_3d: 12.6,
    xedap_city_3d: 3.25,
  };
  const closeDistance = closeDistanceByModel[carId] ?? (isMotorcycle ? 2.75 : 4.15);
  const chaseDistance = chaseDistanceByModel[carId] ?? (isMotorcycle ? 3.65 : 5.35);
  const cameraHeightByModel: Record<string, number> = { rescue_truck_hauler_3d: 3.15, xedap_city_3d: 1.20, vespa_studio_3d: 1.26 };
  const chaseHeightByModel: Record<string, number> = { rescue_truck_hauler_3d: 3.85, xedap_city_3d: 1.62, vespa_studio_3d: 1.72 };
  const lookHeightByModel: Record<string, number> = { rescue_truck_hauler_3d: 1.75, xedap_city_3d: 0.62, vespa_studio_3d: 0.84 };
  const cameraHeight = cameraHeightByModel[carId] ?? (isMotorcycle ? 1.32 : 1.72);
  const chaseHeight = chaseHeightByModel[carId] ?? (isMotorcycle ? 1.78 : 2.28);
  const lookHeight = lookHeightByModel[carId] ?? (isMotorcycle ? 0.72 : 0.92);

  // Camera safety: a malformed waypoint/tangent must never turn the view matrix into NaN
  // (which produces a fully black WebGL frame).
  if (![px, py, pz, tangent.x, tangent.y, tangent.z].every(Number.isFinite)) {
    px = Number.isFinite(px) ? px : 0;
    py = Number.isFinite(py) ? py : 0;
    pz = Number.isFinite(pz) ? pz : 0;
    tangent = { x: 0, y: 0, z: 1 };
  }
  const setOrLerp = (x: number, y: number, z: number, alpha: number) => {
    if (snap || !Number.isFinite(camera.position.x + camera.position.y + camera.position.z)) {
      camera.position.set(x, y, z);
    } else {
      camera.position.lerp(new THREE.Vector3(x, y, z), alpha);
    }
  };

  // Slightly narrower FOV for motorcycles so they remain readable without moving the
  // camera dangerously close to the model.
  const fovTarget = isNitro ? (isMotorcycle ? 53 : 56) : (isMotorcycle ? 46 : 49);
  camera.fov += (fovTarget - camera.fov) * 0.1;
  camera.updateProjectionMatrix();

  switch (viewMode) {
    case 'close_chase': {
      const camX = px - tangent.x * closeDistance;
      const camY = py + cameraHeight;
      const camZ = pz - tangent.z * closeDistance;
      setOrLerp(camX, camY, camZ, 0.2);
      camera.lookAt(px + tangent.x * 5.0, py + lookHeight, pz + tangent.z * 5.0);
      break;
    }
    case 'hood': {
      // Imported FBXs do not share a reliable bonnet/interior origin. The old fixed
      // y=1.0 camera could sit inside an opaque shell and produce a completely black view.
      const forward = carId === 'rescue_truck_hauler_3d' ? 2.4 : isMotorcycle ? 0.34 : 1.72;
      const height = carId === 'rescue_truck_hauler_3d' ? 3.05 : isMotorcycle ? 1.28 : 1.52;
      const camX = px + tangent.x * forward;
      const camY = py + height;
      const camZ = pz + tangent.z * forward;
      camera.position.set(camX, camY, camZ);
      camera.lookAt(px + tangent.x * 22, py + height - 0.18, pz + tangent.z * 22);
      break;
    }
    case 'cockpit': {
      // Use a safe driver/roof viewpoint rather than assuming the FBX contains a hollow cockpit.
      const back = isMotorcycle ? 0.08 : 0.30;
      const height = carId === 'rescue_truck_hauler_3d' ? 3.22 : isMotorcycle ? 1.34 : 1.58;
      const camX = px - tangent.x * back;
      const camY = py + height;
      const camZ = pz - tangent.z * back;
      camera.position.set(camX, camY, camZ);
      camera.lookAt(px + tangent.x * 25, py + height - 0.12, pz + tangent.z * 25);
      break;
    }
    case 'cinematic': {
      const angle = performance.now() * 0.001;
      const camX = px + Math.sin(angle) * 12;
      const camY = py + 3.5;
      const camZ = pz + Math.cos(angle) * 12;
      setOrLerp(camX, camY, camZ, 0.1);
      camera.lookAt(px, py + 1.0, pz);
      break;
    }
    case 'chase':
    default: {
      const camX = px - tangent.x * chaseDistance;
      const camY = py + chaseHeight;
      const camZ = pz - tangent.z * chaseDistance;
      setOrLerp(camX, camY, camZ, 0.16);
      camera.lookAt(px + tangent.x * 4.8, py + lookHeight + 0.12, pz + tangent.z * 4.8);
      break;
    }
  }
}

function setupEnvironmentTheme(scene: THREE.Scene, track: RacingTrackConfig) {
  switch (track.environmentType) {
    case 'city_night':
      scene.background = new THREE.Color(0x090d16);
      scene.fog = new THREE.FogExp2(0x090d16, 0.0035);
      break;
    case 'sunset_coast':
      scene.background = new THREE.Color(0x451a03);
      scene.fog = new THREE.FogExp2(0x451a03, 0.003);
      break;
    case 'mountain':
      scene.background = new THREE.Color(0x1e1b4b);
      scene.fog = new THREE.FogExp2(0x1e1b4b, 0.0028);
      break;
    case 'candy':
      scene.background = new THREE.Color(0x500724);
      scene.fog = new THREE.FogExp2(0x500724, 0.0035);
      break;
    case 'sky_clouds':
      scene.background = new THREE.Color(0x082f49);
      scene.fog = new THREE.FogExp2(0x082f49, 0.002);
      break;
    case 'cosmic_space':
      scene.background = new THREE.Color(0x020617);
      scene.fog = new THREE.FogExp2(0x020617, 0.0018);
      break;
  }
}


function addSkyDome(
  scene: THREE.Scene,
  environmentType: string,
  quality: GraphicsProfile['quality'],
) {
  const palettes: Record<string, [string, string, string]> = {
    city_night: ['#020617', '#0f2a44', '#1d4ed8'],
    sunset_coast: ['#140815', '#7c2d12', '#fb923c'],
    mountain: ['#0f172a', '#334155', '#93c5fd'],
    candy: ['#2e0a2b', '#86198f', '#f9a8d4'],
    sky_clouds: ['#082f49', '#0ea5e9', '#e0f2fe'],
    cosmic_space: ['#02030a', '#1e1b4b', '#6d28d9'],
  };
  const [top, middle, horizon] = palettes[environmentType] || palettes.city_night;

  const width = quality === 'high' ? 768 : quality === 'balanced' ? 512 : 256;
  const c = document.createElement('canvas');
  c.width = width;
  c.height = Math.max(128, Math.floor(width / 2));
  const ctx = c.getContext('2d');
  if (!ctx) return;

  const g = ctx.createLinearGradient(0, 0, 0, c.height);
  g.addColorStop(0, top);
  g.addColorStop(0.58, middle);
  g.addColorStop(1, horizon);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, c.width, c.height);

  if (environmentType === 'city_night' || environmentType === 'cosmic_space') {
    const starCount = quality === 'high' ? 180 : quality === 'balanced' ? 100 : 48;
    for (let i = 0; i < starCount; i++) {
      const a = 0.25 + Math.random() * 0.65;
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      const r = Math.random() > 0.9 ? 2 : 1;
      ctx.fillRect(Math.random() * c.width, Math.random() * c.height * 0.72, r, r);
    }
  }

  // Soft horizon glow makes the scene feel deeper than a flat background color.
  const glow = ctx.createRadialGradient(
    c.width * 0.52, c.height * 0.82, 2,
    c.width * 0.52, c.height * 0.82, c.width * 0.38,
  );
  glow.addColorStop(0, 'rgba(255,255,255,0.18)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, c.width, c.height);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.needsUpdate = true;

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(720, quality === 'high' ? 36 : 24, quality === 'high' ? 18 : 12),
    new THREE.MeshBasicMaterial({
      map: tex,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    }),
  );
  dome.name = 'RaceSkyDome';
  dome.rotation.y = Math.PI * 0.18;
  scene.add(dome);
}

function build3DTrackMesh(scene: THREE.Scene, engine: RaceEngine, profile: GraphicsProfile, track: RacingTrackConfig) {
  const steps = 180;
  const roadWidth = 24;
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= steps; i++) {
    const prog = i / steps;
    const pt = getInterpolatedTrackPoint(engine.waypoints, prog);

    const halfW = roadWidth * 0.5;
    // Left edge
    const lx = pt.pos.x - pt.normal.x * halfW;
    const ly = pt.pos.y;
    const lz = pt.pos.z - pt.normal.z * halfW;

    // Right edge
    const rx = pt.pos.x + pt.normal.x * halfW;
    const ry = pt.pos.y;
    const rz = pt.pos.z + pt.normal.z * halfW;

    vertices.push(lx, ly, lz);
    vertices.push(rx, ry, rz);

    uvs.push(0, prog * 30);
    uvs.push(1, prog * 30);
  }

  for (let i = 0; i < steps; i++) {
    const row1 = i * 2;
    const row2 = (i + 1) * 2;
    indices.push(row1, row1 + 1, row2);
    indices.push(row1 + 1, row2 + 1, row2);
  }

  const trackGeo = new THREE.BufferGeometry();
  trackGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  trackGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  trackGeo.setIndex(indices);
  trackGeo.computeVertexNormals();

  const asphaltTexture = createAsphaltTexture(profile.textureSize);
  const trackMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    map: asphaltTexture || undefined,
    roughness: 0.72,
    metalness: 0.08,
  });

  const trackMesh = new THREE.Mesh(trackGeo, trackMat);
  trackMesh.receiveShadow = true;
  scene.add(trackMesh);

  // Glowing Curb Edges
  const neonRoad = ['city_night', 'cosmic_space', 'sky_clouds'].includes(track.environmentType);
  const curbMatLeft = new THREE.MeshStandardMaterial({
    color: neonRoad ? 0x22d3ee : 0xf8fafc,
    emissive: neonRoad ? 0x0e7490 : 0x000000,
    emissiveIntensity: neonRoad ? 0.45 : 0,
    roughness: 0.56,
    metalness: neonRoad ? 0.28 : 0.02,
  });
  const curbMatRight = new THREE.MeshStandardMaterial({
    color: neonRoad ? 0xa78bfa : 0xdc2626,
    emissive: neonRoad ? 0x6d28d9 : 0x000000,
    emissiveIntensity: neonRoad ? 0.40 : 0,
    roughness: 0.56,
    metalness: neonRoad ? 0.28 : 0.02,
  });

  const leftCurbGeo = new THREE.BufferGeometry();
  const rightCurbGeo = new THREE.BufferGeometry();
  const leftCurbVerts: number[] = [];
  const rightCurbVerts: number[] = [];

  for (let i = 0; i <= steps; i++) {
    const prog = i / steps;
    const pt = getInterpolatedTrackPoint(engine.waypoints, prog);
    const halfW = roadWidth * 0.5;

    leftCurbVerts.push(pt.pos.x - pt.normal.x * halfW, pt.pos.y + 0.035, pt.pos.z - pt.normal.z * halfW);
    leftCurbVerts.push(pt.pos.x - pt.normal.x * (halfW + 0.8), pt.pos.y + 0.035, pt.pos.z - pt.normal.z * (halfW + 0.8));

    rightCurbVerts.push(pt.pos.x + pt.normal.x * halfW, pt.pos.y + 0.035, pt.pos.z + pt.normal.z * halfW);
    rightCurbVerts.push(pt.pos.x + pt.normal.x * (halfW + 0.8), pt.pos.y + 0.035, pt.pos.z + pt.normal.z * (halfW + 0.8));
  }

  leftCurbGeo.setAttribute('position', new THREE.Float32BufferAttribute(leftCurbVerts, 3));
  leftCurbGeo.setIndex(indices);
  rightCurbGeo.setAttribute('position', new THREE.Float32BufferAttribute(rightCurbVerts, 3));
  rightCurbGeo.setIndex(indices);

  const leftCurb = new THREE.Mesh(leftCurbGeo, curbMatLeft);
  const rightCurb = new THREE.Mesh(rightCurbGeo, curbMatRight);
  scene.add(leftCurb, rightCurb);

  // Road markings greatly improve scale perception and speed, especially on TV/PC.
  // Instancing keeps the extra geometry inexpensive on mobile.
  const dashCount = profile.quality === 'high' ? 72 : profile.quality === 'balanced' ? 52 : 34;
  const dashGeo = new THREE.BoxGeometry(0.28, 0.035, 3.6);
  const dashMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.65, metalness: 0.02 });
  const dashes = new THREE.InstancedMesh(dashGeo, dashMat, dashCount);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < dashCount; i++) {
    const prog = (i + 0.35) / dashCount;
    const pt = getInterpolatedTrackPoint(engine.waypoints, prog);
    dummy.position.set(pt.pos.x, pt.pos.y + 0.055, pt.pos.z);
    dummy.rotation.set(0, Math.atan2(pt.tangent.x, pt.tangent.z), 0);
    dummy.updateMatrix();
    dashes.setMatrixAt(i, dummy.matrix);
  }
  dashes.instanceMatrix.needsUpdate = true;
  scene.add(dashes);

  // Solid edge lines + segmented rumble strips. Two instanced draw calls add much
  // stronger road definition on PC/TV without creating hundreds of Mesh objects.
  const edgeCount = profile.quality === 'high' ? 110 : profile.quality === 'balanced' ? 78 : 46;
  const edgeGeo = new THREE.BoxGeometry(0.16, 0.025, 4.2);
  const edgeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.62, metalness: 0.02 });
  const edgeLines = new THREE.InstancedMesh(edgeGeo, edgeMat, edgeCount * 2);

  const rumbleGeo = new THREE.BoxGeometry(0.86, 0.045, 2.8);
  const rumbleMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.60,
    metalness: neonRoad ? 0.22 : 0.02,
  });
  const rumbles = new THREE.InstancedMesh(rumbleGeo, rumbleMat, edgeCount * 2);

  let edgeIndex = 0;
  let rumbleIndex = 0;
  for (let i = 0; i < edgeCount; i++) {
    const prog = (i + 0.5) / edgeCount;
    const pt = getInterpolatedTrackPoint(engine.waypoints, prog);
    const yaw = Math.atan2(pt.tangent.x, pt.tangent.z);

    for (const side of [-1, 1]) {
      dummy.position.set(
        pt.pos.x + pt.normal.x * side * (roadWidth * 0.5 - 0.72),
        pt.pos.y + 0.035,
        pt.pos.z + pt.normal.z * side * (roadWidth * 0.5 - 0.72),
      );
      dummy.rotation.set(0, yaw, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      edgeLines.setMatrixAt(edgeIndex++, dummy.matrix);

      dummy.position.set(
        pt.pos.x + pt.normal.x * side * (roadWidth * 0.5 + 0.42),
        pt.pos.y + 0.045,
        pt.pos.z + pt.normal.z * side * (roadWidth * 0.5 + 0.42),
      );
      dummy.updateMatrix();
      rumbles.setMatrixAt(rumbleIndex, dummy.matrix);

      const alt = (i + (side > 0 ? 1 : 0)) % 2 === 0;
      const color = neonRoad
        ? new THREE.Color(alt ? 0x22d3ee : 0xa78bfa)
        : new THREE.Color(alt ? 0xf8fafc : 0xdc2626);
      rumbles.setColorAt(rumbleIndex, color);
      rumbleIndex++;
    }
  }
  edgeLines.instanceMatrix.needsUpdate = true;
  rumbles.instanceMatrix.needsUpdate = true;
  if (rumbles.instanceColor) rumbles.instanceColor.needsUpdate = true;
  scene.add(edgeLines, rumbles);

  // Low-cost metallic guard rails make the road read as a real circuit instead of a floating ribbon.
  const railCount = profile.quality === 'high' ? 64 : profile.quality === 'balanced' ? 42 : 26;
  const railGeo = new THREE.BoxGeometry(0.10, 0.46, 4.8);
  const railMat = new THREE.MeshStandardMaterial({ color: 0xa7adb5, roughness: 0.38, metalness: 0.72 });
  const rails = new THREE.InstancedMesh(railGeo, railMat, railCount * 2);
  let railIdx = 0;
  for (let i = 0; i < railCount; i++) {
    const prog = (i + 0.5) / railCount;
    const pt = getInterpolatedTrackPoint(engine.waypoints, prog);
    const yaw = Math.atan2(pt.tangent.x, pt.tangent.z);
    for (const side of [-1, 1]) {
      dummy.position.set(
        pt.pos.x + pt.normal.x * side * (roadWidth * 0.5 + 1.65),
        pt.pos.y + 0.42,
        pt.pos.z + pt.normal.z * side * (roadWidth * 0.5 + 1.65)
      );
      dummy.rotation.set(0, yaw, 0);
      dummy.updateMatrix();
      rails.setMatrixAt(railIdx++, dummy.matrix);
    }
  }
  rails.instanceMatrix.needsUpdate = true;
  scene.add(rails);

  // Give non-floating tracks a believable ground surface beyond the asphalt.
  if (!['sky_clouds', 'cosmic_space', 'sunset_coast'].includes(track.environmentType)) {
    const groundColor = track.environmentType === 'sunset_coast' ? 0x5b4636 : track.environmentType === 'mountain' ? 0x263326 : track.environmentType === 'candy' ? 0x6b2148 : 0x10151d;
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(1800, 1800),
      new THREE.MeshStandardMaterial({ color: groundColor, roughness: 0.96, metalness: 0.0 })
    );
    ground.rotation.x = -Math.PI / 2;
    // V5.36: never let the decorative terrain plane sit above a low section
    // of the actual road ribbon. Several tracks intentionally dip below world Y=0.
    // A fixed -0.18 plane could therefore cover both asphalt and vehicles.
    const minTrackY = engine.waypoints.reduce(
      (minY, waypoint) => Number.isFinite(waypoint.y) ? Math.min(minY, waypoint.y) : minY,
      0,
    );
    ground.position.y = minTrackY - 0.45;
    ground.receiveShadow = profile.shadows;
    scene.add(ground);
  }
}

function createBuildingFacadeTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 512;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#111827'; ctx.fillRect(0, 0, c.width, c.height);
  for (let y = 12; y < 500; y += 28) {
    for (let x = 10; x < 250; x += 26) {
      const lit = Math.random() > 0.28;
      ctx.fillStyle = lit ? (Math.random() > 0.55 ? '#dbeafe' : '#fef3c7') : '#172033';
      ctx.globalAlpha = lit ? 0.8 + Math.random() * 0.2 : 0.65;
      ctx.fillRect(x, y, 13, 16);
    }
  }
  ctx.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 4);
  t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

function buildScenery(scene: THREE.Scene, track: RacingTrackConfig, engine: RaceEngine, profile: GraphicsProfile) {
  // V5.16: scenery uses instancing. The old version created dozens/hundreds of
  // individual Mesh + Material objects on mount, causing a visible PC hitch before
  // the countdown. Instancing is both prettier (denser scene) and much cheaper.
  const steps = Math.max(26, Math.round(50 * profile.sceneryDensity));
  const dummy = new THREE.Object3D();

  const trackSample = (i: number) => {
    const prog = ((i % steps) + 0.35) / steps;
    return getInterpolatedTrackPoint(engine.waypoints, prog);
  };

  if (track.environmentType === 'city_night') {
    const facade = createBuildingFacadeTexture();
    const buildingGeo = new THREE.BoxGeometry(1, 1, 1);
    const cityMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      map: facade,
      emissive: 0x8ec5ff,
      emissiveMap: facade,
      emissiveIntensity: profile.quality === 'high' ? 0.32 : 0.18,
      roughness: 0.5,
      metalness: 0.18,
    });

    const count = steps * 2;
    const buildings = new THREE.InstancedMesh(buildingGeo, cityMat, count);
    buildings.castShadow = profile.shadows;
    buildings.receiveShadow = profile.shadows;

    const roofGeo = new THREE.CylinderGeometry(0.45, 0.55, 1, 6);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x0b1220, roughness: 0.48, metalness: 0.48 });
    const roofs = new THREE.InstancedMesh(roofGeo, roofMat, profile.quality === 'high' ? Math.ceil(count / 3) : 0);
    let roofIndex = 0;

    let idx = 0;
    for (let i = 0; i < steps; i++) {
      const pt = trackSample(i);
      const yaw = Math.atan2(pt.tangent.x, pt.tangent.z);
      for (const side of [-1, 1]) {
        const band = 30 + ((i * 13 + (side > 0 ? 9 : 0)) % 34);
        const x = pt.pos.x + pt.normal.x * side * band;
        const z = pt.pos.z + pt.normal.z * side * band;
        const height = 24 + ((i * 23 + (side > 0 ? 11 : 0)) % 72);
        const width = 9 + ((i * 7) % 13);
        const depth = 10 + ((i * 11) % 17);

        dummy.position.set(x, pt.pos.y + height * 0.5, z);
        dummy.rotation.set(0, yaw + (side > 0 ? Math.PI : 0), 0);
        dummy.scale.set(width, height, depth);
        dummy.updateMatrix();
        buildings.setMatrixAt(idx++, dummy.matrix);

        if (profile.quality === 'high' && i % 3 === 0 && roofIndex < roofs.count) {
          dummy.position.set(x, pt.pos.y + height + 1.6, z);
          dummy.rotation.set(0, yaw, 0);
          dummy.scale.set(width * 0.32, 3.2, depth * 0.32);
          dummy.updateMatrix();
          roofs.setMatrixAt(roofIndex++, dummy.matrix);
        }
      }
    }
    buildings.instanceMatrix.needsUpdate = true;
    scene.add(buildings);
    if (roofs.count > 0) {
      roofs.instanceMatrix.needsUpdate = true;
      scene.add(roofs);
    }

    // Street lights: two instanced draw calls instead of a Group per lamp.
    const lampCount = Math.ceil(steps / 2) * 2;
    const poleGeo = new THREE.CylinderGeometry(0.07, 0.10, 5.4, 6);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.4, metalness: 0.78 });
    const poles = new THREE.InstancedMesh(poleGeo, poleMat, lampCount);
    const bulbGeo = new THREE.SphereGeometry(0.23, 8, 6);
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfff1b8 });
    const bulbs = new THREE.InstancedMesh(bulbGeo, bulbMat, lampCount);

    let li = 0;
    for (let i = 0; i < steps; i += 2) {
      const pt = trackSample(i);
      for (const side of [-1, 1]) {
        const lx = pt.pos.x + pt.normal.x * side * 14.5;
        const lz = pt.pos.z + pt.normal.z * side * 14.5;

        dummy.position.set(lx, pt.pos.y + 2.7, lz);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        poles.setMatrixAt(li, dummy.matrix);

        dummy.position.set(lx, pt.pos.y + 5.35, lz);
        dummy.updateMatrix();
        bulbs.setMatrixAt(li, dummy.matrix);
        li++;
      }
    }
    poles.instanceMatrix.needsUpdate = true;
    bulbs.instanceMatrix.needsUpdate = true;
    scene.add(poles, bulbs);

    // Sparse neon tunnel arches use one instanced torus material.
    const tunnelSamples = [];
    for (let i = 0; i < steps; i++) {
      const pt = trackSample(i);
      if (pt.isTunnel && i % 2 === 0) tunnelSamples.push(pt);
    }
    if (tunnelSamples.length) {
      const ringGeo = new THREE.TorusGeometry(13.4, 0.16, 8, 28);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.72 });
      const rings = new THREE.InstancedMesh(ringGeo, ringMat, tunnelSamples.length);
      tunnelSamples.forEach((pt, i) => {
        dummy.position.set(pt.pos.x, pt.pos.y + 4.0, pt.pos.z);
        dummy.rotation.set(Math.PI / 2, Math.atan2(pt.tangent.x, pt.tangent.z), 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        rings.setMatrixAt(i, dummy.matrix);
      });
      rings.instanceMatrix.needsUpdate = true;
      scene.add(rings);
    }
    return;
  }

  if (track.environmentType === 'sunset_coast') {
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(1800, 1800, 1, 1),
      new THREE.MeshPhysicalMaterial({
        color: 0x075985,
        roughness: 0.22,
        metalness: 0.08,
        clearcoat: 0.7,
        clearcoatRoughness: 0.22,
      }),
    );
    water.rotation.x = -Math.PI / 2;
    water.position.y = -0.45;
    scene.add(water);

    const trunkGeo = new THREE.CylinderGeometry(0.36, 0.56, 7.2, profile.quality === 'lite' ? 6 : 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b3f1f, roughness: 0.92 });
    const crownGeo = new THREE.ConeGeometry(3.4, 2.0, profile.quality === 'high' ? 10 : 7);
    const crownMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.72 });

    const palms = new THREE.InstancedMesh(trunkGeo, trunkMat, steps);
    const crowns = new THREE.InstancedMesh(crownGeo, crownMat, steps);
    for (let i = 0; i < steps; i++) {
      const pt = trackSample(i);
      const side = i % 3 === 0 ? -1 : 1;
      const dist = 27 + (i % 4) * 6;
      const x = pt.pos.x + pt.normal.x * side * dist;
      const z = pt.pos.z + pt.normal.z * side * dist;
      const scale = 0.85 + (i % 5) * 0.06;

      dummy.position.set(x, pt.pos.y + 3.6 * scale, z);
      dummy.rotation.set(0, (i * 0.73) % Math.PI, 0);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      palms.setMatrixAt(i, dummy.matrix);

      dummy.position.set(x, pt.pos.y + 7.45 * scale, z);
      dummy.rotation.set(0, (i * 1.17) % Math.PI, Math.PI);
      dummy.scale.set(scale * 1.15, scale * 0.75, scale * 1.15);
      dummy.updateMatrix();
      crowns.setMatrixAt(i, dummy.matrix);
    }
    palms.instanceMatrix.needsUpdate = true;
    crowns.instanceMatrix.needsUpdate = true;
    scene.add(palms, crowns);
    return;
  }

  if (track.environmentType === 'mountain') {
    const mountainGeo = new THREE.ConeGeometry(1, 1, profile.quality === 'lite' ? 7 : 10);
    const mountainMat = new THREE.MeshStandardMaterial({ color: 0x35433a, roughness: 0.96 });
    const mountains = new THREE.InstancedMesh(mountainGeo, mountainMat, steps);
    const pineGeo = new THREE.ConeGeometry(1, 4, 7);
    const pineMat = new THREE.MeshStandardMaterial({ color: 0x163b2a, roughness: 0.95 });
    const pines = new THREE.InstancedMesh(pineGeo, pineMat, steps);

    for (let i = 0; i < steps; i++) {
      const pt = trackSample(i);
      const side = i % 2 === 0 ? 1 : -1;
      const dist = 48 + (i % 5) * 13;
      const x = pt.pos.x + pt.normal.x * side * dist;
      const z = pt.pos.z + pt.normal.z * side * dist;
      const radius = 18 + (i % 4) * 7;
      const height = 34 + (i % 5) * 9;

      dummy.position.set(x, pt.pos.y + height * 0.42, z);
      dummy.rotation.set(0, (i * 0.61) % Math.PI, 0);
      dummy.scale.set(radius, height, radius * 1.25);
      dummy.updateMatrix();
      mountains.setMatrixAt(i, dummy.matrix);

      const nearX = pt.pos.x + pt.normal.x * side * (19 + (i % 3) * 3);
      const nearZ = pt.pos.z + pt.normal.z * side * (19 + (i % 3) * 3);
      dummy.position.set(nearX, pt.pos.y + 2.1, nearZ);
      dummy.rotation.set(0, i * 0.4, 0);
      dummy.scale.set(1.4, 1.4, 1.4);
      dummy.updateMatrix();
      pines.setMatrixAt(i, dummy.matrix);
    }
    mountains.instanceMatrix.needsUpdate = true;
    pines.instanceMatrix.needsUpdate = true;
    scene.add(mountains, pines);
    return;
  }

  if (track.environmentType === 'candy') {
    const donutGeo = new THREE.TorusGeometry(5.5, 2.1, 10, 20);
    const donutMat = new THREE.MeshPhysicalMaterial({ color: 0xf472b6, roughness: 0.3, clearcoat: 0.45 });
    const donuts = new THREE.InstancedMesh(donutGeo, donutMat, steps);
    for (let i = 0; i < steps; i++) {
      const pt = trackSample(i);
      const side = i % 2 === 0 ? 1 : -1;
      dummy.position.set(
        pt.pos.x + pt.normal.x * side * (28 + (i % 4) * 8),
        pt.pos.y + 7.0,
        pt.pos.z + pt.normal.z * side * (28 + (i % 4) * 8),
      );
      dummy.rotation.set(Math.PI / 2, i * 0.55, 0);
      const sc = 0.7 + (i % 4) * 0.1;
      dummy.scale.set(sc, sc, sc);
      dummy.updateMatrix();
      donuts.setMatrixAt(i, dummy.matrix);
      donuts.setColorAt(i, new THREE.Color([0xf472b6, 0x38bdf8, 0xfacc15, 0xa78bfa][i % 4]));
    }
    donuts.instanceMatrix.needsUpdate = true;
    if (donuts.instanceColor) donuts.instanceColor.needsUpdate = true;
    scene.add(donuts);
    return;
  }

  if (track.environmentType === 'sky_clouds') {
    const cloudGeo = new THREE.SphereGeometry(1, profile.quality === 'high' ? 14 : 10, profile.quality === 'high' ? 10 : 8);
    const cloudMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.96 });
    const clouds = new THREE.InstancedMesh(cloudGeo, cloudMat, steps * 2);
    let ci = 0;
    for (let i = 0; i < steps; i++) {
      const pt = trackSample(i);
      for (const side of [-1, 1]) {
        const dist = 30 + ((i * 7) % 42);
        dummy.position.set(
          pt.pos.x + pt.normal.x * side * dist,
          pt.pos.y - 6 - (i % 3) * 2,
          pt.pos.z + pt.normal.z * side * dist,
        );
        dummy.rotation.set(0, i * 0.31, 0);
        dummy.scale.set(10 + (i % 4) * 3, 3.2 + (i % 3), 7 + (i % 4) * 2);
        dummy.updateMatrix();
        clouds.setMatrixAt(ci++, dummy.matrix);
      }
    }
    clouds.instanceMatrix.needsUpdate = true;
    scene.add(clouds);
    return;
  }

  if (track.environmentType === 'cosmic_space') {
    const asteroidGeo = new THREE.DodecahedronGeometry(1, 0);
    const asteroidMat = new THREE.MeshStandardMaterial({ color: 0x596579, roughness: 0.86, metalness: 0.12 });
    const asteroids = new THREE.InstancedMesh(asteroidGeo, asteroidMat, steps);
    for (let i = 0; i < steps; i++) {
      const pt = trackSample(i);
      const side = i % 2 === 0 ? 1 : -1;
      const r = 4 + (i % 5) * 1.8;
      dummy.position.set(
        pt.pos.x + pt.normal.x * side * (36 + (i % 5) * 12),
        pt.pos.y + 10 + (i % 4) * 8,
        pt.pos.z + pt.normal.z * side * (36 + (i % 5) * 12),
      );
      dummy.rotation.set(i * 0.3, i * 0.6, i * 0.17);
      dummy.scale.set(r, r * 0.8, r * 1.1);
      dummy.updateMatrix();
      asteroids.setMatrixAt(i, dummy.matrix);
    }
    asteroids.instanceMatrix.needsUpdate = true;
    scene.add(asteroids);
  }
}

