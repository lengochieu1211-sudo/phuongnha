/**
 * V5.9 - Loads a real user-provided FBX mannequin.
 * The supplied ng1.fbx has no skeleton/skin/animation, so the whole model follows torso orientation only.
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
  const targetYawRef = useRef(0);
  const targetRollRef = useRef(0);

  targetYawRef.current = THREE.MathUtils.clamp(yaw, -0.9, 0.9);
  targetRollRef.current = THREE.MathUtils.clamp(roll, -0.35, 0.35);

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
    if (quality === 'pc') {
      key.shadow.mapSize.set(1024, 1024);
    }
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

    const manager = new THREE.LoadingManager();
    manager.setURLModifier((url) => {
      if (/\.(png|jpe?g|bmp|tga|gif|webp)(\?.*)?$/i.test(url)) return WHITE_PIXEL;
      return url;
    });

    const loader = new FBXLoader(manager);
    const base = ((import.meta as any).env?.BASE_URL || '/');
    let disposed = false;

    loader.load(
      `${base}${file}`,
      (fbx) => {
        if (disposed) return;

        // Preserve diffuse colors from the FBX even when the external JPG textures are missing.
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
        const center = box.getCenter(new THREE.Vector3());
        const modelHeight = Math.max(size.y, 0.001);
        const scale = 2.05 / modelHeight;

        fbx.scale.setScalar(scale);
        fbx.updateWorldMatrix(true, true);

        const scaledBox = new THREE.Box3().setFromObject(fbx);
        const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
        fbx.position.set(-scaledCenter.x, -scaledBox.min.y, -scaledCenter.z);

        mannequinRoot.add(fbx);
      },
      undefined,
      (err) => console.warn(`Không tải được ${file}, giữ Avatar 2.5D làm fallback.`, err),
    );

    let raf = 0;
    let prev = performance.now();
    const animate = (now: number) => {
      raf = requestAnimationFrame(animate);
      const dt = Math.min(0.05, Math.max(0, (now - prev) / 1000));
      prev = now;

      if (rigRef.current) {
        // Whole-body retarget only. ng1.fbx has no bones, so limbs cannot bend individually.
        const wantedY = targetYawRef.current * 0.9;
        const wantedZ = targetRollRef.current * 0.55;
        rigRef.current.rotation.y += (wantedY - rigRef.current.rotation.y) * Math.min(1, dt * 7.5);
        rigRef.current.rotation.z += (wantedZ - rigRef.current.rotation.z) * Math.min(1, dt * 6.5);
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
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      rigRef.current = null;

      scene.traverse((obj: any) => {
        obj.geometry?.dispose?.();
        const mats = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [];
        mats.forEach((m: any) => m.dispose?.());
      });

      renderer.dispose();
      if (renderer.domElement.parentElement === host) host.removeChild(renderer.domElement);
    };
  }, [quality, file]);

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
