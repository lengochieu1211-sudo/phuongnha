/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Heart, Trophy, Sparkles, ShowerHead, Apple, HelpCircle, ArrowLeft } from 'lucide-react';
import { PetState, PlayerProgress, GameGesture, CharacterId } from '../types';
import { audio } from '../lib/AudioEngine';
import CharacterAvatar from './CharacterAvatar';

interface PetCareGameProps {
  progress: PlayerProgress;
  onUpdateProgress: (updater: (p: PlayerProgress) => PlayerProgress) => void;
  gesture: GameGesture;
  onBack: () => void;
}

export default function PetCareGame({ progress, onUpdateProgress, gesture, onBack }: PetCareGameProps) {
  const [selectedPetId, setSelectedPetId] = useState<string>(progress.activePetId || 'bara');
  const [actionFeedback, setActionFeedback] = useState<string>('');
  const [feedbackColor, setFeedbackColor] = useState<string>('text-pink-500');
  const [gestureCooldown, setGestureCooldown] = useState<boolean>(false);

  const currentPetId = progress.pets[selectedPetId] ? selectedPetId : (Object.keys(progress.pets)[0] || 'bara');
  const pet = progress.pets[currentPetId] || { name: 'Thú Cưng', level: 1, hunger: 80, happiness: 80, cleanliness: 80, energy: 80, favoriteToy: 'Đồ chơi' };

  // Helper to trigger actions with visual heart pops and sounds
  const handleAction = (actionType: 'feed' | 'pet' | 'brush' | 'play' | 'bath') => {
    audio.playPetCareAction();

    onUpdateProgress((prev) => {
      const activeId = prev.pets[selectedPetId] ? selectedPetId : (Object.keys(prev.pets)[0] || 'bara');
      const currentPet = prev.pets[activeId] || { name: 'Thú Cưng', level: 1, hunger: 80, happiness: 80, cleanliness: 80, energy: 80 };
      let hunger = currentPet.hunger;
      let happiness = currentPet.happiness;
      let cleanliness = currentPet.cleanliness;
      let energy = currentPet.energy;
      let level = currentPet.level;
      let text = '';
      let color = 'text-pink-500';

      if (actionType === 'feed') {
        hunger = Math.min(100, hunger + 20);
        energy = Math.min(100, energy + 10);
        text = `Bé đã cho ${currentPet.name} ăn táo ngọt! 🍎 Măm măm...`;
        color = 'text-amber-500';
      } else if (actionType === 'pet') {
        happiness = Math.min(100, happiness + 15);
        text = `Bé đã vuốt ve ${currentPet.name} nhẹ nhàng! 🥰 🎶`;
        color = 'text-rose-500';
      } else if (actionType === 'brush') {
        cleanliness = Math.min(100, cleanliness + 15);
        happiness = Math.min(100, happiness + 5);
        text = `Bé đã chải lông mượt mà cho ${currentPet.name}! ✨`;
        color = 'text-sky-500';
      } else if (actionType === 'play') {
        happiness = Math.min(100, happiness + 25);
        energy = Math.max(0, energy - 15);
        text = `${currentPet.name} đang đuổi theo quả bóng của bé kìa! ⚽`;
        color = 'text-emerald-500';
      } else if (actionType === 'bath') {
        cleanliness = Math.min(100, cleanliness + 30);
        text = `Xà phòng thơm phức! ${currentPet.name} đã sạch bong! 🧼`;
        color = 'text-blue-500';
      }

      // Check level up condition (if multiple parameters reach high stats)
      let awardStars = 0;
      let awardDiamonds = 0;
      let nextLevel = level;
      if (hunger >= 90 && happiness >= 90 && cleanliness >= 90) {
        // Level up! Reset a bit to allow more play
        nextLevel = level + 1;
        hunger = 60;
        happiness = 65;
        cleanliness = 55;
        awardStars = 10;
        awardDiamonds = 5;
        text = `🎉 TUYỆT VỜI! ${currentPet.name} LÊN CẤP ${nextLevel}! Nhận thêm 10 Sao và 5 Kim Cương!`;
        color = 'text-yellow-600';
        audio.playSuccess();
      }

      const updatedPet: PetState = {
        ...currentPet,
        hunger,
        happiness,
        cleanliness,
        energy,
        level: nextLevel,
      };

      return {
        ...prev,
        stars: prev.stars + awardStars,
        diamonds: prev.diamonds + awardDiamonds,
        activePetId: activeId as CharacterId,
        pets: {
          ...prev.pets,
          [activeId]: updatedPet,
        },
      };
    });

    setActionFeedback(actionType);
    setTimeout(() => setActionFeedback(''), 2500);
  };

  // Connect Camera gestures to Actions
  useEffect(() => {
    if (gestureCooldown || gesture === 'standing') return;

    let action: 'feed' | 'pet' | 'brush' | 'play' | 'bath' | null = null;

    if (gesture === 'both_arms_up') {
      action = 'feed'; // Both hands up to feed
    } else if (gesture === 'hands_spread') {
      action = 'pet'; // Spread hands wide to hug/pet
    } else if (gesture === 'left_arm_up') {
      action = 'brush'; // Left arm to brush
    } else if (gesture === 'right_arm_up') {
      action = 'play'; // Right arm to play ball
    } else if (gesture === 'duck') {
      action = 'bath'; // Crouch/duck to bathe
    }

    if (action) {
      handleAction(action);
      setGestureCooldown(true);
      // Cooldown of 2.5 seconds to let kids see animation
      const timer = setTimeout(() => {
        setGestureCooldown(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [gesture, gestureCooldown]);

  const menuPets = Object.keys(progress.pets).map(id => {
    const p = progress.pets[id];
    let icon = '🐾';
    if (id === 'bara' || id === 'capy_tie') icon = '🦫';
    if (id === 'may') icon = '🐶';
    if (id === 'bong' || id === 'cinnamoroll' || id === 'kuromi') icon = '🐰';
    if (id === 'miu') icon = '🐱';
    if (id === 'lumi') icon = '🦄';
    if (id === 'po') icon = '🐼';
    return { id, icon, name: p.name };
  });

  return (
    <div id="pet-care-screen" className="flex flex-col items-center gap-6 w-full max-w-4xl mx-auto p-4 md:p-8 bg-purple-50/80 rounded-3xl border-4 border-purple-200 shadow-xl font-sans text-slate-800">
      {/* Top action header */}
      <div className="flex w-full items-center justify-between border-b-2 border-purple-100 pb-4">
        <button
          id="back-menu-btn"
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-full font-bold bg-white text-purple-600 border border-purple-200 hover:bg-purple-100 transition shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại
        </button>

        <h2 className="text-2xl md:text-3xl font-extrabold text-purple-700 flex items-center gap-2">
          <Heart className="w-8 h-8 text-pink-500 fill-pink-500 animate-pulse" />
          Chăm Sóc Thú Cưng
        </h2>

        <div className="flex items-center gap-2 bg-purple-100/80 px-4 py-1.5 rounded-full border border-purple-200">
          <Trophy className="w-5 h-5 text-yellow-600" />
          <span className="font-extrabold text-sm text-purple-800">Cấp {pet.level}</span>
        </div>
      </div>

      {/* Pet Selector Cards */}
      <div id="pet-picker-grid" className="flex flex-wrap justify-center gap-3 w-full">
        {menuPets.map((p) => (
          <button
            key={p.id}
            id={`pick-pet-${p.id}`}
            onClick={() => {
              setSelectedPetId(p.id);
              audio.playCollect();
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-bold transition shadow-sm text-sm ${
              selectedPetId === p.id
                ? 'bg-purple-600 text-white border-2 border-purple-500 scale-105'
                : 'bg-white text-slate-700 hover:bg-purple-100 border border-purple-100'
            }`}
          >
            <span className="text-lg">{p.icon}</span>
            <span>{p.name}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center w-full my-4">
        {/* Left Side: Stats and Interactive Buttons */}
        <div id="pet-stats-panel" className="md:col-span-4 flex flex-col gap-4 bg-white p-5 rounded-2xl border-2 border-purple-100 shadow-sm order-2 md:order-1">
          <h4 className="font-extrabold text-lg text-purple-800 border-b pb-2">Chỉ số của {pet.name}</h4>

          {/* Hunger stats */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-bold text-slate-600">
              <span>🍔 Độ no:</span>
              <span>{pet.hunger}/100</span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
              <div
                className="bg-amber-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${pet.hunger}%` }}
              />
            </div>
          </div>

          {/* Happiness stats */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-bold text-slate-600">
              <span>💖 Hạnh phúc:</span>
              <span>{pet.happiness}/100</span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
              <div
                className="bg-pink-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${pet.happiness}%` }}
              />
            </div>
          </div>

          {/* Cleanliness stats */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-bold text-slate-600">
              <span>🧼 Sạch sẽ:</span>
              <span>{pet.cleanliness}/100</span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
              <div
                className="bg-sky-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${pet.cleanliness}%` }}
              />
            </div>
          </div>

          {/* Energy stats */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-bold text-slate-600">
              <span>⚡ Năng lượng:</span>
              <span>{pet.energy}/100</span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${pet.energy}%` }}
              />
            </div>
          </div>

          <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 mt-2 text-xs font-medium text-purple-700 leading-relaxed text-center">
            🧸 Đồ chơi yêu thích: <span className="font-bold">{pet.favoriteToy}</span>
          </div>
        </div>

        {/* Center: Character Avatar Pet with Visual Bubble Feedback */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-4 order-1 md:order-2">
          <div className="relative p-6 rounded-full bg-purple-100/50 border-4 border-dashed border-purple-200 w-72 h-72 flex items-center justify-center">
            <CharacterAvatar
              characterId={currentPetId as CharacterId}
              size={220}
              animState={actionFeedback ? 'happy' : 'idle'}
              equipped={progress.equippedWardrobe}
            />
          </div>

          {/* Notification bar */}
          <div className="h-10 mt-4 flex items-center justify-center">
            {actionFeedback ? (
              <span id="pet-action-msg" className="bg-purple-600 text-white font-extrabold text-sm px-4 py-1.5 rounded-full shadow-md animate-bounce">
                {actionFeedback === 'feed' && '🍎 Đã cho ăn!'}
                {actionFeedback === 'pet' && '🥰 Đã vuốt ve!'}
                {actionFeedback === 'brush' && '✨ Đã chải lông!'}
                {actionFeedback === 'play' && '⚽ Đã chơi đùa!'}
                {actionFeedback === 'bath' && '🧼 Đã tắm mát!'}
              </span>
            ) : (
              <span className="text-slate-500 text-xs font-bold animate-pulse text-center leading-normal">
                👋 Làm điệu bộ trước camera hoặc nhấn các nút để chơi cùng bé cưng nhé!
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Virtual Actions List */}
        <div id="pet-actions-panel" className="md:col-span-3 flex flex-col gap-2.5 order-3">
          <h4 className="font-extrabold text-sm text-slate-500 uppercase tracking-wider pb-1">Các cử chỉ tương tác</h4>

          <button
            id="action-feed-btn"
            onClick={() => handleAction('feed')}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 border-2 border-amber-200 font-bold transition shadow-sm text-sm"
          >
            <Apple className="w-5 h-5 text-amber-500" />
            <div className="text-left">
              <p>Cho ăn táo ngọt 🍎</p>
              <p className="text-[10px] text-amber-600 font-normal">Giơ hai tay cao 🙌</p>
            </div>
          </button>

          <button
            id="action-pet-btn"
            onClick={() => handleAction('pet')}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-800 border-2 border-rose-200 font-bold transition shadow-sm text-sm"
          >
            <Heart className="w-5 h-5 text-rose-500" />
            <div className="text-left">
              <p>Vuốt ve yêu thương 🥰</p>
              <p className="text-[10px] text-rose-600 font-normal">Dang hai tay 👐</p>
            </div>
          </button>

          <button
            id="action-brush-btn"
            onClick={() => handleAction('brush')}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-800 border-2 border-purple-200 font-bold transition shadow-sm text-sm"
          >
            <Sparkles className="w-5 h-5 text-purple-500" />
            <div className="text-left">
              <p>Chải lông mượt mà ✨</p>
              <p className="text-[10px] text-purple-600 font-normal">Giơ tay trái 🫲</p>
            </div>
          </button>

          <button
            id="action-play-btn"
            onClick={() => handleAction('play')}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-2 border-emerald-200 font-bold transition shadow-sm text-sm"
          >
            <Trophy className="w-5 h-5 text-emerald-500" />
            <div className="text-left">
              <p>Ném bóng chơi đùa ⚽</p>
              <p className="text-[10px] text-emerald-600 font-normal">Giơ tay phải 🫱</p>
            </div>
          </button>

          <button
            id="action-bath-btn"
            onClick={() => handleAction('bath')}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-sky-50 hover:bg-sky-100 text-sky-800 border-2 border-sky-200 font-bold transition shadow-sm text-sm"
          >
            <ShowerHead className="w-5 h-5 text-sky-500" />
            <div className="text-left">
              <p>Tắm mát xà phòng 🧼</p>
              <p className="text-[10px] text-sky-600 font-normal">Né / Cúi người 🙇</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
