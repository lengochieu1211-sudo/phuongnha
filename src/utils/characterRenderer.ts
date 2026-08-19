/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharacterId, AnimState, CategoryType } from '../types';

export interface RenderOptions {
  characterId: CharacterId;
  animState: AnimState;
  equipped?: { [key in CategoryType]?: string };
  width?: number;
  height?: number;
  tick?: number; // Animation frame tick for continuous motion (ear wiggle, tail bounce, etc.)
  isTalking?: boolean; // True when VoiceGuide is speaking
}

/**
 * Character Metadata definitions
 */
export const CHARACTERS_CONFIG = [
  {
    id: 'bara' as CharacterId,
    name: 'Bara',
    species: 'Capybara',
    description: 'Capybara nâu ấm với thân bầu chắc, tai tròn nhỏ, mắt hiền và mõm vuông đặc trưng.',
    avatarColor: '#C88D58',
    unlockStars: 0,
    isUnlockedByDefault: true,
    specialAbility: '🌈 Nam châm thu hút sao cầu vồng',
  },
  {
    id: 'may' as CharacterId,
    name: 'Mây',
    species: 'Chó Mây',
    description: 'Chú chó nhỏ lông trắng muốt như bông mây, đôi tai dài lúc lắc khi chạy!',
    avatarColor: '#FFFDF8',
    unlockStars: 20,
    specialAbility: '⚡ Chạy siêu nhanh và nhạy bén',
  },
  {
    id: 'bong' as CharacterId,
    name: 'Bông',
    species: 'Thỏ Ngọc',
    description: 'Chú thỏ màu hồng pastel ngộ nghĩnh, tai dài nảy tưng tưng vô cùng đáng yêu!',
    avatarColor: '#FFE5EC',
    unlockStars: 50,
    specialAbility: '🦘 Nhảy cao vượt chướng ngại dễ dàng',
  },
  {
    id: 'miu' as CharacterId,
    name: 'Miu',
    species: 'Mèo Tam Thể',
    description: 'Nàng mèo tam thể xinh đẹp, chiếc đuôi ngoắt ngoắt vui vẻ mỗi khi nhặt sao!',
    avatarColor: '#FFAA5A',
    unlockStars: 100,
    specialAbility: '✨ Bắt chước tư thế chính xác gấp đôi',
  },
  {
    id: 'lumi' as CharacterId,
    name: 'Lumi',
    species: 'Kỳ Lân Cầu Vồng',
    description: 'Nhân vật huyền thoại với bờm cầu vồng rực rỡ và hiệu ứng sao lấp lánh!',
    avatarColor: '#F3E8FF',
    unlockStars: 200,
    specialAbility: '🌟 Nhân đôi tất cả điểm số và sao thu thập',
  },
  {
    id: 'cinnamoroll' as CharacterId,
    name: 'Cinnamoroll',
    species: 'Chú cún mây',
    description: 'Cinnamoroll trắng mềm như mây, đôi tai cực dài, mắt xanh, má hồng và chiếc đuôi cuộn đặc trưng.',
    avatarColor: '#FFFFFF',
    unlockStars: 30,
    specialAbility: '☁️ Lướt mây nhẹ nhàng & Thu hút sao tự động',
  },
  {
    id: 'kuromi' as CharacterId,
    name: 'Kuromi',
    species: 'Nhân vật Sanrio',
    description: 'Kuromi cá tính với mũ jester đen, đầu lâu hồng, khuôn mặt trắng và chiếc đuôi quỷ nhỏ tinh nghịch.',
    avatarColor: '#2D2B30',
    unlockStars: 60,
    specialAbility: '🖤 Bùa phép cá tính & Nhân đôi chuỗi Combo',
  },
  {
    id: 'capy_tie' as CharacterId,
    name: 'Capybara Cà Vạt',
    species: 'Capybara Sếp',
    description: 'Chú Capybara công sở vô cùng lịch lãm với áo sơ mi xanh mây và chiếc cà vạt xanh thẫm phong độ!',
    avatarColor: '#C88D58',
    unlockStars: 40,
    specialAbility: '👔 Phong thái Sếp Lớn & Tăng 50% tiền thưởng',
  },
  {
    id: 'po' as CharacterId,
    name: 'Kung Fu Po',
    species: 'Gấu Trúc Po',
    description: 'Thần Long Đại Hiệp Gấu Trúc Po dũng cảm, giỏi võ thuật Kung Fu và cực kỳ mê ăn bánh bao!',
    avatarColor: '#18181B',
    unlockStars: 80,
    specialAbility: '🥟 Chiêu Bánh Bao Kung Fu & Đập tan chướng ngại',
  },
];

export const WARDROBE_ITEMS = [
  // Bows
  { id: 'bow_red', name: 'Nơ Đỏ Thắm', category: 'bow' as CategoryType, costStars: 10, costDiamonds: 0, previewColor: '#FF2A6D', icon: '🎀' },
  { id: 'bow_pink', name: 'Nơ Hồng Xinh', category: 'bow' as CategoryType, costStars: 15, costDiamonds: 0, previewColor: '#FFB6C1', icon: '🎀' },
  // Glasses
  { id: 'glasses_gold', name: 'Kính Tròn Trí Tuệ', category: 'glasses' as CategoryType, costStars: 20, costDiamonds: 2, previewColor: '#FFD700', icon: '👓' },
  { id: 'sunglasses', name: 'Kính Râm Ngầu', category: 'glasses' as CategoryType, costStars: 30, costDiamonds: 5, previewColor: '#1A1A1A', icon: '🕶️' },
  // Hats
  { id: 'hat_straw', name: 'Nón Cói Đi Biển', category: 'hat' as CategoryType, costStars: 25, costDiamonds: 0, previewColor: '#F0E68C', icon: '👒' },
  { id: 'hat_party', name: 'Mũ Sinh Nhật', category: 'hat' as CategoryType, costStars: 35, costDiamonds: 5, previewColor: '#FF6B6B', icon: '🥳' },
  // Crown
  { id: 'crown_gold', name: 'Vương Miện Hoàng Gia', category: 'crown' as CategoryType, costStars: 50, costDiamonds: 10, previewColor: '#FFD700', icon: '👑', badge: 'Hiếm' },
  // Hair / face / layered avatar accessories
  { id: 'hair_long_brown', name: 'Tóc Dài Nâu Tự Nhiên', category: 'hair' as CategoryType, costStars: 20, costDiamonds: 0, previewColor: '#6B4423', icon: '💇‍♀️', badge: 'MỚI' },
  { id: 'hair_bob_black', name: 'Tóc Bob Đen Cá Tính', category: 'hair' as CategoryType, costStars: 25, costDiamonds: 1, previewColor: '#171717', icon: '💇🏻‍♀️' },
  { id: 'hair_ponytail_pink', name: 'Tóc Đuôi Ngựa Hồng', category: 'hair' as CategoryType, costStars: 35, costDiamonds: 4, previewColor: '#EC4899', icon: '🩷', badge: 'Hiếm' },
  { id: 'mask_hero', name: 'Mặt Nạ Anh Hùng', category: 'mask' as CategoryType, costStars: 30, costDiamonds: 2, previewColor: '#7C3AED', icon: '🥷', badge: 'MỚI' },
  { id: 'mask_fox', name: 'Mặt Nạ Cáo Huyền Bí', category: 'mask' as CategoryType, costStars: 45, costDiamonds: 5, previewColor: '#F8FAFC', icon: '🦊', badge: 'Hiếm' },
  { id: 'mask_cyber', name: 'Mặt Nạ Cyber Neon', category: 'mask' as CategoryType, costStars: 55, costDiamonds: 8, previewColor: '#06B6D4', icon: '🤖', badge: 'Huyền thoại' },
  { id: 'necklace_heart', name: 'Dây Chuyền Trái Tim', category: 'necklace' as CategoryType, costStars: 18, costDiamonds: 0, previewColor: '#F43F5E', icon: '💖' },
  { id: 'necklace_crystal', name: 'Dây Chuyền Pha Lê', category: 'necklace' as CategoryType, costStars: 35, costDiamonds: 4, previewColor: '#67E8F9', icon: '💎', badge: 'Hiếm' },
  { id: 'gloves_sport', name: 'Găng Tay Thể Thao', category: 'gloves' as CategoryType, costStars: 20, costDiamonds: 0, previewColor: '#2563EB', icon: '🧤' },
  { id: 'gloves_cyber', name: 'Găng Tay Cyber', category: 'gloves' as CategoryType, costStars: 40, costDiamonds: 5, previewColor: '#22D3EE', icon: '🦾', badge: 'MỚI' },
  { id: 'head_cat_ears', name: 'Tai Mèo Dễ Thương', category: 'headaccessory' as CategoryType, costStars: 22, costDiamonds: 1, previewColor: '#F9A8D4', icon: '🐱' },
  { id: 'head_horns_neon', name: 'Sừng Neon Ma Thuật', category: 'headaccessory' as CategoryType, costStars: 42, costDiamonds: 5, previewColor: '#A855F7', icon: '😈', badge: 'Hiếm' },
  // Backpack
  { id: 'backpack_blue', name: 'Balô Xanh Thám Hiểm', category: 'backpack' as CategoryType, costStars: 15, costDiamonds: 0, previewColor: '#4D96FF', icon: '🎒' },
  { id: 'backpack_pink', name: 'Balô Kẹo Ngọt', category: 'backpack' as CategoryType, costStars: 20, costDiamonds: 0, previewColor: '#FF8AAE', icon: '🎒' },
  // Wings
  { id: 'wings_angel', name: 'Cánh Thiên Thần', category: 'wings' as CategoryType, costStars: 80, costDiamonds: 15, previewColor: '#E0FFFF', icon: '🪽', badge: 'Huyền thoại' },
  { id: 'wings_butterfly', name: 'Cánh Bướm Rực Rỡ', category: 'wings' as CategoryType, costStars: 60, costDiamonds: 10, previewColor: '#FF70A6', icon: '🦋' },
  // Shirts / Clothes
  { id: 'shirt_superhero', name: 'Giáp Siêu Nhân', category: 'shirt' as CategoryType, costStars: 40, costDiamonds: 5, previewColor: '#FF2A6D', icon: '👕', badge: 'MỚI' },
  { id: 'shirt_karate', name: 'Võ Phục Karate', category: 'shirt' as CategoryType, costStars: 25, costDiamonds: 2, previewColor: '#E2E8F0', icon: '🥋', badge: 'MỚI' },
  { id: 'shirt_dress', name: 'Đầm Elsa Lấp Lánh', category: 'shirt' as CategoryType, costStars: 60, costDiamonds: 12, previewColor: '#4D96FF', icon: '👗', badge: 'Hiếm' },
  { id: 'shirt_cape', name: 'Áo Choàng Quý Tộc', category: 'shirt' as CategoryType, costStars: 35, costDiamonds: 4, previewColor: '#8B5CF6', icon: '🧥', badge: 'MỚI' },
  { id: 'shirt_robot', name: 'Giáp Robot Cơ Giáp', category: 'shirt' as CategoryType, costStars: 75, costDiamonds: 15, previewColor: '#10B981', icon: '🤖', badge: 'Huyền thoại' },
  // Shoes
  { id: 'shoes_sneakers', name: 'Giày Phát Sáng', category: 'shoes' as CategoryType, costStars: 25, costDiamonds: 2, previewColor: '#06B6D4', icon: '👟', badge: 'MỚI' },
  { id: 'shoes_skates', name: 'Giày Patin Sắc Màu', category: 'shoes' as CategoryType, costStars: 30, costDiamonds: 4, previewColor: '#EC4899', icon: '🛼', badge: 'MỚI' },
  { id: 'shoes_boots', name: 'Bốt Hoàng Tử', category: 'shoes' as CategoryType, costStars: 40, costDiamonds: 6, previewColor: '#D97706', icon: '👢', badge: 'Hiếm' },
  { id: 'shoes_glass', name: 'Hài Pha Lê Cát Tường', category: 'shoes' as CategoryType, costStars: 55, costDiamonds: 10, previewColor: '#E2E8F0', icon: '👠', badge: 'Cực Hiếm' },
  { id: 'shoes_jets', name: 'Giày Phản Lực Vượt Trội', category: 'shoes' as CategoryType, costStars: 80, costDiamonds: 18, previewColor: '#EF4444', icon: '🚀', badge: 'Thần Thoại' },
];

/**
 * Render Stylized 2.5D Soft 3D Mascot Character with Skeleton Rig & Dynamic Physics
 */
export function renderCharacterSvg({
  characterId,
  animState,
  equipped = {},
  width = 200,
  height = 200,
  tick = 0,
  isTalking = false,
}: RenderOptions): string {
  // Skeleton & Bone Transform State
  let bodyY = 0;
  let bodyRotate = 0;
  let scaleX = 1;
  let scaleY = 1;

  let headY = 0;
  let headRotate = 0;

  let armLeftAngle = 0;
  let armRightAngle = 0;

  let legLeftAngle = 0;
  let legRightAngle = 0;

  let earBounce = Math.sin(tick * 0.18) * 4;
  let tailWiggle = Math.sin(tick * 0.22) * 10;
  let backpackBounce = Math.sin(tick * 0.2) * 2;

  let eyeType: 'normal' | 'happy' | 'sleep' | 'star' | 'sad' | 'surprised' = 'normal';
  let isBlinking = tick % 110 < 6 && animState !== 'sleeping';

  const userTalking = isTalking || animState === 'talking';

  // Animation Blending Matrix
  switch (animState) {
    case 'idle':
      bodyY = Math.sin(tick * 0.08) * 2.5;
      headY = Math.sin(tick * 0.08 + 0.5) * 1.5;
      armLeftAngle = Math.sin(tick * 0.08) * 5;
      armRightAngle = -Math.sin(tick * 0.08) * 5;
      break;

    case 'walk':
      bodyY = Math.abs(Math.sin(tick * 0.25)) * -6;
      bodyRotate = Math.sin(tick * 0.25) * 3;
      armLeftAngle = Math.sin(tick * 0.25) * 35;
      armRightAngle = -Math.sin(tick * 0.25) * 35;
      legLeftAngle = -Math.sin(tick * 0.25) * 25;
      legRightAngle = Math.sin(tick * 0.25) * 25;
      earBounce = Math.sin(tick * 0.3) * 8;
      tailWiggle = Math.sin(tick * 0.3) * 18;
      backpackBounce = Math.abs(Math.sin(tick * 0.25)) * -4;
      break;

    case 'run':
      bodyY = Math.abs(Math.sin(tick * 0.4)) * -12;
      bodyRotate = Math.sin(tick * 0.4) * 6;
      armLeftAngle = Math.sin(tick * 0.4) * 65;
      armRightAngle = -Math.sin(tick * 0.4) * 65;
      legLeftAngle = -Math.sin(tick * 0.4) * 45;
      legRightAngle = Math.sin(tick * 0.4) * 45;
      earBounce = Math.sin(tick * 0.5) * 15;
      tailWiggle = Math.sin(tick * 0.5) * 28;
      backpackBounce = Math.abs(Math.sin(tick * 0.4)) * -8;
      break;

    case 'jump':
      bodyY = -28;
      scaleY = 1.12;
      scaleX = 0.92;
      armLeftAngle = -130;
      armRightAngle = 130;
      legLeftAngle = -20;
      legRightAngle = 20;
      earBounce = -12;
      eyeType = 'happy';
      break;

    case 'duck':
      bodyY = 16;
      scaleY = 0.72;
      scaleX = 1.18;
      headY = 8;
      earBounce = 10;
      break;

    case 'move_left':
      bodyRotate = -12;
      armLeftAngle = -50;
      armRightAngle = 15;
      break;

    case 'move_right':
      bodyRotate = 12;
      armLeftAngle = -15;
      armRightAngle = 50;
      break;

    case 'wave_left':
      armLeftAngle = -135 + Math.sin(tick * 0.35) * 28;
      armRightAngle = 10;
      eyeType = 'happy';
      break;

    case 'wave_right':
      armLeftAngle = -10;
      armRightAngle = 135 + Math.sin(tick * 0.35) * 28;
      eyeType = 'happy';
      break;

    case 'both_hands_up':
    case 'victory':
      armLeftAngle = -145;
      armRightAngle = 145;
      bodyY = -10 + Math.abs(Math.sin(tick * 0.3)) * -6;
      eyeType = 'star';
      break;

    case 'dance':
      bodyRotate = Math.sin(tick * 0.3) * 16;
      armLeftAngle = Math.sin(tick * 0.3) * 75;
      armRightAngle = -Math.sin(tick * 0.3) * 75;
      bodyY = Math.abs(Math.cos(tick * 0.3)) * -6;
      eyeType = 'happy';
      break;

    case 'happy':
    case 'petting':
      eyeType = 'happy';
      bodyY = Math.abs(Math.sin(tick * 0.2)) * -6;
      headRotate = Math.sin(tick * 0.15) * 8;
      break;

    case 'eating':
      eyeType = 'happy';
      scaleX = 1 + Math.sin(tick * 0.4) * 0.06;
      scaleY = 1 - Math.sin(tick * 0.4) * 0.04;
      break;

    case 'sleeping':
      eyeType = 'sleep';
      bodyY = 12;
      scaleY = 0.85;
      scaleX = 1.08;
      isBlinking = false;
      break;

    case 'sad':
      eyeType = 'sad';
      bodyY = 6;
      headY = 4;
      armLeftAngle = 20;
      armRightAngle = -20;
      break;

    case 'talking':
      bodyY = Math.sin(tick * 0.12) * 3;
      armLeftAngle = Math.sin(tick * 0.2) * 20;
      armRightAngle = -Math.sin(tick * 0.2) * 20;
      eyeType = 'happy';
      break;
  }

  // Color & Lighting Material Palette (Soft 2.5D Shading)
  let mainGradId = 'baraGrad';
  let bellyGradId = 'baraBellyGrad';
  let earGradId = 'baraEarGrad';
  let innerEarColor = '#FFAAAA';

  if (characterId === 'may') {
    mainGradId = 'mayGrad';
    bellyGradId = 'mayBellyGrad';
    earGradId = 'mayEarGrad';
    innerEarColor = '#FFC2D1';
  } else if (characterId === 'bong') {
    mainGradId = 'bongGrad';
    bellyGradId = 'bongBellyGrad';
    earGradId = 'bongEarGrad';
    innerEarColor = '#FF8AAE';
  } else if (characterId === 'miu') {
    mainGradId = 'miuGrad';
    bellyGradId = 'miuBellyGrad';
    earGradId = 'miuEarGrad';
    innerEarColor = '#FFAB91';
  } else if (characterId === 'lumi') {
    mainGradId = 'lumiGrad';
    bellyGradId = 'lumiBellyGrad';
    earGradId = 'lumiEarGrad';
    innerEarColor = '#F472B6';
  } else if (characterId === 'cinnamoroll') {
    mainGradId = 'mayGrad';
    bellyGradId = 'mayBellyGrad';
    earGradId = 'mayEarGrad';
    innerEarColor = '#FFE4E1';
  } else if (characterId === 'kuromi') {
    mainGradId = 'kuromiGrad';
    bellyGradId = 'mayBellyGrad';
    earGradId = 'kuromiGrad';
    innerEarColor = '#FF69B4';
  } else if (characterId === 'capy_tie') {
    mainGradId = 'baraGrad';
    bellyGradId = 'baraBellyGrad';
    earGradId = 'baraEarGrad';
    innerEarColor = '#FFAAAA';
  } else if (characterId === 'po') {
    mainGradId = 'mayGrad';
    bellyGradId = 'mayBellyGrad';
    earGradId = 'poEarGrad';
    innerEarColor = '#27272A';
  }

  const outlineColor = characterId === 'cinnamoroll'
    ? '#75A9C7'
    : characterId === 'bara' || characterId === 'capy_tie'
      ? '#5B4028'
      : characterId === 'kuromi'
        ? '#27212D'
        : '#1E293B';

  // Contact Blob Shadow parameters (shrinks/lightens when jumping)
  const shadowRadiusX = Math.max(10, 48 - Math.abs(bodyY) * 0.6);
  const shadowRadiusY = Math.max(4, 12 - Math.abs(bodyY) * 0.2);
  const shadowOpacity = Math.max(0.1, 0.45 - Math.abs(bodyY) * 0.012);

  // Wings SVG overlay
  let wingsSvg = '';
  if (equipped.wings === 'wings_angel') {
    wingsSvg = `
      <g transform="translate(100, 102) scale(1.15)">
        <path d="M-20,-12 C-45,-38 -68,-12 -55,12 C-42,28 -25,22 -14,6 Z" fill="url(#wingsAngelGrad)" filter="url(#softShadow)"/>
        <path d="M20,-12 C45,-38 68,-12 55,12 C42,28 25,22 14,6 Z" fill="url(#wingsAngelGrad)" filter="url(#softShadow)"/>
      </g>
    `;
  } else if (equipped.wings === 'wings_butterfly') {
    wingsSvg = `
      <g transform="translate(100, 102)">
        <path d="M-15,-22 C-48,-48 -70,-8 -38,18 C-22,28 -10,12 -10,0 Z" fill="#FF70A6" opacity="0.9" filter="url(#softShadow)"/>
        <path d="M15,-22 C48,-48 70,-8 38,18 C22,28 10,12 10,0 Z" fill="#FF9EBB" opacity="0.9" filter="url(#softShadow)"/>
      </g>
    `;
  }

  // Backpack SVG with physics bounce
  let backpackSvg = '';
  if (equipped.backpack) {
    const bgCol = equipped.backpack === 'backpack_pink' ? '#FF8AAE' : '#3B82F6';
    backpackSvg = `
      <g transform="translate(0, ${backpackBounce})">
        <rect x="124" y="88" width="24" height="32" rx="10" fill="${bgCol}" stroke="#1E293B" stroke-width="2.5" filter="url(#softShadow)"/>
        <rect x="128" y="96" width="16" height="14" rx="5" fill="#FFFFFF" opacity="0.6"/>
        <line x1="124" y1="102" x2="148" y2="102" stroke="#1E293B" stroke-width="2"/>
        <circle cx="136" cy="102" r="2.5" fill="#FFD700"/>
      </g>
    `;
  }

  // Crown / Hat SVG
  let hatSvg = '';
  if (equipped.crown === 'crown_gold') {
    hatSvg = `
      <g transform="translate(100, 36)" filter="url(#softShadow)">
        <path d="M-18,0 L-22,-20 L-10,-9 L0,-24 L10,-9 L22,-20 L18,0 Z" fill="url(#goldGrad)" stroke="#B8860B" stroke-width="2"/>
        <circle cx="0" cy="-24" r="3.5" fill="#FF2A6D"/>
        <circle cx="-22" cy="-20" r="3" fill="#3B82F6"/>
        <circle cx="22" cy="-20" r="3" fill="#3B82F6"/>
      </g>
    `;
  } else if (equipped.hat === 'hat_straw') {
    hatSvg = `
      <g transform="translate(100, 40)" filter="url(#softShadow)">
        <ellipse cx="0" cy="0" rx="34" ry="9" fill="#F0E68C" stroke="#B8860B" stroke-width="2"/>
        <path d="M-20,0 C-20,-20 20,-20 20,0 Z" fill="#E6C280"/>
        <rect x="-20" y="-3" width="40" height="4.5" fill="#FF4D6D"/>
      </g>
    `;
  } else if (equipped.hat === 'hat_party') {
    hatSvg = `
      <g transform="translate(100, 32)" filter="url(#softShadow)">
        <polygon points="0,-32 -16,6 16,6" fill="#FF6B6B" stroke="#C70039" stroke-width="2"/>
        <circle cx="0" cy="-32" r="4.5" fill="#FFD700"/>
        <line x1="-12" y1="-6" x2="12" y2="-6" stroke="#FFFFFF" stroke-width="3"/>
      </g>
    `;
  }

  // Glasses SVG
  let glassesSvg = '';
  if (equipped.glasses === 'glasses_gold') {
    glassesSvg = `
      <g transform="translate(100, 70)">
        <circle cx="-15" cy="0" r="11" fill="none" stroke="#FFD700" stroke-width="2.8"/>
        <circle cx="15" cy="0" r="11" fill="none" stroke="#FFD700" stroke-width="2.8"/>
        <line x1="-4" y1="0" x2="4" y2="0" stroke="#FFD700" stroke-width="2.8"/>
      </g>
    `;
  } else if (equipped.glasses === 'sunglasses') {
    glassesSvg = `
      <g transform="translate(100, 70)">
        <path d="M-26,-6 L-4,-6 L-8,7 L-22,7 Z" fill="#111827"/>
        <path d="M4,-6 L26,-6 L22,7 L8,7 Z" fill="#111827"/>
        <line x1="-4" y1="-4" x2="4" y2="-4" stroke="#111827" stroke-width="3.5"/>
      </g>
    `;
  }

  // Bow SVG
  let bowSvg = '';
  if (equipped.bow) {
    const bowCol = equipped.bow === 'bow_red' ? '#FF2A6D' : '#FFB6C1';
    bowSvg = `
      <g transform="translate(124, 50) scale(0.95)" filter="url(#softShadow)">
        <polygon points="0,0 -14,-9 -14,9" fill="${bowCol}"/>
        <polygon points="0,0 14,-9 14,9" fill="${bowCol}"/>
        <circle cx="0" cy="0" r="4.5" fill="#FFFFFF"/>
      </g>
    `;
  }

  // Eyes rendering with Iris reflections and blinking
  let eyesSvg = '';
  if (isBlinking) {
    eyesSvg = `
      <path d="M80,68 Q86,72 92,68" fill="none" stroke="#1E293B" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M108,68 Q114,72 120,68" fill="none" stroke="#1E293B" stroke-width="3.5" stroke-linecap="round"/>
    `;
  } else if (eyeType === 'happy') {
    eyesSvg = `
      <path d="M78,69 Q86,59 94,69" fill="none" stroke="#1E293B" stroke-width="4" stroke-linecap="round"/>
      <path d="M106,69 Q114,59 122,69" fill="none" stroke="#1E293B" stroke-width="4" stroke-linecap="round"/>
    `;
  } else if (eyeType === 'sleep') {
    eyesSvg = `
      <line x1="78" y1="68" x2="94" y2="68" stroke="#1E293B" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="106" y1="68" x2="122" y2="68" stroke="#1E293B" stroke-width="3.5" stroke-linecap="round"/>
    `;
  } else if (eyeType === 'star') {
    eyesSvg = `
      <text x="86" y="73" font-size="16" text-anchor="middle">⭐</text>
      <text x="114" y="73" font-size="16" text-anchor="middle">⭐</text>
    `;
  } else if (eyeType === 'sad') {
    eyesSvg = `
      <path d="M78,63 Q86,71 94,63" fill="none" stroke="#1E293B" stroke-width="4" stroke-linecap="round"/>
      <path d="M106,63 Q114,71 122,63" fill="none" stroke="#1E293B" stroke-width="4" stroke-linecap="round"/>
    `;
  } else {
    // Large Sparkly Cute 3D Eyes
    if (characterId === 'cinnamoroll') {
      eyesSvg = `
        <g transform="translate(86, 66)">
          <ellipse cx="0" cy="0" rx="6" ry="8" fill="#00A8FF"/>
          <circle cx="-1.8" cy="-2.5" r="2.8" fill="#FFFFFF"/>
          <circle cx="2.2" cy="2.2" r="1.2" fill="#FFFFFF"/>
        </g>
        <g transform="translate(114, 66)">
          <ellipse cx="0" cy="0" rx="6" ry="8" fill="#00A8FF"/>
          <circle cx="-1.8" cy="-2.5" r="2.8" fill="#FFFFFF"/>
          <circle cx="2.2" cy="2.2" r="1.2" fill="#FFFFFF"/>
        </g>
      `;
    } else {
      eyesSvg = `
        <g transform="translate(86, 66)">
          <ellipse cx="0" cy="0" rx="6.5" ry="7.5" fill="#1E293B"/>
          <circle cx="-2" cy="-2" r="2.8" fill="#FFFFFF"/>
          <circle cx="2.2" cy="2.5" r="1.3" fill="#FFFFFF"/>
        </g>
        <g transform="translate(114, 66)">
          <ellipse cx="0" cy="0" rx="6.5" ry="7.5" fill="#1E293B"/>
          <circle cx="-2" cy="-2" r="2.8" fill="#FFFFFF"/>
          <circle cx="2.2" cy="2.5" r="1.3" fill="#FFFFFF"/>
        </g>
      `;
    }
  }

  // Mouth Rig: Animated talking mouth when user/guide speaks
  let mouthSvg = '';
  if (userTalking) {
    const mouthOpen = 3 + Math.abs(Math.sin(tick * 0.45)) * 6;
    mouthSvg = `
      <g transform="translate(100, 81)">
        <ellipse cx="0" cy="0" rx="5" ry="${mouthOpen}" fill="#991B1B" stroke="#1E293B" stroke-width="1.5"/>
        <path d="M-3,-2 Q0,-4 3,-2" fill="#FFFFFF"/>
        <ellipse cx="0" cy="${mouthOpen * 0.4}" rx="3" ry="2" fill="#FF8A9A"/>
      </g>
    `;
  } else if (animState === 'happy' || animState === 'victory' || animState === 'petting') {
    mouthSvg = `
      <path d="M94,79 Q100,87 106,79" fill="#FF8A9A" stroke="#1E293B" stroke-width="2" stroke-linecap="round"/>
    `;
  } else if (animState === 'eating') {
    const chew = Math.sin(tick * 0.4) * 3;
    mouthSvg = `
      <ellipse cx="100" cy="80" rx="${4 + chew}" ry="${3 - chew * 0.5}" fill="#1E293B"/>
    `;
  } else {
    // Gentle cute smile line
    mouthSvg = `
      <path d="M96,80 Q100,84 104,80" fill="none" stroke="#1E293B" stroke-width="2.2" stroke-linecap="round"/>
    `;
  }

  // Specific Ears according to Species
  let earsSvg = '';
  if (characterId === 'bara' || characterId === 'capy_tie') {
    // Capybara small rounded soft ears
    earsSvg = `
      <g transform="translate(68, 48) rotate(${earBounce * 0.5})">
        <circle cx="0" cy="0" r="10" fill="url(#${earGradId})" stroke="#1E293B" stroke-width="2.5" filter="url(#softShadow)"/>
        <circle cx="0" cy="0" r="5.5" fill="${innerEarColor}"/>
      </g>
      <g transform="translate(132, 48) rotate(${-earBounce * 0.5})">
        <circle cx="0" cy="0" r="10" fill="url(#${earGradId})" stroke="#1E293B" stroke-width="2.5" filter="url(#softShadow)"/>
        <circle cx="0" cy="0" r="5.5" fill="${innerEarColor}"/>
      </g>
    `;
  } else if (characterId === 'may') {
    // Dog long floppy ears bouncing with secondary physics
    earsSvg = `
      <g transform="translate(66, 48) rotate(${18 + earBounce})">
        <rect x="-9" y="0" width="18" height="42" rx="9" fill="url(#${earGradId})" stroke="#1E293B" stroke-width="2.5" filter="url(#softShadow)"/>
        <rect x="-5" y="7" width="10" height="28" rx="5" fill="${innerEarColor}"/>
      </g>
      <g transform="translate(134, 48) rotate(${-18 - earBounce})">
        <rect x="-9" y="0" width="18" height="42" rx="9" fill="url(#${earGradId})" stroke="#1E293B" stroke-width="2.5" filter="url(#softShadow)"/>
        <rect x="-5" y="7" width="10" height="28" rx="5" fill="${innerEarColor}"/>
      </g>
    `;
  } else if (characterId === 'bong') {
    // Bunny long upright ears bouncing with lag
    earsSvg = `
      <g transform="translate(82, 40) rotate(${-8 + earBounce})">
        <rect x="-9" y="-42" width="18" height="46" rx="9" fill="url(#${earGradId})" stroke="#1E293B" stroke-width="2.5" filter="url(#softShadow)"/>
        <rect x="-5" y="-38" width="10" height="36" rx="5" fill="${innerEarColor}"/>
      </g>
      <g transform="translate(118, 40) rotate(${8 - earBounce})">
        <rect x="-9" y="-42" width="18" height="46" rx="9" fill="url(#${earGradId})" stroke="#1E293B" stroke-width="2.5" filter="url(#softShadow)"/>
        <rect x="-5" y="-38" width="10" height="36" rx="5" fill="${innerEarColor}"/>
      </g>
    `;
  } else if (characterId === 'miu') {
    // Cat pointy ears
    earsSvg = `
      <g transform="translate(0, ${earBounce * 0.3})">
        <polygon points="60,48 74,22 88,42" fill="url(#${earGradId})" stroke="#1E293B" stroke-width="2.5" filter="url(#softShadow)"/>
        <polygon points="65,45 74,28 84,40" fill="${innerEarColor}"/>
        <polygon points="112,42 126,22 140,48" fill="url(#${earGradId})" stroke="#1E293B" stroke-width="2.5" filter="url(#softShadow)"/>
        <polygon points="116,40 126,28 135,45" fill="${innerEarColor}"/>
      </g>
    `;
  } else if (characterId === 'lumi') {
    // Unicorn horn + ears + rainbow mane
    earsSvg = `
      <!-- Golden Unicorn Horn with Shimmer -->
      <g transform="translate(100, 36)" filter="url(#softShadow)">
        <polygon points="0,-30 -8,6 8,6" fill="url(#goldGrad)" stroke="#B8860B" stroke-width="2"/>
        <line x1="-5" y1="-2" x2="5" y2="-12" stroke="#FFFFFF" stroke-width="2.8"/>
        <line x1="-3" y1="-15" x2="3" y2="-24" stroke="#FFFFFF" stroke-width="2.8"/>
        <circle cx="0" cy="-30" r="3" fill="#FFD700"/>
      </g>
      <!-- Rainbow Mane -->
      <path d="M88,38 C74,30 68,55 78,65" fill="#FF4D6D" stroke="#1E293B" stroke-width="2"/>
      <path d="M90,44 C76,36 72,58 82,68" fill="#FFD166" stroke="#1E293B" stroke-width="2"/>
      <path d="M92,50 C80,44 76,64 86,74" fill="#06D6A0" stroke="#1E293B" stroke-width="2"/>
      <!-- Ears -->
      <polygon points="64,50 74,26 84,44" fill="url(#${earGradId})" stroke="#1E293B" stroke-width="2"/>
      <polygon points="116,44 126,26 136,50" fill="url(#${earGradId})" stroke="#1E293B" stroke-width="2"/>
    `;
  } else if (characterId === 'cinnamoroll') {
    earsSvg = `
      <g transform="translate(62, 57) rotate(${-7 + earBounce * 0.55})">
        <path d="M0,2 C-18,-13 -47,-15 -56,2 C-63,14 -56,27 -41,28 C-24,28 -10,18 0,8 Z" fill="#FFFDFC" stroke="#75A9C7" stroke-width="2.2" filter="url(#softShadow)"/>
        <path d="M-48,5 Q-31,-5 -14,7" fill="none" stroke="#FFFFFF" stroke-opacity=".72" stroke-width="5" stroke-linecap="round"/>
      </g>
      <g transform="translate(138, 57) rotate(${7 - earBounce * 0.55})">
        <path d="M0,2 C18,-13 47,-15 56,2 C63,14 56,27 41,28 C24,28 10,18 0,8 Z" fill="#FFFDFC" stroke="#75A9C7" stroke-width="2.2" filter="url(#softShadow)"/>
        <path d="M48,5 Q31,-5 14,7" fill="none" stroke="#FFFFFF" stroke-opacity=".72" stroke-width="5" stroke-linecap="round"/>
      </g>
    `;
  } else if (characterId === 'kuromi') {
    earsSvg = `
      <g transform="translate(100, 46)" filter="url(#softShadow)">
        <path d="M-38,15 C-42,-22 -20,-42 -44,-52 C-52,-55 -58,-44 -44,-28 C-35,-12 -22,10 -18,20 Z" fill="#2D2B30" stroke="${outlineColor}" stroke-width="2.5"/>
        <path d="M38,15 C42,-22 20,-42 44,-52 C52,-55 58,-44 44,-28 C35,-12 22,10 18,20 Z" fill="#2D2B30" stroke="${outlineColor}" stroke-width="2.5"/>
        <path d="M-40,12 C-28,-20 0,-28 28,-20 C40,12 34,26 0,26 C-34,26 -40,12 -40,12 Z" fill="#2D2B30" stroke="${outlineColor}" stroke-width="2.5"/>
        <circle cx="-44" cy="-52" r="6.5" fill="#FF69B4" stroke="#1E293B" stroke-width="1.5"/>
        <circle cx="44" cy="-52" r="6.5" fill="#FF69B4" stroke="#1E293B" stroke-width="1.5"/>
        <g transform="translate(0, -6) scale(0.9)">
          <circle cx="0" cy="0" r="9" fill="#FF69B4"/>
          <rect x="-6" y="4" width="12" height="6" rx="2" fill="#FF69B4"/>
          <circle cx="-3.5" cy="-1" r="2" fill="#2D2B30"/>
          <circle cx="3.5" cy="-1" r="2" fill="#2D2B30"/>
        </g>
      </g>
    `;
  } else if (characterId === 'po') {
    earsSvg = `
      <circle cx="64" cy="40" r="13" fill="#18181B" stroke="${outlineColor}" stroke-width="2.5"/>
      <circle cx="136" cy="40" r="13" fill="#18181B" stroke="${outlineColor}" stroke-width="2.5"/>
    `;
  }

  // Tail rendering
  let tailSvg = '';
  if (characterId === 'miu') {
    tailSvg = `
      <path d="M68,124 C46,${118 + tailWiggle} 50,88 68,92" fill="none" stroke="url(#miuGrad)" stroke-width="9" stroke-linecap="round" filter="url(#softShadow)"/>
    `;
  } else if (characterId === 'may') {
    tailSvg = `
      <path d="M132,118 Q${148 + tailWiggle},${102 + tailWiggle} 138,90" fill="none" stroke="url(#mayGrad)" stroke-width="8" stroke-linecap="round" filter="url(#softShadow)"/>
    `;
  } else if (characterId === 'bong') {
    tailSvg = `
      <circle cx="62" cy="118" r="9.5" fill="#FFFFFF" stroke="#1E293B" stroke-width="2.2" filter="url(#softShadow)"/>
    `;
  } else if (characterId === 'lumi') {
    tailSvg = `
      <g transform="translate(134, 112) rotate(${tailWiggle})" filter="url(#softShadow)">
        <path d="M0,0 Q22,12 16,32" fill="none" stroke="#FF4D6D" stroke-width="5.5" stroke-linecap="round"/>
        <path d="M0,0 Q27,20 22,38" fill="none" stroke="#FFD166" stroke-width="5.5" stroke-linecap="round"/>
        <path d="M0,0 Q30,26 24,44" fill="none" stroke="#118AB2" stroke-width="5.5" stroke-linecap="round"/>
      </g>
    `;
  } else if (characterId === 'cinnamoroll') {
    tailSvg = `
      <g transform="translate(139, 116) rotate(${tailWiggle * 0.35})" filter="url(#softShadow)">
        <path d="M0,0 C22,-5 26,25 7,27 C-6,28 -8,12 3,10 C12,9 14,18 8,20"
          fill="none" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round"/>
        <path d="M1,-1 C18,-3 21,19 8,21" fill="none" stroke="#DCEEFF" stroke-width="2.2" stroke-linecap="round" opacity=".85"/>
      </g>
    `;
  } else if (characterId === 'kuromi') {
    tailSvg = `
      <g transform="translate(139, 116) rotate(${tailWiggle * 0.45})" filter="url(#softShadow)">
        <path d="M0,0 Q22,8 18,28" fill="none" stroke="#2D2B30" stroke-width="7" stroke-linecap="round"/>
        <path d="M18,28 l-8,-3 l7,11 l9,-9 Z" fill="#2D2B30" stroke="#1E293B" stroke-width="1.5"/>
      </g>
    `;
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="${width}" height="${height}">
      <defs>
        <!-- Soft Drop Shadow -->
        <filter id="softShadow" x="-24%" y="-24%" width="148%" height="156%" color-interpolation-filters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3.2" result="blur"/>
          <feOffset in="blur" dx="0" dy="4" result="offsetBlur"/>
          <feComponentTransfer in="offsetBlur" result="shadowAlpha">
            <feFuncA type="linear" slope="0.22"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="shadowAlpha"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        <!-- Blush Glow -->
        <radialGradient id="blushGrad">
          <stop offset="0%" stop-color="#FF8A9A" stop-opacity="0.75"/>
          <stop offset="100%" stop-color="#FF8A9A" stop-opacity="0"/>
        </radialGradient>

        <!-- Gold Metal Grad -->
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFE259"/>
          <stop offset="100%" stop-color="#FFA751"/>
        </linearGradient>

        <!-- Angel Wings Grad -->
        <linearGradient id="wingsAngelGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#FFFFFF"/>
          <stop offset="100%" stop-color="#E2E8F0"/>
        </linearGradient>

        <!-- Bara Capybara Soft 2.5D Gradient -->
        <linearGradient id="baraGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#E0A96D"/>
          <stop offset="100%" stop-color="#B87B42"/>
        </linearGradient>
        <linearGradient id="baraBellyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#FFF0DF"/>
          <stop offset="100%" stop-color="#F3D5B5"/>
        </linearGradient>
        <linearGradient id="baraEarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#C88D58"/>
          <stop offset="100%" stop-color="#A56E3B"/>
        </linearGradient>

        <!-- Kuromi hood/body material -->
        <linearGradient id="kuromiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#403845"/>
          <stop offset="48%" stop-color="#2D2B30"/>
          <stop offset="100%" stop-color="#17131B"/>
        </linearGradient>
        <linearGradient id="poEarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#27272A"/>
          <stop offset="100%" stop-color="#09090B"/>
        </linearGradient>

        <!-- Mây Dog Soft Gradient -->
        <linearGradient id="mayGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#FFFFFF"/>
          <stop offset="100%" stop-color="#F1ECE1"/>
        </linearGradient>
        <linearGradient id="mayBellyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#FFFBF5"/>
          <stop offset="100%" stop-color="#FFEED9"/>
        </linearGradient>
        <linearGradient id="mayEarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#F5EFE6"/>
          <stop offset="100%" stop-color="#E2D9CC"/>
        </linearGradient>

        <!-- Bông Bunny Soft Gradient -->
        <linearGradient id="bongGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#FFEBF0"/>
          <stop offset="100%" stop-color="#FFC2D1"/>
        </linearGradient>
        <linearGradient id="bongBellyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#FFFFFF"/>
          <stop offset="100%" stop-color="#FFF0F5"/>
        </linearGradient>
        <linearGradient id="bongEarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#FFD6E0"/>
          <stop offset="100%" stop-color="#FFA8BC"/>
        </linearGradient>

        <!-- Miu Cat Soft Gradient -->
        <linearGradient id="miuGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#FFBB73"/>
          <stop offset="100%" stop-color="#E67E22"/>
        </linearGradient>
        <linearGradient id="miuBellyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#FFF8EE"/>
          <stop offset="100%" stop-color="#FFE0B2"/>
        </linearGradient>
        <linearGradient id="miuEarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#F39C12"/>
          <stop offset="100%" stop-color="#D35400"/>
        </linearGradient>

        <!-- Lumi Unicorn Soft Gradient -->
        <linearGradient id="lumiGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#FAF5FF"/>
          <stop offset="100%" stop-color="#E9D5FF"/>
        </linearGradient>
        <linearGradient id="lumiBellyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#FFFFFF"/>
          <stop offset="100%" stop-color="#F5F3FF"/>
        </linearGradient>
        <linearGradient id="lumiEarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#F3E8FF"/>
          <stop offset="100%" stop-color="#D8B4FE"/>
        </linearGradient>
      </defs>

      <!-- GROUND CONTACT SHADOW DISK -->
      <ellipse cx="100" cy="168" rx="${shadowRadiusX}" ry="${shadowRadiusY}" fill="#0F172A" opacity="${shadowOpacity}"/>

      <!-- SKELETON MASTER ROOT -->
      <g transform="translate(0, ${bodyY}) rotate(${bodyRotate}, 100, 100) scale(${scaleX}, ${scaleY})" transform-origin="100 100">
        <!-- Wings Background -->
        ${wingsSvg}

        <!-- Tail -->
        ${tailSvg}

        <!-- Backpack -->
        ${backpackSvg}

        <!-- Feet / Paws -->
        <g id="paws" filter="url(#softShadow)">
          <g transform="rotate(${legLeftAngle}, 78, 138)" transform-origin="78 138">
            <rect x="68" y="132" width="20" height="18" rx="9" fill="url(#${mainGradId})" stroke="${outlineColor}" stroke-width="2.5"/>
          </g>
          <g transform="rotate(${legRightAngle}, 122, 138)" transform-origin="122 138">
            <rect x="112" y="132" width="20" height="18" rx="9" fill="url(#${mainGradId})" stroke="${outlineColor}" stroke-width="2.5"/>
          </g>
        </g>

        <!-- Main Body Chassis: character-specific proportions -->
        ${characterId === 'cinnamoroll' ? `
          <ellipse cx="100" cy="116" rx="48" ry="37" fill="#FFFDFC" stroke="#75A9C7" stroke-width="2.2" filter="url(#softShadow)"/>
          <ellipse cx="88" cy="102" rx="22" ry="10" fill="#FFFFFF" opacity=".58"/>
        ` : characterId === 'kuromi' ? `
          <path d="M53 101 Q60 83 82 80 L118 80 Q140 83 147 101 L145 133 Q128 151 100 151 Q72 151 55 133Z" fill="url(#kuromiGrad)" stroke="#27212D" stroke-width="2.7" filter="url(#softShadow)"/>
          <g transform="translate(100 112) scale(.52)"><circle cx="0" cy="0" r="9" fill="#FF69B4"/><rect x="-6" y="4" width="12" height="6" rx="2" fill="#FF69B4"/><circle cx="-3.5" cy="-1" r="2" fill="#2D2B30"/><circle cx="3.5" cy="-1" r="2" fill="#2D2B30"/></g>
        ` : characterId === 'bara' || characterId === 'capy_tie' ? `
          <rect x="44" y="82" width="112" height="68" rx="30" fill="url(#baraGrad)" stroke="#5B4028" stroke-width="2.8" filter="url(#softShadow)"/>
          <path d="M58 95 Q96 78 141 94" fill="none" stroke="#F1C38E" stroke-opacity=".32" stroke-width="7" stroke-linecap="round"/>
        ` : `
          <rect x="50" y="84" width="100" height="60" rx="30" fill="url(#${mainGradId})" stroke="${outlineColor}" stroke-width="3" filter="url(#softShadow)"/>
          <ellipse cx="100" cy="115" rx="32" ry="23" fill="url(#${bellyGradId})"/>
        `}

        ${characterId === 'capy_tie' ? `
          <!-- Capybara Shirt & Tie -->
          <g transform="translate(100, 112)">
            <path d="M-26,-15 L26,-15 L22,20 L-22,20 Z" fill="#7DD3FC" stroke="#1E293B" stroke-width="2"/>
            <polygon points="-12,-15 -22,-5 -10,-5" fill="#FFFFFF" stroke="#1E293B" stroke-width="1.5"/>
            <polygon points="12,-15 22,-5 10,-5" fill="#FFFFFF" stroke="#1E293B" stroke-width="1.5"/>
            <polygon points="0,-12 -5,-5 0,18 5,-5" fill="#1E40AF" stroke="#1D4ED8" stroke-width="1.5"/>
          </g>
        ` : ''}

        ${characterId === 'po' ? `
          <!-- Kung Fu Po Pants & Dumpling Bowl -->
          <g transform="translate(100, 115)">
            <rect x="-32" y="2" width="64" height="20" rx="6" fill="#18181B" stroke="#1E293B" stroke-width="2"/>
            <rect x="-32" y="-1" width="64" height="6" fill="#F59E0B"/>
            <path d="M-18,10 C-18,24 18,24 18,10 Z" fill="#D97706" stroke="#1E293B" stroke-width="2"/>
            <circle cx="-8" cy="8" r="4.5" fill="#FFFBEB"/>
            <circle cx="0" cy="5" r="5.5" fill="#FFFBEB"/>
            <circle cx="8" cy="8" r="4.5" fill="#FFFBEB"/>
          </g>
        ` : ''}

        <!-- Left Arm -->
        <g transform="translate(56, 102) rotate(${armLeftAngle})" transform-origin="0 0" filter="url(#softShadow)">
          <rect x="-22" y="-7" width="24" height="14" rx="7" fill="url(#${mainGradId})" stroke="${outlineColor}" stroke-width="2.5"/>
        </g>

        <!-- Right Arm -->
        <g transform="translate(144, 102) rotate(${armRightAngle})" transform-origin="0 0" filter="url(#softShadow)">
          <rect x="-2" y="-7" width="24" height="14" rx="7" fill="url(#${mainGradId})" stroke="${outlineColor}" stroke-width="2.5"/>
        </g>

        <!-- Ears -->
        ${earsSvg}

        <!-- Head Bone Group -->
        <g transform="translate(0, ${headY}) rotate(${headRotate}, 100, 72)" transform-origin="100 72">
          <!-- Character-specific head/face. Licensed-character references are
               recreated procedurally; no downloaded web artwork is embedded. -->
          ${characterId === 'cinnamoroll' ? `
            <!-- Cinnamoroll: broad white puppy face, blue eyes, pink cheeks, no generic dog nose -->
            <ellipse cx="100" cy="72" rx="47" ry="35" fill="#FFFDFC" stroke="#B9DDF5" stroke-width="2.4" filter="url(#softShadow)"/>
            <ellipse cx="81" cy="69" rx="5.6" ry="8.2" fill="#63B3ED"/>
            <ellipse cx="119" cy="69" rx="5.6" ry="8.2" fill="#63B3ED"/>
            <circle cx="79.5" cy="66.5" r="1.7" fill="#FFFFFF"/>
            <circle cx="117.5" cy="66.5" r="1.7" fill="#FFFFFF"/>
            <ellipse cx="72" cy="79" rx="9" ry="4.8" fill="#F9A8D4" opacity=".55"/>
            <ellipse cx="128" cy="79" rx="9" ry="4.8" fill="#F9A8D4" opacity=".55"/>
            ${userTalking
              ? `<ellipse cx="100" cy="82" rx="5" ry="${4 + Math.abs(Math.sin(tick * 0.45)) * 4}" fill="#8B3A4A"/>
                 <ellipse cx="100" cy="84" rx="3.2" ry="1.8" fill="#FF9FB2"/>`
              : `<path d="M94 79 Q100 87 106 79" fill="none" stroke="#7C4A55" stroke-width="2.3" stroke-linecap="round"/>
                 <path d="M100 80 v4" stroke="#7C4A55" stroke-width="1.6" stroke-linecap="round"/>`}
          ` : characterId === 'kuromi' ? `
            <!-- Kuromi: white face framed by the black jester hood -->
            <ellipse cx="100" cy="74" rx="42" ry="34" fill="#FFF9F8" stroke="#2D2B30" stroke-width="2.8" filter="url(#softShadow)"/>
            <path d="M70 64 Q80 57 91 65" fill="none" stroke="#2D2B30" stroke-width="3.2" stroke-linecap="round"/>
            <path d="M109 65 Q120 57 130 64" fill="none" stroke="#2D2B30" stroke-width="3.2" stroke-linecap="round"/>
            <ellipse cx="82" cy="70" rx="4.5" ry="6.8" fill="#2D2B30"/>
            <ellipse cx="118" cy="70" rx="4.5" ry="6.8" fill="#2D2B30"/>
            <path d="M78 64 l-5 -4 M122 64 l5 -4" stroke="#2D2B30" stroke-width="2" stroke-linecap="round"/>
            <ellipse cx="100" cy="78" rx="3.4" ry="2.5" fill="#F472B6"/>
            <ellipse cx="72" cy="80" rx="7.5" ry="3.8" fill="#F9A8D4" opacity=".45"/>
            <ellipse cx="128" cy="80" rx="7.5" ry="3.8" fill="#F9A8D4" opacity=".45"/>
            ${userTalking
              ? `<ellipse cx="100" cy="87" rx="5" ry="${3.5 + Math.abs(Math.sin(tick * 0.45)) * 3}" fill="#2D2B30"/>
                 <ellipse cx="100" cy="89" rx="3" ry="1.6" fill="#F472B6"/>`
              : `<path d="M93 85 Q100 91 108 84" fill="none" stroke="#2D2B30" stroke-width="2.3" stroke-linecap="round"/>`}
          ` : characterId === 'bara' || characterId === 'capy_tie' ? `
            <!-- Capybara: smaller eyes + long rectangular muzzle, closer to a real capybara silhouette -->
            <path d="M59 63 Q61 38 82 32 Q101 25 121 32 Q142 39 143 65 L139 88 Q129 105 101 108 Q73 105 61 89 Z"
              fill="url(#baraGrad)" stroke="#513923" stroke-width="2.6" filter="url(#softShadow)"/>
            <ellipse cx="82" cy="67" rx="4.2" ry="5.1" fill="#2B2118"/>
            <ellipse cx="119" cy="67" rx="4.2" ry="5.1" fill="#2B2118"/>
            <circle cx="80.8" cy="65.8" r="1.1" fill="#FFFFFF" opacity=".8"/>
            <circle cx="117.8" cy="65.8" r="1.1" fill="#FFFFFF" opacity=".8"/>
            <path d="M82 75 Q100 68 119 75 L116 95 Q100 103 84 95 Z" fill="#A67C58" opacity=".82"/>
            <ellipse cx="94" cy="82" rx="3.2" ry="2.6" fill="#2B2118"/>
            <ellipse cx="106" cy="82" rx="3.2" ry="2.6" fill="#2B2118"/>
            <path d="M100 85 v5" stroke="#2B2118" stroke-width="1.8"/>
            <path d="M100 90 Q95 94 91 92 M100 90 Q105 94 109 92" fill="none" stroke="#2B2118" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M83 84 l-18 -4 M84 88 l-20 2 M117 84 l18 -4 M116 88 l20 2" stroke="#6B513C" stroke-width="1.2" stroke-linecap="round" opacity=".8"/>
          ` : `
            <!-- Generic mascot face -->
            <ellipse cx="100" cy="72" rx="44" ry="36" fill="url(#${mainGradId})" stroke="#1E293B" stroke-width="3" filter="url(#softShadow)"/>
            <ellipse cx="100" cy="78" rx="18" ry="12" fill="url(#${bellyGradId})"/>
            <ellipse cx="100" cy="74" rx="5" ry="3.5" fill="#1E293B"/>
            ${characterId === 'miu' ? `
              <line x1="68" y1="76" x2="52" y2="72" stroke="#1E293B" stroke-width="2"/>
              <line x1="68" y1="80" x2="54" y2="82" stroke="#1E293B" stroke-width="2"/>
              <line x1="132" y1="76" x2="148" y2="72" stroke="#1E293B" stroke-width="2"/>
              <line x1="132" y1="80" x2="146" y2="82" stroke="#1E293B" stroke-width="2"/>
            ` : ''}
            <circle cx="68" cy="78" r="8.5" fill="url(#blushGrad)"/>
            <circle cx="132" cy="78" r="8.5" fill="url(#blushGrad)"/>
            ${eyesSvg}
            ${mouthSvg}
          `}

          <!-- Glasses -->
          ${glassesSvg}

          <!-- Bow -->
          ${bowSvg}

          <!-- Hat / Crown -->
          ${hatSvg}
        </g>
      </g>
    </svg>
  `;
}
