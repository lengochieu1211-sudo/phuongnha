import * as THREE from 'three';

export type GraphicsQuality = 'lite' | 'balanced' | 'high';

export interface GraphicsProfile {
  quality: GraphicsQuality;
  pixelRatioCap: number;
  shadows: boolean;
  shadowMapSize: number;
  sceneryDensity: number;
  textureSize: number;
  carDetail: 'lite' | 'high';
  label: string;
}

function getGlCaps() {
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl2') || canvas.getContext('webgl')) as WebGLRenderingContext | null;
    return gl ? { maxTexture: Number(gl.getParameter(gl.MAX_TEXTURE_SIZE)) || 4096 } : { maxTexture: 2048 };
  } catch {
    return { maxTexture: 2048 };
  }
}

export function detectGraphicsProfile(): GraphicsProfile {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const memoryKnown = typeof nav.deviceMemory === 'number';
  const memory = nav.deviceMemory || 4;
  const cores = nav.hardwareConcurrency || 4;
  const ua = navigator.userAgent.toLowerCase();
  const mobile = /android|iphone|ipad|ipod|mobile/.test(ua) || matchMedia('(pointer: coarse)').matches;
  const shortLandscape = innerWidth > innerHeight && innerHeight < 520;
  const { maxTexture } = getGlCaps();

  // Phones/tablets with limited memory are deliberately conservative.
  if ((mobile && (memory <= 4 || cores <= 6 || shortLandscape)) || maxTexture < 4096) {
    return { quality: 'lite', pixelRatioCap: 1.25, shadows: false, shadowMapSize: 512, sceneryDensity: 0.55, textureSize: 256, carDetail: 'lite', label: 'Nhẹ' };
  }

  // Desktop/laptop with enough memory + CPU/GPU caps receives the richer model/material path.
  if (!mobile && (memory >= 8 || !memoryKnown) && cores >= 8 && maxTexture >= 8192) {
    return { quality: 'high', pixelRatioCap: 2, shadows: true, shadowMapSize: 2048, sceneryDensity: 1.35, textureSize: 1024, carDetail: 'high', label: '3D cao' };
  }

  // Balanced desktops and strong tablets still receive the realistic car mesh;
  // the expensive part (resolution, shadow size, scenery density) remains reduced.
  return { quality: 'balanced', pixelRatioCap: 1.6, shadows: true, shadowMapSize: 1024, sceneryDensity: 0.85, textureSize: 512, carDetail: mobile ? 'lite' : 'high', label: 'Cân bằng' };
}

export function createAsphaltTexture(size: number): THREE.Texture | null {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = '#202631';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < size * 4; i++) {
    const v = 42 + Math.floor(Math.random() * 34);
    ctx.fillStyle = `rgba(${v},${v},${v},${0.12 + Math.random() * 0.2})`;
    const r = 0.4 + Math.random() * 1.7;
    ctx.fillRect(Math.random() * size, Math.random() * size, r, r);
  }

  // Always start with a valid offline procedural texture. On High, replace its
  // image asynchronously when the HD asset succeeds; if loading fails the
  // procedural image remains valid instead of leaving an empty texture.
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 30);
  tex.colorSpace = THREE.SRGBColorSpace;

  if (size >= 1024) {
    new THREE.TextureLoader().load(
      `${((import.meta as any).env?.BASE_URL || "/")}assets/pc-hd/asphalt-hd.webp`,
      (hd) => {
        tex.image = hd.image;
        tex.anisotropy = 8;
        tex.needsUpdate = true;
        hd.dispose();
      },
      undefined,
      () => { /* keep procedural fallback */ },
    );
  }

  return tex;
}
