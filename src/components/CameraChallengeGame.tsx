import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Shield, Sparkles, Trophy } from 'lucide-react';
import { GameGesture, PlayerProgress } from '../types';
import { audio } from '../lib/AudioEngine';

type ChallengeMode = 'ninja' | 'goalkeeper' | 'magicacademy';
type EventStatus = 'active' | 'saved' | 'missed';

interface Props {
  mode: ChallengeMode;
  progress: PlayerProgress;
  onUpdateProgress: (updater: (p: PlayerProgress) => PlayerProgress) => void;
  gesture: GameGesture;
  onBack: () => void;
}

interface TargetDef {
  gesture: GameGesture;
  label: string;
  icon: string;
}

interface ChallengeEvent {
  token: number;
  targetIndex: number;
  phase: number;
  status: EventStatus;
}

const CONFIG: Record<ChallengeMode, { title: string; icon: string; subtitle: string; color: string }> = {
  ninja: {
    title: 'Ninja Né Chướng Ngại',
    icon: '🥷',
    subtitle: 'Chướng ngại lao tới thật • né đúng thời điểm bằng cơ thể',
    color: 'from-slate-950 via-indigo-950 to-purple-950',
  },
  goalkeeper: {
    title: 'Thủ Môn Siêu Nhí',
    icon: '🥅',
    subtitle: 'Bóng sút thật vào 4 vùng • cản trước khi bóng qua vạch',
    color: 'from-emerald-950 via-teal-900 to-sky-950',
  },
  magicacademy: {
    title: 'Học Viện Phép Thuật',
    icon: '🪄',
    subtitle: 'Quái vật xuất hiện • tung phép, dựng khiên và hạ mục tiêu',
    color: 'from-fuchsia-950 via-purple-950 to-indigo-950',
  },
};

const MODE_TARGETS: Record<ChallengeMode, TargetDef[]> = {
  ninja: [
    { gesture: 'jump', label: 'NHẢY QUA!', icon: '⬆️' },
    { gesture: 'duck', label: 'CÚI XUỐNG!', icon: '⬇️' },
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

const EVENT_DURATION: Record<ChallengeMode, number> = {
  ninja: 2200,
  goalkeeper: 1900,
  magicacademy: 2350,
};

const SUCCESS_WINDOW: Record<ChallengeMode, [number, number]> = {
  ninja: [0.50, 0.91],
  goalkeeper: [0.43, 0.91],
  magicacademy: [0.35, 0.90],
};

function nextIndex(length: number, prev: number) {
  if (length <= 1) return 0;
  let n = prev;
  while (n === prev) n = Math.floor(Math.random() * length);
  return n;
}

function NinjaArena({ target, phase, status }: { target: TargetDef; phase: number; status: EventStatus }) {
  const p = Math.max(0, Math.min(1, phase));
  const scale = 0.25 + p * 1.55;
  const top = 12 + p * 63;
  const laneX = target.gesture === 'tilt_left' ? 67 : target.gesture === 'tilt_right' ? 33 : 50;
  const isJump = target.gesture === 'jump';
  const isDuck = target.gesture === 'duck';

  return (
    <div className="absolute inset-0 overflow-hidden rounded-[1.7rem] bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950">
      <div className="absolute inset-x-[6%] top-[5%] bottom-0 opacity-80"
        style={{ clipPath: 'polygon(44% 0,56% 0,100% 100%,0 100%)', background: 'linear-gradient(#17255422,#020617dd)' }} />
      <div className="absolute left-[8%] right-[8%] bottom-[18%] h-20 rounded-3xl border-2 border-cyan-300/30 bg-cyan-300/5" />
      <div className="absolute left-1/2 bottom-[5%] -translate-x-1/2 z-30 text-center">
        <div className="text-5xl drop-shadow-2xl">🥷</div>
        <div className="text-[9px] px-2 py-0.5 rounded-full bg-black/50 border border-white/15 font-black">BẠN</div>
      </div>

      <div
        className={`absolute z-20 ${status === 'saved' ? 'opacity-15 blur-sm' : ''}`}
        style={{ left: `${laneX}%`, top: `${top}%`, transform: `translate(-50%,-50%) scale(${scale})` }}
      >
        {isJump ? (
          <div className="w-28 h-14 rounded-lg bg-gradient-to-b from-amber-400 to-red-700 border-4 border-amber-100 shadow-2xl">
            <div className="mx-2 mt-2 h-2 rounded bg-black/30" />
          </div>
        ) : isDuck ? (
          <div className="relative w-36 h-28">
            <div className="absolute top-0 left-0 right-0 h-8 rounded bg-violet-500 border-4 border-violet-100 shadow-xl" />
            <div className="absolute left-1 top-5 bottom-0 w-4 bg-slate-500" />
            <div className="absolute right-1 top-5 bottom-0 w-4 bg-slate-500" />
          </div>
        ) : (
          <div className="w-24 h-28 rounded-xl bg-gradient-to-br from-slate-400 to-slate-900 border-4 border-cyan-100/50 shadow-2xl grid grid-cols-2 gap-1 p-2">
            {Array.from({ length: 8 }).map((_, i) => <i key={i} className="rounded bg-cyan-200/20" />)}
          </div>
        )}
      </div>

      {status === 'saved' && <div className="absolute inset-0 z-40 grid place-items-center text-4xl md:text-6xl font-black">✨ NÉ ĐƯỢC! ✨</div>}
      {status === 'missed' && <div className="absolute inset-0 z-40 grid place-items-center bg-red-600/10"><span className="px-5 py-3 rounded-2xl bg-red-950/90 border-2 border-red-300 font-black">💥 VA CHẠM!</span></div>}
    </div>
  );
}

function GoalkeeperArena({ target, phase, status }: { target: TargetDef; phase: number; status: EventStatus }) {
  const p = Math.max(0, Math.min(1, phase));
  const dst = target.gesture === 'left_arm_up' ? { x: 28, y: 37 }
    : target.gesture === 'right_arm_up' ? { x: 72, y: 37 }
    : target.gesture === 'both_arms_up' ? { x: 50, y: 23 }
    : { x: 50, y: 66 };

  const x = 50 + (dst.x - 50) * Math.pow(p, 1.25);
  const y = 80 + (dst.y - 80) * Math.pow(p, 1.12);
  const scale = 0.26 + p * 1.10;

  return (
    <div className="absolute inset-0 overflow-hidden rounded-[1.7rem] bg-gradient-to-b from-sky-800 via-emerald-800 to-emerald-950">
      <div className="absolute left-[10%] right-[10%] top-[10%] bottom-[14%] border-x-[9px] border-t-[9px] border-white rounded-t-lg shadow-[0_0_24px_rgba(255,255,255,.4)]">
        <div className="absolute inset-0 opacity-30 bg-[linear-gradient(rgba(255,255,255,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.7)_1px,transparent_1px)] bg-[size:26px_26px]" />
      </div>
      <div className="absolute left-1/2 bottom-[12%] -translate-x-1/2 text-3xl opacity-75">🧍‍♂️</div>
      <div className="absolute left-1/2 bottom-[17%] -translate-x-1/2 text-5xl opacity-80">🧤</div>

      <div className={`absolute z-30 text-4xl md:text-5xl ${status === 'saved' ? 'opacity-20' : ''}`}
        style={{ left: `${x}%`, top: `${y}%`, transform: `translate(-50%,-50%) scale(${scale}) rotate(${p * 560}deg)`, filter: 'drop-shadow(0 5px 8px rgba(0,0,0,.5))' }}>
        ⚽
      </div>

      {status === 'saved' && <div className="absolute inset-0 z-40 grid place-items-center"><span className="px-6 py-4 rounded-3xl bg-emerald-950/90 border-2 border-emerald-200 text-2xl md:text-4xl font-black">🧤 CẢN PHÁ!</span></div>}
      {status === 'missed' && <div className="absolute inset-0 z-40 grid place-items-center bg-red-600/10"><span className="px-6 py-4 rounded-3xl bg-red-950/90 border-2 border-red-300 text-2xl md:text-4xl font-black">🥅 VÀO!</span></div>}
    </div>
  );
}

function MagicArena({ target, phase, status }: { target: TargetDef; phase: number; status: EventStatus }) {
  const p = Math.max(0, Math.min(1, phase));
  const isShield = target.gesture === 'hands_spread';
  const isLightning = target.gesture === 'clap';
  const isRainbow = target.gesture === 'rainbow_skill';

  const monsterScale = status === 'saved' && !isShield ? Math.max(0.2, 1 - (p - 0.45) * 2.1) : 1;
  const projectileX = isShield ? 76 - p * 48 : 25 + p * 48;
  const projectileY = 52 - Math.sin(p * Math.PI) * 18;

  return (
    <div className="absolute inset-0 overflow-hidden rounded-[1.7rem] bg-gradient-to-b from-indigo-950 via-purple-950 to-fuchsia-950">
      <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.6)_0_1px,transparent_2px),radial-gradient(circle_at_75%_35%,rgba(103,232,249,.5)_0_1px,transparent_2px)] bg-[size:80px_80px,120px_120px]" />
      <div className="absolute left-[8%] bottom-[10%] text-6xl md:text-7xl drop-shadow-2xl">🧙‍♀️</div>
      <div className="absolute right-[10%] top-[24%] transition-transform duration-100"
        style={{ transform: `scale(${monsterScale})`, transformOrigin: 'center' }}>
        <div className="text-7xl md:text-8xl drop-shadow-2xl">{isShield ? '👾' : isRainbow ? '🐉' : '👹'}</div>
        <div className="mt-1 text-center text-[10px] font-black text-fuchsia-200">QUÁI VẬT</div>
      </div>

      {isShield ? (
        <>
          <div className="absolute z-20 text-4xl" style={{ left: `${projectileX}%`, top: `${projectileY}%`, transform: `translate(-50%,-50%) scale(${0.5 + p})` }}>🔥</div>
          {status === 'saved' && <div className="absolute left-[22%] top-[30%] bottom-[20%] w-28 rounded-[50%] border-[7px] border-cyan-200/90 bg-cyan-300/20 shadow-[0_0_50px_rgba(34,211,238,.8)]" />}
        </>
      ) : isLightning ? (
        <div className="absolute z-20 left-[53%] top-[4%] text-8xl md:text-9xl transition-opacity" style={{ opacity: Math.min(1, p * 1.8) }}>⚡</div>
      ) : isRainbow ? (
        <div className="absolute z-20 left-[20%] right-[20%] top-[35%] h-36 rounded-[50%] border-t-[18px] border-pink-400 shadow-[0_-12px_0_#facc15,0_-24px_0_#4ade80,0_-36px_0_#38bdf8,0_-48px_0_#a78bfa]" style={{ opacity: Math.min(1, p * 1.5) }} />
      ) : (
        <div className="absolute z-20 text-5xl md:text-6xl" style={{ left: `${projectileX}%`, top: `${projectileY}%`, transform: `translate(-50%,-50%) scale(${0.5 + p * 0.8})` }}>✨</div>
      )}

      {status === 'saved' && <div className="absolute inset-x-0 bottom-[8%] z-40 text-center text-2xl md:text-4xl font-black text-amber-200 drop-shadow-2xl">✨ PHÉP THÀNH CÔNG! ✨</div>}
      {status === 'missed' && <div className="absolute inset-x-0 bottom-[8%] z-40 text-center"><span className="px-5 py-3 rounded-2xl bg-red-950/90 border-2 border-red-300 font-black">💨 PHÉP CHƯA KỊP!</span></div>}
    </div>
  );
}

export default function CameraChallengeGame({ mode, progress, onUpdateProgress, gesture, onBack }: Props) {
  const cfg = CONFIG[mode];
  const targets = MODE_TARGETS[mode];

  const [timeLeft, setTimeLeft] = useState(45);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [round, setRound] = useState(0);
  const [misses, setMisses] = useState(0);
  const [finished, setFinished] = useState(false);
  const [feedback, setFeedback] = useState('Sẵn sàng!');
  const [event, setEvent] = useState<ChallengeEvent>(() => ({
    token: 1,
    targetIndex: Math.floor(Math.random() * MODE_TARGETS[mode].length),
    phase: 0,
    status: 'active',
  }));

  const startTimeRef = useRef(performance.now());
  const resolvedRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);

  const target = targets[event.targetIndex] || targets[0];
  const highKey = `challenge_${mode}`;
  const highScore = progress.highScores?.[highKey] || 0;

  const spawnNext = useCallback((prevIndex?: number) => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    resolvedRef.current = false;
    startTimeRef.current = performance.now();
    setEvent((prev) => ({
      token: prev.token + 1,
      targetIndex: nextIndex(targets.length, prevIndex ?? prev.targetIndex),
      phase: 0,
      status: 'active',
    }));
    setFeedback(mode === 'goalkeeper' ? 'Nhìn bóng!' : mode === 'ninja' ? 'Nhìn chướng ngại!' : 'Quái vật tới!');
  }, [mode, targets.length]);

  useEffect(() => {
    resolvedRef.current = false;
    startTimeRef.current = performance.now();
    setEvent({
      token: 1,
      targetIndex: Math.floor(Math.random() * targets.length),
      phase: 0,
      status: 'active',
    });
  }, [mode]);

  useEffect(() => {
    if (finished) return;
    const id = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
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
    let raf = 0;
    const duration = EVENT_DURATION[mode];

    const tick = (now: number) => {
      const phase = Math.max(0, Math.min(1, (now - startTimeRef.current) / duration));
      setEvent((prev) => prev.status === 'active' ? { ...prev, phase } : prev);

      if (phase >= 1 && !resolvedRef.current) {
        resolvedRef.current = true;
        setEvent((prev) => ({ ...prev, phase: 1, status: 'missed' }));
        setMisses((m) => m + 1);
        setCombo(0);
        setFeedback(mode === 'goalkeeper' ? 'Ôi! Bóng vào lưới!' : mode === 'ninja' ? 'Va chạm rồi!' : 'Phép chậm mất rồi!');
        audio.playFail();
        timeoutRef.current = window.setTimeout(() => spawnNext(), 650);
      }
      if (!finished) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [event.token, mode, finished, spawnNext]);

  useEffect(() => {
    if (finished || resolvedRef.current || event.status !== 'active') return;
    if (gesture !== target.gesture) return;

    const [from, to] = SUCCESS_WINDOW[mode];
    if (event.phase < from || event.phase > to) return;

    resolvedRef.current = true;
    const currentCombo = combo + 1;
    const bonus = 100 + Math.min(currentCombo, 10) * 15;

    setEvent((prev) => ({ ...prev, status: 'saved' }));
    setScore((s) => s + bonus);
    setCombo(currentCombo);
    setRound((r) => r + 1);
    setFeedback(currentCombo >= 5 ? `TUYỆT VỜI! Combo x${currentCombo} 🔥` : 'CHÍNH XÁC! ✨');

    if (mode === 'goalkeeper') audio.playShield();
    else if (mode === 'ninja') audio.playCollect();
    else if (target.gesture === 'hands_spread') audio.playShield();
    else if (target.gesture === 'rainbow_skill') audio.playRainbowSlash();
    else if (target.gesture === 'both_arms_up') audio.playMagicLight();
    else audio.playPowerup();

    timeoutRef.current = window.setTimeout(() => spawnNext(event.targetIndex), 560);
  }, [gesture, target.gesture, event.phase, event.status, finished, combo, mode, event.targetIndex, spawnNext]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!finished) return;
    const earnedStars = Math.max(2, Math.floor(score / 450));
    const earnedDiamonds = score >= 1800 ? 2 : score >= 900 ? 1 : 0;
    onUpdateProgress((prev) => ({
      ...prev,
      stars: prev.stars + earnedStars,
      diamonds: prev.diamonds + earnedDiamonds,
      highScores: { ...prev.highScores, [highKey]: Math.max(prev.highScores?.[highKey] || 0, score) },
      parentStats: {
        ...prev.parentStats,
        stagesCompleted: prev.parentStats.stagesCompleted + 1,
        starsEarnedToday: prev.parentStats.starsEarnedToday + earnedStars,
      },
    }));
    audio.playSuccess();
  }, [finished]);

  const progressPct = useMemo(() => Math.max(0, Math.min(100, (timeLeft / 45) * 100)), [timeLeft]);

  const restartGame = () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    resolvedRef.current = false;
    setTimeLeft(45);
    setScore(0);
    setCombo(0);
    setRound(0);
    setMisses(0);
    setFinished(false);
    startTimeRef.current = performance.now();
    setEvent({
      token: event.token + 1,
      targetIndex: Math.floor(Math.random() * targets.length),
      phase: 0,
      status: 'active',
    });
    setFeedback('Sẵn sàng!');
  };

  if (finished) {
    return (
      <div className={`w-full max-w-3xl min-h-[min(520px,calc(100dvh-1rem))] max-h-[calc(100dvh-1rem)] overflow-y-auto rounded-[2rem] bg-gradient-to-br ${cfg.color} text-white p-6 shadow-2xl border border-white/20 flex flex-col items-center justify-center text-center gap-5`}>
        <Trophy className="w-16 h-16 text-amber-300" />
        <div className="text-6xl">{cfg.icon}</div>
        <h2 className="text-3xl font-black">Hoàn thành!</h2>
        <div className="grid grid-cols-4 gap-2 w-full max-w-xl">
          <div className="bg-white/10 rounded-2xl p-3"><div className="text-[10px] opacity-70">Điểm</div><div className="text-xl font-black">{score}</div></div>
          <div className="bg-white/10 rounded-2xl p-3"><div className="text-[10px] opacity-70">Thành công</div><div className="text-xl font-black">{round}</div></div>
          <div className="bg-white/10 rounded-2xl p-3"><div className="text-[10px] opacity-70">Trượt</div><div className="text-xl font-black">{misses}</div></div>
          <div className="bg-white/10 rounded-2xl p-3"><div className="text-[10px] opacity-70">Kỷ lục</div><div className="text-xl font-black">{Math.max(highScore, score)}</div></div>
        </div>
        <div className="flex gap-3">
          <button onClick={onBack} className="px-5 py-3 rounded-2xl bg-white text-slate-900 font-black">Về menu</button>
          <button onClick={restartGame} className="px-5 py-3 rounded-2xl bg-amber-400 text-slate-900 font-black">Chơi lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full max-w-4xl min-h-[min(560px,calc(100dvh-1rem))] max-h-[calc(100dvh-1rem)] overflow-hidden rounded-[2rem] bg-gradient-to-br ${cfg.color} text-white shadow-2xl border border-white/20 p-3 md:p-5`}>
      <div className="relative z-20 flex items-center justify-between gap-3">
        <button onClick={onBack} className="p-2.5 rounded-xl bg-black/30 border border-white/20"><ArrowLeft className="w-5 h-5" /></button>
        <div className="text-center min-w-0">
          <h1 className="font-black text-lg md:text-2xl truncate">{cfg.icon} {cfg.title}</h1>
          <p className="text-[10px] md:text-xs text-white/70">{cfg.subtitle}</p>
        </div>
        <div className="text-right">
          <div className="font-black text-amber-300">{score}</div>
          <div className="text-[10px] text-white/60">Kỷ lục {highScore}</div>
        </div>
      </div>

      <div className="relative z-20 mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full bg-emerald-300 transition-all duration-300" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="relative z-10 mt-3 h-[350px] landscape:h-[300px] md:h-[430px] rounded-[1.7rem] overflow-hidden border border-white/15 shadow-2xl">
        {mode === 'ninja' && <NinjaArena target={target} phase={event.phase} status={event.status} />}
        {mode === 'goalkeeper' && <GoalkeeperArena target={target} phase={event.phase} status={event.status} />}
        {mode === 'magicacademy' && <MagicArena target={target} phase={event.phase} status={event.status} />}

        <div className="absolute z-50 top-3 left-3 right-3 flex justify-between items-start gap-2 pointer-events-none">
          <div className="rounded-2xl bg-black/55 border border-white/15 backdrop-blur px-3 py-2">
            <div className="text-[10px] text-white/60 font-bold">LÀM ĐÚNG KHI VẬT TỚI GẦN</div>
            <div className="text-lg md:text-2xl font-black">{target.icon} {target.label}</div>
          </div>
          <div className="rounded-2xl bg-black/55 border border-white/15 backdrop-blur px-3 py-2 text-right">
            <div className="font-black text-amber-200">⏱ {timeLeft}s</div>
            <div className="text-[10px] text-white/70">Combo x{combo} • Trượt {misses}</div>
          </div>
        </div>

        <div className="absolute z-50 bottom-3 left-1/2 -translate-x-1/2 max-w-[92%] text-center">
          <div className="px-4 py-2 rounded-full bg-black/60 border border-white/15 font-black text-xs md:text-sm">{feedback}</div>
          <div className="mt-1 text-[9px] text-white/60">
            Camera: {gesture.replaceAll('_', ' ')} • đúng động tác nhưng phải đúng thời điểm
          </div>
        </div>
      </div>

      <div className="relative z-20 mt-2 flex items-center justify-center gap-2 text-[10px] text-white/55">
        <Shield className="w-3.5 h-3.5" /><span>Camera: nửa người trên + 2 tay • toàn thân nếu có</span><Sparkles className="w-3.5 h-3.5" />
      </div>
    </div>
  );
}
