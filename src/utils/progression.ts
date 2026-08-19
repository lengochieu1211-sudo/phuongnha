/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlayerProgress, Achievement, SkinItem, WorldConfig } from '../types';

const PROGRESS_KEY = 'phuong_nha_adventure_progress';

export const WORLDS: WorldConfig[] = [
  {
    id: 'magical_forest',
    name: 'Khu rừng phép thuật',
    description: 'Vượt qua rừng cây, bắt bướm rực rỡ và nhặt các ngôi sao lấp lánh!',
    themeColor: '#4CAF50',
    textColor: 'text-emerald-700',
    bgGradient: 'from-emerald-100 to-green-200',
    accentColor: 'bg-emerald-500',
    minStarsToUnlock: 0,
    speed: 3,
    bgElement: 'trees',
  },
  {
    id: 'flower_garden',
    name: 'Vườn hoa rực rỡ',
    description: 'Hái những đóa hoa thơm ngát và giải cứu những chú ong bé nhỏ!',
    themeColor: '#FF69B4',
    textColor: 'text-pink-600',
    bgGradient: 'from-pink-50 to-rose-100',
    accentColor: 'bg-pink-500',
    minStarsToUnlock: 15,
    speed: 3.5,
    bgElement: 'flowers',
  },
  {
    id: 'candy_city',
    name: 'Thành phố kẹo ngọt',
    description: 'Thế giới bánh ngọt và kẹo dẻo khổng lồ! Hãy né những viên kẹo cứng nhé.',
    themeColor: '#FF9800',
    textColor: 'text-orange-700',
    bgGradient: 'from-orange-50 to-amber-100',
    accentColor: 'bg-orange-500',
    minStarsToUnlock: 45,
    speed: 4,
    bgElement: 'candies',
  },
  {
    id: 'undersea',
    name: 'Thế giới dưới biển',
    description: 'Bơi lặn cùng đàn cá nhiều màu sắc, mở rương báu dưới đáy đại dương.',
    themeColor: '#2196F3',
    textColor: 'text-blue-700',
    bgGradient: 'from-sky-100 to-blue-200',
    accentColor: 'bg-blue-500',
    minStarsToUnlock: 80,
    speed: 3.5,
    bgElement: 'corals',
  },
  {
    id: 'space',
    name: 'Vũ trụ diệu kỳ',
    description: 'Nhảy trên các hành tinh xa xôi và thu thập tinh vân lấp lánh!',
    themeColor: '#9C27B0',
    textColor: 'text-purple-700',
    bgGradient: 'from-purple-100 to-indigo-200',
    accentColor: 'bg-purple-600',
    minStarsToUnlock: 120,
    speed: 4.5,
    bgElement: 'planets',
  },
  {
    id: 'cloud_castle',
    name: 'Lâu đài trên mây',
    description: 'Đặt chân lên vùng đất thiên đường của những đám mây ngũ sắc rực rỡ.',
    themeColor: '#00BCD4',
    textColor: 'text-cyan-700',
    bgGradient: 'from-cyan-50 to-sky-100',
    accentColor: 'bg-cyan-500',
    minStarsToUnlock: 180,
    speed: 5,
    bgElement: 'clouds',
  },
];

export const SKINS: SkinItem[] = [
  { id: 'default', name: 'Đầm Hồng Pastel', type: 'skin', cost: 0, color: '#FFB6C1', badge: 'Mặc định', previewSvg: 'pink_dress' },
  { id: 'bunny_ears', name: 'Tai thỏ ngộ nghĩnh', type: 'accessory', cost: 10, color: '#FFFFFF', badge: 'Phụ kiện', previewSvg: 'bunny_ears' },
  { id: 'fairy_wings', name: 'Cánh tiên lấp lánh', type: 'accessory', cost: 25, color: '#E0FFFF', badge: 'Phụ kiện', previewSvg: 'fairy_wings' },
  { id: 'blue_princess', name: 'Váy công chúa xanh', type: 'skin', cost: 40, color: '#ADD8E6', badge: 'Váy mới', previewSvg: 'blue_dress' },
  { id: 'yellow_hat', name: 'Nón cói đi biển', type: 'accessory', cost: 15, color: '#F0E68C', badge: 'Mũ', previewSvg: 'straw_hat' },
  { id: 'candy_dress', name: 'Đầm kẹo sắc màu', type: 'skin', cost: 60, color: '#FF69B4', badge: 'Hiếm', previewSvg: 'candy_dress' },
  { id: 'magic_wand', name: 'Đũa phép ngôi sao', type: 'accessory', cost: 30, color: '#FFF700', badge: 'Cầm tay', previewSvg: 'magic_wand' },
  { id: 'angel_halo', name: 'Vòng hào quang', type: 'accessory', cost: 50, color: '#FFFFE0', badge: 'Cực hiếm', previewSvg: 'halo' },
];

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_steps', title: 'Bước đầu phiêu lưu', description: 'Đạt 10 sao trong chế độ bất kỳ', rewardStars: 5, rewardDiamonds: 2, conditionText: 'Đạt 10 sao', isUnlocked: false, iconName: 'Compass' },
  { id: 'star_master', title: 'Thợ săn vì sao', description: 'Bắt được 50 ngôi sao trong Mini Game 1', rewardStars: 10, rewardDiamonds: 5, conditionText: 'Bắt 50 sao', isUnlocked: false, iconName: 'Star' },
  { id: 'fruit_ninja', title: 'Kiếm Sĩ Trái Cây', description: 'Chém trúng 100 trái cây tươi mát', rewardStars: 20, rewardDiamonds: 10, conditionText: 'Chém 100 trái cây', isUnlocked: false, iconName: 'Sparkles' },
  { id: 'chicken_friend', title: 'Người Bạn Nông Trại', description: 'Đưa 50 chú gà tinh nghịch về chuồng an toàn', rewardStars: 20, rewardDiamonds: 10, conditionText: 'Bắt 50 chú gà', isUnlocked: false, iconName: 'Heart' },
  { id: 'curse_breaker', title: 'Người Giải Lời Nguyền', description: 'Giúp 50 bạn quái vật buồn ngủ vui vẻ tỉnh lại', rewardStars: 25, rewardDiamonds: 15, conditionText: 'Đánh thức 50 quái vật', isUnlocked: false, iconName: 'Sparkles' },
  { id: 'reflex_master', title: 'Phản Xạ Siêu Nhanh', description: 'Đạt chuỗi Combo 20 trong các trò chơi phản xạ', rewardStars: 30, rewardDiamonds: 20, conditionText: 'Combo 20', isUnlocked: false, iconName: 'Flame' },
  { id: 'dual_wield_pro', title: 'Cao Thủ Hai Tay', description: 'Thực hiện 100 hành động kết hợp bằng cả hai tay', rewardStars: 35, rewardDiamonds: 25, conditionText: '100 hành động 2 tay', isUnlocked: false, iconName: 'Flame' },
  { id: 'mimic_expert', title: 'Bắt chước tài ba', description: 'Đạt điểm hoàn hảo 95% ở game Tạo Dáng', rewardStars: 15, rewardDiamonds: 8, conditionText: 'Tạo dáng 95%', isUnlocked: false, iconName: 'Sparkles' },
  { id: 'pet_lover', title: 'Người bạn của muông thú', description: 'Nâng cấp thú cưng lên cấp 3', rewardStars: 20, rewardDiamonds: 10, conditionText: 'Cấp thú cưng 3', isUnlocked: false, iconName: 'Heart' },
  { id: 'workout_hero', title: 'Siêu nhân vận động', description: 'Hoàn thành bài tập 5 phút hoặc 10 phút', rewardStars: 30, rewardDiamonds: 15, conditionText: 'Hoàn thành bài tập', isUnlocked: false, iconName: 'Flame' },
  { id: 'ludo_racer', title: 'Tay Đua Nhí', description: 'Hoàn thành các ván cờ cá ngựa kỳ diệu', rewardStars: 25, rewardDiamonds: 10, conditionText: 'Chơi cờ cá ngựa', isUnlocked: false, iconName: 'Award' },
  { id: 'lucky_six', title: 'Xúc Xắc May Mắn', description: 'Tung được nhiều lần xúc xắc 6 điểm may mắn', rewardStars: 20, rewardDiamonds: 10, conditionText: 'Tung được 6 điểm', isUnlocked: false, iconName: 'Sparkles' },
  { id: 'home_champion', title: 'Về Đích Toàn Thắng', description: 'Đưa toàn bộ đội quân về nhà an toàn', rewardStars: 30, rewardDiamonds: 15, conditionText: 'Về đích toàn đội', isUnlocked: false, iconName: 'Trophy' },
  { id: 'magic_track_win', title: 'Đường Đua Cầu Vồng', description: 'Thắng một ván Cờ Cá Ngựa Kỳ Diệu với ô đặc biệt', rewardStars: 30, rewardDiamonds: 15, conditionText: 'Thắng cờ kỳ diệu', isUnlocked: false, iconName: 'Sparkles' },
  { id: 'race_first_win', title: 'Tay Lái Nhí Siêu Hạng', description: 'Hoàn thành cuộc đua Bara Speed Racing đầu tiên', rewardStars: 25, rewardDiamonds: 10, conditionText: 'Đua xe hoàn thành', isUnlocked: false, iconName: 'Award' },
  { id: 'nitro_king', title: 'Vua Nitro Tốc Độ', description: 'Kích hoạt Nitro tăng tốc thần tốc trong cuộc đua', rewardStars: 30, rewardDiamonds: 15, conditionText: 'Dùng Nitro', isUnlocked: false, iconName: 'Flame' },
  { id: 'drift_master', title: 'Bậc Thầy Drift', description: 'Thực hiện những cú Drift ôm cua mượt mà và ghi điểm cao', rewardStars: 35, rewardDiamonds: 20, conditionText: 'Drift ôm cua', isUnlocked: false, iconName: 'Sparkles' },
  { id: 'speed_champion', title: 'Nhà Vô Địch Tốc Độ', description: 'Giành chiến thắng hạng 1 trong các giải đua xe', rewardStars: 40, rewardDiamonds: 25, conditionText: 'Về nhất cuộc đua', isUnlocked: false, iconName: 'Trophy' },
  { id: 'neon_city_king', title: 'Vua Đường Đêm Neon', description: 'Chinh phục đường đua thành phố ánh đèn Neon City', rewardStars: 30, rewardDiamonds: 15, conditionText: 'Thắng Neon City', isUnlocked: false, iconName: 'Compass' },
  { id: 'rainbow_racer', title: 'Huyền Thoại Cầu Vồng', description: 'Sở hữu và lái siêu xe huyền thoại Lumi Hyper', rewardStars: 50, rewardDiamonds: 30, conditionText: 'Mở khóa Lumi Hyper', isUnlocked: false, iconName: 'Star' },
];

export function getInitialProgress(): PlayerProgress {
  return {
    charName: 'Phương Nhã',
    selectedCharacter: 'bara',
    unlockedCharacters: ['bara'],
    equippedWardrobe: {},
    unlockedWardrobe: [],
    stars: 0,
    diamonds: 5,
    unlockedSkins: ['default'],
    unlockedAccessories: [],
    activeSkin: 'default',
    activeAccessory: '',
    unlockedWorlds: ['magical_forest'],
    highScores: {
      adventure: 0,
      starcatcher: 0,
      mimic: 0,
      dance: 0,
      fruitslash: 0,
      chickenblaster: 0,
      sweetzombie: 0,
    },
    pets: {
      bara: { type: 'bara', name: 'Bara Capybara', hunger: 80, happiness: 80, cleanliness: 80, energy: 90, favoriteToy: 'Bóng bay', level: 1 },
      may: { type: 'may', name: 'Chó Mây', hunger: 80, happiness: 85, cleanliness: 85, energy: 80, favoriteToy: 'Cầu vồng', level: 1 },
      bong: { type: 'bong', name: 'Thỏ Bông', hunger: 85, happiness: 80, cleanliness: 90, energy: 85, favoriteToy: 'Củ cà rốt', level: 1 },
      miu: { type: 'miu', name: 'Mèo Miu Miu', hunger: 80, happiness: 80, cleanliness: 80, energy: 90, favoriteToy: 'Cuộn len', level: 1 },
      lumi: { type: 'lumi', name: 'Lumi Phát Sáng', hunger: 70, happiness: 75, cleanliness: 75, energy: 70, favoriteToy: 'Ngôi sao', level: 1 },
      cinnamoroll: { type: 'cinnamoroll', name: 'Thỏ Mây Cinnamoroll', hunger: 85, happiness: 90, cleanliness: 95, energy: 85, favoriteToy: 'Đám mây kẹo', level: 1 },
      kuromi: { type: 'kuromi', name: 'Thỏ Kuromi', hunger: 80, happiness: 85, cleanliness: 85, energy: 90, favoriteToy: 'Nơ gô-tích', level: 1 },
      capy_tie: { type: 'capy_tie', name: 'Capybara Cà Vạt', hunger: 85, happiness: 80, cleanliness: 90, energy: 85, favoriteToy: 'Cà vạt xanh', level: 1 },
      po: { type: 'po', name: 'Gấu Trúc Po', hunger: 90, happiness: 90, cleanliness: 75, energy: 95, favoriteToy: 'Xửng bánh bao', level: 1 },
    },
    activePetId: 'bara',
    achievements: [],
    dailyMissions: [
      { id: 'm1', title: 'Thợ Săn Vì Sao', description: 'Bắt 30 ngôi sao trong các trò chơi', targetCount: 30, currentCount: 0, isCompleted: false, isClaimed: false, rewardStars: 15, rewardDiamonds: 2 },
      { id: 'm2', title: 'Nhà Thám Hiểm', description: 'Hoàn thành 2 màn chạy phiêu lưu Bara', targetCount: 2, currentCount: 0, isCompleted: false, isClaimed: false, rewardStars: 20, rewardDiamonds: 3 },
      { id: 'm3', title: 'Vũ Công Nhí', description: 'Hoàn thành 1 bài nhảy Vũ Điệu Vui Nhộn', targetCount: 1, currentCount: 0, isCompleted: false, isClaimed: false, rewardStars: 25, rewardDiamonds: 5 },
    ],
    lastMissionDate: new Date().toDateString(),
    parentStats: {
      todayPlayMinutes: 0,
      stagesCompleted: 0,
      workoutSessions: 0,
      starsEarnedToday: 0,
      lastPlayedDate: new Date().toDateString(),
      favoriteMode: 'Phiêu Lưu',
    },
  };
}

export function evaluateAchievements(progress: PlayerProgress): { progress: PlayerProgress; newlyUnlocked: Achievement[] } {
  const currentUnlocked = new Set(progress.achievements || []);
  const newlyUnlocked: Achievement[] = [];
  let starsGained = 0;
  let diamondsGained = 0;

  for (const ach of ACHIEVEMENTS) {
    if (currentUnlocked.has(ach.id)) continue;

    let unlocked = false;
    switch (ach.id) {
      case 'first_steps':
        if (progress.stars >= 10) unlocked = true;
        break;
      case 'star_master':
        if ((progress.highScores?.starcatcher || 0) >= 50) unlocked = true;
        break;
      case 'fruit_ninja':
        if ((progress.highScores?.fruitslash || 0) >= 100) unlocked = true;
        break;
      case 'chicken_friend':
        if ((progress.highScores?.chickenblaster || 0) >= 100) unlocked = true;
        break;
      case 'curse_breaker':
        if ((progress.highScores?.sweetzombie || 0) >= 100) unlocked = true;
        break;
      case 'reflex_master':
        if (
          (progress.highScores?.fruitslash || 0) >= 200 ||
          (progress.highScores?.chickenblaster || 0) >= 200
        ) unlocked = true;
        break;
      case 'workout_hero':
        if ((progress.parentStats?.workoutSessions || 0) >= 1) unlocked = true;
        break;
      case 'pet_lover': {
        const anyPetLv3 = Object.values(progress.pets || {}).some((p) => p && p.level >= 3);
        if (anyPetLv3) unlocked = true;
        break;
      }
      case 'ludo_racer':
        if ((progress.highScores?.ludo_matches_played || 0) >= 1) unlocked = true;
        break;
      case 'lucky_six':
        if ((progress.highScores?.ludo_rolled_six || 0) >= 1) unlocked = true;
        break;
      case 'home_champion':
        if ((progress.highScores?.ludo_home_champion || 0) >= 1) unlocked = true;
        break;
      case 'magic_track_win':
        if ((progress.highScores?.ludo_magic_track_win || 0) >= 1) unlocked = true;
        break;
      case 'race_first_win':
        if ((progress.highScores?.racing_completed_count || 0) >= 1) unlocked = true;
        break;
      case 'nitro_king':
        if ((progress.highScores?.racing_nitro_triggered || 0) >= 1) unlocked = true;
        break;
      case 'drift_master':
        if ((progress.highScores?.racing_max_drift || 0) >= 150) unlocked = true;
        break;
      case 'speed_champion':
        if ((progress.highScores?.racing_rank_1_count || 0) >= 1) unlocked = true;
        break;
      case 'neon_city_king':
        if ((progress.highScores?.racing_track_neon_city_win || 0) >= 1) unlocked = true;
        break;
      case 'rainbow_racer':
        if ((progress.highScores?.lumi_hyper_unlocked || 0) >= 1) unlocked = true;
        break;
      case 'mimic_expert':
        if ((progress.highScores?.mimic || 0) >= 95) unlocked = true;
        break;
      case 'dual_wield_pro':
        if ((progress.highScores?.starcatcher || 0) >= 40) unlocked = true;
        break;
      default:
        break;
    }

    if (unlocked) {
      currentUnlocked.add(ach.id);
      newlyUnlocked.push(ach);
      starsGained += ach.rewardStars;
      diamondsGained += ach.rewardDiamonds;
    }
  }

  return {
    progress: {
      ...progress,
      stars: progress.stars + starsGained,
      diamonds: progress.diamonds + diamondsGained,
      achievements: Array.from(currentUnlocked),
    },
    newlyUnlocked,
  };
}

export function migrateLegacyPetIds(progress: any): any {
  if (!progress) return progress;
  const legacyIds = ['cat', 'dog', 'rabbit', 'bear', 'unicorn'];
  if (legacyIds.includes(progress.activePetId)) {
    progress.activePetId = 'bara';
  }
  if (progress.pets) {
    legacyIds.forEach((id) => {
      if (id in progress.pets) {
        delete progress.pets[id];
      }
    });
  }
  return progress;
}

export function resetDailyMissionsIfNewDay(progress: PlayerProgress): PlayerProgress {
  const today = new Date().toDateString();
  if (progress.lastMissionDate !== today) {
    const initial = getInitialProgress();
    return {
      ...progress,
      lastMissionDate: today,
      dailyMissions: initial.dailyMissions.map((m) => ({
        ...m,
        currentCount: 0,
        isCompleted: false,
        isClaimed: false,
      })),
      parentStats: {
        ...progress.parentStats,
        todayPlayMinutes: 0,
        starsEarnedToday: 0,
        lastPlayedDate: today,
      },
    };
  }
  return progress;
}

export function loadProgress(): PlayerProgress {
  try {
    const saved = localStorage.getItem(PROGRESS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const initial = getInitialProgress();
      const loaded = {
        ...initial,
        ...parsed,
        highScores: { ...initial.highScores, ...(parsed.highScores || {}) },
        pets: { ...initial.pets, ...(parsed.pets || {}) },
        parentStats: { ...initial.parentStats, ...(parsed.parentStats || {}) },
        equippedWardrobe: { ...initial.equippedWardrobe, ...(parsed.equippedWardrobe || {}) },
      };
      const migrated = migrateLegacyPetIds(loaded);
      return resetDailyMissionsIfNewDay(migrated);
    }
  } catch (e) {
    console.error('Failed to load progress', e);
  }
  return getInitialProgress();
}

export function recordMissionProgress(
  progress: PlayerProgress,
  missionType: 'stars' | 'adventure' | 'dance' | 'generic',
  amount: number = 1
): PlayerProgress {
  if (!progress.dailyMissions) return progress;

  const updatedMissions = progress.dailyMissions.map((m) => {
    let match = false;
    if (missionType === 'stars' && m.id === 'm1') match = true;
    if (missionType === 'adventure' && m.id === 'm2') match = true;
    if (missionType === 'dance' && m.id === 'm3') match = true;

    if (match && !m.isCompleted) {
      const nextCount = (m.currentCount || 0) + amount;
      return {
        ...m,
        currentCount: nextCount,
        isCompleted: nextCount >= m.targetCount,
      };
    }
    return m;
  });

  return {
    ...progress,
    dailyMissions: updatedMissions,
  };
}

export function saveProgress(progress: PlayerProgress) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save progress', e);
  }
}
