/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Trophy, RotateCcw, Heart, Sparkles, Timer } from 'lucide-react';
import { PlayerProgress, GameGesture } from '../types';
import { audio } from '../lib/AudioEngine';

interface ParentPlayGameProps {
  progress: PlayerProgress;
  onUpdateProgress: (updater: (p: PlayerProgress) => PlayerProgress) => void;
  gesture: GameGesture;
  onBack: () => void;
}

interface TurnChallenge {
  player: 'child' | 'parent';
  targetGesture: GameGesture;
  title: string;
  desc: string;
  points: number;
}

const CHALLENGES: TurnChallenge[] = [
  { player: 'child', targetGesture: 'jump', title: 'Bé Phương Nhã: Nhảy Bật Cao', desc: 'Bé hãy nhảy 3 lần thật khỏe nhé!', points: 30 },
  { player: 'parent', targetGesture: 'both_arms_up', title: 'Bố/Mẹ: Vươn Cao Hai Tay', desc: 'Bố mẹ hãy vươn hai tay lên cao cổ vũ bé!', points: 30 },
  { player: 'child', targetGesture: 'tilt_left', title: 'Bé Phương Nhã: Nghiêng Trái', desc: 'Nghiêng người sang trái như cành liễu!', points: 30 },
  { player: 'parent', targetGesture: 'tilt_right', title: 'Bố/Mẹ: Nghiêng Phải', desc: 'Nghiêng sang phải tạo thành cổng vòm!', points: 30 },
  { player: 'child', targetGesture: 'duck', title: 'Bé Phương Nhã: Cúi Người / Ngồi Xổm', desc: 'Ngồi xổm nhặt hoa tươi!', points: 30 },
  { player: 'parent', targetGesture: 'hands_spread', title: 'Bố/Mẹ & Bé: Dang Rộng Vòng Tay', desc: 'Hai bố mẹ và bé cùng ôm nhau ăn mừng!', points: 50 },
];

export default function ParentPlayGame({
  progress,
  onUpdateProgress,
  gesture,
  onBack,
}: ParentPlayGameProps) {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(15); // 15 seconds per turn

  const currentChallenge = CHALLENGES[currentIdx];

  // Turn timer
  useEffect(() => {
    if (isGameOver) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          // Move to next challenge
          handleNextChallenge(false);
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentIdx, isGameOver]);

  // Check gesture match
  useEffect(() => {
    if (isGameOver || !currentChallenge) return;

    if (gesture === currentChallenge.targetGesture) {
      audio.playSuccess();
      setTotalScore((s) => s + currentChallenge.points);
      handleNextChallenge(true);
    }
  }, [gesture, currentIdx, isGameOver]);

  const handleNextChallenge = (success: boolean) => {
    if (currentIdx < CHALLENGES.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setTimer(15);
    } else {
      setIsGameOver(true);
      audio.playPowerup();
      // Reward family team
      onUpdateProgress((prev) => ({
        ...prev,
        stars: prev.stars + 25,
        diamonds: prev.diamonds + 10,
      }));
    }
  };

  const restartGame = () => {
    setCurrentIdx(0);
    setTotalScore(0);
    setIsGameOver(false);
    setTimer(15);
  };

  return (
    <div
      id="parent-play-container"
      className="flex flex-col gap-6 w-full max-w-3xl mx-auto p-6 md:p-8 bg-[#FFFAF0] rounded-3xl border-4 border-purple-300 shadow-2xl font-sans text-slate-800"
      style={{
        backgroundImage:
          'radial-gradient(circle at 10% 20%, rgba(255, 182, 193, 0.3) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(173, 216, 230, 0.3) 0%, transparent 40%)',
      }}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-purple-200 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full font-bold bg-white text-purple-700 border-2 border-purple-200 hover:bg-purple-50 transition shadow-sm text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Menu Chính
        </button>

        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-black text-purple-700 flex items-center justify-center gap-2">
            <Users className="w-7 h-7 text-purple-500" />
            Chơi Cùng Bố Mẹ
          </h2>
          <p className="text-xs text-purple-500 font-bold mt-0.5">Tiếp sức gia đình – Gắn kết yêu thương!</p>
        </div>

        <div className="flex items-center gap-2 bg-purple-100 px-4 py-1.5 rounded-full border-2 border-purple-300 font-black text-purple-800 text-sm">
          <Timer className="w-4 h-4 text-purple-600" />
          <span>{timer}s</span>
        </div>
      </div>

      {!isGameOver ? (
        <div className="flex flex-col items-center gap-6 py-4">
          {/* Progress dots */}
          <div className="flex gap-2">
            {CHALLENGES.map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all ${
                  i === currentIdx
                    ? 'bg-purple-600 scale-125 ring-4 ring-purple-200'
                    : i < currentIdx
                    ? 'bg-emerald-500'
                    : 'bg-slate-200'
                }`}
              />
            ))}
          </div>

          {/* Active Player Card */}
          <div className="w-full bg-white rounded-3xl p-8 border-4 border-purple-200 shadow-xl flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-purple-100 border-4 border-purple-300 flex items-center justify-center text-4xl mb-4 animate-bounce shadow-md">
              {currentChallenge.player === 'child' ? '👧' : '👨‍👩‍👧'}
            </div>

            <span className="text-xs font-black bg-purple-100 text-purple-800 px-3 py-1 rounded-full uppercase tracking-wider mb-2">
              LƯỢT CỦA: {currentChallenge.player === 'child' ? 'BÉ PHƯƠNG NHÃ' : 'BỐ HOẶC MẸ'}
            </span>

            <h3 className="text-2xl md:text-3xl font-black text-slate-800 mb-2">{currentChallenge.title}</h3>
            <p className="text-sm font-medium text-slate-600 max-w-md leading-relaxed">{currentChallenge.desc}</p>

            <div className="my-6 p-4 bg-purple-50 rounded-2xl border-2 border-dashed border-purple-300 text-purple-900 font-bold text-xs">
              <span className="text-lg mr-2">👉</span>
              Động tác yêu cầu:{' '}
              <b className="uppercase text-purple-700 font-black">{currentChallenge.targetGesture.replace('_', ' ')}</b>
            </div>

            <div className="text-xs font-bold text-slate-500">
              Camera đang thấy: <span className="text-purple-600 font-black uppercase">{gesture}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center p-8 bg-white rounded-3xl border-4 border-purple-200 shadow-2xl">
          <Trophy className="w-20 h-20 text-yellow-500 animate-pulse mb-4" />
          <h3 className="text-3xl font-black text-purple-700">Cả Nhà Tuyệt Vời Quá!</h3>
          <p className="text-slate-500 text-sm mt-1">Bố mẹ và bé đã hoàn thành xuất sắc thử thách tiếp sức!</p>

          <div className="my-6 p-4 bg-purple-50 rounded-2xl border border-purple-200">
            <span className="text-xs font-bold text-slate-400">TỔNG ĐIỂM GIA ĐÌNH</span>
            <p className="text-4xl font-black text-purple-600 mt-1">{totalScore} Điểm</p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={restartGame}
              className="flex items-center gap-2 px-6 py-2.5 bg-purple-500 hover:bg-purple-600 text-white font-extrabold rounded-full shadow-md transition transform hover:scale-105"
            >
              <RotateCcw className="w-4 h-4" />
              Chơi Lại Tiếp
            </button>
            <button
              onClick={onBack}
              className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-full shadow-sm transition"
            >
              Về Menu Chính
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
