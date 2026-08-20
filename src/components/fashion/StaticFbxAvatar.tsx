/**
 * V5.27 - Persistent FBX avatar renderer with double-buffer model swaps.
 * Static SketchUp FBXs have no skeleton/skin/animation, so the whole model follows torso orientation only.
 */
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

interface Props {
  yaw: number;
  roll: number;
  quality: 'phone' | 'tv' | 'pc' | 'auto';
  file?: string;
  title?: string;
  description?: string;
}

const WHITE_PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z7iEAAAAASUVORK5CYII=';

// Keep parsed templates for the session. Switching ng1 <-> Child+girl no longer
// reparses the same ASCII FBX every time the user taps a model button.
const AVATAR_FBX_CACHE = new Map<string, Promise<THREE.Group>>();

function loadAvatarTemplate(url: string): Promise<THREE.Group> {
  let pending = AVATAR_FBX_CACHE.get(url);
  if (pending) return pending;

  const manager = new THREE.LoadingManager();
  manager.setURLModifier((assetUrl) => {
    if (/\.(png|jpe?g|bmp|tga|gif|webp)(\?.*)?$/i.test(assetUrl)) return WHITE_PIXEL;
    return assetUrl;
  });
  const loader = new FBXLoader(manager);
  pending = new Promise<THREE.Group>((resolve, reject) => {
    loader.load(
      url,
      resolve,
      undefined,
      (error) => {
        AVATAR_FBX_CACHE.delete(url);
        reject(error);
      },
    );
  });
  AVATAR_FBX_CACHE.set(url, pending);
  return pending;
}

function disposeAvatarMaterials(root: THREE.Object3D) {
  root.traverse((obj: any) => {
    const mats = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [];
    mats.forEach((m: any) => m.dispose?.());
  });
}

export default function StaticFbxAvatar({
  yaw,
  roll,
  quality,
  file = 'assets/avatars/ng1-human-static.fbx',
  title = 'NGƯỜI MẪU 3D THẬT',
  description = 'Model FBX • xoay/nghiêng theo thân người',
}: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const rigRef = useRef<THREE.Group | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const loadTokenRef = useRef(0);
  const targetYawRef = useRef(0);
  const targetRollRef = useRef(0);

  targetYawRef.current = THREE.MathUtils.clamp(yaw, -0.9, 0.9);
  targetRollRef.current = THREE.MathUtils.clamp(roll, -0.35, 0.35);

  // Renderer/scene lives for the lifetime of this mode. Changing the FBX file
  // does not destroy the canvas, which eliminates the black flash from V5.26.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const width = host.clientWidth || 640;
    const height = host.clientHeight || 520;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1020);

    const camera = new THREE.PerspectiveCamera(34, width / height, 0.01, 100);
    camera.position.set(0, 1.18, 4.2);
    camera.lookAt(0, 1.0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: quality !== 'phone',
      alpha: false,
      powerPreference: 'high-performance',
    });
    const pixelRatioCap = quality === 'pc' ? 1.65 : quality === 'tv' ? 1.25 : 1.0;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioCap));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = quality === 'pc';
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    host.innerHTML = '';
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xe0f2fe, 0x1e1b4b, 1.5));

    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(3, 5, 4);
    key.castShadow = quality === 'pc';
    if (quality === 'pc') key.shadow.mapSize.set(1024, 1024);
    scene.add(key);

    const rim = new THREE.DirectionalLight(0x67e8f9, 1.5);
    rim.position.set(-4, 2.5, -2);
    scene.add(rim);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(1.35, quality === 'pc' ? 48 : 24),
      new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.92, metalness: 0.06 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.005;
    floor.receiveShadow = true;
    scene.add(floor);

    const mannequinRoot = new THREE.Group();
    rigRef.current = mannequinRoot;
    scene.add(mannequinRoot);

    let raf = 0;
    let prev = performance.now();
    const animate = (now: number) => {
      raf = requestAnimationFrame(animate);
      const dt = Math.min(0.05, Math.max(0, (now - prev) / 1000));
      prev = now;

      const rig = rigRef.current;
      if (rig) {
        const wantedY = targetYawRef.current * 0.9;
        const wantedZ = targetRollRef.current * 0.55;
        rig.rotation.y += (wantedY - rig.rotation.y) * Math.min(1, dt * 7.5);
        rig.rotation.z += (wantedZ - rig.rotation.z) * Math.min(1, dt * 6.5);
      }

      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(animate);

    const ro = new ResizeObserver(() => {
      if (!hostRef.current) return;
      const w = hostRef.current.clientWidth || width;
      const h = hostRef.current.clientHeight || height;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    ro.observe(host);

    return () => {
      loadTokenRef.current += 1;
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (modelRef.current) disposeAvatarMaterials(modelRef.current);
      modelRef.current = null;
      rigRef.current = null;

      // Geometry from cached FBX templates is intentionally not disposed here;
      // clones share it with the session cache. Scene-owned floor geometry is safe to dispose.
      floor.geometry.dispose();
      (floor.material as THREE.Material).dispose();
      renderer.dispose();
      renderer.forceContextLoss?.();
      if (renderer.domElement.parentElement === host) host.removeChild(renderer.domElement);
    };
  }, [quality]);

  useEffect(() => {
    const rig = rigRef.current;
    if (!rig) return;

    const token = ++loadTokenRef.current;
    let cancelled = false;
    let timer: number | null = null;
    const base = ((import.meta as any).env?.BASE_URL || '/');
    const url = `${base}${file}`;

    // Wait briefly so rapidly tapping model choices does not parse every intermediate FBX.
    timer = window.setTimeout(() => {
      loadAvatarTemplate(url)
        .then((template) => {
          if (cancelled || token !== loadTokenRef.current || !rigRef.current) return;
          const fbx = template.clone(true) as THREE.Group;

          // Preserve diffuse colors even when SketchUp texture files are absent.
          fbx.traverse((obj: any) => {
            if (!obj.isMesh) return;
            obj.castShadow = quality === 'pc';
            obj.receiveShadow = true;

            const src = Array.isArray(obj.material) ? obj.material : [obj.material];
            const next = src.map((m: any) => {
              const c = m?.color?.isColor ? m.color.clone() : new THREE.Color(0xd6b59c);
              const materialName = `${obj.name} ${m?.name || ''}`.toLowerCase();
              if (/glass|cornea|tear|lacrimal/.test(materialName)) {
                return new THREE.MeshPhysicalMaterial({
                  color: c,
                  roughness: 0.12,
                  metalness: 0.02,
                  transparent: true,
                  opacity: 0.34,
                  transmission: 0.22,
                  side: THREE.DoubleSide,
                });
              }
              return new THREE.MeshStandardMaterial({
                color: c,
                roughness: /hair/.test(materialName) ? 0.74 : 0.62,
                metalness: 0.04,
                transparent: /eyelash/.test(materialName),
                opacity: /eyelash/.test(materialName) ? 0.72 : 1,
                side: THREE.DoubleSide,
              });
            });
            obj.material = Array.isArray(obj.material) ? next : next[0];
          });

          const box = new THREE.Box3().setFromObject(fbx);
          const size = box.getSize(new THREE.Vector3());
          const modelHeight = Math.max(size.y, 0.001);
          fbx.scale.setScalar(2.05 / modelHeight);
          fbx.updateWorldMatrix(true, true);

          const scaledBox = new THREE.Box3().setFromObject(fbx);
          const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
          fbx.position.set(-scaledCenter.x, -scaledBox.min.y, -scaledCenter.z);

          // Double buffer: add the ready model first, then remove the previous one.
          rigRef.current.add(fbx);
          const previous = modelRef.current;
          modelRef.current = fbx;
          if (previous && previous !== fbx) {
            rigRef.current.remove(previous);
            disposeAvatarMaterials(previous);
          }
        })
        .catch((err) => {
          // Keep the previous model visible on failure instead of flashing to black.
          console.warn(`Không tải được ${file}; giữ nguyên model Avatar đang hiển thị.`, err);
        });
    }, 260);

    return () => {
      cancelled = true;
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [file, quality]);

  return (
    <div className="absolute inset-0 z-40 bg-slate-950">
      <div ref={hostRef} className="absolute inset-0" />
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-2 pointer-events-none">
        <div className="rounded-2xl bg-black/45 border border-cyan-300/20 backdrop-blur px-3 py-2">
          <div className="font-black text-cyan-200 text-xs">👤 {title}</div>
          <div className="text-[10px] text-slate-300 mt-1">{description}</div>
        </div>
        <div className="rounded-full bg-amber-500/15 border border-amber-300/25 px-3 py-1 text-[10px] font-black text-amber-100">
          Chưa có xương rig
        </div>
      </div>

      <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-black/45 border border-white/10 backdrop-blur px-3 py-2 text-[10px] text-slate-200">
        Model FBX hiện tại không có Skeleton/Bone nên chỉ điều khiển <b>xoay/nghiêng toàn thân</b>.
        Muốn tay/chân bắt chước chính xác cần Auto Rig model trước.
      </div>
    </div>
  );
}
