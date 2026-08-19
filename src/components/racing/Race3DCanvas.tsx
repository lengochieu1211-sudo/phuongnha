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
} from '../../types';
import { RaceEngine } from '../../lib/racing/RaceEngine';
import { buildCar3D, Car3DInstance } from '../../lib/racing/Car3DBuilder';
import { getInterpolatedTrackPoint } from '../../lib/racing/TrackData';
import { createAsphaltTexture, detectGraphicsProfile, GraphicsProfile } from '../../utils/graphicsQuality';

interface Race3DCanvasProps {
  engine: RaceEngine;
  track: RacingTrackConfig;
  car: CarConfig;
  customization: CarCustomization;
  cameraView: CameraViewMode;
}

export const Race3DCanvas: React.FC<Race3DCanvasProps> = ({
  engine,
  track,
  car,
  customization,
  cameraView,
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

    const profile = detectGraphicsProfile();

    // 1. Three.js Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Sky & Fog setup based on environment
    setupEnvironmentTheme(scene, track);
    if (profile.quality === 'high') {
      scene.environment = createProceduralRaceEnvironment(track.environmentType);
    }

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.5, 1200);
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
    build3DTrackMesh(scene, engine, profile);
    buildScenery(scene, track, engine, profile);

    // 5. Build Player 3D Car
    const playerCar = buildCar3D(car.id, customization, profile.carDetail);
    scene.add(playerCar.root);
    playerCarRef.current = playerCar;

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
      }, profile.quality === 'high' ? 'lite' : 'lite');
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

      // Runtime safety net: if a nominally capable device cannot sustain smooth rendering,
      // lower render resolution automatically without restarting the race.
      fpsFrames += 1;
      if (!autoDowngraded && time - fpsWindowStart >= 4500) {
        const fps = (fpsFrames * 1000) / (time - fpsWindowStart);
        if (fps < 38 && profile.quality !== 'lite') {
          autoDowngraded = true;
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.15));
          renderer.shadowMap.enabled = false;
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
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      resizeObserver.disconnect();
      scene.traverse((obj: any) => {
        if (obj.geometry?.dispose) obj.geometry.dispose();
        const mats = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [];
        mats.forEach((m: any) => { m.map?.dispose?.(); m.dispose?.(); });
      });
      renderer.dispose();
    };
  }, [track.id, car.id]);

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

function createProceduralRaceEnvironment(environmentType: string): THREE.CubeTexture {
  const palette: Record<string, [string, string]> = {
    city_night: ['#07111f', '#38bdf8'], sunset_coast: ['#2b0b18', '#fb923c'],
    mountain: ['#111827', '#93c5fd'], candy: ['#3b082b', '#f9a8d4'],
    sky_clouds: ['#0c4a6e', '#e0f2fe'], cosmic_space: ['#020617', '#7c3aed'],
  };
  const [dark, glow] = palette[environmentType] || palette.city_night;
  const faces: HTMLCanvasElement[] = [];
  for (let face = 0; face < 6; face++) {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const ctx = c.getContext('2d')!;
    const g = ctx.createLinearGradient(0, 0, 256, 256);
    g.addColorStop(0, dark); g.addColorStop(0.55, glow); g.addColorStop(1, '#ffffff');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
    ctx.globalAlpha = 0.22; ctx.fillStyle = '#fff';
    for (let i = 0; i < 28; i++) ctx.fillRect(Math.random()*256, Math.random()*256, 1 + Math.random()*4, 1 + Math.random()*4);
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
  const fovTarget = isNitro ? 70 : 60;
  camera.fov += (fovTarget - camera.fov) * 0.1;
  camera.updateProjectionMatrix();

  switch (viewMode) {
    case 'close_chase': {
      const camX = px - tangent.x * 5.4;
      const camY = py + 2.2;
      const camZ = pz - tangent.z * 5.4;
      camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.18);
      camera.lookAt(px + tangent.x * 5.5, py + 1.0, pz + tangent.z * 5.5);
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
      const camX = px - tangent.x * 7.2;
      const camY = py + 2.9;
      const camZ = pz - tangent.z * 7.2;
      camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.14);
      camera.lookAt(px + tangent.x * 6.5, py + 1.15, pz + tangent.z * 6.5);
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

function build3DTrackMesh(scene: THREE.Scene, engine: RaceEngine, profile: GraphicsProfile) {
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
}

function buildScenery(scene: THREE.Scene, track: RacingTrackConfig, engine: RaceEngine, profile: GraphicsProfile) {
  const steps = Math.max(20, Math.round(36 * profile.sceneryDensity));
  const buildingGeo = new THREE.BoxGeometry(18, 65, 18);
  const palmTrunkGeo = new THREE.CylinderGeometry(0.5, 0.8, 8, 8);
  const candyDonutGeo = new THREE.TorusGeometry(6, 2.5, 12, 24);

  const neonColors = [0x06b6d4, 0xa855f7, 0xec4899, 0xeab308, 0x10b981];

  for (let i = 0; i < steps; i++) {
    const prog = i / steps;
    const pt = getInterpolatedTrackPoint(engine.waypoints, prog);

    const side = i % 2 === 0 ? 1 : -1;
    const dist = 32 + (i % 3) * 15;
    const x = pt.pos.x + pt.normal.x * side * dist;
    const z = pt.pos.z + pt.normal.z * side * dist;
    const y = pt.pos.y;

    if (track.environmentType === 'city_night') {
      // Futuristic skyscrapers with emissive window strips
      const color = neonColors[i % neonColors.length];
      const mat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        emissive: color,
        emissiveIntensity: 0.4,
        roughness: 0.3,
      });
      const bldg = new THREE.Mesh(buildingGeo, mat);
      bldg.position.set(x, y + 30, z);
      bldg.scale.set(1 + (i % 2) * 0.5, 0.8 + (i % 4) * 0.4, 1 + (i % 2) * 0.5);
      scene.add(bldg);

      // Light portal rings inside tunnel
      if (pt.isTunnel) {
        const ringGeo = new THREE.TorusGeometry(14, 0.4, 8, 24);
        const ringMat = new THREE.MeshBasicMaterial({ color });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(pt.pos.x, pt.pos.y + 4, pt.pos.z);
        ring.lookAt(pt.pos.x + pt.tangent.x, pt.pos.y + pt.tangent.y + 4, pt.pos.z + pt.tangent.z);
        scene.add(ring);
      }
    } else if (track.environmentType === 'sunset_coast') {
      // Tropical palm trees
      const palmGroup = new THREE.Group();
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
      const trunk = new THREE.Mesh(palmTrunkGeo, trunkMat);
      trunk.position.y = 4;
      palmGroup.add(trunk);

      const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });
      const leavesGeo = new THREE.ConeGeometry(4.5, 3, 8);
      const leaves = new THREE.Mesh(leavesGeo, leafMat);
      leaves.position.y = 8;
      palmGroup.add(leaves);

      palmGroup.position.set(x, y, z);
      scene.add(palmGroup);
    } else if (track.environmentType === 'candy') {
      // Candy donuts & lollipop sculptures
      const donutMat = new THREE.MeshStandardMaterial({
        color: neonColors[i % neonColors.length],
        roughness: 0.3,
      });
      const donut = new THREE.Mesh(candyDonutGeo, donutMat);
      donut.position.set(x, y + 8, z);
      donut.rotation.x = Math.PI * 0.5;
      scene.add(donut);
    } else if (track.environmentType === 'sky_clouds') {
      // Volumetric cloud clusters
      const cloudGeo = new THREE.SphereGeometry(8, 12, 12);
      const cloudMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 });
      const cloud = new THREE.Mesh(cloudGeo, cloudMat);
      cloud.position.set(x, y - 2, z);
      cloud.scale.set(2.5, 0.8, 1.8);
      scene.add(cloud);
    } else if (track.environmentType === 'cosmic_space') {
      // Floating asteroids & planetary rings
      const asteroidGeo = new THREE.DodecahedronGeometry(6 + (i % 4) * 3);
      const asteroidMat = new THREE.MeshStandardMaterial({
        color: 0x475569,
        roughness: 0.8,
      });
      const asteroid = new THREE.Mesh(asteroidGeo, asteroidMat);
      asteroid.position.set(x, y + 15 + (i % 3) * 10, z);
      scene.add(asteroid);
    }
  }
}
