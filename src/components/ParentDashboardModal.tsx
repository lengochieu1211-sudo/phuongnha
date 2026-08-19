/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, ShieldCheck, Clock, Award, Flame, Heart, Lock } from 'lucide-react';
import { ParentStats, PlayerProgress } from '../types';

interface ParentDashboardModalProps {
  isOpen?: boolean;
  stats?: ParentStats;
  progress?: PlayerProgress;
  onClose: () => void;
}

export default function ParentDashboardModal({
  isOpen = true,
  stats,
  progress,
  onClose,
}: ParentDashboardModalProps) {
  if (isOpen === false) return null;

  const totalScore = Object.values(progress?.highScores || {}).reduce((a, b) => a + b, 0);

  const displayStats = {
    todayPlayMinutes: progress?.parentStats?.todayPlayMinutes ?? stats?.todayPlayMinutes ?? 0,
    stagesCompleted: progress?.parentStats?.stagesCompleted ?? stats?.stagesCompleted ?? 0,
    workoutSessions: progress?.parentStats?.workoutSessions ?? stats?.workoutSessions ?? 0,
    starsEarnedToday: progress?.parentStats?.starsEarnedToday ?? stats?.starsEarnedToday ?? 0,
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        id="parent-dashboard-card"
        className="relative w-full max-w-2xl bg-[#FFFAF0] rounded-3xl border-4 border-indigo-300 shadow-2xl p-6 md:p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto font-sans text-slate-800"
        style={{
          backgroundImage:
            'radial-gradient(circle at 10% 20%, rgba(255, 182, 193, 0.3) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(173, 216, 230, 0.3) 0%, transparent 40%)',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white text-slate-500 hover:text-slate-800 rounded-full border-2 border-indigo-200 shadow-sm transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-800 px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-wider mb-2 border border-indigo-300">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            Góc Phụ Huynh
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800">
            Theo Dõi Vận Động Của Bé
          </h2>
          <p className="text-xs text-slate-500 font-bold mt-1">
            Báo cáo tổng quan hoạt động trong ngày của bé Phương Nhã
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border-2 border-indigo-100 text-center shadow-xs">
            <Clock className="w-6 h-6 text-indigo-500 mx-auto mb-1" />
            <span className="text-2xl font-black text-indigo-700">{displayStats.todayPlayMinutes}</span>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase mt-0.5">
              Phút Vận Động
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border-2 border-emerald-100 text-center shadow-xs">
            <Award className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
            <span className="text-2xl font-black text-emerald-700">{displayStats.stagesCompleted}</span>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase mt-0.5">
              Màn Hoàn Thành
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border-2 border-amber-100 text-center shadow-xs">
            <Flame className="w-6 h-6 text-amber-500 mx-auto mb-1" />
            <span className="text-2xl font-black text-amber-700">{displayStats.workoutSessions}</span>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase mt-0.5">
              Bài Vận Động
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border-2 border-rose-100 text-center shadow-xs">
            <Heart className="w-6 h-6 text-rose-500 mx-auto mb-1" />
            <span className="text-2xl font-black text-rose-700">{displayStats.starsEarnedToday}</span>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase mt-0.5">
              Sao Đạt Được
            </p>
          </div>
        </div>

        {/* Privacy & Safety Guarantee */}
        <div className="bg-white p-5 rounded-2xl border-2 border-indigo-200 shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-2 font-black text-sm text-indigo-900 border-b pb-2">
            <Lock className="w-4 h-4 text-indigo-600" />
            Cam Kết Bảo Mật & Quyền Riêng Tư 100%
          </div>

          <ul className="text-xs text-slate-600 font-medium space-y-2 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">✓</span>
              Toàn bộ hình ảnh camera được xử lý trực tiếp nội bộ trên thiết bị.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">✓</span>
              KHÔNG lưu trữ, KHÔNG ghi hình và KHÔNG gửi hình ảnh của bé lên bất kỳ máy chủ nào.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">✓</span>
              KHÔNG có quảng cáo, KHÔNG có mua hàng bằng tiền thật trong ứng dụng.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">✓</span>
              Trò chơi hoạt động hoàn toàn ngoại tuyến (Offline local).
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
