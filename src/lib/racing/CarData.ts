/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CarConfig,
  CarModelId,
  CarCategory,
  CarStats,
  CarCustomization,
  CarUpgrades,
  PlayerRaceProfile,
  CharacterId,
} from '../../types';

export const CAR_CATALOG: CarConfig[] = [
  {
    id: 'roadster_883_3d',
    name: 'Roadster 883 Heritage',
    subTitle: 'Classic Performance Motorcycle',
    category: 'motorcycle',
    description:
      'Mẫu xe máy 3D chi tiết do người dùng cung cấp. Kích thước và camera được chuẩn hóa riêng cho xe hai bánh; điện thoại yếu dùng fallback nhẹ.',
    baseStats: {
      topSpeed: 86,
      acceleration: 91,
      handling: 88,
      drift: 70,
      nitro: 86,
      braking: 84,
    },
    unlockCostStars: 0,
    unlockCostDiamonds: 0,
    isUnlockedByDefault: true,
    defaultColor: '#20242b',
    specialAura: '🏍️ Roadster 883',
  },
  {
    id: 'vespa_studio_3d',
    name: 'Vespa Classic Studio',
    subTitle: 'Italian Retro Scooter',
    category: 'motorcycle',
    description:
      'Scooter cổ điển 3D với nhiều chi tiết vật liệu. Bản TV/PC dùng FBX thật; điện thoại dùng fallback để giữ khung hình ổn định.',
    baseStats: {
      topSpeed: 68,
      acceleration: 79,
      handling: 92,
      drift: 66,
      nitro: 73,
      braking: 91,
    },
    unlockCostStars: 0,
    unlockCostDiamonds: 0,
    isUnlockedByDefault: true,
    defaultColor: '#d9e8e6',
    specialAura: '🛵 Retro scooter',
  },
  {
    id: 'canis_mesa_3d',
    name: 'Canis Mesa Trail 4x4',
    subTitle: 'Off-Road Utility 4×4',
    category: 'suv_perf',
    description:
      'Mẫu 4x4 3D chi tiết do người dùng cung cấp. Bản PC/TV ưu tiên model FBX thật; điện thoại yếu tự chuyển sang mô hình nhẹ để giữ FPS.',
    baseStats: {
      topSpeed: 76,
      acceleration: 79,
      handling: 82,
      drift: 76,
      nitro: 80,
      braking: 85,
    },
    unlockCostStars: 0,
    unlockCostDiamonds: 0,
    isUnlockedByDefault: true,
    defaultColor: '#6b7a4a',
    specialAura: '🏜️ 4x4 địa hình thực tế',
  },
  {
    id: 'v12_sv_3d',
    name: 'V12 SV Strada',
    subTitle: 'V12 Performance Supercar',
    category: 'supercar',
    description:
      'Siêu xe V12 3D chi tiết do người dùng cung cấp. Chạy model thật trên PC/TV đủ mạnh và dùng fallback nhẹ khi thiết bị yếu.',
    baseStats: {
      topSpeed: 97,
      acceleration: 95,
      handling: 91,
      drift: 89,
      nitro: 96,
      braking: 94,
    },
    unlockCostStars: 0,
    unlockCostDiamonds: 0,
    isUnlockedByDefault: true,
    defaultColor: '#f2c300',
    specialAura: '⚡ V12 SV tốc độ cao',
  },

  {
    id: 's14_sport_3d',
    name: 'S14 Street Spec',
    subTitle: 'JDM Drift Coupe',
    category: 'jdm',
    description:
      'Mẫu coupe S14 do người dùng cung cấp. Đã xác minh hướng đầu +Z từ hình học thật; hierarchy SketchUp không có tên bánh an toàn nên bánh được giữ tĩnh thay vì quay sai.',
    baseStats: { topSpeed: 88, acceleration: 86, handling: 84, drift: 91, nitro: 85, braking: 83 },
    unlockCostStars: 0,
    unlockCostDiamonds: 0,
    isUnlockedByDefault: true,
    defaultColor: '#8b1018',
    specialAura: '🏁 S14 drift coupe',
  },
  {
    id: 'rescue_truck_hauler_3d',
    name: 'Rescue Hauler XT',
    subTitle: 'Heavy Rescue Truck & Trailer',
    category: 'suv_perf',
    description:
      'File “Ban tai” thực tế là xe tải cứu hộ/hauler kèm trailer nhiều trục. Model rất nặng nên FBX thật chỉ parse trên desktop; thiết bị khác dùng fallback để tránh đứng giao diện.',
    baseStats: { topSpeed: 60, acceleration: 52, handling: 48, drift: 35, nitro: 58, braking: 74 },
    unlockCostStars: 0,
    unlockCostDiamonds: 0,
    isUnlockedByDefault: true,
    defaultColor: '#f3f4f6',
    specialAura: '🚛 Heavy rescue hauler',
  },
  {
    id: 'xedap_city_3d',
    name: 'Urban City Bicycle',
    subTitle: 'Classic Commuter Bicycle',
    category: 'motorcycle',
    description:
      'Xe đạp 3D thật, đầu xe được xác minh theo -X. File không có rig và tên wheel group không đủ tin cậy, vì vậy giữ bánh tĩnh an toàn; desktop dùng FBX thật.',
    baseStats: { topSpeed: 42, acceleration: 66, handling: 95, drift: 45, nitro: 52, braking: 88 },
    unlockCostStars: 0,
    unlockCostDiamonds: 0,
    isUnlockedByDefault: true,
    defaultColor: '#d7924f',
    specialAura: '🚲 City ride',
  },
  {
    id: 'bara_gt',
    name: 'BARA GT',
    subTitle: 'Chiến Mã Capybara Huyền Thoại',
    category: 'mascot_special',
    description:
      'Siêu xe đặc quyền của Bara với động cơ bền bỉ, phong cách ấm áp, tăng tốc mượt mà và khả năng ôm cua cực chuẩn.',
    baseStats: {
      topSpeed: 82,
      acceleration: 85,
      handling: 88,
      drift: 80,
      nitro: 84,
      braking: 86,
    },
    unlockCostStars: 0,
    unlockCostDiamonds: 0,
    isUnlockedByDefault: true,
    defaultColor: '#c2884a',
    mascotOwner: 'bara',
    specialAura: '🌟 Hào quang Capybara thảnh thơi',
  },
  {
    id: 'ap_r1',
    name: 'AP-R1 TUNER',
    subTitle: 'JDM Street Racer',
    category: 'jdm',
    description:
      'Phong cách xe đua đường phố thể thao Nhật Bản. Thân xe khí động học nhẹ, chuyên gia ôm cua và drift khói lốp rực lửa.',
    baseStats: {
      topSpeed: 80,
      acceleration: 82,
      handling: 90,
      drift: 92,
      nitro: 78,
      braking: 85,
    },
    unlockCostStars: 15,
    unlockCostDiamonds: 5,
    isUnlockedByDefault: true,
    defaultColor: '#ef4444',
    specialAura: '🔥 Khói lốp Drift cuồng nhiệt',
  },
  {
    id: 'may_cloud_gt',
    name: 'MÂY CLOUD GT',
    subTitle: 'Cơn Lốc Bông Gòn Bồng Bềnh',
    category: 'mascot_special',
    description:
      'Thiết kế mềm mại như mây trắng trời xanh của bé Mây. Lướt êm ái trên mọi cung đường với hệ thống treo khí nén kỳ diệu.',
    baseStats: {
      topSpeed: 78,
      acceleration: 88,
      handling: 92,
      drift: 84,
      nitro: 86,
      braking: 90,
    },
    unlockCostStars: 20,
    unlockCostDiamonds: 8,
    isUnlockedByDefault: false,
    defaultColor: '#38bdf8',
    mascotOwner: 'may',
    specialAura: '☁️ Vệt mây mềm mại lướt gió',
  },
  {
    id: 'ap_gt',
    name: 'AP-GT EURO',
    subTitle: 'European Grand Tourer',
    category: 'euro_sport',
    description:
      'Đẳng cấp xe thể thao châu Âu sang trọng. Tốc độ ổn định trên đường trường với động cơ V8 gầm vang dũng mãnh.',
    baseStats: {
      topSpeed: 86,
      acceleration: 84,
      handling: 82,
      drift: 78,
      nitro: 85,
      braking: 88,
    },
    unlockCostStars: 30,
    unlockCostDiamonds: 12,
    isUnlockedByDefault: false,
    defaultColor: '#0ea5e9',
    specialAura: '⚡ Tia chớp Grand Tourer',
  },
  {
    id: 'bong_rabbit_r',
    name: 'BÔNG RABBIT R',
    subTitle: 'Thỏ Trắng Phóng Nhanh',
    category: 'mascot_special',
    description:
      'Chiếc xe siêu tốc đáng yêu của bé Bông với đôi tai thỏ lướt gió, gia tốc nhảy vọt thần kỳ sau mỗi khúc cua!',
    baseStats: {
      topSpeed: 84,
      acceleration: 94,
      handling: 86,
      drift: 82,
      nitro: 88,
      braking: 85,
    },
    unlockCostStars: 35,
    unlockCostDiamonds: 15,
    isUnlockedByDefault: false,
    defaultColor: '#f472b6',
    mascotOwner: 'bong',
    specialAura: '🐰 Bước nhảy thỏ siêu tốc',
  },
  {
    id: 'ap_x',
    name: 'AP-X SUPERCAR',
    subTitle: 'Quái Kiệt Đường Đua V-12',
    category: 'supercar',
    description:
      'Thiết kế gầm thấp cắt gió, cánh gió carbon và bộ khuếch tán sau uy lực. Một trong những cỗ máy tốc độ đỉnh cao.',
    baseStats: {
      topSpeed: 92,
      acceleration: 90,
      handling: 85,
      drift: 86,
      nitro: 90,
      braking: 88,
    },
    unlockCostStars: 50,
    unlockCostDiamonds: 20,
    isUnlockedByDefault: false,
    defaultColor: '#eab308',
    specialAura: '✨ Hào quang Siêu Xe Hoàng Kim',
  },
  {
    id: 'ap_e',
    name: 'AP-E CYBER',
    subTitle: 'Electric Lightning Performance',
    category: 'electric',
    description:
      'Động cơ 4 motor điện phản hồi tức thì trong chớp mắt. Khả năng bứt tốc 0-100 km/h không có đối thủ!',
    baseStats: {
      topSpeed: 89,
      acceleration: 98,
      handling: 91,
      drift: 83,
      nitro: 94,
      braking: 92,
    },
    unlockCostStars: 60,
    unlockCostDiamonds: 25,
    isUnlockedByDefault: false,
    defaultColor: '#10b981',
    specialAura: '⚡ Luồng điện Cyber Cyan',
  },
  {
    id: 'ap_hyper',
    name: 'AP-HYPER HYPERION',
    subTitle: 'Siêu Phẩm Hypercar Vượt Giới Hạn',
    category: 'hypercar',
    description:
      'Tuyệt tác công nghệ siêu xe với vận tốc tối đa khủng khiếp, cánh gió thích ứng chủ động và nitro tên lửa hai luồng.',
    baseStats: {
      topSpeed: 97,
      acceleration: 93,
      handling: 89,
      drift: 88,
      nitro: 96,
      braking: 93,
    },
    unlockCostStars: 80,
    unlockCostDiamonds: 35,
    isUnlockedByDefault: false,
    defaultColor: '#8b5cf6',
    specialAura: '🌌 Lốc xoáy Hyperion Tím',
  },
  {
    id: 'lumi_hyper',
    name: 'LUMI HYPER UNICORN',
    subTitle: 'Kỳ Lân Cầu Vồng Vũ Trụ',
    category: 'mascot_special',
    description:
      'Huyền thoại của bé Lumi! Vỏ xe ngọc trai ánh cầu vồng, sừng kỳ lân phát sáng và luồng Nitro 7 màu rực rỡ nhất vương quốc.',
    baseStats: {
      topSpeed: 100,
      acceleration: 99,
      handling: 97,
      drift: 95,
      nitro: 100,
      braking: 98,
    },
    unlockCostStars: 100,
    unlockCostDiamonds: 50,
    isUnlockedByDefault: false,
    defaultColor: '#ffffff',
    mascotOwner: 'lumi',
    specialAura: '🌈 Cầu Vồng Tinh Tú Đa Chiều',
  },
  {
    id: 'yellow_exotic_v12',
    name: 'EXOTIC V12 SUPERCAR',
    subTitle: 'Siêu Xe Hoàng Kim Ý V12',
    category: 'supercar',
    description:
      'Tuyệt tác đường đua màu vàng hoàng kim bóng bẩy, hốc hút gió khí động học sắc sảo và động cơ V12 gầm vang cuồng nhiệt.',
    baseStats: {
      topSpeed: 94,
      acceleration: 91,
      handling: 88,
      drift: 87,
      nitro: 92,
      braking: 89,
    },
    unlockCostStars: 40,
    unlockCostDiamonds: 15,
    isUnlockedByDefault: false,
    defaultColor: '#f59e0b',
    specialAura: '🌟 Hào quang Vàng Kim V12',
  },
  {
    id: 'ford_gt_stripes',
    name: 'FORD GT HERITAGE',
    subTitle: 'Huyền Thoại V8 Sọc Đua Mỹ',
    category: 'supercar',
    description:
      'Biểu tượng tốc độ bất tử với màu sơn vàng hai sọc đua đen chạy dọc thân, thân xe gầm thấp ôm sát mặt đường.',
    baseStats: {
      topSpeed: 95,
      acceleration: 89,
      handling: 86,
      drift: 89,
      nitro: 91,
      braking: 87,
    },
    unlockCostStars: 45,
    unlockCostDiamonds: 18,
    isUnlockedByDefault: false,
    defaultColor: '#eab308',
    specialAura: '🏁 Sọc Đua Huyền Thoại GT',
  },
  {
    id: 'amg_gt3_monster',
    name: 'AMG GT3 MONSTER',
    subTitle: 'Quái Vật Đường Đua Cam Đen',
    category: 'euro_sport',
    description:
      'Thân xe widebody cơ bắp, lưới tản nhiệt dọc dũng mãnh, cánh gió GT khổng lồ cùng pô xả bên hông đầy uy lực!',
    baseStats: {
      topSpeed: 93,
      acceleration: 92,
      handling: 94,
      drift: 90,
      nitro: 89,
      braking: 95,
    },
    unlockCostStars: 55,
    unlockCostDiamonds: 22,
    isUnlockedByDefault: false,
    defaultColor: '#f97316',
    specialAura: '🔥 Sức Mạnh Quái Vật AMG GT3',
  },
  {
    id: 'solus_hyper_proto',
    name: 'SOLUS HYPER-PROTO',
    subTitle: 'Phi Thuyền Tương Lai F1',
    category: 'hypercar',
    description:
      'Siêu phẩm Hypercar nguyên mẫu tương lai với màu trắng phối xanh ngọc, buồng lái kính phi thuyền kín và lực ép vòm khí tối đa.',
    baseStats: {
      topSpeed: 99,
      acceleration: 97,
      handling: 96,
      drift: 93,
      nitro: 98,
      braking: 96,
    },
    unlockCostStars: 75,
    unlockCostDiamonds: 30,
    isUnlockedByDefault: false,
    defaultColor: '#f8fafc',
    specialAura: '🌌 Khí Động Học Solus Tương Lai',
  },
  {
    id: 'miata_roadster',
    name: 'MIATA MX-5 ROADSTER',
    subTitle: 'Xe Thể Thao Mui Trần Bạc',
    category: 'sport',
    description:
      'Mui trần lãng mạn nhẹ nhàng, trọng lượng siêu nhẹ giúp bẻ lái cực nhạy và ôm cua góc hẹp mượt mà không đối thủ.',
    baseStats: {
      topSpeed: 81,
      acceleration: 87,
      handling: 96,
      drift: 94,
      nitro: 82,
      braking: 91,
    },
    unlockCostStars: 25,
    unlockCostDiamonds: 10,
    isUnlockedByDefault: false,
    defaultColor: '#94a3b8',
    specialAura: '🍃 Gió Mui Trần Lướt Phố',
  },
  {
    id: 'nissan_370z_tuner',
    name: 'NISSAN 370Z FAIRLADY',
    subTitle: 'JDM Street Coupe Vàng Sọc Capo',
    category: 'jdm',
    description:
      'Chiếc xe thể thao hai cửa kiêu hãnh của văn hóa JDM với động cơ V6 linh hoạt, nắp capo sơn sọc đen thể thao rực rỡ.',
    baseStats: {
      topSpeed: 85,
      acceleration: 86,
      handling: 91,
      drift: 95,
      nitro: 85,
      braking: 88,
    },
    unlockCostStars: 32,
    unlockCostDiamonds: 12,
    isUnlockedByDefault: false,
    defaultColor: '#eab308',
    specialAura: '🔰 Vệt Drift JDM Fairlady',
  },
];

export const PAINT_PALETTES = [
  { name: 'Đỏ Đua Sport', hex: '#ef4444' },
  { name: 'Xanh Neon Cyan', hex: '#06b6d4' },
  { name: 'Vàng Hoàng Kim', hex: '#eab308' },
  { name: 'Tím Thiên Hà (Galaxy)', hex: '#8b5cf6' },
  { name: 'Hồng Ngọc Trai (Pink Pearl)', hex: '#f472b6' },
  { name: 'Xanh Lá Mint', hex: '#10b981' },
  { name: 'Capybara Nâu Ấm', hex: '#c2884a' },
  { name: 'Trắng Ngọc Tuyết', hex: '#f8fafc' },
  { name: 'Đen Huyền Bí Phantom', hex: '#18181b' },
  { name: 'Cầu Vồng Pastel (Rainbow)', hex: '#a855f7' },
];

export const WHEEL_STYLES: { id: CarCustomization['wheelStyle']; name: string; icon: string }[] = [
  { id: 'sport', name: '5-Chấu Thể Thao', icon: '🛞' },
  { id: 'star', name: 'Ngôi Sao Đua', icon: '⭐' },
  { id: 'aero', name: 'Aero Khí Động Học', icon: '🌀' },
  { id: 'gold_chrome', name: 'Mạ Vàng Chrome', icon: '✨' },
];

export const SPOILER_STYLES: { id: CarCustomization['spoilerStyle']; name: string }[] = [
  { id: 'stock', name: 'Tiêu chuẩn (Stock)' },
  { id: 'sport_wing', name: 'Cánh gió Sport' },
  { id: 'gt_wing', name: 'Cánh gió Đua GT' },
  { id: 'neon_wing', name: 'Cánh gió Neon LED' },
];

export const NEON_UNDERGLOW_OPTIONS: { id: CarCustomization['neonUnderglow']; name: string; color: string }[] = [
  { id: 'none', name: 'Tắt đèn gầm', color: 'transparent' },
  { id: 'cyan', name: 'Cyan Băng Giá', color: '#06b6d4' },
  { id: 'purple', name: 'Tím Neon Cyber', color: '#a855f7' },
  { id: 'pink', name: 'Hồng Kẹo Ngọt', color: '#f43f5e' },
  { id: 'lime', name: 'Xanh Lime Năng Động', color: '#84cc16' },
  { id: 'gold', name: 'Vàng Ánh Kim', color: '#eab308' },
  { id: 'rainbow', name: 'Cầu Vồng Lấp Lánh', color: '#ec4899' },
];

export const DEFAULT_CUSTOMIZATION: CarCustomization = {
  paintColor: '#ef4444',
  paintFinish: 'metallic',
  wheelStyle: 'sport',
  wheelColor: '#1e293b',
  spoilerStyle: 'sport_wing',
  neonUnderglow: 'cyan',
  windowTint: 'smoke',
  decal: 'stripes',
};

export const DEFAULT_UPGRADES: CarUpgrades = {
  engine: 1,
  acceleration: 1,
  handling: 1,
  nitro: 1,
  brakes: 1,
};

const RACING_SAVE_KEY = 'bara_speed_racing_profile_v1';

export function getInitialRaceProfile(): PlayerRaceProfile {
  return {
    unlockedCars: ['bara_gt', 'ap_r1', 'canis_mesa_3d', 'v12_sv_3d', 'roadster_883_3d', 'vespa_studio_3d', 's14_sport_3d', 'rescue_truck_hauler_3d', 'xedap_city_3d'],
    selectedCarId: 'bara_gt',
    carCustomizations: {
      bara_gt: {
        ...DEFAULT_CUSTOMIZATION,
        paintColor: '#c2884a',
        neonUnderglow: 'gold',
      },
      ap_r1: {
        ...DEFAULT_CUSTOMIZATION,
        paintColor: '#ef4444',
        neonUnderglow: 'cyan',
      },
    },
    carUpgrades: {
      bara_gt: { ...DEFAULT_UPGRADES },
      ap_r1: { ...DEFAULT_UPGRADES },
    },
    unlockedTracks: ['neon_city', 'coastal_highway', 'mountain_pass'],
    bestLapTimes: {},
    careerProgress: 0,
    totalDriftScore: 0,
    totalNitroUsed: 0,
    racesWon: 0,
  };
}

export function loadRaceProfile(): PlayerRaceProfile {
  try {
    const raw = localStorage.getItem(RACING_SAVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const initial = getInitialRaceProfile();
      const mergedUnlockedCars = Array.from(new Set([
        ...(initial.unlockedCars || []),
        ...(parsed.unlockedCars || []),
        'canis_mesa_3d',
        'v12_sv_3d',
        'roadster_883_3d',
        'vespa_studio_3d',
        's14_sport_3d',
        'rescue_truck_hauler_3d',
        'xedap_city_3d',
      ])) as CarModelId[];
      return {
        ...initial,
        ...parsed,
        unlockedCars: mergedUnlockedCars,
        carCustomizations: { ...initial.carCustomizations, ...(parsed.carCustomizations || {}) },
        carUpgrades: { ...initial.carUpgrades, ...(parsed.carUpgrades || {}) },
        bestLapTimes: { ...initial.bestLapTimes, ...(parsed.bestLapTimes || {}) },
      };
    }
  } catch (e) {
    // Fallback
  }
  return getInitialRaceProfile();
}

export function saveRaceProfile(profile: PlayerRaceProfile) {
  try {
    localStorage.setItem(RACING_SAVE_KEY, JSON.stringify(profile));
  } catch (e) {}
}

export function calculateUpgradedStats(car: CarConfig, upgrades?: CarUpgrades): CarStats {
  const up = upgrades || DEFAULT_UPGRADES;
  const statBoost = (level: number) => (level - 1) * 3.5;

  return {
    topSpeed: Math.min(100, Math.round(car.baseStats.topSpeed + statBoost(up.engine))),
    acceleration: Math.min(100, Math.round(car.baseStats.acceleration + statBoost(up.acceleration))),
    handling: Math.min(100, Math.round(car.baseStats.handling + statBoost(up.handling))),
    drift: Math.min(100, Math.round(car.baseStats.drift + statBoost(up.handling) * 0.5)),
    nitro: Math.min(100, Math.round(car.baseStats.nitro + statBoost(up.nitro))),
    braking: Math.min(100, Math.round(car.baseStats.braking + statBoost(up.brakes))),
  };
}
