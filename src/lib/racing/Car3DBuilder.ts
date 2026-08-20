/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { CarModelId, CarCustomization } from '../../types';


interface CarBodyProfile {
  width: number;
  length: number;
  roofHeight: number;
  noseHeight: number;
  rearHeight: number;
  wheelbase: number;
  track: number;
  cabinLength: number;
  cabinOffsetZ: number;
}

function getCarBodyProfile(modelId: CarModelId): CarBodyProfile {
  const base: CarBodyProfile = { width: 1.92, length: 4.45, roofHeight: 1.12, noseHeight: 0.58, rearHeight: 0.66, wheelbase: 2.82, track: 1.92, cabinLength: 2.05, cabinOffsetZ: -0.28 };
  if (modelId === 'solus_hyper_proto' || modelId === 'ap_hyper' || modelId === 'lumi_hyper')
    return { ...base, width: 2.04, length: 4.72, roofHeight: 0.98, noseHeight: 0.43, rearHeight: 0.60, wheelbase: 3.02, track: 2.04, cabinLength: 1.62, cabinOffsetZ: -0.10 };
  if (modelId === 'yellow_exotic_v12' || modelId === 'ap_x' || modelId === 'ford_gt_stripes')
    return { ...base, width: 2.00, length: 4.58, roofHeight: 1.04, noseHeight: 0.48, rearHeight: 0.61, wheelbase: 2.92, track: 2.00, cabinLength: 1.82, cabinOffsetZ: -0.24 };
  if (modelId === 'amg_gt3_monster' || modelId === 'ap_gt')
    return { ...base, width: 2.03, length: 4.67, roofHeight: 1.17, noseHeight: 0.60, rearHeight: 0.72, wheelbase: 2.88, track: 2.02, cabinLength: 2.08, cabinOffsetZ: -0.35 };
  if (modelId === 'nissan_370z_tuner' || modelId === 'ap_r1')
    return { ...base, width: 1.90, length: 4.35, roofHeight: 1.16, noseHeight: 0.57, rearHeight: 0.68, wheelbase: 2.70, track: 1.91, cabinLength: 1.92, cabinOffsetZ: -0.35 };
  if (modelId === 'miata_roadster')
    return { ...base, width: 1.78, length: 3.94, roofHeight: 0.88, noseHeight: 0.52, rearHeight: 0.58, wheelbase: 2.45, track: 1.79, cabinLength: 1.48, cabinOffsetZ: -0.26 };
  if (modelId === 'ap_e')
    return { ...base, width: 1.96, length: 4.48, roofHeight: 1.10, noseHeight: 0.50, rearHeight: 0.64, wheelbase: 2.95, track: 1.96, cabinLength: 2.15, cabinOffsetZ: -0.18 };
  return base;
}

function createAerodynamicBodyGeometry(profile: CarBodyProfile, rings = 30, radial = 20): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  const halfL = profile.length / 2;
  const bottom = 0.20;
  for (let iz = 0; iz <= rings; iz++) {
    const t = iz / rings;
    const z = -halfL + t * profile.length;
    const longitudinal = Math.sin(Math.PI * t);
    const endTaper = 0.56 + 0.44 * Math.pow(longitudinal, 0.52);
    const shoulder = 1 + 0.055 * Math.sin(Math.PI * Math.min(1, Math.max(0, (t - 0.12) / 0.22))) + 0.045 * Math.sin(Math.PI * Math.min(1, Math.max(0, (0.88 - t) / 0.22)));
    const width = profile.width * 0.5 * endTaper * shoulder;
    const frontBlend = Math.pow(t, 0.72);
    const rearBlend = Math.pow(1 - t, 0.72);
    const edgeTop = profile.rearHeight * rearBlend + profile.noseHeight * frontBlend;
    const cabinBump = Math.pow(Math.sin(Math.PI * t), 1.85) * Math.max(0, profile.roofHeight - 0.60);
    const top = Math.max(edgeTop + cabinBump, bottom + 0.18);
    const cy = (top + bottom) * 0.5;
    const ry = Math.max(0.12, (top - bottom) * 0.5);
    for (let ia = 0; ia < radial; ia++) {
      const a = (ia / radial) * Math.PI * 2;
      const ca = Math.cos(a), sa = Math.sin(a);
      // Flatter underbody and more pronounced shoulder line than a perfect ellipse.
      const x = ca * width;
      const shapedSin = sa < 0 ? -Math.pow(-sa, 0.58) : Math.pow(sa, 0.78);
      const y = cy + shapedSin * ry;
      positions.push(x, y, z);
    }
  }
  for (let iz = 0; iz < rings; iz++) {
    for (let ia = 0; ia < radial; ia++) {
      const n = (ia + 1) % radial;
      const a = iz * radial + ia;
      const b = iz * radial + n;
      const c = (iz + 1) * radial + ia;
      const d = (iz + 1) * radial + n;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function addHighDetailBodyShell(group: THREE.Group, profile: CarBodyProfile, bodyMaterial: THREE.Material, glassMaterial: THREE.Material, carbonMaterial: THREE.Material, ultra = false) {
  const shell = new THREE.Mesh(createAerodynamicBodyGeometry(profile, ultra ? 46 : 34, ultra ? 32 : 24), bodyMaterial);
  shell.castShadow = true; shell.receiveShadow = true;
  group.add(shell);

  // Smooth glass canopy gives a real sports-car greenhouse instead of a rectangular cabin.
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 22), glassMaterial);
  canopy.scale.set(profile.width * 0.355, Math.max(0.27, profile.roofHeight * 0.34), profile.cabinLength * 0.50);
  canopy.position.set(0, profile.roofHeight * 0.74, profile.cabinOffsetZ);
  canopy.castShadow = true;
  group.add(canopy);

  // Belt line / window surround.
  const belt = new THREE.Mesh(new THREE.TorusGeometry(profile.width * 0.37, 0.018, 8, 44), carbonMaterial);
  belt.rotation.x = Math.PI / 2;
  belt.scale.z = profile.cabinLength / (profile.width * 0.74);
  belt.position.set(0, profile.roofHeight * 0.61, profile.cabinOffsetZ);
  group.add(belt);

  // Sculpted front splitter and rear diffuser sized from the actual body profile.
  const splitter = new THREE.Mesh(new THREE.BoxGeometry(profile.width * 0.92, 0.055, 0.42), carbonMaterial);
  splitter.position.set(0, 0.19, profile.length * 0.49);
  const diffuser = new THREE.Mesh(new THREE.BoxGeometry(profile.width * 0.90, 0.075, 0.46), carbonMaterial);
  diffuser.position.set(0, 0.21, -profile.length * 0.49);
  group.add(splitter, diffuser);
}

export interface Car3DInstance {
  root: THREE.Group;
  bodyMesh: THREE.Mesh;
  bodyMaterial: THREE.MeshPhysicalMaterial;
  frontLeftWheel: THREE.Group;
  frontRightWheel: THREE.Group;
  rearLeftWheel: THREE.Group;
  rearRightWheel: THREE.Group;
  leftHeadlight: THREE.PointLight;
  rightHeadlight: THREE.PointLight;
  underglowLight: THREE.PointLight;
  underglowMesh: THREE.Mesh;
  spoilerGroup: THREE.Group;
  nitroFlameLeft: THREE.Mesh;
  nitroFlameRight: THREE.Mesh;
  nitroLight: THREE.PointLight;
  updateAnimation: (speed: number, steerAngleRad: number, isDrifting: boolean, isNitro: boolean, delta: number) => void;
  applyCustomization: (custom: CarCustomization) => void;
}

export function buildCar3D(modelId: CarModelId, initialCustom: CarCustomization, detail: 'lite' | 'high' | 'ultra' = 'lite'): Car3DInstance {
  const root = new THREE.Group();
  const bodyProfile = getCarBodyProfile(modelId);

  // 1. High-End PBR Clearcoat Paint Material
  const paintColor = new THREE.Color(initialCustom.paintColor || '#ef4444');
  let roughness = 0.15;
  let metalness = 0.85;
  let clearcoat = 0.9;
  let clearcoatRoughness = 0.1;

  if (initialCustom.paintFinish === 'matte') {
    roughness = 0.75;
    metalness = 0.1;
    clearcoat = 0;
  } else if (initialCustom.paintFinish === 'glossy') {
    roughness = 0.08;
    metalness = 0.3;
    clearcoat = 1.0;
  } else if (initialCustom.paintFinish === 'metallic') {
    roughness = 0.12;
    metalness = 0.92;
    clearcoat = 0.8;
  }

  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: paintColor,
    roughness,
    metalness,
    clearcoat,
    clearcoatRoughness,
    reflectivity: 0.9,
  });

  const blackTrimMaterial = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.5,
    metalness: 0.3,
  });

  const carbonMaterial = new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    roughness: 0.25,
    metalness: 0.85,
  });
  if (detail !== 'lite') {
    new THREE.TextureLoader().load(
      `${((import.meta as any).env?.BASE_URL || "/")}assets/pc-hd/carbon-hd.webp`,
      (carbonTex) => {
        carbonTex.wrapS = carbonTex.wrapT = THREE.RepeatWrapping;
        carbonTex.repeat.set(4, 8);
        carbonTex.colorSpace = THREE.SRGBColorSpace;
        carbonTex.anisotropy = 8;
        carbonMaterial.map = carbonTex;
        carbonMaterial.needsUpdate = true;
      },
      undefined,
      () => { /* keep the base carbon material if HD texture cannot load */ },
    );
  }

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x0f172a,
    roughness: 0.05,
    transmission: 0.75,
    transparent: true,
    opacity: 0.85,
    metalness: 0.2,
    ior: 1.5,
  });

  const chromeMaterial = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.04,
    metalness: 0.96,
  });

  const brakeCaliperMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.2,
    metalness: 0.8,
  });

  const brakeDiskMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.1,
    metalness: 0.9,
  });

  // 2. Main Chassis Body with Smooth Curves
  const carBodyGroup = new THREE.Group();

  // Lower chassis
  const lowerGeo = new THREE.BoxGeometry(1.85, 0.45, 4.2);
  const bodyMesh = new THREE.Mesh(lowerGeo, bodyMaterial);
  bodyMesh.position.y = 0.42;
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  carBodyGroup.add(bodyMesh);

  // Hood scoop / taper
  const hoodGeo = new THREE.BoxGeometry(1.75, 0.22, 1.4);
  const hoodMesh = new THREE.Mesh(hoodGeo, bodyMaterial);
  hoodMesh.position.set(0, 0.62, 1.1);
  hoodMesh.castShadow = true;
  carBodyGroup.add(hoodMesh);

  // Cabin / Roof
  const cabinGeo = new THREE.BoxGeometry(1.5, 0.45, 2.0);
  const cabinMesh = new THREE.Mesh(cabinGeo, bodyMaterial);
  cabinMesh.position.set(0, 0.92, -0.3);
  cabinMesh.castShadow = true;
  carBodyGroup.add(cabinMesh);

  // Windshield & Windows with Reflections
  const windshieldGeo = new THREE.BoxGeometry(1.48, 0.42, 0.8);
  windshieldGeo.rotateX(Math.PI * 0.12);
  const windshieldMesh = new THREE.Mesh(windshieldGeo, glassMaterial);
  windshieldMesh.position.set(0, 0.85, 0.55);
  carBodyGroup.add(windshieldMesh);

  const rearWindowGeo = new THREE.BoxGeometry(1.48, 0.4, 0.7);
  rearWindowGeo.rotateX(-Math.PI * 0.14);
  const rearWindowMesh = new THREE.Mesh(rearWindowGeo, glassMaterial);
  rearWindowMesh.position.set(0, 0.86, -1.15);
  carBodyGroup.add(rearWindowMesh);

  if (detail !== 'lite') {
    // High-end silhouette: keep a thin chassis underneath but replace boxy upper panels.
    // The smooth procedural shell is the visible body on desktop. Keeping the old
    // rectangular chassis visible caused box edges to poke through the curved shell.
    bodyMesh.visible = false;
    hoodMesh.visible = false;
    cabinMesh.visible = false;
    windshieldMesh.visible = false;
    rearWindowMesh.visible = false;
    addHighDetailBodyShell(carBodyGroup, bodyProfile, bodyMaterial, glassMaterial, carbonMaterial, detail === 'ultra');
  }

  // Front Bumper & Splitter
  const splitterGeo = new THREE.BoxGeometry(1.88, 0.1, 0.6);
  const splitterMesh = new THREE.Mesh(splitterGeo, carbonMaterial);
  splitterMesh.position.set(0, 0.22, bodyProfile.length * 0.475);
  carBodyGroup.add(splitterMesh);

  // Rear Diffuser & Exhaust tips
  const diffuserGeo = new THREE.BoxGeometry(1.82, 0.16, 0.5);
  const diffuserMesh = new THREE.Mesh(diffuserGeo, carbonMaterial);
  diffuserMesh.position.set(0, 0.25, -bodyProfile.length * 0.475);
  carBodyGroup.add(diffuserMesh);

  const exhaustGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.3, 16);
  exhaustGeo.rotateX(Math.PI * 0.5);
  const leftExhaust = new THREE.Mesh(exhaustGeo, chromeMaterial);
  leftExhaust.position.set(-bodyProfile.width * 0.21, 0.32, -bodyProfile.length * 0.505);
  const rightExhaust = new THREE.Mesh(exhaustGeo, chromeMaterial);
  rightExhaust.position.set(bodyProfile.width * 0.21, 0.32, -bodyProfile.length * 0.505);
  carBodyGroup.add(leftExhaust, rightExhaust);


  // Real-car detailing: side glass, mirrors, wheel arches, door seams and front grille.
  // These remain lightweight primitives so mobile WebGL can still hold a stable frame-rate.
  const sideGlassGeo = new THREE.BoxGeometry(0.035, Math.max(0.28, bodyProfile.roofHeight * 0.31), bodyProfile.cabinLength * 0.68);
  const leftSideGlass = new THREE.Mesh(sideGlassGeo, glassMaterial);
  const sideGlassX = bodyProfile.width * 0.40;
  leftSideGlass.position.set(-sideGlassX, bodyProfile.roofHeight * 0.78, bodyProfile.cabinOffsetZ);
  const rightSideGlass = leftSideGlass.clone();
  rightSideGlass.position.x = sideGlassX;
  carBodyGroup.add(leftSideGlass, rightSideGlass);

  const mirrorHousingGeo = new THREE.SphereGeometry(0.14, detail !== 'lite' ? 28 : 16, detail !== 'lite' ? 18 : 10);
  mirrorHousingGeo.scale(1.3, 0.55, 0.72);
  const leftMirror = new THREE.Mesh(mirrorHousingGeo, bodyMaterial);
  const mirrorX = bodyProfile.width * 0.54;
  const mirrorY = Math.max(0.72, bodyProfile.roofHeight * 0.72);
  const mirrorZ = bodyProfile.cabinOffsetZ + bodyProfile.cabinLength * 0.35;
  leftMirror.position.set(-mirrorX, mirrorY, mirrorZ);
  const rightMirror = leftMirror.clone();
  rightMirror.position.x = mirrorX;
  const mirrorGlassGeo = new THREE.CircleGeometry(0.095, 16);
  const mirrorGlassMat = new THREE.MeshPhysicalMaterial({ color: 0xbfe6ff, roughness: 0.05, metalness: 0.65, clearcoat: 1 });
  const leftMirrorGlass = new THREE.Mesh(mirrorGlassGeo, mirrorGlassMat);
  leftMirrorGlass.rotation.y = -Math.PI / 2;
  leftMirrorGlass.position.set(-(mirrorX + 0.115), mirrorY, mirrorZ);
  const rightMirrorGlass = leftMirrorGlass.clone();
  rightMirrorGlass.rotation.y = Math.PI / 2;
  rightMirrorGlass.position.x = mirrorX + 0.115;
  carBodyGroup.add(leftMirror, rightMirror, leftMirrorGlass, rightMirrorGlass);

  // Door shut lines and lower rocker trim add recognizable automotive proportions.
  const seamMat = new THREE.MeshBasicMaterial({ color: 0x020617, transparent: true, opacity: 0.7 });
  const doorX = bodyProfile.width * 0.485;
  const seamGeo = new THREE.BoxGeometry(0.016, Math.max(0.24, bodyProfile.roofHeight * 0.27), bodyProfile.cabinLength * 0.79);
  const leftDoorSeam = new THREE.Mesh(seamGeo, seamMat);
  leftDoorSeam.position.set(-doorX, Math.max(0.50, bodyProfile.roofHeight * 0.52), bodyProfile.cabinOffsetZ);
  const rightDoorSeam = leftDoorSeam.clone();
  rightDoorSeam.position.x = doorX;
  const rockerGeo = new THREE.BoxGeometry(0.09, 0.09, bodyProfile.wheelbase * 0.96);
  const leftRocker = new THREE.Mesh(rockerGeo, carbonMaterial);
  leftRocker.position.set(-bodyProfile.width * 0.485, 0.20, 0);
  const rightRocker = leftRocker.clone();
  rightRocker.position.x = bodyProfile.width * 0.485;
  carBodyGroup.add(leftDoorSeam, rightDoorSeam, leftRocker, rightRocker);

  // Four subtle fender shoulders make the wheel arches read more like a real sports car.
  const fenderRadius = Math.max(0.42, Math.min(0.52, bodyProfile.width * 0.245));
  const fenderGeo = new THREE.SphereGeometry(fenderRadius, detail !== 'lite' ? 30 : 18, detail !== 'lite' ? 20 : 12);
  fenderGeo.scale(1.0, 0.48, 1.15);
  const fenderX = bodyProfile.track * 0.43;
  const fenderZ = bodyProfile.wheelbase * 0.50;
  [[-fenderX,0.47,fenderZ],[fenderX,0.47,fenderZ],[-fenderX,0.47,-fenderZ],[fenderX,0.47,-fenderZ]].forEach(([x,y,z]) => {
    const fender = new THREE.Mesh(fenderGeo, bodyMaterial);
    fender.position.set(x,y,z);
    fender.castShadow = true;
    carBodyGroup.add(fender);
  });

  const grilleFrameGeo = new THREE.BoxGeometry(1.18, 0.28, 0.06);
  const grilleFrame = new THREE.Mesh(grilleFrameGeo, blackTrimMaterial);
  grilleFrame.position.set(0, 0.38, bodyProfile.length * 0.492);
  carBodyGroup.add(grilleFrame);
  for (let gx = -0.45; gx <= 0.45; gx += 0.15) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.23, 0.025), chromeMaterial);
    slat.position.set(gx, 0.38, bodyProfile.length * 0.50);
    carBodyGroup.add(slat);
  }

  // 3. Headlights & Taillights Lenses
  const headlightMat = new THREE.MeshStandardMaterial({ color: 0xf8fbff, emissive: 0xe0f2fe, emissiveIntensity: 2.2, roughness: 0.12, metalness: 0.2 });
  const hlGeo = new THREE.BoxGeometry(0.35, 0.12, 0.15);
  const leftHl = new THREE.Mesh(hlGeo, headlightMat);
  leftHl.position.set(-bodyProfile.width * 0.34, 0.52, bodyProfile.length * 0.49);
  const rightHl = new THREE.Mesh(hlGeo, headlightMat);
  rightHl.position.set(bodyProfile.width * 0.34, 0.52, bodyProfile.length * 0.49);
  carBodyGroup.add(leftHl, rightHl);

  // Real Three.js forward beams
  const leftHeadlight = new THREE.PointLight(0xfff5ea, 1.4, 28);
  leftHeadlight.position.set(-bodyProfile.width * 0.34, 0.55, bodyProfile.length * 0.505);
  const rightHeadlight = new THREE.PointLight(0xfff5ea, 1.4, 28);
  rightHeadlight.position.set(bodyProfile.width * 0.34, 0.55, bodyProfile.length * 0.505);
  carBodyGroup.add(leftHeadlight, rightHeadlight);

  // Taillight glowing bar
  const taillightMat = new THREE.MeshStandardMaterial({ color: 0xff1738, emissive: 0xff001f, emissiveIntensity: 1.8, roughness: 0.2 });
  const tailGeo = new THREE.BoxGeometry(bodyProfile.width * 0.86, 0.12, 0.1);
  const tailMesh = new THREE.Mesh(tailGeo, taillightMat);
  tailMesh.position.set(0, 0.55, -bodyProfile.length * 0.49);
  carBodyGroup.add(tailMesh);

  const plateMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5, metalness: 0.05 });
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.22, 0.035), plateMat);
  plate.position.set(0, 0.34, -bodyProfile.length * 0.498);
  carBodyGroup.add(plate);

  // 4. Mascot Ornaments
  if (modelId === 'bara_gt') {
    // Cute Capybara ears on roof
    const earGeo = new THREE.SphereGeometry(0.18, 12, 12);
    earGeo.scale(1.2, 0.8, 0.6);
    const earMat = new THREE.MeshStandardMaterial({ color: 0x9a602d, roughness: 0.7 });
    const leftEar = new THREE.Mesh(earGeo, earMat);
    leftEar.position.set(-0.55, 1.25, -0.3);
    const rightEar = new THREE.Mesh(earGeo, earMat);
    rightEar.position.set(0.55, 1.25, -0.3);
    // Orange on head
    const orangeGeo = new THREE.SphereGeometry(0.16, 12, 12);
    const orangeMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4 });
    const capyOrange = new THREE.Mesh(orangeGeo, orangeMat);
    capyOrange.position.set(0, 1.28, -0.2);
    carBodyGroup.add(leftEar, rightEar, capyOrange);
  } else if (modelId === 'bong_rabbit_r') {
    // White rabbit ears
    const earGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.6, 12);
    earGeo.rotateZ(0.2);
    const earMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    const leftEar = new THREE.Mesh(earGeo, earMat);
    leftEar.position.set(-0.45, 1.45, -0.3);
    const rightEar = new THREE.Mesh(earGeo.clone().rotateZ(-0.4), earMat);
    rightEar.position.set(0.45, 1.45, -0.3);
    carBodyGroup.add(leftEar, rightEar);
  } else if (modelId === 'lumi_hyper') {
    // Iridescent Unicorn horn on hood
    const hornGeo = new THREE.ConeGeometry(0.1, 0.6, 16);
    hornGeo.rotateX(-Math.PI * 0.25);
    const hornMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xd946ef,
      emissiveIntensity: 0.8,
      roughness: 0.1,
      metalness: 0.9,
    });
    const horn = new THREE.Mesh(hornGeo, hornMat);
    horn.position.set(0, 0.85, 1.6);
    carBodyGroup.add(horn);
  } else if (modelId === 'ford_gt_stripes') {
    // Dual Black Racing Stripes down center
    const stripeGeo = new THREE.BoxGeometry(0.18, 0.02, 4.15);
    const leftStripe = new THREE.Mesh(stripeGeo, blackTrimMaterial);
    leftStripe.position.set(-0.16, 0.66, 0);
    const rightStripe = new THREE.Mesh(stripeGeo, blackTrimMaterial);
    rightStripe.position.set(0.16, 0.66, 0);
    // Side air intakes
    const intakeGeo = new THREE.BoxGeometry(0.2, 0.3, 0.8);
    const leftIntake = new THREE.Mesh(intakeGeo, carbonMaterial);
    leftIntake.position.set(-0.85, 0.48, -0.6);
    const rightIntake = new THREE.Mesh(intakeGeo, carbonMaterial);
    rightIntake.position.set(0.85, 0.48, -0.6);
    carBodyGroup.add(leftStripe, rightStripe, leftIntake, rightIntake);
  } else if (modelId === 'amg_gt3_monster') {
    // Large GT3 Front Grille
    const grilleGeo = new THREE.BoxGeometry(1.4, 0.32, 0.1);
    const grille = new THREE.Mesh(grilleGeo, blackTrimMaterial);
    grille.position.set(0, 0.42, 2.06);
    // Vertical slats
    for (let x = -0.5; x <= 0.5; x += 0.2) {
      const slatGeo = new THREE.BoxGeometry(0.04, 0.28, 0.12);
      const slat = new THREE.Mesh(slatGeo, chromeMaterial);
      slat.position.set(x, 0.42, 2.07);
      carBodyGroup.add(slat);
    }
    // Widebody fender flares
    const fenderGeo = new THREE.BoxGeometry(0.15, 0.35, 1.2);
    const flFender = new THREE.Mesh(fenderGeo, blackTrimMaterial);
    flFender.position.set(-0.92, 0.4, 1.3);
    const frFender = new THREE.Mesh(fenderGeo, blackTrimMaterial);
    frFender.position.set(0.92, 0.4, 1.3);
    carBodyGroup.add(grille, flFender, frFender);
  } else if (modelId === 'solus_hyper_proto') {
    // Single-seater canopy cockpit
    const canopyGeo = new THREE.CapsuleGeometry(0.45, 1.2, 8, 16);
    canopyGeo.rotateX(Math.PI * 0.5);
    const canopy = new THREE.Mesh(canopyGeo, glassMaterial);
    canopy.position.set(0, 0.88, 0.1);
    // Top air scoop
    const scoopGeo = new THREE.BoxGeometry(0.28, 0.18, 0.6);
    const scoop = new THREE.Mesh(scoopGeo, carbonMaterial);
    scoop.position.set(0, 1.15, -0.4);
    // Front aero winglets
    const wingletGeo = new THREE.BoxGeometry(1.95, 0.05, 0.4);
    const tealMat = new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.2, metalness: 0.8 });
    const winglet = new THREE.Mesh(wingletGeo, tealMat);
    winglet.position.set(0, 0.25, 2.05);
    carBodyGroup.add(canopy, scoop, winglet);
  } else if (modelId === 'miata_roadster') {
    // Open-top cockpit tub
    const tubGeo = new THREE.BoxGeometry(1.2, 0.25, 1.2);
    const tub = new THREE.Mesh(tubGeo, blackTrimMaterial);
    tub.position.set(0, 0.72, -0.2);
    // Driver Seats
    const seatGeo = new THREE.BoxGeometry(0.4, 0.35, 0.4);
    const leftSeat = new THREE.Mesh(seatGeo, blackTrimMaterial);
    leftSeat.position.set(-0.32, 0.8, -0.3);
    const rightSeat = new THREE.Mesh(seatGeo, blackTrimMaterial);
    rightSeat.position.set(0.32, 0.8, -0.3);
    // Roll bars
    const rollGeo = new THREE.TorusGeometry(0.18, 0.03, 8, 12, Math.PI);
    const rollBar = new THREE.Mesh(rollGeo, chromeMaterial);
    rollBar.position.set(0, 0.95, -0.55);
    carBodyGroup.add(tub, leftSeat, rightSeat, rollBar);
  } else if (modelId === 'nissan_370z_tuner') {
    // Black hood bonnet decal
    const bonnetGeo = new THREE.BoxGeometry(1.0, 0.02, 1.2);
    const bonnet = new THREE.Mesh(bonnetGeo, blackTrimMaterial);
    bonnet.position.set(0, 0.63, 1.1);
    // Sport side skirts
    const skirtGeo = new THREE.BoxGeometry(0.1, 0.12, 2.4);
    const lSkirt = new THREE.Mesh(skirtGeo, blackTrimMaterial);
    lSkirt.position.set(-0.9, 0.22, 0);
    const rSkirt = new THREE.Mesh(skirtGeo, blackTrimMaterial);
    rSkirt.position.set(0.9, 0.22, 0);
    carBodyGroup.add(bonnet, lSkirt, rSkirt);
  } else if (modelId === 'yellow_exotic_v12') {
    // Large front intake meshes
    const intakeGeo = new THREE.BoxGeometry(0.6, 0.25, 0.1);
    const lIntake = new THREE.Mesh(intakeGeo, blackTrimMaterial);
    lIntake.position.set(-0.5, 0.38, 2.08);
    const rIntake = new THREE.Mesh(intakeGeo, blackTrimMaterial);
    rIntake.position.set(0.5, 0.38, 2.08);
    // Side aero vents
    const ventGeo = new THREE.BoxGeometry(0.12, 0.3, 0.7);
    const lVent = new THREE.Mesh(ventGeo, carbonMaterial);
    lVent.position.set(-0.92, 0.45, 0.2);
    const rVent = new THREE.Mesh(ventGeo, carbonMaterial);
    rVent.position.set(0.92, 0.45, 0.2);
    carBodyGroup.add(lIntake, rIntake, lVent, rVent);
  }

  // Desktop/high-performance detail pack. Kept procedural so it works offline and falls back safely.
  if (detail !== 'lite') {
    // Interior: seats, dashboard and steering wheel become visible through the glass in garage/chase views.
    const interiorMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.58, metalness: 0.08 });
    const leatherMat = new THREE.MeshPhysicalMaterial({ color: 0x171717, roughness: 0.42, clearcoat: 0.22 });
    const seatGeo = new THREE.BoxGeometry(0.42, 0.52, 0.56, 2, 2, 2);
    [-0.38, 0.38].forEach((x) => {
      const seat = new THREE.Mesh(seatGeo, leatherMat);
      seat.position.set(x, 0.75, -0.42);
      seat.rotation.x = -0.08;
      carBodyGroup.add(seat);
      const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.20), leatherMat);
      headrest.position.set(x, 1.03, -0.52);
      carBodyGroup.add(headrest);
    });
    const dash = new THREE.Mesh(new THREE.BoxGeometry(1.30, 0.18, 0.34), interiorMat);
    dash.position.set(0, 0.82, 0.38);
    carBodyGroup.add(dash);
    const steering = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.025, 10, 28), interiorMat);
    steering.rotation.y = Math.PI / 2;
    steering.rotation.z = -0.12;
    steering.position.set(-0.36, 0.91, 0.30);
    carBodyGroup.add(steering);

    // Door handles, badges and DRL strips add scale cues without external GLB dependencies.
    const handleGeo = new THREE.BoxGeometry(0.035, 0.055, Math.max(0.24, bodyProfile.cabinLength * 0.15));
    const handleL = new THREE.Mesh(handleGeo, chromeMaterial);
    handleL.position.set(-bodyProfile.width * 0.498, Math.max(0.57, bodyProfile.roofHeight * 0.58), bodyProfile.cabinOffsetZ);
    const handleR = handleL.clone(); handleR.position.x = bodyProfile.width * 0.498;
    carBodyGroup.add(handleL, handleR);
    const badge = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.025, 24), chromeMaterial);
    badge.rotation.x = Math.PI / 2; badge.position.set(0, Math.max(0.46, bodyProfile.noseHeight * 0.90), bodyProfile.length * 0.497);
    carBodyGroup.add(badge);
    const drlMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
    [-0.64, 0.64].forEach((x) => {
      const drl = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.025, 0.022), drlMat);
      drl.position.set(x * (bodyProfile.width / 1.92), Math.max(0.42, bodyProfile.noseHeight * 0.80), bodyProfile.length * 0.498);
      carBodyGroup.add(drl);
    });
  }

  // PC Ultra detail pack: extra paneling and aero cues that are intentionally omitted
  // from phone/TV profiles. All pieces are lightweight primitives so there is no GLB download.
  if (detail === 'ultra') {
    const panelLineMat = new THREE.MeshBasicMaterial({ color: 0x05070a, transparent: true, opacity: 0.76 });
    const meshBlackMat = new THREE.MeshStandardMaterial({ color: 0x07090c, roughness: 0.48, metalness: 0.32 });

    // Hood creases and roof rails give highlights something to catch in chase/garage views.
    [-0.46, 0.46].forEach((sx) => {
      const crease = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.018, bodyProfile.length * 0.34), panelLineMat);
      crease.position.set(sx * (bodyProfile.width / 1.92), Math.max(0.60, bodyProfile.noseHeight + 0.055), bodyProfile.length * 0.24);
      crease.rotation.x = -0.015;
      carBodyGroup.add(crease);
    });

    // Side intake blades behind the doors.
    [-1, 1].forEach((side) => {
      const intakeFrame = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.34, 0.72), meshBlackMat);
      intakeFrame.position.set(side * bodyProfile.width * 0.495, 0.46, bodyProfile.cabinOffsetZ - bodyProfile.cabinLength * 0.40);
      carBodyGroup.add(intakeFrame);
      for (let j = -2; j <= 2; j++) {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.025, 0.56), chromeMaterial);
        blade.position.set(side * bodyProfile.width * 0.512, 0.46 + j * 0.055, bodyProfile.cabinOffsetZ - bodyProfile.cabinLength * 0.40);
        carBodyGroup.add(blade);
      }
    });

    // Rear diffuser fins + separate tail lamp elements read much more like a production supercar.
    for (let i = -2; i <= 2; i++) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.22, 0.48), carbonMaterial);
      fin.position.set(i * bodyProfile.width * 0.15, 0.18, -bodyProfile.length * 0.485);
      fin.rotation.x = -0.12;
      carBodyGroup.add(fin);
    }
    const tailSegmentMat = new THREE.MeshStandardMaterial({ color: 0x7f1d1d, emissive: 0xff1838, emissiveIntensity: 2.6, roughness: 0.18 });
    [-0.58, -0.25, 0.25, 0.58].forEach((sx) => {
      const seg = new THREE.Mesh(new THREE.BoxGeometry(bodyProfile.width * 0.19, 0.055, 0.035), tailSegmentMat);
      seg.position.set(sx * bodyProfile.width * 0.72, 0.59, -bodyProfile.length * 0.505);
      carBodyGroup.add(seg);
    });

    // Front lower intakes with horizontal vanes.
    [-1, 1].forEach((side) => {
      const intake = new THREE.Mesh(new THREE.BoxGeometry(bodyProfile.width * 0.27, 0.19, 0.035), meshBlackMat);
      intake.position.set(side * bodyProfile.width * 0.31, 0.32, bodyProfile.length * 0.505);
      carBodyGroup.add(intake);
      for (let j = -1; j <= 1; j++) {
        const vane = new THREE.Mesh(new THREE.BoxGeometry(bodyProfile.width * 0.23, 0.018, 0.018), chromeMaterial);
        vane.position.set(side * bodyProfile.width * 0.31, 0.32 + j * 0.055, bodyProfile.length * 0.512);
        carBodyGroup.add(vane);
      }
    });

    // Subtle underbody tray visible during hills/jumps.
    const undertray = new THREE.Mesh(new THREE.BoxGeometry(bodyProfile.width * 0.88, 0.035, bodyProfile.wheelbase * 1.05), carbonMaterial);
    undertray.position.set(0, 0.115, 0);
    carBodyGroup.add(undertray);
  }

  root.add(carBodyGroup);

  // 5. Spoiler Group
  // V5.25: motorcycle/bicycle procedural fallbacks must never inherit an automotive
  // rear wing. On XEDAP this looked exactly like a detached table in front of the bike.
  const supportsAutomotiveSpoiler = !['roadster_883_3d', 'vespa_studio_3d', 'xedap_city_3d'].includes(modelId);
  const spoilerGroup = new THREE.Group();
  if (supportsAutomotiveSpoiler) {
    rebuildSpoiler(spoilerGroup, initialCustom.spoilerStyle, carbonMaterial, chromeMaterial);
  }
  spoilerGroup.position.set(0, 0.68, -bodyProfile.length * 0.40);
  root.add(spoilerGroup);

  // 6. Wheels with Brake Disk & Calipers
  const wheelRadius = detail !== 'lite' ? (modelId === 'miata_roadster' ? 0.34 : 0.38) : 0.36;
  const wheelWidth = detail !== 'lite' ? 0.30 : 0.26;
  const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, detail !== 'lite' ? 48 : 24);
  wheelGeo.rotateZ(Math.PI * 0.5);

  const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85 });
  const rimMat = new THREE.MeshStandardMaterial({
    color: initialCustom.wheelColor || 0xd1d5db,
    metalness: 0.92,
    roughness: 0.12,
  });

  const createWheel = (isLeft: boolean) => {
    const wGroup = new THREE.Group();
    const tire = new THREE.Mesh(wheelGeo, tireMat);
    tire.castShadow = true;
    wGroup.add(tire);
    if (detail !== 'lite') {
      const sidewallMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.96 });
      const sidewallGeo = new THREE.TorusGeometry(wheelRadius * 0.81, wheelRadius * 0.16, 10, 36);
      sidewallGeo.rotateY(Math.PI / 2);
      const outerSidewall = new THREE.Mesh(sidewallGeo, sidewallMat);
      outerSidewall.position.x = isLeft ? wheelWidth * 0.52 : -wheelWidth * 0.52;
      wGroup.add(outerSidewall);
    }

    // Rim inner hub
    const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.72, wheelRadius * 0.72, wheelWidth * 1.05, detail !== 'lite' ? 32 : 16);
    rimGeo.rotateZ(Math.PI * 0.5);
    const rim = new THREE.Mesh(rimGeo, rimMat);
    wGroup.add(rim);

    // Spokes
    const spokeGeo = new THREE.BoxGeometry(wheelWidth * 1.08, wheelRadius * 1.28, 0.06);
    const spoke1 = new THREE.Mesh(spokeGeo, rimMat);
    const spoke2 = new THREE.Mesh(spokeGeo, rimMat);
    spoke2.rotateX(Math.PI * 0.33);
    const spoke3 = new THREE.Mesh(spokeGeo, rimMat);
    spoke3.rotateX(Math.PI * 0.66);
    wGroup.add(spoke1, spoke2, spoke3);
    if (detail !== 'lite') {
      for (let i = 0; i < 7; i++) {
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(wheelWidth * 1.10, wheelRadius * 1.18, 0.028), rimMat);
        spoke.rotateX((i / 7) * Math.PI);
        wGroup.add(spoke);
      }
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const lug = new THREE.Mesh(new THREE.SphereGeometry(0.026, 10, 8), chromeMaterial);
        lug.position.set(isLeft ? wheelWidth * 0.55 : -wheelWidth * 0.55, Math.cos(a) * 0.09, Math.sin(a) * 0.09);
        wGroup.add(lug);
      }
    }

    // Brake Disk Rotor
    const diskGeo = new THREE.CylinderGeometry(wheelRadius * 0.62, wheelRadius * 0.62, 0.04, detail !== 'lite' ? 32 : 16);
    diskGeo.rotateZ(Math.PI * 0.5);
    const disk = new THREE.Mesh(diskGeo, brakeDiskMat);
    disk.position.x = isLeft ? 0.06 : -0.06;
    wGroup.add(disk);

    // Brake Caliper
    const caliperGeo = new THREE.BoxGeometry(0.08, wheelRadius * 0.32, 0.12);
    const caliper = new THREE.Mesh(caliperGeo, brakeCaliperMat);
    caliper.position.set(isLeft ? 0.06 : -0.06, wheelRadius * 0.3, 0);
    wGroup.add(caliper);

    return wGroup;
  };

  const frontLeftWheel = createWheel(true);
  frontLeftWheel.position.set(-bodyProfile.track * 0.52, wheelRadius, bodyProfile.wheelbase * 0.5);

  const frontRightWheel = createWheel(false);
  frontRightWheel.position.set(bodyProfile.track * 0.52, wheelRadius, bodyProfile.wheelbase * 0.5);

  const rearLeftWheel = createWheel(true);
  rearLeftWheel.position.set(-bodyProfile.track * 0.52, wheelRadius, -bodyProfile.wheelbase * 0.5);

  const rearRightWheel = createWheel(false);
  rearRightWheel.position.set(bodyProfile.track * 0.52, wheelRadius, -bodyProfile.wheelbase * 0.5);

  root.add(frontLeftWheel, frontRightWheel, rearLeftWheel, rearRightWheel);

  // 7. Neon Underglow
  const underglowPlaneGeo = new THREE.PlaneGeometry(bodyProfile.width * 0.92, bodyProfile.length * 0.84);
  underglowPlaneGeo.rotateX(-Math.PI * 0.5);
  const underglowMat = new THREE.MeshBasicMaterial({
    color: getNeonColor(initialCustom.neonUnderglow),
    transparent: true,
    opacity: initialCustom.neonUnderglow === 'none' ? 0 : 0.6,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  const underglowMesh = new THREE.Mesh(underglowPlaneGeo, underglowMat);
  underglowMesh.position.set(0, 0.05, 0);
  root.add(underglowMesh);

  const underglowLight = new THREE.PointLight(
    getNeonColor(initialCustom.neonUnderglow),
    initialCustom.neonUnderglow === 'none' ? 0 : 1.5,
    6
  );
  underglowLight.position.set(0, 0.15, 0);
  root.add(underglowLight);

  // 8. Nitro Exhaust Jets
  const nitroGeo = new THREE.ConeGeometry(0.18, 1.2, 16);
  nitroGeo.rotateX(-Math.PI * 0.5);
  const nitroMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
  });

  const nitroFlameLeft = new THREE.Mesh(nitroGeo, nitroMat);
  nitroFlameLeft.position.set(-bodyProfile.width * 0.21, 0.35, -bodyProfile.length * 0.55);
  const nitroFlameRight = new THREE.Mesh(nitroGeo, nitroMat.clone());
  nitroFlameRight.position.set(bodyProfile.width * 0.21, 0.35, -bodyProfile.length * 0.55);

  const nitroLight = new THREE.PointLight(0x06b6d4, 0, 10);
  nitroLight.position.set(0, 0.35, -bodyProfile.length * 0.57);

  root.add(nitroFlameLeft, nitroFlameRight, nitroLight);

  // Suspension & Animation Loop
  let wheelRotX = 0;
  let currentPitch = 0;
  let currentRoll = 0;

  const updateAnimation = (
    speed: number,
    steerAngleRad: number,
    isDrifting: boolean,
    isNitro: boolean,
    delta: number
  ) => {
    // Wheel spin based on forward velocity
    const rotSpeed = (speed / 10) * delta * 25;
    wheelRotX += rotSpeed;

    frontLeftWheel.children.forEach((c) => (c.rotation.x = wheelRotX));
    frontRightWheel.children.forEach((c) => (c.rotation.x = wheelRotX));
    rearLeftWheel.children.forEach((c) => (c.rotation.x = wheelRotX));
    rearRightWheel.children.forEach((c) => (c.rotation.x = wheelRotX));

    // Front steering angle
    frontLeftWheel.rotation.y = steerAngleRad;
    frontRightWheel.rotation.y = steerAngleRad;

    // Suspension Pitch on acceleration/braking & Suspension Roll on turns
    const targetPitch = isNitro ? -0.06 : (speed > 80 ? -0.02 : 0);
    const targetRoll = -steerAngleRad * 0.22 + (isDrifting ? -Math.sign(steerAngleRad) * 0.12 : 0);

    currentPitch += (targetPitch - currentPitch) * 0.12;
    currentRoll += (targetRoll - currentRoll) * 0.12;

    carBodyGroup.rotation.x = currentPitch;
    carBodyGroup.rotation.z = currentRoll;

    // Nitro Jet Flames
    if (isNitro) {
      const flicker = 0.8 + Math.random() * 0.4;
      (nitroFlameLeft.material as THREE.MeshBasicMaterial).opacity = 0.95;
      (nitroFlameRight.material as THREE.MeshBasicMaterial).opacity = 0.95;
      nitroFlameLeft.scale.set(1, 1, flicker);
      nitroFlameRight.scale.set(1, 1, flicker);
      nitroLight.intensity = 2.5 * flicker;
    } else {
      (nitroFlameLeft.material as THREE.MeshBasicMaterial).opacity = 0;
      (nitroFlameRight.material as THREE.MeshBasicMaterial).opacity = 0;
      nitroLight.intensity = 0;
    }
  };

  const applyCustomization = (custom: CarCustomization) => {
    bodyMaterial.color.set(custom.paintColor || '#ef4444');
    const neonCol = getNeonColor(custom.neonUnderglow);
    (underglowMesh.material as THREE.MeshBasicMaterial).color.set(neonCol);
    (underglowMesh.material as THREE.MeshBasicMaterial).opacity =
      custom.neonUnderglow === 'none' ? 0 : 0.65;
    underglowLight.color.set(neonCol);
    underglowLight.intensity = custom.neonUnderglow === 'none' ? 0 : 1.5;

    if (supportsAutomotiveSpoiler) {
      rebuildSpoiler(spoilerGroup, custom.spoilerStyle, carbonMaterial, chromeMaterial);
    }
  };

  return {
    root,
    bodyMesh,
    bodyMaterial,
    frontLeftWheel,
    frontRightWheel,
    rearLeftWheel,
    rearRightWheel,
    leftHeadlight,
    rightHeadlight,
    underglowLight,
    underglowMesh,
    spoilerGroup,
    nitroFlameLeft,
    nitroFlameRight,
    nitroLight,
    updateAnimation,
    applyCustomization,
  };
}

function rebuildSpoiler(
  group: THREE.Group,
  style: CarCustomization['spoilerStyle'],
  carbonMat: THREE.Material,
  chromeMat: THREE.Material
) {
  while (group.children.length > 0) {
    group.remove(group.children[0]);
  }

  if (style === 'stock') {
    // Subtle lip spoiler
    const lipGeo = new THREE.BoxGeometry(1.6, 0.08, 0.25);
    const lip = new THREE.Mesh(lipGeo, carbonMat);
    group.add(lip);
  } else if (style === 'sport_wing') {
    // Elevated sport wing
    const wingGeo = new THREE.BoxGeometry(1.7, 0.06, 0.35);
    const wing = new THREE.Mesh(wingGeo, carbonMat);
    wing.position.y = 0.3;

    const postGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.3, 8);
    const leftPost = new THREE.Mesh(postGeo, chromeMat);
    leftPost.position.set(-0.55, 0.15, 0);
    const rightPost = new THREE.Mesh(postGeo, chromeMat);
    rightPost.position.set(0.55, 0.15, 0);

    group.add(wing, leftPost, rightPost);
  } else if (style === 'gt_wing' || style === 'neon_wing') {
    // Aggressive GT racing wing
    const wingGeo = new THREE.BoxGeometry(1.9, 0.08, 0.45);
    const wingMat =
      style === 'neon_wing'
        ? new THREE.MeshStandardMaterial({
            color: 0x111827,
            emissive: 0x06b6d4,
            emissiveIntensity: 0.6,
            roughness: 0.2,
          })
        : carbonMat;
    const wing = new THREE.Mesh(wingGeo, wingMat);
    wing.position.y = 0.45;

    // End plates
    const plateGeo = new THREE.BoxGeometry(0.04, 0.25, 0.48);
    const leftPlate = new THREE.Mesh(plateGeo, wingMat);
    leftPlate.position.set(-0.95, 0.45, 0);
    const rightPlate = new THREE.Mesh(plateGeo, wingMat);
    rightPlate.position.set(0.95, 0.45, 0);

    const postGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.45, 8);
    const leftPost = new THREE.Mesh(postGeo, chromeMat);
    leftPost.position.set(-0.6, 0.22, 0);
    const rightPost = new THREE.Mesh(postGeo, chromeMat);
    rightPost.position.set(0.6, 0.22, 0);

    group.add(wing, leftPlate, rightPlate, leftPost, rightPost);
  }
}

function getNeonColor(neon: CarCustomization['neonUnderglow']): number {
  switch (neon) {
    case 'cyan':
      return 0x06b6d4;
    case 'purple':
      return 0xa855f7;
    case 'pink':
      return 0xf43f5e;
    case 'lime':
      return 0x84cc16;
    case 'gold':
      return 0xeab308;
    case 'rainbow':
      return 0xec4899;
    case 'none':
    default:
      return 0x000000;
  }
}

