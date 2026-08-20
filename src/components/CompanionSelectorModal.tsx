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
        accent: 'from-fuchsia-500 to-violet-600',
        chip: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700',
        preview: 'from-fuchsia-50 via-violet-50 to-pink-50',
        glow: 'bg-fuchsia-300/35',
        title: 'text-fuchsia-950',
        ability: 'border-fuchsia-100 bg-fuchsia-50/75 text-fuchsia-900',
      };
    case 'cinnamoroll':
      return {
        accent: 'from-sky-500 to-cyan-500',
        chip: 'border-sky-200 bg-sky-50 text-sky-700',
        preview: 'from-sky-50 via-cyan-50 to-white',
        glow: 'bg-sky-300/35',
        title: 'text-sky-950',
        ability: 'border-sky-100 bg-sky-50/75 text-sky-900',
      };
    case 'capybara':
      return {
        accent: 'from-amber-500 to-orange-500',
        chip: 'border-amber-200 bg-amber-50 text-amber-700',
        preview: 'from-amber-50 via-orange-50 to-yellow-50',
        glow: 'bg-amber-300/35',
        title: 'text-amber-950',
        ability: 'border-amber-100 bg-amber-50/75 text-amber-900',
      };
    default:
      return {
        accent: 'from-violet-500 to-fuchsia-500',
        chip: 'border-violet-200 bg-violet-50 text-violet-700',
        preview: 'from-violet-50 via-fuchsia-50 to-cyan-50',
        glow: 'bg-violet-300/35',
        title: 'text-violet-950',
        ability: 'border-violet-100 bg-violet-50/75 text-violet-900',
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
        onUpdateProgress((prev) => ({ ...prev, selectedCharacter: charId }));
      }
      return;
    }

    if (progress.stars >= cost) {
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
      return;
    }

    audio.playFail();
  };

  const unlockedCount = CHARACTERS_CONFIG.filter(
    (char) => char.isUnlockedByDefault || progress.unlockedCharacters.includes(char.id as CharacterId),
  ).length;
  const selectedName =
    CHARACTERS_CONFIG.find((char) => char.id === progress.selectedCharacter)?.name ?? 'Chưa chọn';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-2.5 backdrop-blur-md sm:p-4">
      <div
        id="companion-selector-card"
        className="relative flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-white/70 bg-[#fffdf9] shadow-[0_30px_90px_rgba(15,23,42,0.34)] sm:rounded-[34px]"
      >
        <div className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full bg-amber-200/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 top-10 h-64 w-64 rounded-full bg-sky-200/25 blur-3xl" />

        <button
          onClick={onClose}
          aria-label="Đóng chọn bạn đồng hành"
          className="absolute right-3 top-3 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-500 shadow-md transition hover:scale-105 hover:text-slate-900 sm:right-5 sm:top-5"
        >
          <X className="h-5 w-5" />
        </button>

        <header className="relative z-10 border-b border-amber-100/90 px-4 pb-4 pt-5 sm:px-7 sm:pb-5 sm:pt-6 lg:px-9">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="pr-10 lg:max-w-[58%]">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">
                <Sparkles className="h-3.5 w-3.5" />
                Bạn Đồng Hành Ma Thuật
              </div>
              <h2 className="text-xl font-black leading-tight text-slate-900 sm:text-2xl lg:text-[1.75rem]">
                Chọn người bạn cùng phiêu lưu
              </h2>
              <p className="mt-1.5 text-xs font-semibold leading-5 text-slate-500 sm:text-sm">
                Chạm để chọn. Mỗi bạn có một năng lực riêng trong trò chơi.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="min-w-0 rounded-2xl border border-amber-100 bg-white/85 px-3 py-2.5 shadow-sm">
                <div className="text-[9px] font-black uppercase tracking-wide text-slate-400 sm:text-[10px]">Sao</div>
                <div className="mt-0.5 flex items-center gap-1.5 text-base font-black text-amber-500">
                  <Star className="h-4 w-4 shrink-0 fill-amber-300" />
                  {progress.stars}
                </div>
              </div>
              <div className="min-w-0 rounded-2xl border border-emerald-100 bg-white/85 px-3 py-2.5 shadow-sm">
                <div className="text-[9px] font-black uppercase tracking-wide text-slate-400 sm:text-[10px]">Đã mở</div>
                <div className="mt-0.5 flex items-center gap-1.5 text-base font-black text-emerald-600">
                  <Heart className="h-4 w-4 shrink-0 fill-emerald-100" />
                  {unlockedCount}
                </div>
              </div>
              <div className="min-w-0 rounded-2xl border border-violet-100 bg-white/85 px-3 py-2.5 shadow-sm">
                <div className="text-[9px] font-black uppercase tracking-wide text-slate-400 sm:text-[10px]">Đang chọn</div>
                <div className="mt-0.5 truncate text-sm font-black text-violet-700">{selectedName}</div>
              </div>
            </div>
          </div>
        </header>

        <div className="relative z-10 overflow-y-auto px-3 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
          <div className="-mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-3 md:mx-0 md:grid md:grid-cols-2 md:gap-5 md:overflow-visible md:px-0 md:pb-0 xl:grid-cols-3">
            {CHARACTERS_CONFIG.map((char) => {
              const isUnlocked =
                char.isUnlockedByDefault || progress.unlockedCharacters.includes(char.id as CharacterId);
              const isSelected = progress.selectedCharacter === char.id;
              const canAfford = progress.stars >= char.unlockStars;
              const tone = getToneClasses(char.id);

              return (
                <article
                  key={char.id}
                  className={`relative flex w-[86vw] max-w-[340px] shrink-0 snap-center flex-col overflow-hidden rounded-[26px] border bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.10)] transition sm:w-[72vw] md:w-auto md:max-w-none ${
                    isSelected
                      ? 'border-amber-300 ring-2 ring-amber-200/80'
                      : 'border-slate-200 hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(15,23,42,0.13)]'
                  }`}
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-wide ${tone.chip}`}>
                        <Sparkles className="h-3 w-3 shrink-0" />
                        <span className="truncate">{char.species}</span>
                      </div>
                      <h3 className={`mt-2 truncate text-xl font-black tracking-tight ${tone.title}`}>{char.name}</h3>
                    </div>

                    {isSelected ? (
                      <div className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1.5 text-[10px] font-black text-white shadow-sm">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Đã chọn
                      </div>
                    ) : !isUnlocked ? (
                      <div className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-800 px-2.5 py-1.5 text-[10px] font-black text-white">
                        <Lock className="h-3.5 w-3.5" />
                        {char.unlockStars}
                        <Star className="h-3 w-3 fill-current" />
                      </div>
                    ) : null}
                  </div>

                  <div className={`relative mb-3 overflow-hidden rounded-[22px] border border-white bg-gradient-to-br ${tone.preview} shadow-inner`}>
                    <div className={`pointer-events-none absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full ${tone.glow} blur-3xl`} />
                    <div className="pointer-events-none absolute inset-x-[20%] bottom-3 h-5 rounded-full bg-slate-900/10 blur-md" />
                    <div className="relative flex h-[200px] items-center justify-center sm:h-[215px] lg:h-[225px]">
                      <CharacterAvatar
                        characterId={char.id as CharacterId}
                        animState={isSelected ? 'happy' : 'idle'}
                        equipped={isSelected ? progress.equippedWardrobe : {}}
                        size={196}
                        className="drop-shadow-[0_14px_18px_rgba(15,23,42,0.22)]"
                      />
                    </div>
                  </div>

                  <p className="line-clamp-2 min-h-[42px] text-[13px] font-semibold leading-[21px] text-slate-500">
                    {char.description}
                  </p>

                  <div className={`mt-3 flex min-h-[52px] items-center gap-2 rounded-2xl border px-3 py-2.5 ${tone.ability}`}>
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/90 shadow-sm">
                      <Wand2 className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-[9px] font-black uppercase tracking-wide opacity-60">Năng lực</div>
                      <div className="line-clamp-2 text-[12px] font-black leading-4">{char.specialAbility}</div>
                    </div>
                  </div>

                  <div className="mt-auto pt-4">
                    {isSelected ? (
                      <button
                        disabled
                        className="w-full rounded-2xl bg-emerald-500 py-3 text-sm font-black text-white shadow-md shadow-emerald-500/20"
                      >
                        Bạn đồng hành hiện tại
                      </button>
                    ) : isUnlocked ? (
                      <button
                        onClick={() => handleSelectOrUnlock(char.id as CharacterId, char.unlockStars, true)}
                        className={`w-full rounded-2xl bg-gradient-to-r ${tone.accent} py-3 text-sm font-black text-white shadow-md transition hover:-translate-y-0.5 hover:brightness-105`}
                      >
                        Chọn {char.name}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSelectOrUnlock(char.id as CharacterId, char.unlockStars, false)}
                        disabled={!canAfford}
                        className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-black transition ${
                          canAfford
                            ? `bg-gradient-to-r ${tone.accent} text-white shadow-md hover:-translate-y-0.5 hover:brightness-105`
                            : 'cursor-not-allowed bg-slate-200 text-slate-400'
                        }`}
                      >
                        <Lock className="h-4 w-4" />
                        Mở khóa {char.unlockStars}
                        <Star className="h-3.5 w-3.5 fill-current" />
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
          <div className="mt-1 text-center text-[10px] font-bold text-slate-400 md:hidden">
            Vuốt ngang để xem thêm nhân vật
          </div>
        </div>
      </div>
    </div>
  );
}
