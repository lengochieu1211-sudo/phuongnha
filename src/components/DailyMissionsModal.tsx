/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Trophy, CheckCircle2, Star, Sparkles, Calendar } from 'lucide-react';
import { PlayerProgress, DailyMission } from '../types';
import { ACHIEVEMENTS } from '../utils/progression';
import { audio } from '../lib/AudioEngine';

interface DailyMissionsModalProps {
  isOpen?: boolean;
  progress: PlayerProgress;
  onUpdateProgress?: (updater: (p: PlayerProgress) => PlayerProgress) => void;
  onClaimMission?: (missionId: string, rewardStars: number, rewardDiamonds: number) => void;
  onClose: () => void;
}

const DEFAULT_DAILY_MISSIONS: DailyMission[] = [
  {
    id: 'm1',
    title: 'Thợ Săn Vì Sao',
    description: 'Bắt 30 ngôi sao trong các trò chơi',
    targetCount: 30,
    currentCount: 0,
    isCompleted: false,
    rewardStars: 15,
    rewardDiamonds: 2,
  },
  {
    id: 'm2',
    title: 'Nhà Thám Hiểm',
    description: 'Hoàn thành 2 màn chạy phiêu lưu Bara',
    targetCount: 2,
    currentCount: 0,
    isCompleted: false,
    rewardStars: 20,
    rewardDiamonds: 3,
  },
  {
    id: 'm3',
    title: 'Vũ Công Nhí',
    description: 'Hoàn thành 1 bài nhảy Vũ Điệu Vui Nhộn',
    targetCount: 1,
    currentCount: 0,
    isCompleted: false,
    rewardStars: 25,
    rewardDiamonds: 5,
  },
];

export default function DailyMissionsModal({
  isOpen = true,
  progress,
  onUpdateProgress,
  onClaimMission,
  onClose,
}: DailyMissionsModalProps) {
  const [activeTab, setActiveTab] = useState<'daily' | 'achievements'>('daily');

  if (isOpen === false) return null;

  const claimMissionReward = (missionId: string) => {
    const mission = (progress.dailyMissions as any)?.find((m: any) => m.id === missionId);
    if (!mission || mission.isClaimed || !mission.isCompleted) return;

    audio.playSuccess();
    const stars = mission.rewardStars || 15;
    const diamonds = mission.rewardDiamonds || 2;

    if (onClaimMission) {
      onClaimMission(missionId, stars, diamonds);
    } else if (onUpdateProgress) {
      onUpdateProgress((prev) => {
        const updatedMissions = prev.dailyMissions.map((m) =>
          m.id === missionId ? { ...m, isClaimed: true } : m
        );
        return {
          ...prev,
          stars: prev.stars + stars,
          diamonds: prev.diamonds + diamonds,
          dailyMissions: updatedMissions,
        };
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        id="daily-missions-card"
        className="relative w-full max-w-3xl bg-[#FFFAF0] rounded-3xl border-4 border-amber-300 shadow-2xl p-6 md:p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto font-sans text-slate-800"
        style={{
          backgroundImage:
            'radial-gradient(circle at 10% 20%, rgba(255, 182, 193, 0.3) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(173, 216, 230, 0.3) 0%, transparent 40%)',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white text-slate-500 hover:text-slate-800 rounded-full border-2 border-amber-200 shadow-sm transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-wider mb-2 border border-amber-300">
            <Trophy className="w-4 h-4 text-amber-600" />
            Nhiệm Vụ & Thành Tích
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800">
            Thưởng Lớn Mỗi Ngày!
          </h2>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center gap-3">
          <button
            onClick={() => setActiveTab('daily')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs transition ${
              activeTab === 'daily'
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-white text-slate-600 border-2 border-amber-200 hover:bg-amber-50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Nhiệm Vụ Hôm Nay
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs transition ${
              activeTab === 'achievements'
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-white text-slate-600 border-2 border-amber-200 hover:bg-amber-50'
            }`}
          >
            <Trophy className="w-4 h-4" />
            Bảng Thành Tích
          </button>
        </div>

        {/* Daily Missions List */}
        {activeTab === 'daily' ? (
          <div className="flex flex-col gap-3">
            {(progress.dailyMissions?.length ? progress.dailyMissions : DEFAULT_DAILY_MISSIONS).map(
              (m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-white border-2 border-amber-200 shadow-xs"
                >
                  <div>
                    <h4 className="font-black text-sm text-slate-800">{m.title}</h4>
                    <p className="text-xs text-slate-500 font-medium">{m.description}</p>
                    <div className="mt-2 w-48 bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (m.currentCount / m.targetCount) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    {m.isClaimed ? (
                      <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-3.5 py-1.5 rounded-xl border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Đã nhận
                      </span>
                    ) : m.isCompleted ? (
                      <button
                        onClick={() => claimMissionReward(m.id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-xl shadow-md transition animate-bounce"
                      >
                        <Sparkles className="w-4 h-4" />
                        Nhận +{m.rewardStars} ⭐
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl">
                        {m.currentCount}/{m.targetCount}
                      </span>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        ) : (
          /* Achievements List */
          <div className="flex flex-col gap-3">
            {ACHIEVEMENTS.map((ach) => {
              const isUnlocked = progress.achievements.includes(ach.id);
              return (
                <div
                  key={ach.id}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 transition ${
                    isUnlocked
                      ? 'bg-amber-50 border-amber-300'
                      : 'bg-white border-slate-200 opacity-80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🏆</span>
                    <div>
                      <h4 className="font-black text-sm text-slate-800">{ach.title}</h4>
                      <p className="text-xs text-slate-500 font-medium">{ach.description}</p>
                    </div>
                  </div>

                  <div>
                    {isUnlocked ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 fill-emerald-100" />
                    ) : (
                      <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                        Thưởng +{ach.rewardStars} ⭐
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
