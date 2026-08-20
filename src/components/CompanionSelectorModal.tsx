/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Lock, Star, Sparkles, CheckCircle2, Heart, Wand2 } from 'lucide-react';
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

const getToneClasses = (charId: string) => {
  switch (charId) {
    case 'kuromi':
      return {
        shell: 'from-slate-900 via-fuchsia-900 to-violet-800',
        halo: 'from-fuchsia-400/30 via-violet-400/20 to-cyan-300/20',
        chip: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
        accent: 'from-fuchsia-500 to-violet-500',
        accentSoft: 'from-fuchsia-50 via-violet-50 to-pink-50',
        ring: 'ring-fuchsia-200',
      };
    case 'cinnamoroll':
      return {
        shell: 'from-sky-500 via-cyan-400 to-blue-500',
        halo: 'from-cyan-300/35 via-sky-300/20 to-white/10',
        chip: 'bg-sky-100 text-sky-700 border-sky-200',
        accent: 'from-sky-500 to-cyan-500',
        accentSoft: 'from-cyan-50 via-sky-50 to-indigo-50',
        ring: 'ring-sky-200',
      };
    case 'capybara':
      return {
        shell: 'from-amber-700 via-orange-500 to-yellow-500',
        halo: 'from-amber-300/30 via-orange-300/15 to-lime-200/10',
        chip: 'bg-amber-100 text-amber-700 border-amber-200',
        accent: 'from-amber-500 to-orange-500',
        accentSoft: 'from-amber-50 via-orange-50 to-yellow-50',
        ring: 'ring-amber-200',
      };
    default:
      return {
        shell: 'from-violet-700 via-fuchsia-600 to-cyan-500',
        halo: 'from-fuchsia-300/30 via-sky-300/20 to-amber-200/15',
        chip: 'bg-violet-100 text-violet-700 border-violet-200',
        accent: 'from-violet-500 to-fuchsia-500',
        accentSoft: 'from-violet-50 via-fuchsia-50 to-cyan-50',
        ring: 'ring-violet-200',
      };
  }
};

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
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div
        id="companion-selector-card"
        className="relative w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/40 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.35)] max-h-[92vh]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 12% 16%, rgba(254,240,138,0.28) 0%, transparent 28%), radial-gradient(circle at 88% 12%, rgba(147,197,253,0.22) 0%, transparent 25%), linear-gradient(180deg, #fffdf8 0%, #fff8ee 42%, #ffffff 100%)',
        }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-70" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.16) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
        <div className="relative flex max-h-[92vh] flex-col">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-500 shadow-lg transition hover:-translate-y-0.5 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="border-b border-amber-100 px-5 pb-5 pt-6 sm:px-7 sm:pb-6 sm:pt-7 lg:px-9">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/90 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-amber-700 shadow-sm">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Khu Kết Bạn Ma Thuật
                </div>
                <h2 className="text-2xl font-black leading-tight text-slate-900 sm:text-3xl lg:text-[2rem]">
                  Chọn Bạn Đồng Hành Thật Xinh Cho Chuyến Phiêu Lưu
                </h2>
                <p className="mt-2 max-w-xl text-sm font-medium leading-relaxed text-slate-500">
                  Mỗi nhân vật có phong cách, hiệu ứng hỗ trợ và cá tính riêng. Chọn bé bạn thích nhất để cùng chơi game, thử đồ và khám phá thế giới phép thuật.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-amber-200 bg-white/90 px-4 py-3 shadow-sm">
                  <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">Sao hiện có</div>
                  <div className="mt-1 inline-flex items-center gap-2 text-lg font-black text-amber-500">
                    <Star className="h-5 w-5 fill-amber-300 text-amber-500" />
                    {progress.stars}
                  </div>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-white/90 px-4 py-3 shadow-sm">
                  <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">Đã mở</div>
                  <div className="mt-1 inline-flex items-center gap-2 text-lg font-black text-emerald-600">
                    <Heart className="h-5 w-5 fill-emerald-200 text-emerald-500" />
                    {CHARACTERS_CONFIG.filter((char) => char.isUnlockedByDefault || progress.unlockedCharacters.includes(char.id as CharacterId)).length}
                  </div>
                </div>
                <div className="rounded-2xl border border-violet-200 bg-white/90 px-4 py-3 shadow-sm col-span-2 sm:col-span-1">
                  <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">Đang chọn</div>
                  <div className="mt-1 truncate text-sm font-black text-violet-700">
                    {CHARACTERS_CONFIG.find((char) => char.id === progress.selectedCharacter)?.name ?? 'Chưa chọn'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {CHARACTERS_CONFIG.map((char) => {
                const isUnlocked =
                  char.isUnlockedByDefault || progress.unlockedCharacters.includes(char.id as CharacterId);
                const isSelected = progress.selectedCharacter === char.id;
                const canAfford = progress.stars >= char.unlockStars;
                const tone = getToneClasses(char.id);

                return (
                  <div
                    key={char.id}
                    className={`group relative overflow-hidden rounded-[28px] border p-[1px] shadow-[0_14px_40px_rgba(15,23,42,0.10)] transition duration-300 ${
                      isSelected
                        ? `border-amber-300 bg-gradient-to-br ${tone.accent} shadow-[0_18px_44px_rgba(245,158,11,0.26)]`
                        : 'border-slate-200/80 bg-white hover:-translate-y-1 hover:shadow-[0_18px_44px_rgba(15,23,42,0.14)]'
                    }`}
                  >
                    <div
                      className={`relative h-full rounded-[27px] border ${
                        isSelected ? 'border-white/40 bg-white/96' : 'border-white bg-white/98'
                      } px-4 pb-4 pt-4 sm:px-5`}
                    >
                      <div className={`absolute inset-x-0 top-0 h-28 rounded-t-[27px] bg-gradient-to-br ${tone.accentSoft} opacity-95`} />
                      <div className={`pointer-events-none absolute right-[-24px] top-[-24px] h-28 w-28 rounded-full bg-gradient-to-br ${tone.halo} blur-2xl`} />

                      {isSelected ? (
                        <div className="absolute right-3 top-3 z-[2] inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-black text-white shadow-lg">
                          <CheckCircle2 className="h-4 w-4" />
                          Đang chọn
                        </div>
                      ) : !isUnlocked ? (
                        <div className="absolute right-3 top-3 z-[2] inline-flex items-center gap-1.5 rounded-full bg-slate-900/85 px-3 py-1 text-[11px] font-black text-white shadow-lg">
                          <Lock className="h-3.5 w-3.5" />
                          Khóa
                        </div>
                      ) : null}

                      <div className="relative z-[1]">
                        <div className="mb-4 flex items-start justify-between gap-3">
                          <div>
                            <div className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${tone.chip}`}>
                              <Sparkles className="h-3.5 w-3.5" />
                              {char.species}
                            </div>
                            <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-900">{char.name}</h3>
                          </div>
                          <div className="rounded-2xl bg-white/85 px-2.5 py-2 text-right shadow-sm ring-1 ring-black/5">
                            <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">Mở khóa</div>
                            <div className="mt-1 inline-flex items-center gap-1 text-sm font-black text-amber-500">
                              <Star className="h-4 w-4 fill-amber-300 text-amber-500" />
                              {char.unlockStars}
                            </div>
                          </div>
                        </div>

                        <div className={`relative mb-4 overflow-hidden rounded-[26px] border border-white/70 bg-gradient-to-br ${tone.shell} p-4 shadow-inner`}>
                          <div className="absolute inset-x-5 bottom-3 h-6 rounded-full bg-black/20 blur-md" />
                          <div className="absolute left-3 top-3 h-10 w-10 rounded-full border border-white/25 bg-white/10 blur-sm" />
                          <div className="absolute right-4 top-4 h-16 w-16 rounded-full border border-white/10 bg-white/10 blur-xl" />
                          <div className="relative flex min-h-[210px] items-center justify-center rounded-[22px] border border-white/20 bg-white/8 backdrop-blur-[2px]">
                            <div className="absolute inset-x-6 bottom-4 h-7 rounded-full bg-white/20 blur-md" />
                            <CharacterAvatar
                              characterId={char.id as CharacterId}
                              animState={isSelected ? 'happy' : 'idle'}
                              equipped={isSelected ? progress.equippedWardrobe : {}}
                              size={176}
                              className="drop-shadow-[0_10px_18px_rgba(15,23,42,0.32)]"
                            />
                          </div>
                        </div>

                        <p className="min-h-[68px] text-sm font-medium leading-6 text-slate-500">
                          {char.description}
                        </p>

                        <div className="mt-4 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-pink-50 p-3.5 shadow-sm">
                          <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-white/85 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-amber-700 shadow-sm">
                            <Wand2 className="h-3.5 w-3.5" />
                            Năng lực đặc biệt
                          </div>
                          <div className="text-sm font-black leading-5 text-amber-900">
                            {char.specialAbility}
                          </div>
                        </div>

                        <div className="mt-5">
                          {isSelected ? (
                            <button
                              disabled
                              className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-500/25 cursor-default"
                            >
                              Bạn đồng hành hiện tại
                            </button>
                          ) : isUnlocked ? (
                            <button
                              onClick={() => handleSelectOrUnlock(char.id as CharacterId, char.unlockStars, true)}
                              className={`w-full rounded-2xl bg-gradient-to-r ${tone.accent} py-3.5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:brightness-105`}
                            >
                              Chọn {char.name}
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                handleSelectOrUnlock(char.id as CharacterId, char.unlockStars, false)
                              }
                              disabled={!canAfford}
                              className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-black shadow-lg transition ${
                                canAfford
                                  ? `bg-gradient-to-r ${tone.accent} text-white hover:-translate-y-0.5 hover:brightness-105`
                                  : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                              }`}
                            >
                              <Lock className="h-4 w-4" />
                              Mở khóa ngay
                              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[12px]">
                                {char.unlockStars}
                                <Star className="h-3.5 w-3.5 fill-current" />
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
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
