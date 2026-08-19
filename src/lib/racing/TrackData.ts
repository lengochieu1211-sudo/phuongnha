/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RacingTrackConfig, RacingTrackId } from '../../types';

export interface Waypoint3D {
  x: number;
  y: number;
  z: number;
  width: number;
  speedLimit?: number;
  isCheckpoint?: boolean;
  tunnel?: boolean;
  bankAngle?: number; // tilt on high speed corners
}

export const TRACK_CATALOG: RacingTrackConfig[] = [
  {
    id: 'neon_city',
    name: 'NEON CYBER METROPOLIS',
    subtitle: 'Đường Đua Thành Phố Ánh Đèn Đêm',
    description:
      'Đại lộ tương lai ngập tràn bảng hiệu hologram neon rực rỡ, đường hầm ánh sáng và mặt đường ướt phản chiếu lung linh.',
    difficulty: 'easy',
    lapsCount: 3,
    lengthMeters: 2400,
    themeColor: '#a855f7',
    accentColor: '#06b6d4',
    bgGradient: 'from-slate-950 via-purple-950 to-indigo-950',
    unlockStars: 0,
    environmentType: 'city_night',
    icon: '🌃',
  },
  {
    id: 'coastal_highway',
    name: 'COASTAL SUNSET HIGHWAY',
    subtitle: 'Cung Đường Ven Biển Hoàng Hôn',
    description:
      'Lướt gió dọc bãi biển nhiệt đới với hàng dừa đung đưa, cầu treo vượt biển ngoạn mục và ánh hoàng hôn ấm áp.',
    difficulty: 'easy',
    lapsCount: 3,
    lengthMeters: 2800,
    themeColor: '#f97316',
    accentColor: '#38bdf8',
    bgGradient: 'from-amber-900 via-rose-900 to-indigo-950',
    unlockStars: 10,
    environmentType: 'sunset_coast',
    icon: '🌅',
  },
  {
    id: 'mountain_pass',
    name: 'CHERRY MOUNTAIN PASS',
    subtitle: 'Đèo Núi Hoa Anh Đào Uốn Lượn',
    description:
      'Thử thách kỹ năng Drift ôm cua tay áo liên tục giữa rừng hoa anh đào và đỉnh núi phủ mây trắng hùng vĩ.',
    difficulty: 'normal',
    lapsCount: 2,
    lengthMeters: 3200,
    themeColor: '#ec4899',
    accentColor: '#10b981',
    bgGradient: 'from-slate-900 via-pink-950 to-emerald-950',
    unlockStars: 25,
    environmentType: 'mountain',
    icon: '🌸',
  },
  {
    id: 'candy_city',
    name: 'SWEET CANDY KINGDOM',
    subtitle: 'Thành Phố Kẹo Ngọt Phương Nhã',
    description:
      'Đường đua thần tiên với cầu kẹo mút cầu vồng 🍭, đồi bánh kem dâu tây 🍰 và sông sữa socola ngọt ngào.',
    difficulty: 'easy',
    lapsCount: 3,
    lengthMeters: 2200,
    themeColor: '#f43f5e',
    accentColor: '#fde047',
    bgGradient: 'from-pink-900 via-rose-800 to-amber-950',
    unlockStars: 40,
    environmentType: 'candy',
    icon: '🍭',
  },
  {
    id: 'sky_road',
    name: 'SKY RAINBOW CASTLE',
    subtitle: 'Đường Đua Cầu Vồng Trên Mây',
    description:
      'Cung đường bay bổng giữa những đám mây bồng bềnh, lâu đài thiên thần và các vòm sao lấp lánh kỳ diệu.',
    difficulty: 'normal',
    lapsCount: 3,
    lengthMeters: 2600,
    themeColor: '#38bdf8',
    accentColor: '#c084fc',
    bgGradient: 'from-sky-950 via-indigo-950 to-purple-950',
    unlockStars: 60,
    environmentType: 'sky_clouds',
    icon: '☁️',
  },
  {
    id: 'space_race',
    name: 'COSMIC GALAXY HYPERDRIVE',
    subtitle: 'Đường Đua Vũ Trụ Siêu Tốc',
    description:
      'Chinh phục dải ngân hà với cổng dịch chuyển ánh sáng, các tiểu hành tinh trôi nổi và vành đai sao Thổ huyền bí.',
    difficulty: 'hard',
    lapsCount: 3,
    lengthMeters: 3600,
    themeColor: '#6366f1',
    accentColor: '#e11d48',
    bgGradient: 'from-black via-slate-950 to-purple-950',
    unlockStars: 80,
    environmentType: 'cosmic_space',
    icon: '🚀',
  },
];

/**
 * Generate closed-loop 3D track waypoints with smooth curves
 */
export function generateTrackWaypoints(trackId: RacingTrackId): Waypoint3D[] {
  const points: Waypoint3D[] = [];
  const count = 72; // Detailed sample nodes for smooth interpolation

  switch (trackId) {
    case 'neon_city': {
      // High-speed city circuit with 2 long straights, 2 high-speed chicanes, and 1 tunnel section
      const rX = 280;
      const rZ = 420;
      for (let i = 0; i < count; i++) {
        const t = (i / count) * Math.PI * 2;
        // Modified stadium oval with chicanes
        let x = Math.sin(t) * rX + Math.sin(t * 3) * 35;
        let z = Math.cos(t) * rZ + Math.sin(t * 2) * 45;
        let y = Math.sin(t * 2) * 8; // gentle overpass rise
        let tunnel = (i >= 22 && i <= 36); // Cyber Tunnel section
        if (tunnel) y -= 12; // Underground dip
        let isCheckpoint = i % 18 === 0;

        points.push({
          x,
          y,
          z,
          width: tunnel ? 20 : 24,
          isCheckpoint,
          tunnel,
          bankAngle: Math.sin(t * 3) * 0.12,
        });
      }
      break;
    }

    case 'coastal_highway': {
      // Scenic coastal loop with a cliff curve and ocean bridge
      for (let i = 0; i < count; i++) {
        const t = (i / count) * Math.PI * 2;
        let x = Math.sin(t) * 320 + Math.cos(t * 2) * 60;
        let z = Math.cos(t) * 380 + Math.sin(t * 3) * 30;
        let y = Math.sin(t) * 15 + Math.cos(t * 2) * 10; // cliff hill elevation
        let isCheckpoint = i % 18 === 0;

        points.push({
          x,
          y,
          z,
          width: 24,
          isCheckpoint,
          bankAngle: Math.cos(t * 2) * 0.15,
        });
      }
      break;
    }

    case 'mountain_pass': {
      // Mountain drift pass with multiple hairpin turns (S-curves)
      for (let i = 0; i < count; i++) {
        const t = (i / count) * Math.PI * 2;
        let x = Math.sin(t) * 260 + Math.sin(t * 5) * 80;
        let z = Math.cos(t) * 340 + Math.cos(t * 4) * 60;
        let y = Math.sin(t * 3) * 24; // High mountain climb and descent
        let isCheckpoint = i % 12 === 0;

        points.push({
          x,
          y,
          z,
          width: 22,
          isCheckpoint,
          bankAngle: Math.sin(t * 5) * 0.2, // dynamic camber banking for drifting
        });
      }
      break;
    }

    case 'candy_city': {
      // Sweet rolling candy hills and soft loops
      for (let i = 0; i < count; i++) {
        const t = (i / count) * Math.PI * 2;
        let x = Math.sin(t) * 240 + Math.sin(t * 3) * 40;
        let z = Math.cos(t) * 300 + Math.cos(t * 2) * 35;
        let y = Math.sin(t * 4) * 12; // undulating roller-coaster humps
        let isCheckpoint = i % 18 === 0;

        points.push({
          x,
          y,
          z,
          width: 26,
          isCheckpoint,
          bankAngle: Math.sin(t * 3) * 0.1,
        });
      }
      break;
    }

    case 'sky_road': {
      // Floating celestial road in the sky
      for (let i = 0; i < count; i++) {
        const t = (i / count) * Math.PI * 2;
        let x = Math.sin(t) * 300 + Math.cos(t * 3) * 50;
        let z = Math.cos(t) * 360 + Math.sin(t * 2) * 60;
        let y = 40 + Math.sin(t * 2) * 18; // elevated high altitude
        let isCheckpoint = i % 18 === 0;

        points.push({
          x,
          y,
          z,
          width: 26,
          isCheckpoint,
          bankAngle: Math.sin(t * 2) * 0.14,
        });
      }
      break;
    }

    case 'space_race': {
      // Cosmic zero-gravity hyperloop with corkscrews and energy arches
      for (let i = 0; i < count; i++) {
        const t = (i / count) * Math.PI * 2;
        let x = Math.sin(t) * 340 + Math.sin(t * 4) * 70;
        let z = Math.cos(t) * 420 + Math.cos(t * 3) * 80;
        let y = 60 + Math.sin(t * 3) * 30;
        let isCheckpoint = i % 18 === 0;
        let tunnel = (i >= 15 && i <= 28) || (i >= 50 && i <= 62);

        points.push({
          x,
          y,
          z,
          width: 28,
          isCheckpoint,
          tunnel,
          bankAngle: Math.sin(t * 4) * 0.25,
        });
      }
      break;
    }
  }

  return points;
}

/**
 * Spline interpolation helper for smooth path following
 */
export function getInterpolatedTrackPoint(
  waypoints: Waypoint3D[],
  progressNormalized: number // 0.0 to 1.0
): {
  pos: { x: number; y: number; z: number };
  tangent: { x: number; y: number; z: number };
  normal: { x: number; y: number; z: number };
  width: number;
  bankAngle: number;
  isTunnel: boolean;
} {
  const n = waypoints.length;
  if (n === 0) {
    return {
      pos: { x: 0, y: 0, z: 0 },
      tangent: { x: 0, y: 0, z: 1 },
      normal: { x: 1, y: 0, z: 0 },
      width: 24,
      bankAngle: 0,
      isTunnel: false,
    };
  }

  const p = ((progressNormalized % 1.0) + 1.0) % 1.0;
  const floatIdx = p * n;
  const idx0 = Math.floor(floatIdx) % n;
  const idx1 = (idx0 + 1) % n;
  const t = floatIdx - Math.floor(floatIdx);

  // Smooth Hermite / Catmull-Rom interpolation
  const idxPrev = (idx0 - 1 + n) % n;
  const idxNext = (idx1 + 1) % n;

  const pPrev = waypoints[idxPrev];
  const p0 = waypoints[idx0];
  const p1 = waypoints[idx1];
  const pNext = waypoints[idxNext];

  // Position
  const x = catmullRom(pPrev.x, p0.x, p1.x, pNext.x, t);
  const y = catmullRom(pPrev.y, p0.y, p1.y, pNext.y, t);
  const z = catmullRom(pPrev.z, p0.z, p1.z, pNext.z, t);

  // Derivative for forward tangent vector
  const dt = 0.01;
  const nextT = Math.min(1.0, t + dt);
  const nx = catmullRom(pPrev.x, p0.x, p1.x, pNext.x, nextT);
  const ny = catmullRom(pPrev.y, p0.y, p1.y, pNext.y, nextT);
  const nz = catmullRom(pPrev.z, p0.z, p1.z, pNext.z, nextT);

  let dx = nx - x;
  let dy = ny - y;
  let dz = nz - z;
  const len = Math.hypot(dx, dy, dz) || 1;
  dx /= len;
  dy /= len;
  dz /= len;

  // Horizontal normal perpendicular to tangent (XZ plane)
  const normX = -dz;
  const normY = 0;
  const normZ = dx;

  const width = p0.width * (1 - t) + p1.width * t;
  const bankAngle = (p0.bankAngle || 0) * (1 - t) + (p1.bankAngle || 0) * t;
  const isTunnel = !!(p0.tunnel || p1.tunnel);

  return {
    pos: { x, y, z },
    tangent: { x: dx, y: dy, z: dz },
    normal: { x: normX, y: normY, z: normZ },
    width,
    bankAngle,
    isTunnel,
  };
}

function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const v0 = (p2 - p0) * 0.5;
  const v1 = (p3 - p1) * 0.5;
  const t2 = t * t;
  const t3 = t * t2;
  return (2 * p1 - 2 * p2 + v0 + v1) * t3 + (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 + v0 * t + p1;
}
