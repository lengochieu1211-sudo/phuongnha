/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  Sparkles,
  Bot,
  User,
  Settings,
  Play,
  RotateCcw,
  Zap,
  Shield,
  HelpCircle,
  Volume2,
} from 'lucide-react';
import {
  LudoPlayer,
  LudoRules,
  CharacterId,
  LudoColor,
} from '../../types';
import {
  DEFAULT_RULES,
  PRESET_RULES,
  DEFAULT_PLAYERS_SETUP,
  LudoGameEngine,
} from '../../lib/LudoGameEngine';

interface LudoSetupModalProps {
  onStartGame: (players: LudoPlayer[], rules: LudoRules) => void;
  onResumeSavedGame?: (savedState: any) => void;
  onBack: () => void;
}

export default function LudoSetupModal({
  onStartGame,
  onResumeSavedGame,
  onBack,
}: LudoSetupModalProps) {
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(4);
  const [gameMode, setGameMode] = useState<'quick' | 'classic' | 'magic'>('magic');
  const [rules, setRules] = useState<LudoRules>(DEFAULT_RULES);
  const [showAdvancedRules, setShowAdvancedRules] = useState(false);
  const [hasSavedGame, setHasSavedGame] = useState(false);
  const [savedGameState, setSavedGameState] = useState<any>(null);

  // Player configuration state
  const [playersConfig, setPlayersConfig] = useState<
    {
      name: string;
      mascot: CharacterId;
      color: LudoColor;
      isAI: boolean;
      aiDifficulty: 'easy' | 'normal' | 'hard';
    }[]
  >([
    { name: 'Bara', mascot: 'bara', color: 'red', isAI: false, aiDifficulty: 'normal' },
    { name: 'Mây', mascot: 'may', color: 'blue', isAI: false, aiDifficulty: 'normal' },
    { name: 'Bông', mascot: 'bong', color: 'yellow', isAI: true, aiDifficulty: 'normal' },
    { name: 'Miu', mascot: 'miu', color: 'purple', isAI: true, aiDifficulty: 'normal' },
  ]);

  // Check saved session on mount
  useEffect(() => {
    const saved = LudoGameEngine.loadSession();
    if (saved && !saved.isGameOver) {
      setHasSavedGame(true);
      setSavedGameState(saved);
    }
  }, []);

  // Sync rules when gameMode changes
  const handleModeChange = (mode: 'quick' | 'classic' | 'magic') => {
    setGameMode(mode);
    setRules({ ...PRESET_RULES[mode] });
  };

  const handleStart = () => {
    const piecesCount = rules.piecesPerPlayer;
    const finalPlayers = DEFAULT_PLAYERS_SETUP(playerCount, piecesCount).map((p, idx) => {
      const cfg = playersConfig[idx];
      return {
        ...p,
        name: cfg.name.trim() || p.name,
        mascot: cfg.mascot,
        color: cfg.color,
        isAI: cfg.isAI,
        aiDifficulty: cfg.aiDifficulty,
      };
    });

    onStartGame(finalPlayers, rules);
  };

  const mascotOptions: { id: CharacterId; name: string; avatar: string }[] = [
    { id: 'bara', name: 'Bara Capybara', avatar: '🦫' },
    { id: 'may', name: 'Mây Nhỏ', avatar: '🐶' },
    { id: 'bong', name: 'Thỏ Bông', avatar: '🐰' },
    { id: 'miu', name: 'Mèo Miu', avatar: '🐱' },
    { id: 'lumi', name: 'Kỳ Lân Lumi', avatar: '🦄' },
  ];

  const colorOptions: { id: LudoColor; bg: string; name: string }[] = [
    { id: 'red', bg: 'bg-rose-500', name: 'Đỏ' },
    { id: 'blue', bg: 'bg-sky-500', name: 'Xanh Dương' },
    { id: 'yellow', bg: 'bg-amber-500', name: 'Vàng' },
    { id: 'purple', bg: 'bg-purple-500', name: 'Tím' },
    { id: 'green', bg: 'bg-emerald-500', name: 'Xanh Lá' },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 md:p-8 shadow-2xl border-4 border-purple-200 relative animate-in fade-in zoom-in duration-200 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-pink-100 to-purple-100 border border-purple-200 rounded-full text-purple-800 text-xs font-black tracking-wide mb-2">
            <Sparkles className="w-4 h-4 text-purple-600 animate-spin" />
            BOARD GAME GIA ĐÌNH & BẠN BÈ
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
            CỜ CÁ NGỰA – ĐƯỜNG ĐUA KỲ DIỆU 🏇
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Chơi chung trên một thiết bị (Pass & Play) hoặc thêm bạn Máy AI thông minh
          </p>
        </div>

        {/* Resume Saved Game Banner */}
        {hasSavedGame && onResumeSavedGame && (
          <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <div className="text-sm font-black text-amber-900 flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-amber-600" />
                Tìm thấy ván cờ đang chơi dở!
              </div>
              <p className="text-xs text-amber-700 mt-0.5">
                Ván chơi gần nhất với {savedGameState?.players?.length} bạn vẫn đang được lưu an toàn.
              </p>
            </div>
            <button
              onClick={() => onResumeSavedGame(savedGameState)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-full text-xs shadow-md transition transform hover:scale-105"
            >
              TIẾP TỤC VÁN CŨ ➔
            </button>
          </div>
        )}

        {/* 1. Chọn Chế Độ Chơi (Preset Modes) */}
        <div className="mb-6">
          <label className="block text-xs font-black text-slate-600 uppercase mb-2.5">
            1. CHỌN CHẾ ĐỘ CHƠI
          </label>
          <div className="grid grid-cols-3 gap-2.5 md:gap-3">
            {/* Quick */}
            <button
              onClick={() => handleModeChange('quick')}
              className={`p-3 rounded-2xl border-2 text-left transition-all ${
                gameMode === 'quick'
                  ? 'border-rose-500 bg-rose-50 shadow-md ring-2 ring-rose-300'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-1 text-sm font-black text-rose-700">
                <Zap className="w-4 h-4 text-rose-500" /> Chơi Nhanh
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-tight">
                2 quân, ra quân 1 & 6, ván 5-10 phút siêu vui
              </p>
            </button>

            {/* Magic */}
            <button
              onClick={() => handleModeChange('magic')}
              className={`p-3 rounded-2xl border-2 text-left transition-all ${
                gameMode === 'magic'
                  ? 'border-purple-500 bg-purple-50 shadow-md ring-2 ring-purple-300'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-1 text-sm font-black text-purple-700">
                <Sparkles className="w-4 h-4 text-purple-500" /> Kỳ Diệu
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-tight">
                4 quân, Ô Cầu Vồng 🌈, Sao ⭐, Quà 🎁 & Mascot
              </p>
            </button>

            {/* Classic */}
            <button
              onClick={() => handleModeChange('classic')}
              className={`p-3 rounded-2xl border-2 text-left transition-all ${
                gameMode === 'classic'
                  ? 'border-sky-500 bg-sky-50 shadow-md ring-2 ring-sky-300'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-1 text-sm font-black text-sky-700">
                <Shield className="w-4 h-4 text-sky-500" /> Cổ Điển
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-tight">
                4 quân, ra quân 6, chuẩn luật cờ truyền thống
              </p>
            </button>
          </div>
        </div>

        {/* 2. Chọn Số Lượng Người Chơi (2, 3, 4) */}
        <div className="mb-6">
          <label className="block text-xs font-black text-slate-600 uppercase mb-2.5">
            2. CÓ BAO NHIÊU BẠN CÙNG THAM GIA?
          </label>
          <div className="grid grid-cols-3 gap-3">
            {([2, 3, 4] as const).map((num) => (
              <button
                key={`player-count-${num}`}
                onClick={() => setPlayerCount(num)}
                className={`py-3 rounded-2xl font-black text-sm border-2 transition-all flex items-center justify-center gap-2 ${
                  playerCount === num
                    ? 'border-purple-600 bg-purple-600 text-white shadow-lg shadow-purple-200 scale-102'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>{num} NGƯỜI CHƠI</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Cấu hình từng người chơi (Avatar, Mascot, Tên, Người/Máy) */}
        <div className="mb-6">
          <label className="block text-xs font-black text-slate-600 uppercase mb-2.5">
            3. THÔNG TIN CÁC TAY ĐUA NHÍ
          </label>
          <div className="space-y-3">
            {Array.from({ length: playerCount }).map((_, idx) => {
              const cfg = playersConfig[idx];
              return (
                <div
                  key={`player-setup-row-${idx}`}
                  className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-2"
                >
                  {/* Name & Index */}
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-black flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      maxLength={12}
                      value={cfg.name}
                      onChange={(e) => {
                        const newConfigs = [...playersConfig];
                        newConfigs[idx].name = e.target.value;
                        setPlayersConfig(newConfigs);
                      }}
                      className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 w-28 md:w-36 focus:ring-2 focus:ring-purple-400 outline-none"
                      placeholder="Biệt danh..."
                    />
                  </div>

                  {/* Mascot Picker */}
                  <div className="flex items-center gap-1">
                    {mascotOptions.map((m) => (
                      <button
                        key={`m-opt-${m.id}`}
                        onClick={() => {
                          const newConfigs = [...playersConfig];
                          newConfigs[idx].mascot = m.id;
                          setPlayersConfig(newConfigs);
                        }}
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-sm transition-transform ${
                          cfg.mascot === m.id
                            ? 'bg-purple-200 ring-2 ring-purple-600 scale-110 shadow-xs'
                            : 'hover:bg-slate-200 opacity-70'
                        }`}
                        title={m.name}
                      >
                        {m.avatar}
                      </button>
                    ))}
                  </div>

                  {/* Color Picker */}
                  <div className="flex items-center gap-1">
                    {colorOptions.map((c) => (
                      <button
                        key={`c-opt-${c.id}`}
                        onClick={() => {
                          const newConfigs = [...playersConfig];
                          newConfigs[idx].color = c.id;
                          setPlayersConfig(newConfigs);
                        }}
                        className={`w-5 h-5 rounded-full ${c.bg} transition-transform ${
                          cfg.color === c.id
                            ? 'ring-2 ring-slate-800 scale-125 shadow-xs'
                            : 'opacity-60 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Human or AI Toggle */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                    <button
                      onClick={() => {
                        const newConfigs = [...playersConfig];
                        newConfigs[idx].isAI = false;
                        setPlayersConfig(newConfigs);
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 ${
                        !cfg.isAI
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <User className="w-3 h-3" /> BÉ CHƠI
                    </button>
                    <button
                      onClick={() => {
                        const newConfigs = [...playersConfig];
                        newConfigs[idx].isAI = true;
                        setPlayersConfig(newConfigs);
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 ${
                        cfg.isAI
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Bot className="w-3 h-3" /> MÁY AI
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Tùy Chọn Nâng Cao (Rules Toggle) */}
        <div className="mb-6">
          <button
            onClick={() => setShowAdvancedRules(!showAdvancedRules)}
            className="flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-900"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{showAdvancedRules ? 'Ẩn cài đặt luật chi tiết' : 'Tùy chỉnh luật chơi chi tiết ➔'}</span>
          </button>

          {showAdvancedRules && (
            <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Spawn Rule */}
                <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-700">Luật ra quân:</span>
                  <select
                    value={rules.spawnRules}
                    onChange={(e) =>
                      setRules({ ...rules, spawnRules: e.target.value as any })
                    }
                    className="p-1 text-xs font-bold bg-slate-100 rounded-lg border border-slate-300 outline-none"
                  >
                    <option value="one_or_six">Đổ được 1 hoặc 6</option>
                    <option value="six_only">Chỉ khi được 6</option>
                  </select>
                </div>

                {/* Capture */}
                <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-700">Đá quân đối thủ:</span>
                  <button
                    onClick={() => setRules({ ...rules, allowCapture: !rules.allowCapture })}
                    className={`px-3 py-1 rounded-lg font-black ${
                      rules.allowCapture ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-600'
                    }`}
                  >
                    {rules.allowCapture ? 'BẬT' : 'TẮT'}
                  </button>
                </div>

                {/* Roll 6 bonus */}
                <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-700">Được 6 tung thêm:</span>
                  <button
                    onClick={() => setRules({ ...rules, rollSixBonus: !rules.rollSixBonus })}
                    className={`px-3 py-1 rounded-lg font-black ${
                      rules.rollSixBonus ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-600'
                    }`}
                  >
                    {rules.rollSixBonus ? 'BẬT' : 'TẮT'}
                  </button>
                </div>

                {/* Camera Clap */}
                <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-700">Tung xúc xắc bằng cử chỉ:</span>
                  <button
                    onClick={() =>
                      setRules({ ...rules, enableCameraClap: !rules.enableCameraClap })
                    }
                    className={`px-3 py-1 rounded-lg font-black ${
                      rules.enableCameraClap ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-600'
                    }`}
                  >
                    {rules.enableCameraClap ? 'BẬT' : 'TẮT'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <button
            onClick={onBack}
            className="px-5 py-3 rounded-full border-2 border-slate-300 hover:bg-slate-100 font-bold text-slate-600 text-xs md:text-sm transition"
          >
            QUAY LẠI
          </button>
          <button
            onClick={handleStart}
            className="px-8 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-black text-sm md:text-base rounded-full shadow-lg shadow-purple-200 transition transform hover:scale-105 flex items-center gap-2 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            BẮT ĐẦU ĐUA NGỰA 🏁
          </button>
        </div>
      </div>
    </div>
  );
}
