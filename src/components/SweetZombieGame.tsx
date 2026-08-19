/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, ArrowLeft, RotateCcw, Award, Clock, Heart, Zap } from 'lucide-react';
import { PlayerProgress, GameGesture, GameDifficulty } from '../types';
import { audio } from '../lib/AudioEngine';
import { voiceGuide } from '../lib/VoiceGuideService';
import { VOICE_LINES } from '../lib/voiceLines.vi';
import { poseDetector } from '../utils/poseDetector';
import { mapWristToGame } from '../utils/poseUtils';
import { recordMissionProgress } from '../utils/progression';

interface SweetZombieGameProps {
  progress: PlayerProgress;
  onUpdateProgress: (updater: (prev: PlayerProgress) => PlayerProgress) => void;
  gesture: GameGesture;
  onBack: () => void;
  workoutMode?: boolean;
  isPaused?: boolean;
}

export type MonsterType = 'sleepy_red' | 'sleepy_blue' | 'sleepy_rainbow' | 'sleepy_giant_king';

interface MonsterEntity {
  id: string;
  type: MonsterType;
  x: number; // 0-100%
  y: number; // 0-100%
  targetX: number;
  vx: number;
  requiredGesture?: GameGesture;
  health: number;
  maxHealth: number;
  isAwake: boolean;
  awakeTimer?: number;
  yawnTimer?: number;
}

interface ObstacleHazard {
  id: number;
  type: 'sleepy_cloud' | 'candy_puddle';
  x: number;
  y: number;
  vy: number;
  requiredAction: 'duck' | 'jump';
}

interface FloatingParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
}

interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  opacity: number;
}

export default function SweetZombieGame({
  progress,
  onUpdateProgress,
  gesture,
  onBack,
  workoutMode = false,
  isPaused = false,
}: SweetZombieGameProps) {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'boss_awakening' | 'game_over'>(() => workoutMode ? 'playing' : 'intro');
  const [difficulty, setDifficulty] = useState<GameDifficulty>('normal');
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [awakenedCount, setAwakenedCount] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [bossPhase, setBossPhase] = useState<number>(1); // 1 to 4 steps

  // Aim crosshair
  const [aimPos, setAimPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const rawAim = useRef<{ x: number; y: number }>({ x: 50, y: 50 });

  // Entities
  const [monsters, setMonsters] = useState<MonsterEntity[]>([]);
  const [hazards, setHazards] = useState<ObstacleHazard[]>([]);
  const [particles, setParticles] = useState<FloatingParticle[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastSpawnTime = useRef<number>(0);
  const lastHazardTime = useRef<number>(0);
  const monsterIdCounter = useRef<number>(0);
  const bossSpawnedRef = useRef<boolean>(false);
  const currentGestureRef = useRef<GameGesture>(gesture);

  const timeLeftRef = useRef<number>(60);
  const scoreRef = useRef<number>(0);

  const addScore = (amount: number) => {
    scoreRef.current += amount;
    setScore(scoreRef.current);
  };

  useEffect(() => {
    currentGestureRef.current = gesture;
  }, [gesture]);

  // Safety reminder on enter
  useEffect(() => {
    voiceGuide.speak(VOICE_LINES.safety.warmup, 'medium');
  }, []);

  // Wrist listener for aiming & matching gesture actions
  useEffect(() => {
    const handlePoseResults = (res: any) => {
      if (isPaused) return;
      if (gameState !== 'playing' && gameState !== 'boss_awakening') return;

      const rightMapped = mapWristToGame(res.rightWrist, { minX: 5, maxX: 95, minY: 10, maxY: 90 });
      const leftMapped = mapWristToGame(res.leftWrist, { minX: 5, maxX: 95, minY: 10, maxY: 90 });

      const activeMapped = rightMapped.visible ? rightMapped : leftMapped.visible ? leftMapped : null;

      if (activeMapped) {
        rawAim.current = {
          x: activeMapped.gameX,
          y: activeMapped.gameY,
        };
      }

      // Check current detected gesture against active monsters
      if (res.gesture) {
        checkGestureAwakening(res.gesture);
      }
    };

    const unsub = poseDetector.addListener(handlePoseResults);
    return () => {
      unsub();
    };
  }, [gameState, bossPhase, isPaused]);

  // Click/tap directly to wake up a monster
  const handleMonsterClick = (monster: MonsterEntity) => {
    if (monster.isAwake || (gameState !== 'playing' && gameState !== 'boss_awakening')) return;

    audio.playMonsterCheer();
    audio.playMagicLight();
    spawnSparkles(monster.x, monster.y, '#FF4081');

    addScore(25);
    setAwakenedCount((c) => c + 1);
    setCombo((cb) => {
      const next = cb + 1;
      if (next > maxCombo) setMaxCombo(next);
      return next;
    });

    addFloatingText('CHẠM THẦN KỲ! 💖 +25', monster.x, monster.y, '#4CAF50');
    voiceGuide.speak(VOICE_LINES.sweetzombie.monsterWoke, 'low');

    setMonsters((prev) =>
      prev.map((m) =>
        m.id === monster.id
          ? {
              ...m,
              isAwake: true,
              awakeTimer: Date.now(),
            }
          : m
      )
    );
  };

  // Wake up monsters if player performs their required gesture
  const checkGestureAwakening = (detectedGesture: GameGesture) => {
    if (gameState !== 'playing' && gameState !== 'boss_awakening') return;

    const aimX = rawAim.current.x;
    const aimY = rawAim.current.y;

    setMonsters((prev) => {
      let targetMonsterId: string | null = null;
      let minDistance = 999;

      prev.forEach((m) => {
        if (m.isAwake) return;

        const monsterRadius = m.type === 'sleepy_giant_king' ? 15 : 10;

        let matches = false;
        if (m.type === 'sleepy_red' && (detectedGesture === 'left_arm_up' || detectedGesture === 'both_arms_up')) {
          matches = true;
        } else if (m.type === 'sleepy_blue' && (detectedGesture === 'right_arm_up' || detectedGesture === 'both_arms_up')) {
          matches = true;
        } else if (m.type === 'sleepy_rainbow' && (detectedGesture === 'both_arms_up' || detectedGesture === 'hands_spread')) {
          matches = true;
        }

        if (matches) {
          const dist = Math.hypot(m.x - aimX, m.y - aimY);
          if (dist <= monsterRadius && dist < minDistance) {
            minDistance = dist;
            targetMonsterId = m.id;
          }
        }
      });

      if (!targetMonsterId) return prev;

      return prev.map((m) => {
        if (m.id !== targetMonsterId) return m;

        audio.playMonsterCheer();
        audio.playMagicLight();
        spawnSparkles(m.x, m.y, '#FF4081');

        addScore(25);
        setAwakenedCount((c) => c + 1);
        setCombo((cb) => {
          const next = cb + 1;
          if (next > maxCombo) setMaxCombo(next);
          return next;
        });

        addFloatingText('TỈNH DẬY RỒI! 💖 +25', m.x, m.y, '#4CAF50');
        voiceGuide.speak(VOICE_LINES.sweetzombie.monsterWoke, 'low');

        return {
          ...m,
          isAwake: true,
          awakeTimer: Date.now(),
        };
      });
    });

    // Boss Phase Progression
    if (gameState === 'boss_awakening') {
      const boss = monsters.find((m) => m.type === 'sleepy_giant_king' && !m.isAwake);
      if (boss) {
        if (bossPhase === 1 && detectedGesture === 'left_arm_up') {
          audio.playMagicLight();
          setBossPhase(2);
          addFloatingText('BƯỚC 1/4: TAY TRÁI THÀNH CÔNG! ✨', 50, 40, '#00E5FF');
        } else if (bossPhase === 2 && detectedGesture === 'right_arm_up') {
          audio.playMagicLight();
          setBossPhase(3);
          addFloatingText('BƯỚC 2/4: TAY PHẢI THÀNH CÔNG! ✨', 50, 40, '#FF4081');
        } else if (bossPhase === 3 && detectedGesture === 'jump') {
          audio.playJump();
          setBossPhase(4);
          addFloatingText('BƯỚC 3/4: NHẢY THÀNH CÔNG! 🦘', 50, 40, '#FFD700');
        } else if (bossPhase === 4 && (detectedGesture === 'both_arms_up' || detectedGesture === 'hands_spread')) {
          // Boss fully awake!
          audio.playSuccess();
          audio.playMonsterCheer();
          voiceGuide.speak(VOICE_LINES.sweetzombie.bossWoke, 'high');
          addFloatingText('👑 VUA QUÁI VẬT ĐÃ TỈNH! +300 🎉', 50, 35, '#E040FB');
          addScore(300);
          setAwakenedCount((c) => c + 1);

          setMonsters((prev) =>
            prev.map((m) => (m.type === 'sleepy_giant_king' ? { ...m, isAwake: true } : m))
          );
        }
      }
    }
  };

  const spawnSparkles = (x: number, y: number, color: string) => {
    const newParts: FloatingParticle[] = Array.from({ length: 12 }).map((_, i) => ({
      id: Date.now() + i + Math.random(),
      x,
      y,
      vx: (Math.random() - 0.5) * 30,
      vy: (Math.random() - 0.5) * 30 - 10,
      color,
      size: Math.random() * 8 + 4,
      alpha: 1,
    }));
    setParticles((prev) => [...prev, ...newParts]);
  };

  const addFloatingText = (text: string, x: number, y: number, color: string) => {
    setFloatingTexts((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), text, x, y, color, opacity: 1 },
    ]);
  };

  const startGame = () => {
    audio.playRoundStartJingle();
    voiceGuide.speak(VOICE_LINES.sweetzombie.start, 'high');

    scoreRef.current = 0;
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setAwakenedCount(0);
    setTimeLeft(60);
    setMonsters([]);
    setHazards([]);
    setParticles([]);
    setFloatingTexts([]);
    bossSpawnedRef.current = false;
    setBossPhase(1);
    timeLeftRef.current = 60;
    setTimeLeft(60);
    setGameState('playing');
  };

  const endGame = () => {
    setGameState('game_over');
    audio.playSuccess();
    voiceGuide.speak(VOICE_LINES.sweetzombie.finish, 'high');

    const finalScore = scoreRef.current;
    const starsEarned = Math.max(2, Math.floor(finalScore / 25));
    const diamondsEarned = Math.floor(finalScore / 80);

    onUpdateProgress((prev) => {
      const currentHigh = prev.highScores.sweetzombie || 0;
      const newHigh = Math.max(currentHigh, finalScore);
      return {
        ...prev,
        stars: prev.stars + starsEarned,
        diamonds: prev.diamonds + diamondsEarned,
        highScores: { ...prev.highScores, sweetzombie: newHigh },
        parentStats: {
          ...prev.parentStats,
          starsEarnedToday: prev.parentStats.starsEarnedToday + starsEarned,
          stagesCompleted: prev.parentStats.stagesCompleted + 1,
        },
      };
    });
  };

  // Timer
  useEffect(() => {
    if ((gameState !== 'playing' && gameState !== 'boss_awakening') || isPaused) return;

    const timer = setInterval(() => {
      if (workoutMode) {
        // Workout mode is governed externally
        return;
      }

      const nextTime = timeLeftRef.current - 1;
      timeLeftRef.current = nextTime;
      setTimeLeft(Math.max(0, nextTime));

      if (nextTime <= 0) {
        clearInterval(timer);
        endGame();
        return;
      }

      // Spawn Giant Boss when 24s left
      if (nextTime === 24 && !bossSpawnedRef.current) {
        bossSpawnedRef.current = true;
        setGameState('boss_awakening');
        voiceGuide.speak(VOICE_LINES.sweetzombie.bossAlert, 'high');
        spawnSleepyBoss();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, workoutMode, isPaused]);

  const spawnSleepyBoss = () => {
    setMonsters((prev) => [
      ...prev,
      {
        id: 'sleepy_giant_king',
        type: 'sleepy_giant_king',
        x: 50,
        y: 40,
        targetX: 50,
        vx: 0,
        health: 4,
        maxHealth: 4,
        isAwake: false,
      },
    ]);
  };

  // Physics Ticker
  useEffect(() => {
    if (gameState !== 'playing' && gameState !== 'boss_awakening') return;

    let lastTick = performance.now();

    const ticker = (timeNow: number) => {
      if (isPaused) {
        lastTick = timeNow;
        animFrameRef.current = requestAnimationFrame(ticker);
        return;
      }
      const dt = Math.min(0.1, (timeNow - lastTick) / 1000);
      lastTick = timeNow;

      // 1. Aim smoothing
      setAimPos((prev) => ({
        x: prev.x + (rawAim.current.x - prev.x) * 0.2,
        y: prev.y + (rawAim.current.y - prev.y) * 0.2,
      }));

      // 2. Spawn sleepy monsters
      const spawnInterval = difficulty === 'easy' ? 2400 : difficulty === 'normal' ? 1800 : 1200;
      if (timeNow - lastSpawnTime.current > spawnInterval && gameState === 'playing') {
        lastSpawnTime.current = timeNow;
        spawnMonster();
      }

      // 3. Spawn Hazards (Clouds or Puddles)
      if (timeNow - lastHazardTime.current > 3500) {
        lastHazardTime.current = timeNow;
        spawnHazard();
      }

      // 4. Update Monsters
      setMonsters((prev) =>
        prev
          .map((m) => {
            if (m.isAwake) {
              // Cheerful running away
              return {
                ...m,
                y: m.y - 40 * dt,
              };
            }

            // Sleepy slow march downwards
            const nextY = m.y + (m.type === 'sleepy_giant_king' ? 0 : 6 * dt);
            const nextX = m.x + m.vx * dt;

            return {
              ...m,
              x: nextX,
              y: nextY,
            };
          })
          .filter((m) => {
            if (m.isAwake && m.y < -15) return false;
            if (!m.isAwake && m.y > 105) return false;
            return true;
          })
      );

      // 5. Update Hazards & Check Dodge
      setHazards((prev) =>
        prev
          .map((h) => {
            const nextY = h.y + h.vy * dt;

            // Collision check with player's zone
            if (nextY > 80 && nextY < 95 && Math.abs(h.x - 50) < 35) {
              const curG = currentGestureRef.current;
              let dodged = false;
              if (h.type === 'sleepy_cloud' && curG === 'duck') {
                dodged = true;
              } else if (h.type === 'candy_puddle' && curG === 'jump') {
                dodged = true;
              }

              if (dodged) {
                audio.playPowerup();
                addFloatingText(h.type === 'sleepy_cloud' ? 'CÚI NÉ THÀNH CÔNG! ✨' : 'NHẢY QUA THÀNH CÔNG! 🦘', 50, 80, '#4CAF50');
                return { ...h, y: 150 };
              } else if (nextY > 90) {
                // Minor stumble, combo reset
                audio.playFail();
                setCombo(0);
                if (h.type === 'sleepy_cloud') {
                  voiceGuide.speak(VOICE_LINES.sweetzombie.duckCloud, 'medium');
                } else {
                  voiceGuide.speak(VOICE_LINES.sweetzombie.jumpPuddle, 'medium');
                }
              }
            }

            return {
              ...h,
              y: nextY,
            };
          })
          .filter((h) => h.y < 120)
      );

      // 6. Update Particles
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx * dt,
            y: p.y + p.vy * dt,
            alpha: p.alpha - 1.0 * dt,
          }))
          .filter((p) => p.alpha > 0.05)
      );

      // 7. Update Floating Texts
      setFloatingTexts((prev) =>
        prev
          .map((t) => ({ ...t, y: t.y - 12 * dt, opacity: t.opacity - 0.8 * dt }))
          .filter((t) => t.opacity > 0.05)
      );

      animFrameRef.current = requestAnimationFrame(ticker);
    };

    animFrameRef.current = requestAnimationFrame(ticker);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameState, difficulty]);

  const spawnMonster = () => {
    monsterIdCounter.current++;
    const roll = Math.random();
    let type: MonsterType = 'sleepy_red';
    let reqGesture: GameGesture = 'left_arm_up';

    if (roll < 0.35) {
      type = 'sleepy_red';
      reqGesture = 'left_arm_up';
    } else if (roll < 0.7) {
      type = 'sleepy_blue';
      reqGesture = 'right_arm_up';
    } else {
      type = 'sleepy_rainbow';
      reqGesture = 'both_arms_up';
    }

    const x = Math.random() * 60 + 20;

    setMonsters((prev) => [
      ...prev,
      {
        id: `monster_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
        type,
        x,
        y: 15,
        targetX: x,
        vx: (Math.random() - 0.5) * 4,
        requiredGesture: reqGesture,
        health: 1,
        maxHealth: 1,
        isAwake: false,
      },
    ]);
  };

  const spawnHazard = () => {
    const isCloud = Math.random() < 0.5;
    setHazards((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        type: isCloud ? 'sleepy_cloud' : 'candy_puddle',
        x: Math.random() * 50 + 25,
        y: 10,
        vy: 30,
        requiredAction: isCloud ? 'duck' : 'jump',
      },
    ]);
  };

  return (
    <div
      ref={containerRef}
      id="sweet-zombie-game"
      className="relative w-full max-w-4xl h-[92dvh] max-h-[calc(100dvh-32px)] landscape:max-h-[calc(100dvh-16px)] md:h-[600px] bg-gradient-to-b from-purple-100 via-pink-50 to-indigo-100 rounded-3xl overflow-hidden border-4 border-purple-300 shadow-2xl flex flex-col justify-between select-none touch-none"
    >
      {/* Pastel Candy Garden Background */}
      <div className="absolute inset-0 pointer-events-none opacity-25">
        <div className="absolute top-10 left-10 text-6xl">🍭</div>
        <div className="absolute top-8 right-16 text-6xl">🍬</div>
        <div className="absolute bottom-10 left-12 text-5xl">🧁</div>
        <div className="absolute bottom-8 right-12 text-5xl">🍰</div>
      </div>

      {/* Header HUD */}
      <header className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-md border-b-2 border-purple-200 z-30">
        {!workoutMode && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-800 font-black text-xs rounded-full transition shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            Menu Chính
          </button>
        )}

        <div className="flex items-center gap-2">
          <span className="text-2xl">🧸</span>
          <h2 className="text-lg md:text-xl font-black text-purple-700">Zombie Kẹo Ngọt</h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-purple-500 text-white px-3 py-1.5 rounded-full font-black text-xs shadow-sm">
            <Clock className="w-3.5 h-3.5" />
            {workoutMode ? "Vận Động" : `${timeLeft}s`}
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      {(gameState === 'playing' || gameState === 'boss_awakening') && (
        <div className="flex items-center justify-between px-6 py-2 bg-purple-50/90 text-xs font-black text-purple-950 z-20">
          <div className="flex items-center gap-4">
            <span className="text-base font-extrabold text-purple-700">Điểm: {score}</span>
            {combo > 1 && (
              <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2.5 py-0.5 rounded-full animate-bounce">
                COMBO x{combo}!
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-emerald-700">Đã tỉnh dậy: {awakenedCount} 🌟</span>
            {gameState === 'boss_awakening' && (
              <span className="bg-indigo-600 text-white px-2.5 py-0.5 rounded-full animate-pulse">
                👑 ĐÁNH THỨC VUA QUÁI VẬT (BƯỚC {bossPhase}/4)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Stage Canvas Area */}
      <div className="relative flex-1 w-full overflow-hidden">
        {/* Intro View */}
        {gameState === 'intro' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-white/95 backdrop-blur-sm z-30 text-center">
            <div className="text-6xl mb-3 animate-bounce">🧸🍬🌈</div>
            <h2 className="text-3xl font-black text-purple-600">Đánh Thức Các Bạn Quái Vật</h2>
            <p className="text-slate-600 text-sm max-w-md mt-2 leading-relaxed">
              Các bạn quái vật nhỏ dễ thương đang bị buồn ngủ và đi lạc vào vườn kẹo!
              Hãy làm đúng các tư thế tay để dùng phép màu đánh thức các bạn ấy nhé.
            </p>

            <div className="grid grid-cols-3 gap-3 my-5 max-w-md w-full text-xs">
              <div className="bg-rose-50 p-3 rounded-2xl border border-rose-200">
                <span className="text-xl">🔴 🫲</span>
                <p className="font-bold text-rose-800 mt-1">Quái Vật Đỏ</p>
                <p className="text-[10px] text-slate-500">Giơ tay trái lên</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-2xl border border-blue-200">
                <span className="text-xl">🔵 🫱</span>
                <p className="font-bold text-blue-800 mt-1">Quái Vật Xanh</p>
                <p className="text-[10px] text-slate-500">Giơ tay phải lên</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-2xl border border-purple-200">
                <span className="text-xl">🌈 🙌</span>
                <p className="font-bold text-purple-800 mt-1">Quái Vật Cầu Vồng</p>
                <p className="text-[10px] text-slate-500">Giơ cả hai tay lên</p>
              </div>
            </div>

            {/* Difficulty */}
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xs font-bold text-slate-500">Độ khó:</span>
              {(['easy', 'normal', 'fast'] as GameDifficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase transition ${
                    difficulty === d ? 'bg-purple-500 text-white shadow-sm' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  }`}
                >
                  {d === 'easy' ? 'Dễ' : d === 'normal' ? 'Vừa' : 'Nhanh'}
                </button>
              ))}
            </div>

            <button
              onClick={startGame}
              className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-black text-sm rounded-full shadow-lg transform hover:scale-105 transition"
            >
              BẮT ĐẦU GIẢI CỨU!
            </button>
          </div>
        )}

        {/* Game Over View */}
        {gameState === 'game_over' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-white/95 backdrop-blur-sm z-30 text-center">
            <Award className="w-20 h-20 text-yellow-500 animate-bounce mb-2" />
            <h2 className="text-3xl font-black text-purple-600">Bữa Tiệc Bánh Kem Bắt Đầu!</h2>
            <p className="text-slate-500 text-xs font-bold mt-1">Tất cả quái vật nhỏ đã vui vẻ tỉnh giấc và nhảy múa!</p>

            <div className="grid grid-cols-3 gap-3 my-6 max-w-md w-full">
              <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Tổng Điểm</span>
                <p className="text-3xl font-black text-purple-600">{score}</p>
              </div>
              <div className="bg-pink-50 p-4 rounded-2xl border border-pink-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Max Combo</span>
                <p className="text-3xl font-black text-pink-600">x{maxCombo}</p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Đã Tỉnh Giấc</span>
                <p className="text-3xl font-black text-emerald-600">{awakenedCount}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={startGame}
                className="flex items-center gap-2 px-6 py-2.5 bg-purple-500 hover:bg-purple-600 text-white font-black text-xs rounded-full shadow-md transition"
              >
                <RotateCcw className="w-4 h-4" />
                Chơi Lại Lần Nữa
              </button>
              <button
                onClick={onBack}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-full transition"
              >
                Về Menu
              </button>
            </div>
          </div>
        )}

        {/* Monsters Rendering */}
        {monsters.map((m) => {
          if (!m.isAwake) {
            return (
              <div
                key={m.id}
                onClick={() => handleMonsterClick(m)}
                className="absolute flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 select-none cursor-pointer hover:scale-110 active:scale-95"
                style={{
                  left: `${m.x}%`,
                  top: `${m.y}%`,
                }}
              >
                <div className="relative flex flex-col items-center">
                  {/* Action prompt bubble above monster */}
                  <div className="mb-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white shadow-md border border-purple-200 text-purple-900 animate-bounce">
                    {m.type === 'sleepy_red' && '🫲 TAY TRÁI ↑ (hoặc chạm)'}
                    {m.type === 'sleepy_blue' && '🫱 TAY PHẢI ↑ (hoặc chạm)'}
                    {m.type === 'sleepy_rainbow' && '🙌 HAI TAY ↑ (hoặc chạm)'}
                    {m.type === 'sleepy_giant_king' && `👑 BƯỚC ${bossPhase}/4`}
                  </div>

                  <span className={`${m.type === 'sleepy_giant_king' ? 'text-7xl animate-pulse' : 'text-5xl'}`}>
                    {m.type === 'sleepy_red' ? '👾' : m.type === 'sleepy_blue' ? '🤖' : m.type === 'sleepy_giant_king' ? '👹' : '🦄'}
                  </span>
                  <span className="text-xs animate-pulse">💤</span>
                </div>
              </div>
            );
          } else {
            // Awake monster running up happily
            return (
              <div
                key={m.id}
                className="absolute flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all"
                style={{
                  left: `${m.x}%`,
                  top: `${m.y}%`,
                }}
              >
                <span className="text-4xl animate-bounce">🎉😄💖</span>
                <span className="text-[10px] font-black text-pink-600">Mình tỉnh rồi nè!</span>
              </div>
            );
          }
        })}

        {/* Hazards (Sleepy Cloud & Candy Puddle) */}
        {hazards.map((h) => (
          <div
            key={h.id}
            className="absolute flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              left: `${h.x}%`,
              top: `${h.y}%`,
            }}
          >
            <div className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/90 text-slate-800 shadow-sm mb-0.5">
              {h.type === 'sleepy_cloud' ? 'CÚI XUỐNG! ⇩' : 'NHẢY LÊN! ⇧'}
            </div>
            <span className="text-4xl">{h.type === 'sleepy_cloud' ? '☁️' : '🍯'}</span>
          </div>
        ))}

        {/* Sparkles */}
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              opacity: p.alpha,
              boxShadow: `0 0 10px ${p.color}`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}

        {/* Floating Texts */}
        {floatingTexts.map((t) => (
          <div
            key={t.id}
            className="absolute font-black text-sm pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${t.x}%`,
              top: `${t.y}%`,
              color: t.color,
              opacity: t.opacity,
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            {t.text}
          </div>
        ))}
      </div>

      {/* Footer Guidance */}
      <footer className="p-3 bg-white/70 backdrop-blur-md border-t border-purple-200 text-center text-xs font-bold text-purple-800 z-30">
        Nhìn màu của quái vật để giơ tay tương ứng! Đỏ = Tay trái, Xanh = Tay phải, Cầu vồng = Hai tay!
      </footer>
    </div>
  );
}
