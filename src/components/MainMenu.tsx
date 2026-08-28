/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import MagicalWorldHub from './MagicalWorldHub';
import VersionInfoModal from './VersionInfoModal';
import { BUILD_INFO } from '../lib/buildInfo';
import {
  Sparkles,
  Trophy,
  Shirt,
  Volume2,
  VolumeX,
  Camera,
  Play,
  Flame,
  Users,
  Settings as SettingsIcon,
  ChevronRight,
  Lock,
  Heart,
  CheckCircle2,
  Sliders,
  HelpCircle,
  Award,
  Gamepad2,
  Compass,
  ArrowRight,
  Activity,
  Zap,
} from 'lucide-react';
import { PlayerProgress, GameScreen, WorldConfig, GameGesture } from '../types';
import { WORLDS, SKINS, ACHIEVEMENTS } from '../utils/progression';
import { CHARACTERS_CONFIG, getCharacterEmoji } from '../utils/characterRenderer';
import { audio } from '../lib/AudioEngine';

interface MainMenuProps {
  progress: PlayerProgress;
  onUpdateProgress: (updater: (p: PlayerProgress) => PlayerProgress) => void;
  onSelectScreen: (screen: GameScreen, options?: { world?: WorldConfig; workoutMode?: '5min' | '10min' }) => void;
  isStreaming: boolean;
  gesture: GameGesture;
  trackingFeedback: 'ok' | 'too_near' | 'too_far' | 'no_body' | 'no_legs' | 'not_centered' | 'near' | 'far';
  soundEnabled: boolean;
  onToggleSound: () => void;
  showPipCamera?: boolean;
  onTogglePipCamera?: (show: boolean) => void;
  onOpenCompanion?: () => void;
  onOpenWardrobe?: () => void;
  onOpenParentDashboard?: () => void;
  onOpenDailyMissions?: () => void;
  onOpenVoiceSettings?: () => void;
  onOpenTVMode?: () => void;
}

export default function MainMenu({
  progress,
  onUpdateProgress,
  onSelectScreen,
  isStreaming,
  gesture,
  trackingFeedback,
  soundEnabled,
  onToggleSound,
  showPipCamera = true,
  onTogglePipCamera,
  onOpenCompanion,
  onOpenWardrobe,
  onOpenParentDashboard,
  onOpenDailyMissions,
  onOpenVoiceSettings,
  onOpenTVMode,
}: MainMenuProps) {
  const [activeTab, setActiveTab] = useState<'home' | 'worlds' | 'minigames' | 'wardrobe' | 'achievements' | 'workout' | 'settings'>('home');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [minigameFilter, setMinigameFilter] = useState<'all' | '3d' | 'board' | 'reflex' | 'dance'>('all');
  const [wardrobeFilter, setWardrobeFilter] = useState<'all' | 'skin' | 'accessory'>('all');
  const [showVersionInfo, setShowVersionInfo] = useState(false);

  const buyOrEquipSkin = (item: typeof SKINS[0]) => {
    const isSkin = item.type === 'skin';
    const isUnlocked = isSkin
      ? progress.unlockedSkins.includes(item.id)
      : progress.unlockedAccessories.includes(item.id);

    if (isUnlocked) {
      audio.playPetCareAction();
      onUpdateProgress((prev) => ({
        ...prev,
        activeSkin: isSkin ? item.id : prev.activeSkin,
        activeAccessory: !isSkin ? (prev.activeAccessory === item.id ? '' : item.id) : prev.activeAccessory,
      }));
    } else {
      if (progress.stars >= item.cost) {
        audio.playPowerup();
        onUpdateProgress((prev) => {
          const unlockedSkins = isSkin ? [...prev.unlockedSkins, item.id] : prev.unlockedSkins;
          const unlockedAccessories = !isSkin ? [...prev.unlockedAccessories, item.id] : prev.unlockedAccessories;
          return {
            ...prev,
            stars: prev.stars - item.cost,
            unlockedSkins,
            unlockedAccessories,
            activeSkin: isSkin ? item.id : prev.activeSkin,
            activeAccessory: !isSkin ? item.id : prev.activeAccessory,
          };
        });
      } else {
        audio.playFail();
      }
    }
  };

  const activeSkinConfig = SKINS.find((s) => s.id === progress.activeSkin) || SKINS[0];
  const activeAccConfig = SKINS.find((s) => s.id === progress.activeAccessory);
  const activeCompanion = CHARACTERS_CONFIG.find((c) => c.id === progress.selectedCharacter) || CHARACTERS_CONFIG[0];
  const activeCompanionEmoji = getCharacterEmoji(activeCompanion.id);

  // Gestures label mapping
  const gestureLabel: { [key in GameGesture]?: string } = {
    standing: 'Đang Đứng Thẳng 🧍',
    left_arm_up: 'Giơ Tay Trái ✋',
    right_arm_up: 'Giơ Tay Phải ✋',
    both_arms_up: 'Giơ Hai Tay 🙌',
    jump: 'Nhảy Cao 🦘',
    duck: 'Cúi Người 🙇',
    tilt_left: 'Nghiêng Trái ↖️',
    tilt_right: 'Nghiêng Phải ↗️',
    hands_spread: 'Dang Hai Tay 🦅',
    clap: 'Vỗ Tay 👏',
    hands_head: 'Tay Lên Đầu 🙆',
    wave_left: 'Vẫy Tay Trái 👋',
    wave_right: 'Vẫy Tay Phải 👋',
    rainbow_skill: 'Tung Chiêu Cầu Vồng 🌈',
  };

  const unclaimedMissionsCount = progress.dailyMissions?.filter((m) => !m.isCompleted).length || 0;

  return (
    <div
      id="main-menu-hub"
      className="min-h-full w-full flex flex-col bg-[#FFF9F2] font-sans text-slate-800 relative pb-[calc(60px+env(safe-area-inset-bottom)+16px)] select-none"
      style={{
        backgroundImage:
          'radial-gradient(circle at 12% 15%, rgba(255, 192, 203, 0.35) 0%, transparent 35%), radial-gradient(circle at 88% 82%, rgba(186, 230, 253, 0.35) 0%, transparent 40%), radial-gradient(circle at 50% 50%, rgba(254, 240, 138, 0.15) 0%, transparent 60%)',
      }}
    >
      {/* 1. TOP FLOATING GLASS HEADER */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-pink-100 shadow-xs px-3 py-2 sm:px-5 sm:py-2.5 xl:px-8 xl:py-3 flex flex-col xl:flex-row xl:items-center justify-between gap-2 xl:gap-4">
        {/* Row 1: Profile Badge & Currency Tracker */}
        <div className="flex items-center justify-between gap-2 sm:gap-3 w-full xl:w-auto">
          {/* Left: Player Profile Pill */}
          <div
            id="player-profile-badge"
            onClick={() => {
              if (onOpenWardrobe) onOpenWardrobe();
              else setActiveTab('wardrobe');
            }}
            className="flex items-center gap-2 md:gap-3 bg-white/95 hover:bg-pink-50/80 px-2.5 py-1 md:px-3.5 md:py-1.5 rounded-full border-2 border-pink-200 shadow-xs cursor-pointer transition-all duration-200 hover:scale-102 active:scale-95 shrink-0 max-w-[55%] sm:max-w-none overflow-hidden"
            title="Xem thông tin bé & Tủ đồ trang phục"
          >
            <div className="relative shrink-0">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-tr from-pink-400 to-rose-300 border-2 border-white shadow-inner flex items-center justify-center text-white font-black text-xs md:text-sm">
                👑
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 md:w-4 md:h-4 bg-emerald-400 border border-white rounded-full flex items-center justify-center text-[7px] md:text-[8px] text-white font-bold">
                ✓
              </span>
            </div>
            <div className="leading-tight min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-black text-slate-800 text-xs md:text-base truncate">Phương Nhã</span>
                <span className="text-[9px] font-black bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded-full border border-pink-200 shrink-0">
                  LV.1
                </span>
              </div>
              <p className="text-[9px] md:text-[11px] font-bold text-pink-500 flex items-center gap-1 truncate">
                <span>⭐ Bé Chăm Vận Động</span>
              </p>
            </div>
          </div>

          {/* Center: Currency & Companion Tracker */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 md:gap-3 shrink-0">
            {/* Stars Pill */}
            <div
              id="currency-stars"
              className="flex items-center gap-1 bg-amber-50 hover:bg-amber-100/80 px-2 py-1 md:px-3 md:py-1.5 rounded-full border-2 border-amber-300 shadow-xs transition"
            >
              <span className="text-xs md:text-base">⭐</span>
              <span className="font-black text-amber-900 text-xs md:text-base">{progress.stars.toLocaleString()}</span>
            </div>

            {/* Diamonds Pill */}
            <div
              id="currency-diamonds"
              className="flex items-center gap-1 bg-cyan-50 hover:bg-cyan-100/80 px-2 py-1 md:px-3 md:py-1.5 rounded-full border-2 border-cyan-300 shadow-xs transition"
            >
              <span className="text-xs md:text-base">💎</span>
              <span className="font-black text-cyan-900 text-xs md:text-base">{progress.diamonds.toLocaleString()}</span>
            </div>

            {/* Active Mascot Chip */}
            <button
              onClick={() => {
                if (onOpenCompanion) onOpenCompanion();
                else setActiveTab('home');
              }}
              className="hidden sm:flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full border-2 border-emerald-300 shadow-xs transition active:scale-95 animate-in fade-in duration-200 shrink-0"
              title="Đổi bạn đồng hành"
            >
              <span className="text-sm md:text-base">{activeCompanionEmoji}</span>
              <span className="font-black text-emerald-800 text-xs">{activeCompanion.name}</span>
            </button>
          </div>
        </div>

        {/* Row 2: Quick Action Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2.5 xl:gap-3 w-full xl:w-auto overflow-x-auto no-scrollbar py-0.5">
          {/* Daily Missions Modal Trigger */}
          {onOpenDailyMissions && (
            <button
              id="header-daily-missions-btn"
              onClick={onOpenDailyMissions}
              className="relative p-1.5 px-2.5 md:p-2 md:px-3 md:py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-full border border-purple-300 shadow-xs transition active:scale-95 flex items-center gap-1 shrink-0"
              title="Nhiệm vụ hằng ngày nhận thưởng sao"
            >
              <span className="text-sm md:text-base">🎯</span>
              <span className="text-[11px] md:text-xs font-black">Nhiệm Vụ</span>
              {unclaimedMissionsCount > 0 && (
                <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping absolute top-0.5 right-0.5" />
              )}
            </button>
          )}

          {/* Parent Dashboard Modal Trigger */}
          {onOpenParentDashboard && (
            <button
              id="header-parent-dashboard-btn"
              onClick={onOpenParentDashboard}
              className="p-1.5 px-2.5 md:p-2 md:px-3 md:py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-full border border-indigo-300 shadow-xs transition active:scale-95 flex items-center gap-1 shrink-0"
              title="Bảng thống kê vận động dành cho bố mẹ"
            >
              <span className="text-sm md:text-base">📊</span>
              <span className="text-[11px] md:text-xs font-black">Phụ Huynh</span>
            </button>
          )}

          {onOpenTVMode && (
            <button id="header-tv-mode-btn" onClick={onOpenTVMode} className="p-1.5 px-2.5 md:p-2 md:px-3 md:py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-full border border-sky-300 shadow-xs transition active:scale-95 flex items-center gap-1 shrink-0" title="Chơi trên TV / Mi Box">
              <span className="text-sm md:text-base">📺</span><span className="text-[11px] md:text-xs font-black">TV / Mi Box</span>
            </button>
          )}

          <button
            id="header-version-info-btn"
            onClick={() => setShowVersionInfo(true)}
            className="p-1.5 px-2.5 md:p-2 md:px-3 md:py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-full border border-slate-300 shadow-xs transition active:scale-95 flex items-center gap-1 shrink-0"
            title="Xem phiên bản, thời gian build và ghi chú cập nhật"
          >
            <span className="text-sm md:text-base">ℹ️</span>
            <span className="text-[11px] md:text-xs font-black">v{BUILD_INFO.version}</span>
          </button>

          {/* Camera Quick Live Status */}
          <div className="flex items-center bg-white rounded-full p-0.5 border-2 border-emerald-300 shadow-xs shrink-0">
            <button
              id="header-camera-test-btn"
              onClick={() => onSelectScreen('cameratest')}
              className="flex items-center gap-1 py-0.5 px-2 rounded-full hover:bg-emerald-50 text-emerald-800 transition"
              title="Kiểm tra góc camera & nhận diện dáng người"
            >
              <span className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <Camera className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[11px] md:text-xs font-black">
                {isStreaming ? 'Cam Bật' : 'Camera'}
              </span>
            </button>

            {isStreaming && onTogglePipCamera && (
              <button
                id="header-camera-pip-toggle-btn"
                onClick={() => onTogglePipCamera(!showPipCamera)}
                className={`py-0.5 px-2 rounded-full text-[10px] font-black transition ${
                  showPipCamera
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                title="Bật/Ẩn khung hình camera bé"
              >
                {showPipCamera ? '👁️' : 'Ẩn'}
              </button>
            )}
          </div>

          {/* Unified Sound & Voice Settings Capsule (Right Side) */}
          <div className="flex items-center bg-white rounded-full p-0.5 border-2 border-pink-300 shadow-xs gap-1 shrink-0">
            {/* Sound Mute Toggle */}
            <button
              id="header-sound-toggle-btn"
              onClick={onToggleSound}
              className="p-1 px-1.5 rounded-full hover:bg-pink-50 text-pink-600 transition active:scale-95 flex items-center gap-1"
              title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-pink-600" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            <div className="w-[1px] h-3 bg-pink-200" />

            {/* Voice Guide Settings */}
            {onOpenVoiceSettings && (
              <button
                id="header-voice-settings-btn"
                onClick={onOpenVoiceSettings}
                className="p-1 px-1.5 rounded-full hover:bg-pink-50 text-pink-700 transition active:scale-95 flex items-center gap-0.5"
                title="Tùy chọn giọng nói hướng dẫn (Nữ/Nam/Em bé)"
              >
                <span className="text-sm">🎙️</span>
                <span className="text-[11px] md:text-xs font-black">Giọng</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. TOP GREETING BANNER & LIVE POSE INDICATOR */}
      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 pt-4 pb-2">
        <div className="bg-gradient-to-r from-pink-400/90 via-purple-400/90 to-blue-400/90 rounded-2xl p-3 md:p-4 text-white shadow-md flex flex-wrap items-center justify-between gap-3 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="text-3xl animate-bounce">✨</span>
            <div>
              <h1 className="text-sm md:text-base font-black tracking-wide">
                Chào mừng Phương Nhã đến với Thế Giới Vận Động! 🌈
              </h1>
              <p className="text-[11px] md:text-xs text-pink-100 font-medium">
                Đứng cách camera 1.5m – 2.5m để các trò chơi nhận diện chuẩn xác nhất nhé!
              </p>
            </div>
          </div>

          {/* Live Gesture Detection Chip */}
          <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/30 text-xs font-black">
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
            <span className="text-white/80">Nhận diện:</span>
            <span className="text-amber-200 uppercase">{gestureLabel[gesture] || gesture}</span>
          </div>
        </div>
      </div>

      {/* 3. MAIN CONTENT CONTAINER */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-4">
        {/* ================= VIEW: HOME ================= */}
        {activeTab === 'home' && (
          <div className="flex flex-col gap-6">
            <MagicalWorldHub onRace={() => onSelectScreen('racing')} onFashion={() => onSelectScreen('dressing')} onGames={() => setActiveTab('minigames')} onWorlds={() => setActiveTab('worlds')} />
            {/* ROW 1: TWO FLAGSHIP SHOWCASE CARDS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Flagship Card 1: Bara Speed Racing 3D */}
              <div
                id="home-card-racing"
                onClick={() => onSelectScreen('racing')}
                className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 text-white p-6 border-4 border-cyan-400/80 shadow-2xl hover:border-cyan-300 transition-all duration-300 cursor-pointer flex flex-col justify-between"
              >
                {/* Background Glow Decors */}
                <div className="absolute -right-8 -bottom-8 text-9xl opacity-15 select-none transition-transform group-hover:scale-110">
                  🏎️
                </div>
                <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-3 py-1 bg-gradient-to-r from-amber-400 to-cyan-400 text-slate-950 font-black text-xs rounded-full shadow-md uppercase tracking-wider">
                      SIÊU PHẨM 3D • ĐUA XE
                    </span>
                    <span className="text-xs font-black text-cyan-300 flex items-center gap-1">
                      <span>⚡ Drift & Nitro</span>
                    </span>
                  </div>

                  <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-300 to-cyan-300 mb-2">
                    Bara Speed Racing 3D
                  </h2>
                  <p className="text-xs md:text-sm text-cyan-100 font-medium leading-relaxed max-w-md">
                    Đua xe Arcade 3D siêu tốc! Lái xe bằng vô lăng camera cử chỉ tay, Drift bốc khói, nạp Nitro bứt phá và mở khóa 9 siêu xe Neon rực rỡ!
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-cyan-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                    <span>🏆 6 Đường Đua Đêm</span>
                    <span>•</span>
                    <span>🚗 9 Siêu Xe Tùy Biến</span>
                  </div>
                  <button className="px-5 py-2 bg-gradient-to-r from-amber-400 to-cyan-400 hover:from-amber-300 hover:to-cyan-300 text-slate-950 font-black text-xs md:text-sm rounded-full shadow-lg flex items-center gap-2 transition-transform group-hover:translate-x-1">
                    <span>ĐUA NGAY</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Flagship Card 2: 6 Thế Giới Phiêu Lưu */}
              <div
                id="home-card-adventure"
                onClick={() => setActiveTab('worlds')}
                className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 text-white p-6 border-4 border-pink-300 shadow-2xl hover:border-pink-200 transition-all duration-300 cursor-pointer flex flex-col justify-between"
              >
                <div className="absolute -right-8 -bottom-8 text-9xl opacity-15 select-none transition-transform group-hover:scale-110">
                  🚀
                </div>
                <div className="absolute top-0 right-0 w-48 h-48 bg-pink-300/20 rounded-full blur-3xl pointer-events-none" />

                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-3 py-1 bg-white text-pink-600 font-black text-xs rounded-full shadow-md uppercase tracking-wider">
                      CỐT TRUYỆN • 6 THẾ GIỚI
                    </span>
                    <span className="text-xs font-black text-pink-200 flex items-center gap-1">
                      <span>⭐ Thu thập sao diệu kỳ</span>
                    </span>
                  </div>

                  <h2 className="text-2xl md:text-3xl font-black text-white mb-2">
                    Hành Trình Khám Phá 6 Thế Giới
                  </h2>
                  <p className="text-xs md:text-sm text-pink-100 font-medium leading-relaxed max-w-md">
                    Đồng hành cùng Phương Nhã vượt qua Rừng Xanh 🌲, Xứ Sở Kẹo Ngọt 🍭, Đại Dương Xanh 🐬 và Vũ Trụ Ngàn Sao 🚀 bằng các động tác nhảy, né và vươn tay!
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-pink-300/30 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xl">
                    <span>🌲</span>
                    <span>🌸</span>
                    <span>🍭</span>
                    <span>🐬</span>
                    <span>🚀</span>
                    <span>🏰</span>
                  </div>
                  <button className="px-5 py-2 bg-white hover:bg-pink-50 text-pink-600 font-black text-xs md:text-sm rounded-full shadow-lg flex items-center gap-2 transition-transform group-hover:translate-x-1">
                    <span>KHÁM PHÁ</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* ROW 2: CHARACTER STAGE & TWO ACTION HUBS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              {/* Left Action Hub (Ludo & Workout) - 4 cols */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                {/* Cờ Cá Ngựa Card */}
                <div
                  id="home-card-ludo"
                  onClick={() => onSelectScreen('ludo')}
                  className="bg-white hover:bg-indigo-50/50 rounded-3xl p-5 border-4 border-indigo-200 shadow-lg hover:border-indigo-400 transition cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-3xl">🎲</span>
                      <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full uppercase">
                        2 - 4 Người / Đấu Máy
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-indigo-800 mb-1">Cờ Cá Ngựa Kỳ Diệu</h3>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      Tung xúc xắc 3D bằng cử chỉ vỗ tay, đạp chân đua ngựa về chuồng cùng bạn bè và gia đình!
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-indigo-100 flex items-center justify-between text-xs font-black text-indigo-600">
                    <span>Đua vui gia đình</span>
                    <span className="flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-full">
                      Chơi Ngay 🏇
                    </span>
                  </div>
                </div>

                {/* Vận Động Mỗi Ngày Card */}
                <div
                  id="home-card-workout"
                  onClick={() => setActiveTab('workout')}
                  className="bg-white hover:bg-rose-50/50 rounded-3xl p-5 border-4 border-rose-200 shadow-lg hover:border-rose-400 transition cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-3xl">🏃‍♀️</span>
                      <span className="text-[10px] font-black bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full uppercase">
                        Playlist 5 & 10 Phút
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-rose-700 mb-1">Vận Động Mỗi Ngày</h3>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      Chuỗi bài tập tự động đổi trò chơi liên hoàn giúp bé rèn luyện thể chất và đốt cháy calo vui vẻ!
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-rose-100 flex items-center justify-between text-xs font-black text-rose-600">
                    <span className="flex items-center gap-1">
                      <Flame className="w-4 h-4 text-orange-500" />
                      ~30 - 70 Kcal
                    </span>
                    <span className="flex items-center gap-1 bg-rose-50 px-2.5 py-1 rounded-full">
                      Tập Ngay 🔥
                    </span>
                  </div>
                </div>
              </div>

              {/* Center Character Interactive Showcase - 4 cols */}
              <div className="lg:col-span-4 bg-gradient-to-b from-pink-100/70 to-purple-100/70 rounded-3xl p-6 border-4 border-pink-200 shadow-lg flex flex-col items-center justify-between relative overflow-hidden text-center">
                <div className="w-full flex items-center justify-between text-xs font-black">
                  <span className="bg-white/80 text-pink-700 px-3 py-1 rounded-full shadow-xs">
                    Công Chúa Phương Nhã 👑
                  </span>
                  <button
                    onClick={() => {
                      if (onOpenWardrobe) onOpenWardrobe();
                      else setActiveTab('wardrobe');
                    }}
                    className="bg-yellow-400 hover:bg-yellow-500 text-yellow-950 px-3 py-1 rounded-full shadow-xs transition active:scale-95"
                  >
                    👗 Đổi Đồ
                  </button>
                </div>

                {/* Magical Stage Bubble */}
                <div className="my-4 relative flex items-center justify-center">
                  <div className="w-44 h-44 md:w-48 md:h-48 rounded-full bg-white/90 border-4 border-dashed border-pink-300 shadow-inner flex items-center justify-center relative animate-float-slow">
                    {/* Active Accessories */}
                    {activeAccConfig?.id === 'fairy_wings' && (
                      <span className="absolute -top-3 text-4xl">🪽</span>
                    )}
                    {activeAccConfig?.id === 'angel_halo' && (
                      <span className="absolute -top-6 text-3xl animate-pulse">✨</span>
                    )}
                    {activeAccConfig?.id === 'bunny_ears' && (
                      <span className="absolute -top-7 text-4xl">🐰</span>
                    )}
                    {activeAccConfig?.id === 'straw_hat' && (
                      <span className="absolute -top-7 text-3xl">👒</span>
                    )}

                    {/* Princess Avatar */}
                    <span className="text-7xl select-none">👸</span>

                    {activeAccConfig?.id === 'magic_wand' && (
                      <span className="absolute -right-2 bottom-3 text-3xl animate-bounce">🪄</span>
                    )}

                    {/* Mascot Beside */}
                    <div
                      onClick={() => {
                        if (onOpenCompanion) onOpenCompanion();
                        else setActiveTab('home');
                      }}
                      className="absolute -bottom-2 -left-2 w-12 h-12 bg-emerald-100 rounded-full border-2 border-emerald-300 shadow-md flex items-center justify-center text-2xl cursor-pointer hover:scale-110 transition"
                      title={`Bạn đồng hành: ${activeCompanion.name}`}
                    >
                      {activeCompanionEmoji}
                    </div>
                  </div>
                </div>

                <div className="w-full">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        if (onOpenCompanion) onOpenCompanion();
                        else setActiveTab('home');
                      }}
                      className="text-xs font-black text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1 rounded-full transition"
                    >
                      Bạn {activeCompanion.name} 🐾
                    </button>
                    <span className="text-xs font-bold text-pink-600 bg-pink-100 px-3 py-1 rounded-full">
                      {activeSkinConfig.name}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Quick Access Deck (Minigames & Co-op) - 4 cols */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                {/* Chơi Cùng Bố Mẹ Card */}
                <div
                  id="home-card-parentplay"
                  onClick={() => onSelectScreen('parentplay')}
                  className="bg-white hover:bg-purple-50/50 rounded-3xl p-5 border-4 border-purple-200 shadow-lg hover:border-purple-400 transition cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-3xl">👨‍👩‍👧</span>
                      <span className="text-[10px] font-black bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full uppercase">
                        Chế Độ Gia Đình
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-purple-800 mb-1">Chơi Cùng Bố Mẹ</h3>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      Thử thách phối hợp tiếp sức giữa bé và phụ huynh, cùng tạo dáng và bắt sao vui nhộn!
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-purple-100 flex items-center justify-between text-xs font-black text-purple-600">
                    <span>Tiếp sức gia đình</span>
                    <span className="flex items-center gap-1 bg-purple-50 px-2.5 py-1 rounded-full">
                      Thử Thách 🌟
                    </span>
                  </div>
                </div>

                {/* Toàn bộ Mini Games Hub Trigger */}
                <div
                  id="home-card-all-minigames"
                  onClick={() => setActiveTab('minigames')}
                  className="bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-3xl p-5 border-4 border-amber-300 shadow-lg hover:brightness-105 transition cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-3xl">🎮</span>
                      <span className="text-[10px] font-black bg-white/30 text-white px-2.5 py-0.5 rounded-full uppercase">
                        7 Mini Games
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-slate-950 mb-1">Khu Vườn Mini Games</h3>
                    <p className="text-xs text-slate-900 font-bold leading-relaxed">
                      Chém Trái Cây 🍉, Bắn Gà 🐔, Zombie Kẹo 🧸, Bắt Sao ⭐, Nhảy Vũ Điệu 💃!
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/30 flex items-center justify-between text-xs font-black text-slate-950">
                    <span>Khám phá ngay</span>
                    <span className="flex items-center gap-1 bg-white text-orange-600 px-3 py-1 rounded-full shadow-xs">
                      Xem Tất Cả 🎮
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 3: POPULAR MINI GAMES QUICK LAUNCHER */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border-4 border-pink-100 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🎪</span>
                  <div>
                    <h3 className="text-lg font-black text-slate-800">Trò Chơi Vận Động Phổ Biến</h3>
                    <p className="text-xs text-slate-500 font-bold">Chọn nhanh một trò chơi bé yêu thích để bắt đầu!</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('minigames')}
                  className="text-xs font-black text-pink-600 hover:text-pink-700 flex items-center gap-1"
                >
                  <span>Xem tất cả (7 trò)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* 1. Chém trái cây */}
                <button
                  onClick={() => onSelectScreen('fruitslash')}
                  className="bg-orange-50 hover:bg-orange-100 p-3.5 rounded-2xl border-2 border-orange-200 flex flex-col items-center text-center transition group active:scale-95"
                >
                  <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">🍉</span>
                  <span className="text-xs font-black text-orange-900 leading-tight">Chém Trái Cây</span>
                  <span className="text-[10px] text-orange-600 font-bold mt-1">Phản xạ nhanh</span>
                </button>

                {/* 2. Gà tinh nghịch */}
                <button
                  onClick={() => onSelectScreen('chickenblaster')}
                  className="bg-amber-50 hover:bg-amber-100 p-3.5 rounded-2xl border-2 border-amber-200 flex flex-col items-center text-center transition group active:scale-95"
                >
                  <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">🐔</span>
                  <span className="text-xs font-black text-amber-900 leading-tight">Gà Tinh Nghịch</span>
                  <span className="text-[10px] text-amber-700 font-bold mt-1">Ngắm bắn & né</span>
                </button>

                {/* 3. Zombie Kẹo */}
                <button
                  onClick={() => onSelectScreen('sweetzombie')}
                  className="bg-purple-50 hover:bg-purple-100 p-3.5 rounded-2xl border-2 border-purple-200 flex flex-col items-center text-center transition group active:scale-95"
                >
                  <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">🧸</span>
                  <span className="text-xs font-black text-purple-900 leading-tight">Zombie Kẹo</span>
                  <span className="text-[10px] text-purple-600 font-bold mt-1">Tạo dáng tay</span>
                </button>

                {/* 4. Bắt Sao */}
                <button
                  onClick={() => onSelectScreen('starcatcher')}
                  className="bg-yellow-50 hover:bg-yellow-100 p-3.5 rounded-2xl border-2 border-yellow-200 flex flex-col items-center text-center transition group active:scale-95"
                >
                  <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">⭐</span>
                  <span className="text-xs font-black text-yellow-900 leading-tight">Bắt Ngôi Sao</span>
                  <span className="text-[10px] text-yellow-700 font-bold mt-1">Vận động nhẹ</span>
                </button>

                {/* 5. Tạo dáng thần tượng */}
                <button
                  onClick={() => onSelectScreen('mimic')}
                  className="bg-pink-50 hover:bg-pink-100 p-3.5 rounded-2xl border-2 border-pink-200 flex flex-col items-center text-center transition group active:scale-95"
                >
                  <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">🤸‍♀️</span>
                  <span className="text-xs font-black text-pink-900 leading-tight">Tạo Dáng Idol</span>
                  <span className="text-[10px] text-pink-600 font-bold mt-1">Chuẩn động tác</span>
                </button>

                {/* 6. Vũ điệu âm nhạc */}
                <button
                  onClick={() => onSelectScreen('dance')}
                  className="bg-blue-50 hover:bg-blue-100 p-3.5 rounded-2xl border-2 border-blue-200 flex flex-col items-center text-center transition group active:scale-95"
                >
                  <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">💃</span>
                  <span className="text-xs font-black text-blue-900 leading-tight">Vũ Điệu Nhạc</span>
                  <span className="text-[10px] text-blue-600 font-bold mt-1">Theo nhịp rơi</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= VIEW: WORLDS ================= */}
        {activeTab === 'worlds' && (
          <div id="worlds-view" className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <button
                  onClick={() => setActiveTab('home')}
                  className="text-xs font-black text-pink-600 bg-pink-100 hover:bg-pink-200 px-3.5 py-1.5 rounded-full mb-2 transition inline-flex items-center gap-1"
                >
                  ← Về Menu Chính
                </button>
                <h2 className="text-2xl md:text-3xl font-black text-slate-800">Bản Đồ 6 Thế Giới Phiêu Lưu</h2>
                <p className="text-xs text-slate-500 font-bold mt-0.5">
                  Vượt chướng ngại vật, thu thập sao và hoàn thành thử thách thần kỳ!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {WORLDS.map((world, idx) => {
                const isUnlocked = progress.unlockedWorlds.includes(world.id) || world.minStarsToUnlock === 0;

                return (
                  <div
                    key={world.id}
                    className={`relative bg-white rounded-3xl p-6 border-4 shadow-xl flex flex-col justify-between transition-all duration-200 ${
                      isUnlocked
                        ? 'border-pink-200 hover:border-pink-400 hover:scale-102 cursor-pointer'
                        : 'border-slate-200 opacity-70 cursor-not-allowed'
                    }`}
                    onClick={() => {
                      if (isUnlocked) {
                        onSelectScreen('adventure', { world });
                      }
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-4xl">
                          {idx === 0 && '🌲'}
                          {idx === 1 && '🌸'}
                          {idx === 2 && '🍭'}
                          {idx === 3 && '🐬'}
                          {idx === 4 && '🚀'}
                          {idx === 5 && '🏰'}
                        </span>
                        {isUnlocked ? (
                          <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-700">
                            Sẵn Sàng
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-600">
                            <Lock className="w-3.5 h-3.5" />
                            Cần {world.minStarsToUnlock} ⭐
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-black text-slate-800 mb-1">{world.name}</h3>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">{world.description}</p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-slate-400 uppercase">Tốc độ: {world.speed}x</span>
                      {isUnlocked && (
                        <button className="flex items-center gap-1.5 px-4 py-2 rounded-full font-black text-xs bg-pink-500 hover:bg-pink-600 text-white shadow-md transition">
                          <Play className="w-3.5 h-3.5 fill-white" />
                          CHƠI NGAY
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= VIEW: MINIGAMES ================= */}
        {activeTab === 'minigames' && (
          <div id="minigames-view" className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <button
                  onClick={() => setActiveTab('home')}
                  className="text-xs font-black text-purple-600 bg-purple-100 hover:bg-purple-200 px-3.5 py-1.5 rounded-full mb-2 transition inline-flex items-center gap-1"
                >
                  ← Về Menu Chính
                </button>
                <h2 className="text-2xl md:text-3xl font-black text-slate-800">Khu Vườn Mini Games Vận Động</h2>
                <p className="text-xs text-slate-500 font-bold mt-0.5">
                  Tập luyện phản xạ, nhịp điệu, tốc độ và tương tác chuyển động vui nhộn!
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex gap-1.5 bg-white p-1 rounded-2xl border-2 border-purple-100 shadow-xs">
                <button
                  onClick={() => setMinigameFilter('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition ${
                    minigameFilter === 'all' ? 'bg-purple-600 text-white' : 'text-slate-600 hover:bg-purple-50'
                  }`}
                >
                  Tất Cả
                </button>
                <button
                  onClick={() => setMinigameFilter('3d')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition ${
                    minigameFilter === '3d' ? 'bg-purple-600 text-white' : 'text-slate-600 hover:bg-purple-50'
                  }`}
                >
                  🏎️ Đua Xe 3D
                </button>
                <button
                  onClick={() => setMinigameFilter('board')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition ${
                    minigameFilter === 'board' ? 'bg-purple-600 text-white' : 'text-slate-600 hover:bg-purple-50'
                  }`}
                >
                  🎲 Cờ & Gia Đình
                </button>
                <button
                  onClick={() => setMinigameFilter('reflex')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition ${
                    minigameFilter === 'reflex' ? 'bg-purple-600 text-white' : 'text-slate-600 hover:bg-purple-50'
                  }`}
                >
                  ⚡ Phản Xạ Nhanh
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Mini Game 1: Bara Speed Racing 3D */}
              {(minigameFilter === 'all' || minigameFilter === '3d') && (
                <div
                  id="minigame-racing-card"
                  onClick={() => onSelectScreen('racing')}
                  className="bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white rounded-3xl p-5 border-4 border-cyan-400 shadow-2xl hover:border-cyan-300 hover:scale-102 transition cursor-pointer flex flex-col justify-between relative overflow-hidden"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-4xl">🏎️</span>
                      <span className="text-[10px] font-black bg-gradient-to-r from-amber-400 to-cyan-400 text-slate-950 px-2.5 py-0.5 rounded-full shadow-xs uppercase">
                        SIÊU PHẨM 3D • ĐUA XE
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-300 to-cyan-300 mb-1">
                      Bara Speed Racing 3D
                    </h3>
                    <p className="text-xs text-cyan-100 font-medium leading-relaxed">
                      Đua xe 3D tốc độ cao, Drift bốc lửa, Nitro, 6 cung đường neon tuyệt đẹp, 9 siêu xe tùy biến gầm neon & cánh gió GT! Lái xe bằng camera cử chỉ tay.
                    </p>
                  </div>
                  <div className="mt-5 flex items-center justify-between pt-3 border-t border-cyan-500/30">
                    <span className="text-xs font-black text-amber-300">Đua tốc độ & Drift</span>
                    <button className="px-4 py-1.5 bg-gradient-to-r from-amber-400 to-cyan-400 text-slate-950 font-black text-xs rounded-full shadow-lg">
                      ĐUA NGAY 🏎️
                    </button>
                  </div>
                </div>
              )}

              {/* Mini Game 2: Cờ Cá Ngựa Kỳ Diệu */}
              {(minigameFilter === 'all' || minigameFilter === 'board') && (
                <div
                  id="minigame-ludo-card"
                  onClick={() => onSelectScreen('ludo')}
                  className="bg-white rounded-3xl p-5 border-4 border-indigo-300 shadow-xl hover:border-indigo-500 hover:scale-102 transition cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-4xl">🏇</span>
                      <span className="text-[10px] font-black bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2.5 py-0.5 rounded-full shadow-xs">
                        2 - 4 NGƯỜI / ĐẤU MÁY
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-indigo-800 mb-1">Cờ Cá Ngựa Kỳ Diệu</h3>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      Đua ngựa vui vẻ cùng bạn bè trên 1 màn hình hoặc chơi với máy AI! Xúc xắc 3D cử chỉ vỗ tay, ô Cầu Vồng 🌈 và Mascot dễ thương.
                    </p>
                  </div>
                  <div className="mt-5 flex items-center justify-between pt-3 border-t border-indigo-100">
                    <span className="text-xs font-black text-indigo-700">Đua vui cùng gia đình</span>
                    <button className="px-4 py-1.5 bg-indigo-600 text-white font-black text-xs rounded-full shadow-md">
                      CHƠI CỜ 🎲
                    </button>
                  </div>
                </div>
              )}

              {/* Mini Game 3: Chém Trái Cây */}
              {(minigameFilter === 'all' || minigameFilter === 'reflex') && (
                <div
                  id="minigame-fruitslash-card"
                  onClick={() => onSelectScreen('fruitslash')}
                  className="bg-white rounded-3xl p-5 border-4 border-orange-200 shadow-xl hover:border-orange-400 hover:scale-102 transition cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-4xl">🍉</span>
                      <span className="text-[10px] font-black bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                        PHẢN XẠ NHANH
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-orange-700 mb-1">Chém Trái Cây (Fruit Slash)</h3>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      Vung 2 tay thật nhanh như kiếm sĩ để chém dưa hấu, cam, táo! Bắt chéo 2 tay kích hoạt kỹ năng Cầu Vồng quét sạch trái cây.
                    </p>
                  </div>
                  <div className="mt-5 flex items-center justify-between pt-3 border-t border-orange-100">
                    <span className="text-xs font-black text-orange-600">Kỷ lục: {progress.highScores?.fruitslash || 0} điểm</span>
                    <button className="px-3.5 py-1.5 bg-orange-500 text-white font-black text-xs rounded-full shadow">
                      CHÉM NGAY 🍉
                    </button>
                  </div>
                </div>
              )}

              {/* Mini Game 4: Gà Tinh Nghịch */}
              {(minigameFilter === 'all' || minigameFilter === 'reflex') && (
                <div
                  id="minigame-chickenblaster-card"
                  onClick={() => onSelectScreen('chickenblaster')}
                  className="bg-white rounded-3xl p-5 border-4 border-amber-200 shadow-xl hover:border-amber-400 hover:scale-102 transition cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-4xl">🐔</span>
                      <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                        NGẮM BẮN & NÉ
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-amber-700 mb-1">Gà Tinh Nghịch</h3>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      Giơ tay ngắm bắn bong bóng phép thuật đưa các bạn gà về chuồng an toàn! Nghiêng hoặc cúi người để né trứng bay nhé.
                    </p>
                  </div>
                  <div className="mt-5 flex items-center justify-between pt-3 border-t border-amber-100">
                    <span className="text-xs font-black text-amber-700">Kỷ lục: {progress.highScores?.chickenblaster || 0} điểm</span>
                    <button className="px-3.5 py-1.5 bg-amber-500 text-white font-black text-xs rounded-full shadow">
                      BẮN BONG BÓNG 🫧
                    </button>
                  </div>
                </div>
              )}

              {/* Mini Game 5: Zombie Kẹo Ngọt */}
              {(minigameFilter === 'all' || minigameFilter === 'reflex') && (
                <div
                  id="minigame-sweetzombie-card"
                  onClick={() => onSelectScreen('sweetzombie')}
                  className="bg-white rounded-3xl p-5 border-4 border-purple-200 shadow-xl hover:border-purple-400 hover:scale-102 transition cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-4xl">🧸</span>
                      <span className="text-[10px] font-black bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        TẠO DÁNG TAY
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-purple-700 mb-1">Zombie Kẹo Ngọt</h3>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      Các quái vật nhỏ dễ thương bị buồn ngủ lạc vào vườn kẹo. Giơ tay trái, tay phải hoặc hai tay để giải lời nguyền đánh thức các bạn ấy!
                    </p>
                  </div>
                  <div className="mt-5 flex items-center justify-between pt-3 border-t border-purple-100">
                    <span className="text-xs font-black text-purple-700">Kỷ lục: {progress.highScores?.sweetzombie || 0} điểm</span>
                    <button className="px-3.5 py-1.5 bg-purple-500 text-white font-black text-xs rounded-full shadow">
                      ĐÁNH THỨC 🌈
                    </button>
                  </div>
                </div>
              )}

              {/* Mini Game 6: Bắt Sao */}
              {minigameFilter === 'all' && (
                <div
                  id="minigame-starcatcher-card"
                  onClick={() => onSelectScreen('starcatcher')}
                  className="bg-white rounded-3xl p-5 border-4 border-yellow-200 shadow-xl hover:border-yellow-400 hover:scale-102 transition cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-4xl">⭐</span>
                      <span className="text-[10px] font-black bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                        VẬN ĐỘNG NHẸ
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-yellow-700 mb-1">Bắt Ngôi Sao Phép Thuật</h3>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      Ngôi sao xuất hiện ở các góc! Bé hãy giơ tay trái, tay phải, hai tay hoặc cúi người để bắt trọn bộ sao lấp lánh trong 45 giây.
                    </p>
                  </div>
                  <div className="mt-5 flex items-center justify-between pt-3 border-t border-yellow-100">
                    <span className="text-xs font-black text-yellow-600">Kỷ lục: {progress.highScores.starcatcher || 0} điểm</span>
                    <button className="px-3.5 py-1.5 bg-yellow-500 text-white font-black text-xs rounded-full shadow">
                      BẮT ĐẦU CHƠI ⭐
                    </button>
                  </div>
                </div>
              )}

              {/* Mini Game 7: Tạo Dáng Thần Tượng */}
              {minigameFilter === 'all' && (
                <div
                  id="minigame-mimic-card"
                  onClick={() => onSelectScreen('mimic')}
                  className="bg-white rounded-3xl p-5 border-4 border-pink-200 shadow-xl hover:border-pink-400 hover:scale-102 transition cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-4xl">🤸‍♀️</span>
                      <span className="text-[10px] font-black bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">
                        TẠO DÁNG
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-pink-700 mb-1">Tạo Dáng Thần Tượng</h3>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      Quan sát hình bóng mẫu (Cây cầu vồng, Chim bay, Siêu nhân) và giữ dáng chuẩn xác trong 3 giây để đạt điểm Perfect!
                    </p>
                  </div>
                  <div className="mt-5 flex items-center justify-between pt-3 border-t border-pink-100">
                    <span className="text-xs font-black text-pink-600">Kỷ lục: {progress.highScores.mimic || 0} điểm</span>
                    <button className="px-3.5 py-1.5 bg-pink-500 text-white font-black text-xs rounded-full shadow">
                      BẮT ĐẦU CHƠI 🤸‍♀️
                    </button>
                  </div>
                </div>
              )}

              {/* Mini Game 8: Nhảy Theo Nhạc */}
              {minigameFilter === 'all' && (
                <div
                  id="minigame-dance-card"
                  onClick={() => onSelectScreen('dance')}
                  className="bg-white rounded-3xl p-5 border-4 border-indigo-200 shadow-xl hover:border-indigo-400 hover:scale-102 transition cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-4xl">💃</span>
                      <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                        VŨ ĐIỆU
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-indigo-700 mb-1">Vũ Điệu Nhịp Điệu</h3>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      Các nốt nhạc chuyển động theo giai điệu vui tươi. Hãy vận động khớp với nhịp rơi để thắp sáng sàn nhảy cầu vồng!
                    </p>
                  </div>
                  <div className="mt-5 flex items-center justify-between pt-3 border-t border-indigo-100">
                    <span className="text-xs font-black text-indigo-600">Kỷ lục: {progress.highScores.dance || 0} điểm</span>
                    <button className="px-3.5 py-1.5 bg-indigo-500 text-white font-black text-xs rounded-full shadow">
                      BẮT ĐẦU CHƠI 💃
                    </button>
                  </div>
                </div>
              )}


              {/* NEW: Ninja obstacle camera challenge */}
              {(minigameFilter === 'all' || minigameFilter === 'reflex') && (
                <div onClick={() => onSelectScreen('ninja')} className="bg-gradient-to-br from-slate-900 to-purple-950 text-white rounded-3xl p-5 border-4 border-violet-400 shadow-xl hover:scale-102 transition cursor-pointer flex flex-col justify-between">
                  <div><div className="flex items-center justify-between mb-2"><span className="text-4xl">🥷</span><span className="text-[10px] font-black bg-violet-200 text-violet-900 px-2 py-0.5 rounded-full">FULL BODY • MỚI</span></div><h3 className="text-xl font-black text-violet-200 mb-1">Ninja Né Chướng Ngại</h3><p className="text-xs text-violet-100/90 font-medium leading-relaxed">Nhảy, cúi và nghiêng người thật để vượt chướng ngại. Camera nhận diện toàn thân, có combo và kỷ lục riêng.</p></div>
                  <div className="mt-5 flex items-center justify-between pt-3 border-t border-violet-400/30"><span className="text-xs font-black text-amber-300">Kỷ lục: {progress.highScores?.challenge_ninja || 0}</span><button className="px-3.5 py-1.5 bg-violet-400 text-slate-950 font-black text-xs rounded-full">CHIẾN ĐẤU 🥷</button></div>
                </div>
              )}

              {/* NEW: Goalkeeper camera challenge */}
              {(minigameFilter === 'all' || minigameFilter === 'reflex') && (
                <div onClick={() => onSelectScreen('goalkeeper')} className="bg-gradient-to-br from-emerald-900 to-sky-950 text-white rounded-3xl p-5 border-4 border-emerald-300 shadow-xl hover:scale-102 transition cursor-pointer flex flex-col justify-between">
                  <div><div className="flex items-center justify-between mb-2"><span className="text-4xl">🥅</span><span className="text-[10px] font-black bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full">PHẢN XẠ • MỚI</span></div><h3 className="text-xl font-black text-emerald-200 mb-1">Thủ Môn Siêu Nhí</h3><p className="text-xs text-emerald-100/90 font-medium leading-relaxed">Giơ tay trái, tay phải, hai tay hoặc hạ thấp người theo hướng bóng để cứu khung thành.</p></div>
                  <div className="mt-5 flex items-center justify-between pt-3 border-t border-emerald-400/30"><span className="text-xs font-black text-amber-300">Kỷ lục: {progress.highScores?.challenge_goalkeeper || 0}</span><button className="px-3.5 py-1.5 bg-emerald-300 text-emerald-950 font-black text-xs rounded-full">BẮT BÓNG 🧤</button></div>
                </div>
              )}

              {/* NEW: Magic academy gesture challenge */}
              {minigameFilter === 'all' && (
                <div onClick={() => onSelectScreen('magicacademy')} className="bg-gradient-to-br from-fuchsia-900 to-indigo-950 text-white rounded-3xl p-5 border-4 border-fuchsia-300 shadow-xl hover:scale-102 transition cursor-pointer flex flex-col justify-between">
                  <div><div className="flex items-center justify-between mb-2"><span className="text-4xl">🪄</span><span className="text-[10px] font-black bg-fuchsia-100 text-fuchsia-900 px-2 py-0.5 rounded-full">CỬ CHỈ • MỚI</span></div><h3 className="text-xl font-black text-fuchsia-200 mb-1">Học Viện Phép Thuật</h3><p className="text-xs text-fuchsia-100/90 font-medium leading-relaxed">Làm đúng tư thế để tung phép ánh sáng, dựng khiên, gọi sấm sét và kích hoạt cầu vồng.</p></div>
                  <div className="mt-5 flex items-center justify-between pt-3 border-t border-fuchsia-400/30"><span className="text-xs font-black text-amber-300">Kỷ lục: {progress.highScores?.challenge_magicacademy || 0}</span><button className="px-3.5 py-1.5 bg-fuchsia-300 text-fuchsia-950 font-black text-xs rounded-full">HỌC PHÉP ✨</button></div>
                </div>
              )}

              {/* Mini Game 9: Gương Phép Thuật – Fashion Show */}
              {minigameFilter === 'all' && (
                <div
                  id="minigame-dressing-card"
                  onClick={() => onSelectScreen('dressing')}
                  className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-3xl p-5 border-4 border-purple-300 shadow-xl hover:border-purple-400 hover:scale-102 transition cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-4xl">🪞</span>
                      <span className="text-[10px] font-black bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full shadow-xs uppercase">
                        AR TRY-ON • MỚI
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-200 to-cyan-200 mb-1">
                      Gương Phép Thuật
                    </h3>
                    <p className="text-xs text-purple-100 font-bold tracking-wide mt-0.5 mb-1">
                      Fashion Show – Thử đồ bằng Camera
                    </p>
                    <p className="text-xs text-purple-100/90 font-medium leading-relaxed">
                      Sử dụng camera và Full-Body Pose Tracking để tự do ướm thử nón, kính, áo thun, cánh tiên, balô và giày phép thuật chuyển động theo cơ thể! Sau đó sải bước tham gia buổi trình diễn Fashion Show lộng lẫy!
                    </p>
                  </div>
                  <div className="mt-5 flex items-center justify-between pt-3 border-t border-purple-400/40">
                    <span className="text-xs font-black text-amber-300">Kỷ lục Show: {progress.highScores.fashion_show || 0}</span>
                    <button className="px-3.5 py-1.5 bg-white text-purple-700 font-black text-xs rounded-full shadow-lg">
                      TRÌNH DIỄN NGAY 🪄
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= VIEW: WARDROBE ================= */}
        {activeTab === 'wardrobe' && (
          <div id="wardrobe-view" className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <button
                  onClick={() => setActiveTab('home')}
                  className="text-xs font-black text-pink-600 bg-pink-100 hover:bg-pink-200 px-3.5 py-1.5 rounded-full mb-2 transition inline-flex items-center gap-1"
                >
                  ← Về Menu Chính
                </button>
                <h2 className="text-2xl md:text-3xl font-black text-pink-700">Tủ Đồ Công Chúa Của Phương Nhã</h2>
                <p className="text-xs text-slate-500 font-bold mt-0.5">
                  Dùng Ngôi Sao tích lũy để mở khóa những bộ váy đầm và phụ kiện lộng lẫy!
                </p>
              </div>

              <div className="flex gap-2 bg-white p-1 rounded-2xl border border-pink-200 shadow-xs">
                <button
                  onClick={() => setWardrobeFilter('all')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-black transition ${
                    wardrobeFilter === 'all' ? 'bg-pink-500 text-white' : 'text-slate-600 hover:bg-pink-50'
                  }`}
                >
                  Tất Cả
                </button>
                <button
                  onClick={() => setWardrobeFilter('skin')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-black transition ${
                    wardrobeFilter === 'skin' ? 'bg-pink-500 text-white' : 'text-slate-600 hover:bg-pink-50'
                  }`}
                >
                  Váy Đầm
                </button>
                <button
                  onClick={() => setWardrobeFilter('accessory')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-black transition ${
                    wardrobeFilter === 'accessory' ? 'bg-pink-500 text-white' : 'text-slate-600 hover:bg-pink-50'
                  }`}
                >
                  Phụ Kiện
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {SKINS.filter((item) => wardrobeFilter === 'all' || item.type === wardrobeFilter).map((item) => {
                const isSkin = item.type === 'skin';
                const isUnlocked = isSkin
                  ? progress.unlockedSkins.includes(item.id)
                  : progress.unlockedAccessories.includes(item.id);
                const isEquipped = isSkin ? progress.activeSkin === item.id : progress.activeAccessory === item.id;

                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-3xl p-4 border-4 flex flex-col items-center justify-between text-center transition-all ${
                      isEquipped
                        ? 'border-pink-500 shadow-lg ring-2 ring-pink-300'
                        : isUnlocked
                        ? 'border-slate-200 hover:border-pink-300'
                        : 'border-slate-200 opacity-80'
                    }`}
                  >
                    <div className="w-full flex justify-between items-center text-[10px] font-bold">
                      <span className="bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full">{item.badge}</span>
                      {isEquipped && (
                        <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-full">Đang mặc</span>
                      )}
                    </div>

                    <div className="my-4 text-5xl">
                      {item.previewSvg === 'pink_dress' && '👗'}
                      {item.previewSvg === 'blue_dress' && '🥻'}
                      {item.previewSvg === 'candy_dress' && '🧁'}
                      {item.previewSvg === 'bunny_ears' && '🐰'}
                      {item.previewSvg === 'fairy_wings' && '🪽'}
                      {item.previewSvg === 'straw_hat' && '👒'}
                      {item.previewSvg === 'magic_wand' && '🪄'}
                      {item.previewSvg === 'halo' && '✨'}
                    </div>

                    <h4 className="font-extrabold text-sm text-slate-800 mb-1">{item.name}</h4>

                    <div className="w-full mt-2">
                      {isUnlocked ? (
                        <button
                          onClick={() => buyOrEquipSkin(item)}
                          className={`w-full py-2 rounded-2xl font-black text-xs transition ${
                            isEquipped
                              ? 'bg-slate-100 text-slate-500 cursor-default'
                              : 'bg-pink-500 hover:bg-pink-600 text-white shadow-sm'
                          }`}
                        >
                          {isEquipped ? 'Đã Chọn' : 'Mặc Ngay'}
                        </button>
                      ) : (
                        <button
                          onClick={() => buyOrEquipSkin(item)}
                          disabled={progress.stars < item.cost}
                          className={`w-full py-2 rounded-2xl font-black text-xs flex items-center justify-center gap-1 transition ${
                            progress.stars >= item.cost
                              ? 'bg-yellow-400 hover:bg-yellow-500 text-yellow-950 shadow-sm'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <span>Mở khóa ({item.cost} ⭐)</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= VIEW: ACHIEVEMENTS ================= */}
        {activeTab === 'achievements' && (
          <div id="achievements-view" className="flex flex-col gap-6">
            <div>
              <button
                onClick={() => setActiveTab('home')}
                className="text-xs font-black text-emerald-600 bg-emerald-100 hover:bg-emerald-200 px-3.5 py-1.5 rounded-full mb-2 transition inline-flex items-center gap-1"
              >
                ← Về Menu Chính
              </button>
              <h2 className="text-2xl md:text-3xl font-black text-slate-800">Bộ Sưu Tập Huy Hiệu Của Bé</h2>
              <p className="text-xs text-slate-500 font-bold mt-0.5">
                Mỗi huy hiệu là minh chứng cho sự kiên trì, dẻo dai và khỏe mạnh!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ACHIEVEMENTS.map((ach) => {
                const isUnlocked = progress.achievements?.includes(ach.id);

                return (
                  <div
                    key={ach.id}
                    className={`bg-white rounded-3xl p-5 border-4 flex items-center gap-4 transition ${
                      isUnlocked ? 'border-emerald-200 shadow-md' : 'border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center text-3xl shrink-0">
                      {ach.iconName === 'Compass' && '🧭'}
                      {ach.iconName === 'Star' && '⭐'}
                      {ach.iconName === 'Sparkles' && '✨'}
                      {ach.iconName === 'Heart' && '💖'}
                      {ach.iconName === 'Flame' && '🔥'}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-black text-base text-slate-800">{ach.title}</h4>
                        {isUnlocked ? (
                          <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                            Đã Đạt
                          </span>
                        ) : (
                          <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                            Chưa đạt
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{ach.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] font-bold text-slate-600">
                        <span>Thưởng: +{ach.rewardStars} ⭐</span>
                        <span>+{ach.rewardDiamonds} 💎</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= VIEW: WORKOUT ================= */}
        {activeTab === 'workout' && (
          <div id="workout-view" className="flex flex-col gap-6 max-w-4xl mx-auto">
            <div>
              <button
                onClick={() => setActiveTab('home')}
                className="text-xs font-black text-rose-600 bg-rose-100 hover:bg-rose-200 px-3.5 py-1.5 rounded-full mb-2 transition inline-flex items-center gap-1"
              >
                ← Về Menu Chính
              </button>
              <h2 className="text-2xl md:text-3xl font-black text-slate-800">Chương Trình Vận Động Mỗi Ngày</h2>
              <p className="text-xs text-slate-500 font-bold mt-0.5">
                Giúp bé rèn luyện thể chất, giải tỏa căng thẳng và tràn đầy niềm vui qua chuỗi liên hoàn mini game!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 5 min Playlist */}
              <div className="bg-white rounded-3xl p-6 border-4 border-rose-200 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-4xl">⚡</div>
                    <span className="text-[10px] font-black bg-rose-100 text-rose-700 px-2.5 py-1 rounded-full">
                      TỰ ĐỘNG CHUYỂN MÀN
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-rose-600">Khởi Động Nhanh (5 Phút)</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Chuỗi playlist tự động: <strong>Khởi động khớp (45s)</strong> → <strong>Chém Trái Cây (90s)</strong> → <strong>Gà Tinh Nghịch (90s)</strong> → <strong>Bắt Sao Thả Lỏng (75s)</strong>.
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-[11px] font-bold text-slate-500">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span>Tiêu hao ~25-30 kcal • Thưởng +25 ⭐</span>
                  </div>
                </div>
                <button
                  onClick={() => onSelectScreen('workout_session', { workoutMode: '5min' })}
                  className="mt-6 w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-full text-xs shadow-md transition transform hover:scale-102"
                >
                  BẮT ĐẦU BUỔI TẬP 5 PHÚT ⚡
                </button>
              </div>

              {/* 10 min Playlist */}
              <div className="bg-white rounded-3xl p-6 border-4 border-orange-200 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-4xl">🔥</div>
                    <span className="text-[10px] font-black bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full">
                      CHUYÊN SÂU TOÀN DIỆN
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-orange-600">Vận Động Toàn Diện (10 Phút)</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Chuỗi playlist: <strong>Khởi động (60s)</strong> → <strong>Chém Trái Cây</strong> → <strong>Gà Tinh Nghịch</strong> → <strong>Zombie Kẹo Ngọt</strong> → <strong>Bắt Sao</strong> → <strong>Thả Lỏng Hít Thở</strong>.
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-[11px] font-bold text-slate-500">
                    <Flame className="w-4 h-4 text-red-500" />
                    <span>Tiêu hao ~60-70 kcal • Thưởng +50 ⭐</span>
                  </div>
                </div>
                <button
                  onClick={() => onSelectScreen('workout_session', { workoutMode: '10min' })}
                  className="mt-6 w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-full text-xs shadow-md transition transform hover:scale-102"
                >
                  BẮT ĐẦU BUỔI TẬP 10 PHÚT 🔥
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= VIEW: SETTINGS ================= */}
        {activeTab === 'settings' && (
          <div id="settings-view" className="flex flex-col gap-6 max-w-2xl mx-auto bg-white p-6 md:p-8 rounded-3xl border-4 border-slate-200 shadow-xl">
            <div>
              <button
                onClick={() => setActiveTab('home')}
                className="text-xs font-black text-slate-600 bg-slate-100 hover:bg-slate-200 px-3.5 py-1.5 rounded-full mb-2 transition inline-flex items-center gap-1"
              >
                ← Về Menu Chính
              </button>
              <h2 className="text-2xl font-black text-slate-800">Cài Đặt & Trợ Giúp</h2>
            </div>

            <div className="flex flex-col gap-4 text-xs font-bold text-slate-700">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div>
                  <span>Giọng nói cổ vũ & Hướng dẫn</span>
                  <p className="text-[11px] text-slate-400 font-normal mt-0.5">Tùy chọn Nữ dịu dàng / Nam ấm áp / Em bé</p>
                </div>
                {onOpenVoiceSettings && (
                  <button
                    onClick={onOpenVoiceSettings}
                    className="px-4 py-1.5 rounded-full bg-pink-500 hover:bg-pink-600 font-black text-white transition shadow-sm"
                  >
                    TÙY CHỈNH GIỌNG 🎙️
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <span>Âm thanh & Nhạc nền</span>
                <button
                  onClick={onToggleSound}
                  className={`px-4 py-1.5 rounded-full font-black text-white ${
                    soundEnabled ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                >
                  {soundEnabled ? 'ĐANG BẬT' : 'ĐANG TẮT'}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <span>Kiểm tra chuyển động & Khớp xương</span>
                <button
                  onClick={() => onSelectScreen('cameratest')}
                  className="px-4 py-1.5 rounded-full bg-pink-500 text-white hover:bg-pink-600 transition"
                >
                  MỞ BẢNG TEST
                </button>
              </div>

              <div className="p-4 bg-yellow-50 rounded-2xl text-yellow-900 leading-relaxed font-normal">
                <p className="font-bold mb-1">💡 Lời khuyên an toàn cho bé:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Dọn dẹp các vật cản xung quanh khu vực chơi để tránh vấp ngã.</li>
                  <li>Uống một ngụm nước sau mỗi 10-15 phút vận động.</li>
                  <li>Nếu không có camera hoặc camera mờ, bé hoàn toàn có thể dùng các phím mũi tên trên bàn phím để điều khiển nhé!</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 4. FLOATING BOTTOM NAVIGATION DOCK */}
      {activeTab !== 'settings' && (
        <>
          {/* Mobile Tab "Thêm" Popover Menu */}
          {showMoreMenu && (
            <>
              <div 
                className="fixed inset-0 z-40 bg-slate-900/10 backdrop-blur-[1px]" 
                onClick={() => setShowMoreMenu(false)}
              />
              <div className="fixed bottom-[calc(70px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-50 bg-white border-2 border-pink-200 rounded-3xl shadow-2xl p-3 flex flex-col gap-1.5 min-w-[200px] max-w-[90vw] animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="text-[10px] font-black text-slate-400 px-3 uppercase tracking-wider border-b border-slate-100 pb-1.5 mb-1.5">
                  Khám phá thêm
                </div>
                <button
                  onClick={() => {
                    setActiveTab('worlds');
                    setShowMoreMenu(false);
                  }}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-black text-xs transition active:scale-95 text-left w-full ${
                    activeTab === 'worlds' ? 'bg-pink-100 text-pink-700' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-sm">🚀</span> Thế Giới
                </button>
                <button
                  onClick={() => {
                    setActiveTab('achievements');
                    setShowMoreMenu(false);
                  }}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-black text-xs transition active:scale-95 text-left w-full ${
                    activeTab === 'achievements' ? 'bg-pink-100 text-pink-700' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-sm">🏆</span> Huy Hiệu
                </button>
                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setShowMoreMenu(false);
                  }}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-black text-xs transition active:scale-95 text-left w-full ${
                    activeTab === 'settings' ? 'bg-pink-100 text-pink-700' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-sm">⚙️</span> Cài Đặt
                </button>
              </div>
            </>
          )}

          {/* ==================== DESKTOP NAVIGATION TABS (>= 768px) ==================== */}
          <nav className="hidden md:flex fixed bottom-[calc(8px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-30 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full border-2 border-pink-200 shadow-2xl items-center gap-1.5 max-w-[95vw]">
            {/* Tab 1: Trang Chủ */}
            <button
              onClick={() => setActiveTab('home')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-black text-xs transition duration-200 whitespace-nowrap active:scale-95 ${
                activeTab === 'home'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                  : 'text-slate-600 hover:bg-pink-50'
              }`}
            >
              <span className="text-sm sm:text-base">🏠</span>
              <span>Trang Chủ</span>
            </button>

            {/* Tab 2: Thế Giới */}
            <button
              onClick={() => setActiveTab('worlds')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-black text-xs transition duration-200 whitespace-nowrap active:scale-95 ${
                activeTab === 'worlds'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md'
                  : 'text-slate-600 hover:bg-pink-50'
              }`}
            >
              <span className="text-sm sm:text-base">🚀</span>
              <span>Thế Giới</span>
            </button>

            {/* Tab 3: Mini Games */}
            <button
              onClick={() => setActiveTab('minigames')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-black text-xs transition duration-200 whitespace-nowrap active:scale-95 ${
                activeTab === 'minigames'
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-purple-50'
              }`}
            >
              <span className="text-sm sm:text-base">🎮</span>
              <span>Mini Games</span>
            </button>

            {/* Tab 4: Vận Động */}
            <button
              onClick={() => setActiveTab('workout')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-black text-xs transition duration-200 whitespace-nowrap active:scale-95 ${
                activeTab === 'workout'
                  ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-md'
                  : 'text-slate-600 hover:bg-rose-50'
              }`}
            >
              <span className="text-sm sm:text-base">🏃‍♀️</span>
              <span>Vận Động</span>
            </button>

            {/* Tab 5: Tủ Đồ */}
            <button
              onClick={() => {
                if (onOpenWardrobe) onOpenWardrobe();
                else setActiveTab('wardrobe');
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-black text-xs transition duration-200 whitespace-nowrap active:scale-95 ${
                activeTab === 'wardrobe'
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-yellow-950 shadow-md'
                  : 'text-slate-600 hover:bg-yellow-50'
              }`}
            >
              <span className="text-sm sm:text-base">👗</span>
              <span>Tủ Đồ</span>
            </button>

            {/* Tab 6: Huy Hiệu */}
            <button
              onClick={() => setActiveTab('achievements')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-black text-xs transition duration-200 whitespace-nowrap active:scale-95 ${
                activeTab === 'achievements'
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-md'
                  : 'text-slate-600 hover:bg-emerald-50'
              }`}
            >
              <span className="text-sm sm:text-base">🏆</span>
              <span>Huy Hiệu</span>
            </button>

            {/* Tab 7: Cài Đặt */}
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-black text-xs transition duration-200 whitespace-nowrap active:scale-95 ${
                activeTab === 'settings'
                  ? 'bg-slate-700 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="text-sm sm:text-base">⚙️</span>
              <span>Cài Đặt</span>
            </button>
          </nav>

          {/* ==================== MOBILE NAVIGATION TABS (< 768px - Column Layout) ==================== */}
          <nav className="flex md:hidden fixed bottom-[calc(8px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-30 bg-white/95 backdrop-blur-md px-1.5 py-1 rounded-2xl border-2 border-pink-200 shadow-xl items-center justify-around w-[92%] max-w-[420px]">
            {/* Mobile Tab 1: Trang Chủ */}
            <button
              onClick={() => {
                setActiveTab('home');
                setShowMoreMenu(false);
              }}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition duration-150 active:scale-95 flex-1 min-w-[50px] ${
                activeTab === 'home'
                  ? 'text-pink-600 font-extrabold'
                  : 'text-slate-500 font-bold hover:bg-pink-50/50'
              }`}
            >
              <span className={`text-base transition-transform ${activeTab === 'home' ? 'scale-110' : ''}`}>🏠</span>
              <span className="text-[9px] mt-0.5 whitespace-nowrap">Trang Chủ</span>
            </button>

            {/* Mobile Tab 2: Game */}
            <button
              onClick={() => {
                setActiveTab('minigames');
                setShowMoreMenu(false);
              }}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition duration-150 active:scale-95 flex-1 min-w-[50px] ${
                activeTab === 'minigames'
                  ? 'text-purple-600 font-extrabold'
                  : 'text-slate-500 font-bold hover:bg-purple-50/50'
              }`}
            >
              <span className={`text-base transition-transform ${activeTab === 'minigames' ? 'scale-110' : ''}`}>🎮</span>
              <span className="text-[9px] mt-0.5 whitespace-nowrap">Trò Chơi</span>
            </button>

            {/* Mobile Tab 3: Vận Động */}
            <button
              onClick={() => {
                setActiveTab('workout');
                setShowMoreMenu(false);
              }}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition duration-150 active:scale-95 flex-1 min-w-[50px] ${
                activeTab === 'workout'
                  ? 'text-rose-600 font-extrabold'
                  : 'text-slate-500 font-bold hover:bg-rose-50/50'
              }`}
            >
              <span className={`text-base transition-transform ${activeTab === 'workout' ? 'scale-110' : ''}`}>🏃‍♀️</span>
              <span className="text-[9px] mt-0.5 whitespace-nowrap">Vận Động</span>
            </button>

            {/* Mobile Tab 4: Tủ Đồ */}
            <button
              onClick={() => {
                setShowMoreMenu(false);
                if (onOpenWardrobe) onOpenWardrobe();
                else setActiveTab('wardrobe');
              }}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition duration-150 active:scale-95 flex-1 min-w-[50px] ${
                activeTab === 'wardrobe'
                  ? 'text-amber-600 font-extrabold'
                  : 'text-slate-500 font-bold hover:bg-yellow-50/50'
              }`}
            >
              <span className={`text-base transition-transform ${activeTab === 'wardrobe' ? 'scale-110' : ''}`}>👗</span>
              <span className="text-[9px] mt-0.5 whitespace-nowrap">Tủ Đồ</span>
            </button>

            {/* Mobile Tab 5: Thêm */}
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition duration-150 active:scale-95 flex-1 min-w-[50px] ${
                showMoreMenu || activeTab === 'worlds' || activeTab === 'achievements'
                  ? 'text-pink-600 font-extrabold'
                  : 'text-slate-500 font-bold hover:bg-pink-50/50'
              }`}
            >
              <span className={`text-base transition-transform ${showMoreMenu ? 'scale-110' : ''}`}>✨</span>
              <span className="text-[9px] mt-0.5 whitespace-nowrap">Thêm</span>
            </button>
          </nav>
        </>
      )}

      {showVersionInfo && <VersionInfoModal onClose={() => setShowVersionInfo(false)} />}
    </div>
  );
}