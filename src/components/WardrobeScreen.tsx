/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ArrowLeft, Sparkles, Star, Lock, CheckCircle2, ShieldAlert } from 'lucide-react';
import { PlayerProgress, CategoryType, WardrobeItem } from '../types';
import { WARDROBE_ITEMS, getCharacterDisplayLabel } from '../utils/characterRenderer';
import CharacterAvatar from './CharacterAvatar';
import { audio } from '../lib/AudioEngine';

interface WardrobeScreenProps {
  isOpen?: boolean;
  progress: PlayerProgress;
  onUpdateProgress?: (updater: (p: PlayerProgress) => PlayerProgress) => void;
  onBack?: () => void;
  onClose?: () => void;
  onEquipItem?: (item: WardrobeItem) => void;
  onUnlockItem?: (item: any) => void;
  onOpenFashionAR?: () => void;
}

const CATEGORIES: { id: CategoryType; label: string; icon: string }[] = [
  { id: 'hair', label: 'Tóc', icon: '💇‍♀️' },
  { id: 'bow', label: 'Nơ', icon: '🎀' },
  { id: 'hat', label: 'Mũ', icon: '👒' },
  { id: 'crown', label: 'Vương Miện', icon: '👑' },
  { id: 'headaccessory', label: 'Phụ kiện đầu', icon: '🐱' },
  { id: 'glasses', label: 'Kính', icon: '👓' },
  { id: 'mask', label: 'Mặt nạ', icon: '🥷' },
  { id: 'necklace', label: 'Dây chuyền', icon: '💎' },
  { id: 'shirt', label: 'Trang phục', icon: '👕' },
  { id: 'gloves', label: 'Găng tay', icon: '🧤' },
  { id: 'shoes', label: 'Giày', icon: '👟' },
  { id: 'backpack', label: 'Balô', icon: '🎒' },
  { id: 'wings', label: 'Cánh', icon: '🪽' },
];

export default function WardrobeScreen({
  isOpen = true,
  progress,
  onUpdateProgress,
  onBack,
  onClose,
  onEquipItem,
  onUnlockItem,
  onOpenFashionAR,
}: WardrobeScreenProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryType>('bow');

  if (isOpen === false) return null;

  const filteredItems = WARDROBE_ITEMS.filter((item) => item.category === activeCategory);

  const handleCloseOrBack = () => {
    if (onClose) onClose();
    else if (onBack) onBack();
  };

  const handleEquipOrUnlock = (item: WardrobeItem) => {
    const isUnlocked = progress.unlockedWardrobe.includes(item.id);
    const isEquipped = progress.equippedWardrobe[item.category] === item.id;

    if (isEquipped) {
      // Unequip
      audio.playCollect();
      if (onEquipItem) {
        onEquipItem({ ...item, id: '' });
      } else if (onUpdateProgress) {
        onUpdateProgress((prev) => {
          const updated = { ...prev.equippedWardrobe };
          delete updated[item.category];
          return { ...prev, equippedWardrobe: updated };
        });
      }
    } else if (isUnlocked) {
      // Equip
      audio.playPowerup();
      if (onEquipItem) {
        onEquipItem(item);
      } else if (onUpdateProgress) {
        onUpdateProgress((prev) => ({
          ...prev,
          equippedWardrobe: {
            ...prev.equippedWardrobe,
            [item.category]: item.id,
          },
        }));
      }
    } else if (progress.stars >= item.costStars && progress.diamonds >= item.costDiamonds) {
      // Unlock & Equip
      audio.playSuccess();
      if (onUnlockItem) {
        onUnlockItem({
          id: item.id,
          costStars: item.costStars,
          costDiamonds: item.costDiamonds,
        });
        if (onEquipItem) onEquipItem(item);
      } else if (onUpdateProgress) {
        onUpdateProgress((prev) => ({
          ...prev,
          stars: prev.stars - item.costStars,
          diamonds: prev.diamonds - item.costDiamonds,
          unlockedWardrobe: [...prev.unlockedWardrobe, item.id],
          equippedWardrobe: {
            ...prev.equippedWardrobe,
            [item.category]: item.id,
          },
        }));
      }
    } else {
      audio.playFail();
    }
  };

  return (
    <div className="fixed inset-0 z-80 flex justify-center bg-slate-900/65 backdrop-blur-sm overflow-y-auto md:p-6 p-0">
      <div
        id="wardrobe-container"
        className="flex flex-col gap-6 w-full max-w-5xl bg-[#FFFAF0] rounded-none md:rounded-3xl border-0 md:border-4 border-pink-300 shadow-2xl font-sans text-slate-800 min-h-screen md:min-h-0 md:max-h-[90vh] overflow-y-auto relative p-5 md:p-8 pt-[calc(24px+env(safe-area-inset-top))] pb-[calc(24px+env(safe-area-inset-bottom))] pl-[calc(20px+env(safe-area-inset-left))] pr-[calc(20px+env(safe-area-inset-right))]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 10% 20%, rgba(255, 182, 193, 0.3) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(173, 216, 230, 0.3) 0%, transparent 40%)',
        }}
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-pink-200 pb-4">
          <button
            onClick={handleCloseOrBack}
            className="flex items-center gap-2 px-4 py-2 rounded-full font-bold bg-white text-pink-700 border-2 border-pink-200 hover:bg-pink-50 transition shadow-sm text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            {onClose ? 'Đóng' : 'Menu Chính'}
          </button>

          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-black text-pink-700 flex items-center justify-center gap-2">
              <Sparkles className="w-7 h-7 text-pink-500" />
              Tủ Đồ Thời Trang
            </h2>
            <p className="text-xs text-slate-500 font-bold mt-0.5">
              Diện cho bạn đồng hành những bộ trang phục dễ thương nhất nhé!
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white px-4 py-1.5 rounded-full border-2 border-pink-200 font-black text-xs shadow-sm">
            <span className="text-amber-500 flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" /> {progress.stars}
            </span>
            <span className="text-cyan-600 flex items-center gap-1">
              💎 {progress.diamonds}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 5 cols: Live Mascot Dressing Room Preview */}
          <div className="lg:col-span-5 flex flex-col items-center gap-4 bg-white p-6 rounded-3xl border-4 border-pink-200 shadow-lg text-center">
            <span className="text-xs font-black bg-pink-100 text-pink-700 px-3 py-1 rounded-full uppercase tracking-wider">
              THỬ ĐỒ TRỰC TIẾP
            </span>

            <div className="my-4">
              <CharacterAvatar
                characterId={progress.selectedCharacter}
                animState="happy"
                equipped={progress.equippedWardrobe}
                size={180}
              />
            </div>

            <h3 className="font-black text-lg text-slate-800 uppercase">
              {getCharacterDisplayLabel(progress.selectedCharacter)}
            </h3>

            <div className="w-full bg-pink-50 p-3 rounded-2xl border border-pink-200 text-xs text-pink-800 font-bold">
              💡 Tất cả trang phục được mở bằng Sao & Kim Cương khi chơi game!
            </div>

            {onOpenFashionAR && (
              <button
                onClick={onOpenFashionAR}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:opacity-90 text-white font-extrabold text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition transform hover:scale-102 mt-2"
              >
                <span>🪞</span> Thử Trên Camera AR
              </button>
            )}
          </div>

          {/* Right 7 cols: Category Tabs & Items Grid */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border-2 border-pink-200 shadow-sm">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition ${
                    activeCategory === cat.id
                      ? 'bg-pink-500 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredItems.map((item) => {
                const isUnlocked = progress.unlockedWardrobe.includes(item.id);
                const isEquipped = progress.equippedWardrobe[item.category] === item.id;
                const canAfford =
                  progress.stars >= item.costStars && progress.diamonds >= item.costDiamonds;

                return (
                  <div
                    key={item.id}
                    className={`flex flex-col justify-between p-4 rounded-2xl border-3 transition-all ${
                      isEquipped
                        ? 'bg-pink-50 border-pink-400 shadow-md ring-2 ring-pink-300'
                        : isUnlocked
                        ? 'bg-white border-pink-200 hover:border-pink-300 shadow-xs'
                        : 'bg-slate-100/90 border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{item.icon}</span>
                        <div>
                          <h4 className="font-black text-sm text-slate-800">{item.name}</h4>
                          {item.badge && (
                            <span className="text-[9px] font-extrabold bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </div>

                      {isEquipped && (
                        <CheckCircle2 className="w-5 h-5 text-pink-500 fill-pink-100" />
                      )}
                    </div>

                    <div className="mt-3">
                      {isEquipped ? (
                        <button
                          onClick={() => handleEquipOrUnlock(item)}
                          className="w-full py-2 bg-pink-500 hover:bg-pink-600 text-white font-extrabold text-xs rounded-xl shadow-sm transition"
                        >
                          Tháo Ra
                        </button>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => handleEquipOrUnlock(item)}
                          className="w-full py-2 bg-pink-100 hover:bg-pink-200 text-pink-800 font-extrabold text-xs rounded-xl transition"
                        >
                          Mặc Vào
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEquipOrUnlock(item)}
                          disabled={!canAfford}
                          className={`w-full py-2 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1 transition ${
                            canAfford
                              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm cursor-pointer'
                              : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <Lock className="w-3.5 h-3.5" />
                          Mở: {item.costStars} ⭐
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
