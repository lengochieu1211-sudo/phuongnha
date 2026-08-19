/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Lock, Star, Sparkles, CheckCircle2 } from 'lucide-react';
import { CharacterId, PlayerProgress } from '../types';
import { CHARACTERS_CONFIG } from '../utils/characterRenderer';
import CharacterAvatar from './CharacterAvatar';
import { audio } from '../lib/AudioEngine';

interface CompanionSelectorModalProps {
  isOpen?: boolean;
  progress: PlayerProgress;
  onUpdateProgress?: (updater: (p: PlayerProgress) => PlayerProgress) => void;
  onSelectCompanion?: (charId: CharacterId) => void;
  onUnlockCompanion?: (charId: CharacterId, cost: number) => void;
  onClose: () => void;
}

export default function CompanionSelectorModal({
  isOpen = true,
  progress,
  onUpdateProgress,
  onSelectCompanion,
  onUnlockCompanion,
  onClose,
}: CompanionSelectorModalProps) {
  if (isOpen === false) return null;

  const handleSelectOrUnlock = (charId: CharacterId, cost: number, isUnlocked: boolean) => {
    if (isUnlocked) {
      audio.playCollect();
      if (onSelectCompanion) {
        onSelectCompanion(charId);
      } else if (onUpdateProgress) {
        onUpdateProgress((prev) => ({
          ...prev,
          selectedCharacter: charId,
        }));
      }
    } else if (progress.stars >= cost) {
      audio.playPowerup();
      if (onUnlockCompanion) {
        onUnlockCompanion(charId, cost);
      } else if (onUpdateProgress) {
        onUpdateProgress((prev) => ({
          ...prev,
          stars: prev.stars - cost,
          unlockedCharacters: [...prev.unlockedCharacters, charId],
          selectedCharacter: charId,
        }));
      }
    } else {
      audio.playFail();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        id="companion-selector-card"
        className="relative w-full max-w-4xl bg-[#FFFAF0] rounded-3xl border-4 border-amber-300 shadow-2xl p-6 md:p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto"
        style={{
          backgroundImage:
            'radial-gradient(circle at 10% 20%, rgba(255, 182, 193, 0.3) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(173, 216, 230, 0.3) 0%, transparent 40%)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white text-slate-500 hover:text-slate-800 rounded-full border-2 border-amber-200 shadow-sm transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-wider mb-2 border border-amber-300">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Chọn Bạn Đồng Hành
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800">
            Bạn Muốn Đi Phiêu Lưu Cùng Ai?
          </h2>
          <p className="text-xs text-slate-500 font-bold mt-1">
            Số sao hiện có:{' '}
            <span className="text-amber-500 font-black inline-flex items-center gap-1 text-sm">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500 inline" /> {progress.stars}
            </span>
          </p>
        </div>

        {/* Mascot Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CHARACTERS_CONFIG.map((char) => {
            const isUnlocked =
              char.isUnlockedByDefault || progress.unlockedCharacters.includes(char.id as CharacterId);
            const isSelected = progress.selectedCharacter === char.id;
            const canAfford = progress.stars >= char.unlockStars;

            return (
              <div
                key={char.id}
                className={`relative flex flex-col items-center p-5 rounded-3xl border-4 transition-all duration-300 ${
                  isSelected
                    ? 'bg-amber-50 border-amber-400 shadow-xl scale-102 ring-4 ring-amber-200'
                    : isUnlocked
                    ? 'bg-white border-amber-200 hover:border-amber-300 hover:shadow-lg'
                    : 'bg-slate-100/80 border-slate-300 opacity-90'
                }`}
              >
                {/* Selected Badge */}
                {isSelected && (
                  <div className="absolute top-3 right-3 bg-amber-500 text-white p-1 rounded-full shadow-md">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                )}

                {/* Avatar Preview */}
                <div className="my-2 flex items-center justify-center h-44">
                  <CharacterAvatar
                    characterId={char.id as CharacterId}
                    animState={isSelected ? 'happy' : 'idle'}
                    equipped={isSelected ? progress.equippedWardrobe : {}}
                    size={160}
                  />
                </div>

                {/* Info */}
                <div className="text-center w-full">
                  <h3 className="font-black text-lg text-slate-800">{char.name}</h3>
                  <span className="text-[10px] font-extrabold text-amber-600 bg-amber-100 px-2.5 py-0.5 rounded-full inline-block mb-1">
                    {char.species}
                  </span>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed my-2 min-h-[36px]">
                    {char.description}
                  </p>

                  <div className="bg-amber-50/80 p-2 rounded-xl text-[10px] font-black text-amber-800 border border-amber-200 mb-4">
                    {char.specialAbility}
                  </div>

                  {/* Action Button */}
                  {isSelected ? (
                    <button
                      disabled
                      className="w-full py-2.5 bg-emerald-500 text-white font-extrabold text-xs rounded-2xl shadow-md cursor-default"
                    >
                      Đang Chọn
                    </button>
                  ) : isUnlocked ? (
                    <button
                      onClick={() => handleSelectOrUnlock(char.id as CharacterId, char.unlockStars, true)}
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-2xl shadow-md transition transform hover:scale-102"
                    >
                      Chọn {char.name}
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        handleSelectOrUnlock(char.id as CharacterId, char.unlockStars, false)
                      }
                      disabled={!canAfford}
                      className={`w-full py-2.5 font-extrabold text-xs rounded-2xl shadow-md flex items-center justify-center gap-1.5 transition ${
                        canAfford
                          ? 'bg-amber-500 hover:bg-amber-600 text-white cursor-pointer'
                          : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Mở khóa: {char.unlockStars} <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-500" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
