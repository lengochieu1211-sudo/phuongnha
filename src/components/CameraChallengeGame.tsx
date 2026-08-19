import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Shield, Sparkles, Trophy } from 'lucide-react';
import { GameGesture, PlayerProgress } from '../types';
import { audio } from '../lib/AudioEngine';

type ChallengeMode = 'ninja' | 'goalkeeper' | 'magicacademy';

interface Props {
  mode: ChallengeMode;
  progress: PlayerProgress;
  onUpdateProgress: (updater: (p: PlayerProgress) => PlayerProgress) => void;
  gesture: GameGesture;
  onBack: () => void;
}

const CONFIG: Record<ChallengeMode, { title: string; icon: string; subtitle: string; color: string }> = {
  ninja: { title: 'Ninja Né Chướng Ngại', icon: '🥷', subtitle: 'Nhảy • cúi • nghiêng người để vượt thử thách', color: 'from-slate-950 via-indigo-950 to-purple-950' },
  goalkeeper: { title: 'Thủ Môn Siêu Nhí', icon: '🥅', subtitle: 'Dùng tay và thân người để cản những cú sút', color: 'from-emerald-950 via-teal-900 to-sky-950' },
  magicacademy: { title: 'Học Viện Phép Thuật', icon: '🪄', subtitle: 'Tạo đúng tư thế để tung phép và hạ quái vật', color: 'from-fuchsia-950 via-purple-950 to-indigo-950' },
};

const MODE_TARGETS: Record<ChallengeMode, { gesture: GameGesture; label: string; icon: string }[]> = {
  ninja: [
    { gesture: 'jump', label: 'NHẢY!', icon: '⬆️' },
    { gesture: 'duck', label: 'CÚI!', icon: '⬇️' },
    { gesture: 'tilt_left', label: 'NÉ TRÁI!', icon: '⬅️' },
    { gesture: 'tilt_right', label: 'NÉ PHẢI!', icon: '➡️' },
  ],
  goalkeeper: [
    { gesture: 'left_arm_up', label: 'CẢN TRÁI!', icon: '🧤⬅️' },
    { gesture: 'right_arm_up', label: 'CẢN PHẢI!', icon: '➡️🧤' },
    { gesture: 'both_arms_up', label: 'BÓNG CAO!', icon: '🙌' },
    { gesture: 'duck', label: 'BÓNG THẤP!', icon: '🥅' },
  ],
  magicacademy: [
    { gesture: 'both_arms_up', label: 'PHÉP ÁNH SÁNG!', icon: '✨' },
    { gesture: 'hands_spread', label: 'KHIÊN PHÉP!', icon: '🛡️' },
    { gesture: 'clap', label: 'SẤM SÉT!', icon: '⚡' },
    { gesture: 'rainbow_skill', label: 'CẦU VỒNG!', icon: '🌈' },
  ],
};

export default function CameraChallengeGame({ mode, progress, onUpdateProgress, gesture, onBack }: Props) {
  const cfg = CONFIG[mode];
  const targets = MODE_TARGETS[mode];
  const [timeLeft, setTimeLeft] = useState(45);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [round, setRound] = useState(0);
  const [finished, setFinished] = useState(false);
  const [feedback, setFeedback] = useState('Sẵn sàng!');
  const [targetIndex, setTargetIndex] = useState(0);
  const acceptedRef = useRef(false);

  const target = targets[targetIndex];
  const highKey = `challenge_${mode}`;

  // A new prompt must be allowed even when pose detection moves directly from
  // one gesture to another without briefly reporting `standing`.
  useEffect(() => {
    acceptedRef.current = false;
  }, [targetIndex, mode]);
  const highScore = progress.highScores?.[highKey] || 0;

  useEffect(() => {
    setTargetIndex(Math.floor(Math.random() * targets.length));
  }, [mode]);

  useEffect(() => {
    if (finished) return;
    const id = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          window.clearInterval(id);
          setFinished(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [finished]);

  useEffect(() => {
    if (finished) return;
    if (gesture === 'standing') acceptedRef.current = false;
    if (gesture !== target.gesture || acceptedRef.current) return;
    acceptedRef.current = true;
    const bonus = 100 + Math.min(combo, 10) * 15;
    setScore((s) => s + bonus);
    setCombo((c) => c + 1);
    setRound((r) => r + 1);
    setFeedback(combo >= 4 ? `TUYỆT VỜI! Combo x${combo + 1} 🔥` : 'CHÍNH XÁC! ✨');
    audio.playCollect();
    window.setTimeout(() => {
      setTargetIndex((prev) => {
        let next = prev;
        while (next === prev && targets.length > 1) next = Math.floor(Math.random() * targets.length);
        return next;
      });
      setFeedback('Tiếp theo!');
    }, 420);
  }, [gesture, target.gesture, finished, combo, targets]);

  useEffect(() => {
    if (!finished) return;
    const earnedStars = Math.max(2, Math.floor(score / 450));
    const earnedDiamonds = score >= 1800 ? 2 : score >= 900 ? 1 : 0;
    onUpdateProgress((prev) => ({
      ...prev,
      stars: prev.stars + earnedStars,
      diamonds: prev.diamonds + earnedDiamonds,
      highScores: { ...prev.highScores, [highKey]: Math.max(prev.highScores?.[highKey] || 0, score) },
      parentStats: { ...prev.parentStats, stagesCompleted: prev.parentStats.stagesCompleted + 1, starsEarnedToday: prev.parentStats.starsEarnedToday + earnedStars },
    }));
    audio.playSuccess();
  }, [finished]);

  const progressPct = useMemo(() => Math.max(0, Math.min(100, (timeLeft / 45) * 100)), [timeLeft]);
  const restartGame = () => {
    acceptedRef.current = false;
    setTimeLeft(45);
    setScore(0);
    setCombo(0);
    setRound(0);
    setFinished(false);
    setFeedback('Sẵn sàng!');
    setTargetIndex(Math.floor(Math.random() * targets.length));
  };


  if (finished) {
    return (
      <div className={`w-full max-w-3xl min-h-[min(520px,calc(100dvh-1rem))] max-h-[calc(100dvh-1rem)] overflow-y-auto rounded-[2rem] bg-gradient-to-br ${cfg.color} text-white p-6 shadow-2xl border border-white/20 flex flex-col items-center justify-center text-center gap-5`}>
        <Trophy className="w-16 h-16 text-amber-300" />
        <div className="text-6xl">{cfg.icon}</div>
        <h2 className="text-3xl font-black">Hoàn thành!</h2>
        <div className="grid grid-cols-3 gap-3 w-full max-w-lg">
          <div className="bg-white/10 rounded-2xl p-4"><div className="text-xs opacity-70">Điểm</div><div className="text-2xl font-black">{score}</div></div>
          <div className="bg-white/10 rounded-2xl p-4"><div className="text-xs opacity-70">Lượt đúng</div><div className="text-2xl font-black">{round}</div></div>
          <div className="bg-white/10 rounded-2xl p-4"><div className="text-xs opacity-70">Kỷ lục</div><div className="text-2xl font-black">{Math.max(highScore, score)}</div></div>
        </div>
        <div className="flex gap-3">
          <button onClick={onBack} className="px-5 py-3 rounded-2xl bg-white text-slate-900 font-black">Về menu</button>
          <button onClick={restartGame} className="px-5 py-3 rounded-2xl bg-amber-400 text-slate-900 font-black">Chơi lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full max-w-4xl min-h-[min(540px,calc(100dvh-1rem))] max-h-[calc(100dvh-1rem)] overflow-hidden rounded-[2rem] bg-gradient-to-br ${cfg.color} text-white shadow-2xl border border-white/20 p-4 md:p-6`}>
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, white 0 2px, transparent 3px), radial-gradient(circle at 80% 40%, white 0 1px, transparent 2px)', backgroundSize: '90px 90px, 60px 60px' }} />
      <div className="relative z-10 flex items-center justify-between gap-3">
        <button onClick={onBack} className="p-2.5 rounded-xl bg-black/30 border border-white/20"><ArrowLeft className="w-5 h-5" /></button>
        <div className="text-center min-w-0"><h1 className="font-black text-lg md:text-2xl truncate">{cfg.icon} {cfg.title}</h1><p className="text-[10px] md:text-xs text-white/70">{cfg.subtitle}</p></div>
        <div className="text-right"><div className="font-black text-amber-300">{score}</div><div className="text-[10px] text-white/60">Kỷ lục {highScore}</div></div>
      </div>

      <div className="relative z-10 mt-4 h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-emerald-300 transition-all duration-300" style={{ width: `${progressPct}%` }} /></div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-[280px] landscape:min-h-[240px] md:min-h-[390px] gap-5">
        <div className="text-sm font-bold text-white/70">Còn {timeLeft}s • Combo x{combo}</div>
        <div className="relative w-52 h-52 landscape:w-44 landscape:h-44 md:w-72 md:h-72 rounded-full border-[10px] border-white/10 bg-black/20 backdrop-blur-sm flex items-center justify-center shadow-[0_0_60px_rgba(255,255,255,.12)]">
          <div className="absolute inset-5 rounded-full border border-white/10 animate-pulse" />
          <div className="text-center">
            <div className="text-6xl landscape:text-5xl md:text-8xl drop-shadow-2xl">{target.icon}</div>
            <div className="mt-3 text-xl md:text-2xl font-black tracking-wide">{target.label}</div>
          </div>
        </div>
        <div className="px-5 py-2 rounded-full bg-white/10 border border-white/15 text-sm font-black min-h-9">{feedback}</div>
        <div className="flex items-center gap-2 text-[11px] text-white/55"><Shield className="w-4 h-4" /><span>Camera nhận diện: {gesture.replaceAll('_', ' ')}</span><Sparkles className="w-4 h-4" /></div>
      </div>
    </div>
  );
}
