import * as THREE from 'three';

export type GraphicsQuality = 'lite' | 'balanced' | 'high';
export type DeviceClass = 'phone' | 'tablet' | 'tv' | 'desktop';
export type RacingQualitySetting = 'auto' | 'low' | 'medium' | 'high';

export interface GraphicsProfile {
  quality: GraphicsQuality;
  deviceClass: DeviceClass;
  pixelRatioCap: number;
  pixelRatioFloor: number;
  shadows: boolean;
  shadowMapSize: number;
  sceneryDensity: number;
  textureSize: number;
  carDetail: 'lite' | 'high' | 'ultra';
  aiCarDetail: 'lite' | 'high';
  targetFps: number;
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

export function detectDeviceClass(): DeviceClass {
  const ua = navigator.userAgent.toLowerCase();
  const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  const forcedTv = typeof location !== 'undefined' && new URLSearchParams(location.search).get('tv') === '1';
  const tv = forcedTv || /android tv|google ?tv|smart-?tv|smarttv|mibox|mi box|aft[a-z0-9]*|fire tv|bravia|viera|netcast|web0s|webos|hbbtv|crkey|shield android tv/.test(ua);
  if (tv) return 'tv';

  const mobileUa = /android|iphone|ipod|mobile/.test(ua);
  const tabletUa = /ipad|tablet/.test(ua) || (/android/.test(ua) && !/mobile/.test(ua));
  if (tabletUa) return 'tablet';
  if (mobileUa || coarse) return 'phone';
  return 'desktop';
}

function phoneProfile(label = '📱 Điện thoại') : GraphicsProfile {
  return {
    quality: 'lite', deviceClass: 'phone', pixelRatioCap: 1.15, pixelRatioFloor: 0.78,
    shadows: false, shadowMapSize: 512, sceneryDensity: 0.46, textureSize: 256,
    // Keep the PLAYER car detailed; save GPU on resolution, shadows and scenery instead.
    carDetail: 'high', aiCarDetail: 'lite', targetFps: 48, label,
  };
}

function tvProfile(label = '📺 TV / Mi Box') : GraphicsProfile {
  return {
    quality: 'balanced', deviceClass: 'tv', pixelRatioCap: 1.20, pixelRatioFloor: 0.78,
    shadows: false, shadowMapSize: 768, sceneryDensity: 0.70, textureSize: 512,
    carDetail: 'high', aiCarDetail: 'lite', targetFps: 50, label,
  };
}

function desktopBalancedProfile(label = '⚙️ PC cân bằng') : GraphicsProfile {
  return {
    quality: 'balanced', deviceClass: 'desktop', pixelRatioCap: 1.38, pixelRatioFloor: 0.90,
    shadows: true, shadowMapSize: 1024, sceneryDensity: 0.90, textureSize: 512,
    carDetail: 'high', aiCarDetail: 'lite', targetFps: 58, label,
  };
}

function desktopHighProfile(label = '🖥️ PC đẹp') : GraphicsProfile {
  return {
    // 1.60 DPR + 1536 shadow map looks almost identical in motion to the old
    // 1.75/2048 preset but avoids a large first-frame GPU allocation spike.
    quality: 'high', deviceClass: 'desktop', pixelRatioCap: 1.60, pixelRatioFloor: 0.95,
    shadows: true, shadowMapSize: 1536, sceneryDensity: 1.10, textureSize: 1024,
    carDetail: 'ultra', aiCarDetail: 'high', targetFps: 60, label,
  };
}

export function detectGraphicsProfile(): GraphicsProfile {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const memoryKnown = typeof nav.deviceMemory === 'number';
  const memory = nav.deviceMemory || 4;
  const cores = nav.hardwareConcurrency || 4;
  const shortLandscape = innerWidth > innerHeight && innerHeight < 520;
  const { maxTexture } = getGlCaps();
  const deviceClass = detectDeviceClass();

  if (deviceClass === 'tv') {
    return tvProfile('Tự động · 📺 TV');
  }

  if (deviceClass === 'phone') {
    // Strong phones get a little more resolution, but still avoid expensive realtime shadows.
    const p = phoneProfile('Tự động · 📱 Điện thoại');
    if (memory >= 6 && cores >= 8 && maxTexture >= 4096 && !shortLandscape) {
      p.quality = 'balanced';
      p.pixelRatioCap = 1.35;
      p.sceneryDensity = 0.62;
      p.textureSize = 512;
      p.targetFps = 50;
      p.label = 'Tự động · 📱 Điện thoại mạnh';
    }
    return p;
  }

  if (deviceClass === 'tablet') {
    const p = tvProfile('Tự động · 📱 Máy tính bảng');
    p.deviceClass = 'tablet';
    p.pixelRatioCap = 1.35;
    p.sceneryDensity = 0.76;
    return p;
  }

  if ((memory >= 8 || !memoryKnown) && cores >= 8 && maxTexture >= 8192) {
    return desktopHighProfile('Tự động · 🖥️ PC mạnh');
  }
  return desktopBalancedProfile('Tự động · 💻 PC');
}

/**
 * Race UI uses: low = Điện thoại, medium = TV, high = PC đẹp.
 * Auto detects the actual device. Runtime FPS protection can still reduce pixel ratio/shadows.
 */
export function resolveRacingGraphicsProfile(setting: RacingQualitySetting = 'auto'): GraphicsProfile {
  if (setting === 'low') return phoneProfile();
  if (setting === 'medium') return tvProfile();
  if (setting === 'high') return desktopHighProfile();
  return detectGraphicsProfile();
}

export function createAsphaltTexture(size: number): THREE.Texture | null {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = '#24272b';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < size * 4; i++) {
    const v = 34 + Math.floor(Math.random() * 42);
    ctx.fillStyle = `rgba(${v},${v},${v},${0.10 + Math.random() * 0.20})`;
    const r = 0.4 + Math.random() * 1.7;
    ctx.fillRect(Math.random() * size, Math.random() * size, r, r);
  }
  // Fine tire wear and aggregate streaks make the surface less like a flat neon plane.
  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = '#050505';
  for (let i = 0; i < 12; i++) {
    ctx.beginPath();
    ctx.moveTo(size * (0.25 + Math.random() * 0.12), 0);
    ctx.lineTo(size * (0.25 + Math.random() * 0.12), size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(size * (0.63 + Math.random() * 0.12), 0);
    ctx.lineTo(size * (0.63 + Math.random() * 0.12), size);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 30);
  tex.colorSpace = THREE.SRGBColorSpace;

  if (size >= 1024) {
    new THREE.TextureLoader().load(
      `${((import.meta as any).env?.BASE_URL || '/')}assets/pc-hd/asphalt-hd.webp`,
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
