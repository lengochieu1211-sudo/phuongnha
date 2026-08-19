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
import { buildCar3D, Car3DInstance } from '../../lib/racing/Car3DBuilder';
import { attachExternalCarModel, isExternalCar, shouldUseExternalCar, ExternalCarHandle } from '../../lib/racing/ExternalCarModelLoader';
import { getInterpolatedTrackPoint } from '../../lib/racing/TrackData';
import { createAsphaltTexture, resolveRacingGraphicsProfile, GraphicsProfile, detectDeviceClass } from '../../utils/graphicsQuality';

interface Race3DCanvasProps {
  engine: RaceEngine;
  track: RacingTrackConfig;
  car: CarConfig;
  customization: CarCustomization;
  cameraView: CameraViewMode;
  qualitySetting: RaceSettings['quality'];
}

export const Race3DCanvas: React.FC<Race3DCanvasProps> = ({
  engine,
  track,
  car,
  customization,
  cameraView,
  qualitySetting,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const playerCarRef = useRef<Car3DInstance | null>(null);
  const aiCarsRef = useRef<{ id: string; instance: Car3DInstance }[]>([]);
  const itemMeshesRef = useRef<{ id: number; mesh: THREE.Mesh }[]>([]);
  const particlesRef = useRef<THREE.Points | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const profile = resolveRacingGraphicsProfile(qualitySetting);
    const actualDeviceClass = detectDeviceClass();

    // 1. Three.js Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Sky & Fog setup based on environment
    setupEnvironmentTheme(scene, track);
    // Even phone/TV gets a tiny reflection environment so clearcoat paint does not look flat.
    const envSize = profile.quality === 'high' ? 256 : profile.quality === 'balanced' ? 128 : 64;
    scene.environment = createProceduralRaceEnvironment(track.environmentType, envSize);

    const camera = new THREE.PerspectiveCamera(54, width / height, 0.5, 1400);
    cameraRef.current = camera;

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, profile.pixelRatioCap));
    renderer.shadowMap.enabled = profile.shadows;
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

    // 5. Build Player 3D Car
    const playerCar = buildCar3D(car.id, customization, profile.carDetail);
    scene.add(playerCar.root);
    playerCarRef.current = playerCar;

    // V5.7: lazy-load user-provided FBX cars only when selected.
    // Phones / Low mode keep the procedural fallback so initial loading and FPS stay safe.
    let externalPlayerHandle: ExternalCarHandle | null = null;
    let externalLoadCancelled = false;
    if (
      isExternalCar(car.id) &&
      shouldUseExternalCar(car.id, actualDeviceClass)
    ) {
      attachExternalCarModel(playerCar, car.id, customization, profile.carDetail)
        .then((handle) => {
          if (!handle) return;
          if (externalLoadCancelled) {
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
    contactShadow.scale.set(car.category === 'motorcycle' ? 0.42 : 1.15, car.category === 'motorcycle' ? 1.12 : 2.25, 1);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.renderOrder = 2;
    scene.add(contactShadow);

    // 6. Build AI 3D Cars
    const aiCars: { id: string; instance: Car3DInstance }[] = [];
    engine.physics.aiRacers.forEach((ai) => {
      const aiInstance = buildCar3D(ai.carModelId as any, {
        paintColor: ai.color,
        paintFinish: 'metallic',
        wheelStyle: 'sport',
        wheelColor: '#1e293b',
        spoilerStyle: 'sport_wing',
        neonUnderglow: 'cyan',
        windowTint: 'smoke',
        decal: 'none',
      }, profile.aiCarDetail);
      scene.add(aiInstance.root);
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
    const particleCount = profile.quality === 'high' ? 220 : profile.quality === 'balanced' ? 140 : 80;
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
      const py = pt.pos.y + (pt.bankAngle ? Math.abs(engine.physics.player.lateralOffset) * pt.bankAngle * 0.2 : 0);
      const pz = pt.pos.z + pt.normal.z * engine.physics.player.lateralOffset;

      playerCar.root.position.set(px, py, pz);
      contactShadow.position.set(px, py + 0.025, pz);

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
        const aiy = aiPt.pos.y;
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

      // Update Camera Tracking View
      updateCameraPosition(camera, px, py, pz, pt.tangent, cameraView, engine.physics.player.isNitroActive);

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

      renderer.render(scene, camera);
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
      rendererRef.current.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      externalLoadCancelled = true;
      externalPlayerHandle?.dispose();
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      resizeObserver.disconnect();
      scene.traverse((obj: any) => {
        if (obj.geometry?.dispose) obj.geometry.dispose();
        const mats = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [];
        mats.forEach((m: any) => { m.map?.dispose?.(); m.dispose?.(); });
      });
      renderer.dispose();
    };
  }, [track.id, car.id, qualitySetting]);

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

function updateCameraPosition(
  camera: THREE.PerspectiveCamera,
  px: number,
  py: number,
  pz: number,
  tangent: { x: number; y: number; z: number },
  viewMode: CameraViewMode,
  isNitro: boolean
) {
  // Keep the car visually prominent on phones. Nitro widens the view, but not so
  // much that the player car becomes tiny.
  const fovTarget = isNitro ? 56 : 49;
  camera.fov += (fovTarget - camera.fov) * 0.1;
  camera.updateProjectionMatrix();

  switch (viewMode) {
    case 'close_chase': {
      const camX = px - tangent.x * 3.25;
      const camY = py + 1.48;
      const camZ = pz - tangent.z * 3.25;
      camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.2);
      camera.lookAt(px + tangent.x * 5.0, py + 0.78, pz + tangent.z * 5.0);
      break;
    }
    case 'hood': {
      const camX = px + tangent.x * 0.8;
      const camY = py + 1.0;
      const camZ = pz + tangent.z * 0.8;
      camera.position.set(camX, camY, camZ);
      camera.lookAt(px + tangent.x * 20, py + 0.8, pz + tangent.z * 20);
      break;
    }
    case 'cockpit': {
      const camX = px - tangent.x * 0.2;
      const camY = py + 0.95;
      const camZ = pz - tangent.z * 0.2;
      camera.position.set(camX, camY, camZ);
      camera.lookAt(px + tangent.x * 25, py + 0.9, pz + tangent.z * 25);
      break;
    }
    case 'cinematic': {
      const angle = performance.now() * 0.001;
      const camX = px + Math.sin(angle) * 12;
      const camY = py + 3.5;
      const camZ = pz + Math.cos(angle) * 12;
      camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.1);
      camera.lookAt(px, py + 1.0, pz);
      break;
    }
    case 'chase':
    default: {
      const camX = px - tangent.x * 5.15;
      const camY = py + 2.1;
      const camZ = pz - tangent.z * 5.15;
      camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.16);
      camera.lookAt(px + tangent.x * 4.8, py + 1.02, pz + tangent.z * 4.8);
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
  const curbMatLeft = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
  const curbMatRight = new THREE.MeshBasicMaterial({ color: 0xa855f7 });

  const leftCurbGeo = new THREE.BufferGeometry();
  const rightCurbGeo = new THREE.BufferGeometry();
  const leftCurbVerts: number[] = [];
  const rightCurbVerts: number[] = [];

  for (let i = 0; i <= steps; i++) {
    const prog = i / steps;
    const pt = getInterpolatedTrackPoint(engine.waypoints, prog);
    const halfW = roadWidth * 0.5;

    leftCurbVerts.push(pt.pos.x - pt.normal.x * halfW, pt.pos.y + 0.15, pt.pos.z - pt.normal.z * halfW);
    leftCurbVerts.push(pt.pos.x - pt.normal.x * (halfW + 0.8), pt.pos.y + 0.15, pt.pos.z - pt.normal.z * (halfW + 0.8));

    rightCurbVerts.push(pt.pos.x + pt.normal.x * halfW, pt.pos.y + 0.15, pt.pos.z + pt.normal.z * halfW);
    rightCurbVerts.push(pt.pos.x + pt.normal.x * (halfW + 0.8), pt.pos.y + 0.15, pt.pos.z + pt.normal.z * (halfW + 0.8));
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
    ground.position.y = -0.18;
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
  const steps = Math.max(24, Math.round(52 * profile.sceneryDensity));
  const palmTrunkGeo = new THREE.CylinderGeometry(0.45, 0.72, 8, profile.quality === 'lite' ? 6 : 10);
  const candyDonutGeo = new THREE.TorusGeometry(6, 2.5, 12, 24);
  const neonColors = [0x38bdf8, 0xa78bfa, 0xf472b6, 0xfbbf24, 0x34d399];

  const facade = track.environmentType === 'city_night' ? createBuildingFacadeTexture() : null;
  const cityMat = facade ? new THREE.MeshStandardMaterial({
    color: 0x202938,
    map: facade,
    emissive: 0xb9ddff,
    emissiveMap: facade,
    emissiveIntensity: profile.quality === 'high' ? 0.38 : 0.22,
    roughness: 0.52,
    metalness: 0.15,
  }) : null;
  const buildingGeo = new THREE.BoxGeometry(1, 1, 1);
  const poleGeo = new THREE.CylinderGeometry(0.08, 0.11, 5.8, 6);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.45, metalness: 0.75 });
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xfff2c2 });
  const lampGeo = new THREE.SphereGeometry(0.22, 8, 6);

  // Coast gets a reflective water plane beyond the roadside.
  if (track.environmentType === 'sunset_coast') {
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(1800, 1800),
      new THREE.MeshPhysicalMaterial({ color: 0x075985, roughness: 0.2, metalness: 0.1, clearcoat: 0.65, clearcoatRoughness: 0.22 })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.y = -0.32;
    scene.add(water);
  }

  for (let i = 0; i < steps; i++) {
    const prog = i / steps;
    const pt = getInterpolatedTrackPoint(engine.waypoints, prog);
    const sides = track.environmentType === 'city_night' && profile.quality === 'high' ? [-1, 1] : [i % 2 === 0 ? 1 : -1];

    for (const side of sides) {
      const dist = 27 + (i % 4) * 9;
      const x = pt.pos.x + pt.normal.x * side * dist;
      const z = pt.pos.z + pt.normal.z * side * dist;
      const y = pt.pos.y;

      if (track.environmentType === 'city_night' && cityMat) {
        const height = 28 + ((i * 17) % 58);
        const width = 10 + ((i * 7) % 13);
        const depth = 11 + ((i * 11) % 15);
        const bldg = new THREE.Mesh(buildingGeo, cityMat);
        bldg.position.set(x, y + height * 0.5, z);
        bldg.scale.set(width, height, depth);
        bldg.castShadow = profile.shadows;
        bldg.receiveShadow = profile.shadows;
        scene.add(bldg);

        // Rooftop silhouette breaks up the primitive box shape on PC High.
        if (profile.quality === 'high' && i % 3 === 0) {
          const roof = new THREE.Mesh(new THREE.BoxGeometry(width * 0.35, 2.2, depth * 0.35), new THREE.MeshStandardMaterial({ color: 0x0b1018, roughness: 0.5, metalness: 0.45 }));
          roof.position.set(x, y + height + 1.1, z);
          scene.add(roof);
        }

        // Street lamps near the road visually connect the city to the racing surface.
        if (i % 2 === 0) {
          const lampGroup = new THREE.Group();
          const pole = new THREE.Mesh(poleGeo, poleMat); pole.position.y = 2.9; lampGroup.add(pole);
          const bulb = new THREE.Mesh(lampGeo, lampMat); bulb.position.y = 5.75; lampGroup.add(bulb);
          lampGroup.position.set(pt.pos.x + pt.normal.x * side * 13.5, y, pt.pos.z + pt.normal.z * side * 13.5);
          scene.add(lampGroup);
        }

        if (pt.isTunnel && i % 2 === 0) {
          const color = neonColors[i % neonColors.length];
          const ringGeo = new THREE.TorusGeometry(13.5, 0.18, 8, 32);
          const ringMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.75 });
          const ring = new THREE.Mesh(ringGeo, ringMat);
          ring.position.set(pt.pos.x, pt.pos.y + 4, pt.pos.z);
          ring.lookAt(pt.pos.x + pt.tangent.x, pt.pos.y + pt.tangent.y + 4, pt.pos.z + pt.tangent.z);
          scene.add(ring);
        }
      } else if (track.environmentType === 'sunset_coast') {
        const palmGroup = new THREE.Group();
        const trunk = new THREE.Mesh(palmTrunkGeo, new THREE.MeshStandardMaterial({ color: 0x6b3f1f, roughness: 0.95 }));
        trunk.position.y = 4; palmGroup.add(trunk);
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.75 });
        for (let leaf = 0; leaf < (profile.quality === 'high' ? 6 : 4); leaf++) {
          const frond = new THREE.Mesh(new THREE.ConeGeometry(1.6, 5.4, 5), leafMat);
          frond.position.y = 8.1; frond.rotation.z = Math.PI / 2.7; frond.rotation.y = leaf * (Math.PI * 2 / 6);
          palmGroup.add(frond);
        }
        palmGroup.position.set(x, y, z); scene.add(palmGroup);
      } else if (track.environmentType === 'mountain') {
        const mountain = new THREE.Mesh(
          new THREE.ConeGeometry(18 + (i % 3) * 7, 42 + (i % 4) * 12, profile.quality === 'lite' ? 7 : 12),
          new THREE.MeshStandardMaterial({ color: i % 2 ? 0x334155 : 0x3f4d3d, roughness: 0.96 })
        );
        mountain.position.set(x, y + 16, z);
        mountain.scale.z = 1.35;
        mountain.rotation.y = (i * 0.73) % Math.PI;
        scene.add(mountain);
      } else if (track.environmentType === 'candy') {
        const donut = new THREE.Mesh(candyDonutGeo, new THREE.MeshStandardMaterial({ color: neonColors[i % neonColors.length], roughness: 0.34, clearcoat: 0.35 }));
        donut.position.set(x, y + 8, z); donut.rotation.x = Math.PI * 0.5; scene.add(donut);
      } else if (track.environmentType === 'sky_clouds') {
        const cloud = new THREE.Mesh(new THREE.SphereGeometry(8, 12, 12), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.95 }));
        cloud.position.set(x, y - 2, z); cloud.scale.set(2.5, 0.8, 1.8); scene.add(cloud);
      } else if (track.environmentType === 'cosmic_space') {
        const asteroid = new THREE.Mesh(new THREE.DodecahedronGeometry(6 + (i % 4) * 3), new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.86 }));
        asteroid.position.set(x, y + 15 + (i % 3) * 10, z); scene.add(asteroid);
      }
    }
  }
}

