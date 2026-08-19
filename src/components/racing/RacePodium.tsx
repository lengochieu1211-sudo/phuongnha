/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { RaceResult } from '../../lib/racing/RaceEngine';
import { RacingTrackConfig, CarConfig } from '../../types';
import { Trophy, Star, Sparkles, RotateCcw, Home, Compass, Wrench } from 'lucide-react';
import { audio } from '../../lib/AudioEngine';

interface RacePodiumProps {
  result: RaceResult;
  track: RacingTrackConfig;
  car: CarConfig;
  onReplay: () => void;
  onChooseTrack: () => void;
  onGoGarage: () => void;
  onHome: () => void;
}

export const RacePodium: React.FC<RacePodiumProps> = ({
  result,
  track,
  car,
  onReplay,
  onChooseTrack,
  onGoGarage,
  onHome,
}) => {
  useEffect(() => {
    if (result.rank <= 3) {
      audio.playRaceWinJingle();
    } else {
      audio.playRoundStartJingle();
    }
  }, [result.rank]);

  const formatTime = (ms: number) => {
    if (ms <= 0) return '00:00.00';
    const totalSec = ms / 1000;
    const mins = Math.floor(totalSec / 60);
    const secs = Math.floor(totalSec % 60);
    const hundredths = Math.floor((ms % 1000) / 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${hundredths
      .toString()
      .padStart(2, '0')}`;
  };

  const isFirst = result.rank === 1;

  return (
    <div
      id="race-podium-screen"
      className="w-full h-full min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 select-none overflow-y-auto"
    >
      {/* 1. Header Banner */}
      <div className="flex flex-col items-center text-center mt-4">
        <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 px-6 py-2 rounded-full shadow-2xl mb-2">
          <Trophy className="w-6 h-6 text-amber-300 animate-bounce" />
          <span className="text-sm md:text-base font-black tracking-widest text-white uppercase">
            {isFirst ? '🏆 VÔ ĐỊCH ĐƯỜNG ĐUA!' : '🎉 HOÀN THÀNH CUỘC ĐUA!'}
          </span>
        </div>

        <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-400 to-cyan-400 drop-shadow-lg">
          {isFirst ? 'CHIẾN THẮNG TUYỆT ĐỈNH' : `BẠN VỀ ĐÍCH HẠNG #${result.rank}`}
        </h1>

        <p className="text-xs md:text-sm text-slate-300 font-semibold mt-1">
          Đường đua: <span className="text-cyan-400 font-bold">{track.name}</span> | Xe:{' '}
          <span className="text-amber-400 font-bold">{car.name}</span>
        </p>
      </div>

      {/* 2. Podium Results & Rewards Grid */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-6 max-w-4xl mx-auto w-full my-auto py-6">
        {/* Left: Podium Rankings List */}
        <div className="w-full md:w-1/2 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            BẢNG XẾP HẠNG TAY ĐUA
          </h2>

          <div className="flex flex-col gap-2">
            {result.racersFinished.map((racer, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                  racer.isPlayer
                    ? 'bg-cyan-950/60 border-cyan-400 shadow-lg shadow-cyan-950/40 text-cyan-200'
                    : 'bg-slate-950/40 border-slate-800/80 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs ${
                      racer.rank === 1
                        ? 'bg-amber-400 text-slate-950'
                        : racer.rank === 2
                        ? 'bg-slate-300 text-slate-950'
                        : racer.rank === 3
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {racer.rank}
                  </div>
                  <span className="font-bold text-sm">
                    {racer.name} {racer.isPlayer && '⭐ (Bạn)'}
                  </span>
                </div>

                <span className="font-mono text-xs font-bold text-slate-400">
                  {formatTime(racer.timeMs)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Rewards & Best Lap */}
        <div className="w-full md:w-1/2 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            PHẦN THƯỞNG & THÀNH TÍCH
          </h2>

          {/* Currency Earned */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-amber-950/40 border border-amber-500/40 p-4 rounded-2xl flex items-center gap-3 shadow-inner">
              <span className="text-3xl">⭐</span>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-amber-300 uppercase">Sao Thưởng</span>
                <span className="text-2xl font-black text-amber-400">+{result.starsEarned}</span>
              </div>
            </div>

            <div className="bg-cyan-950/40 border border-cyan-500/40 p-4 rounded-2xl flex items-center gap-3 shadow-inner">
              <span className="text-3xl">💎</span>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-cyan-300 uppercase">Kim Cương</span>
                <span className="text-2xl font-black text-cyan-400">+{result.diamondsEarned}</span>
              </div>
            </div>
          </div>

          {/* Lap Time & Drift Records */}
          <div className="flex flex-col gap-2 bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
            <div className="flex justify-between items-center text-sm font-semibold">
              <span className="text-slate-400">Vòng chạy nhanh nhất:</span>
              <div className="flex items-center gap-1.5 font-mono font-bold text-amber-400">
                <span>{formatTime(result.bestLapTimeMs)}</span>
                {result.isNewRecord && (
                  <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">
                    KỶ LỤC MỚI!
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center text-sm font-semibold">
              <span className="text-slate-400">Điểm Drift ôm cua:</span>
              <span className="font-bold text-purple-400 font-mono">+{result.totalDriftScore} PTS</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-4 max-w-2xl mx-auto w-full mb-4">
        <button
          onClick={onReplay}
          className="flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all min-w-[160px]"
        >
          <RotateCcw className="w-5 h-5" />
          <span>ĐUA LẠI</span>
        </button>

        <button
          onClick={onChooseTrack}
          className="flex-1 py-3.5 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all min-w-[160px]"
        >
          <Compass className="w-5 h-5 text-amber-400" />
          <span>ĐƯỜNG ĐUA KHÁC</span>
        </button>

        <button
          onClick={onGoGarage}
          className="flex-1 py-3.5 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all min-w-[160px]"
        >
          <Wrench className="w-5 h-5 text-purple-400" />
          <span>VÀO GARA</span>
        </button>

        <button
          onClick={onHome}
          className="py-3.5 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-black text-sm shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <Home className="w-5 h-5" />
          <span>VỀ MENU CHÍNH</span>
        </button>
      </div>
    </div>
  );
};
