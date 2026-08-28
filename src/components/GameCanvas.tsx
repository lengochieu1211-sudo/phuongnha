/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useManagedTimeout } from '../hooks/useManagedTimeout';
import { ArrowLeft, Play, Pause, RotateCcw, Star, Trophy, Heart, Flame, Shield, CloudRain } from 'lucide-react';
import { PlayerProgress, GameGesture, WorldConfig, CharacterId } from '../types';
import { audio } from '../lib/AudioEngine';
import { WORLDS, recordMissionProgress } from '../utils/progression';
import { renderCharacterSvg } from '../utils/characterRenderer';
import Confetti from './Confetti';

interface GameCanvasProps {
  progress: PlayerProgress;
  onUpdateProgress: (updater: (p: PlayerProgress) => PlayerProgress) => void;
  gesture: GameGesture;
  world: WorldConfig;
  workoutMode?: '5min' | '10min' | null;
  externalDuration?: number;
  isPaused?: boolean;
  onBack: () => void;
}

// Coordinate configurations
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 450;
const LANES = [180, 400, 620]; // Left, Center, Right X coordinates

interface Entity {
  id: string;
  type: 'star' | 'rainbow_star' | 'diamond' | 'obstacle_low' | 'obstacle_high' | 'butterfly' | 'gift_box';
  lane: number;
  x: number;
  y: number;
  w: number;
  h: number;
  collected: boolean;
}

export default function GameCanvas({
  progress,
  onUpdateProgress,
  gesture,
  world,
  workoutMode = null,
  externalDuration,
  isPaused = false,
  onBack,
}: GameCanvasProps) {
  const scheduleTimeout = useManagedTimeout();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [score, setScore] = useState<number>(0);
  const [starsCollected, setStarsCollected] = useState<number>(0);
  const [diamondsCollected, setDiamondsCollected] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [gameStatus, setGameStatus] = useState<'playing' | 'completed'>('playing');

  // Custom Workout Timer
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    if (externalDuration) return externalDuration;
    if (workoutMode === '5min') return 300;
    if (workoutMode === '10min') return 600;
    return 0;
  });

  // Boss Rain Cloud state
  const [bossActive, setBossActive] = useState<boolean>(false);
  const [bossHp, setBossHp] = useState<number>(100);
  const [floatingText, setFloatingText] = useState<{ id: number; text: string; x: number; y: number }[]>([]);

  // Multi-world chaining for Workout mode
  const [currentWorldIdx, setCurrentWorldIdx] = useState<number>(
    WORLDS.findIndex((w) => w.id === world.id) >= 0 ? WORLDS.findIndex((w) => w.id === world.id) : 0
  );
  const activeWorld = WORLDS[currentWorldIdx];

  const handleLevelCompletion = useCallback(() => {
    setIsPlaying(false);
    setGameStatus('completed');
    audio.playSuccess();

    onUpdateProgress((prev) => {
      let starsEarned = starsCollected;
      let diamondsEarned = diamondsCollected;

      const unlockedWorlds = [...prev.unlockedWorlds];
      const nextWorld = WORLDS[currentWorldIdx + 1];

      if (nextWorld && !unlockedWorlds.includes(nextWorld.id)) {
        unlockedWorlds.push(nextWorld.id);
      }

      // If World 6 (cloud_castle) completed, unlock Lumi!
      const unlockedChars = [...prev.unlockedCharacters];
      if (activeWorld.id === 'cloud_castle') {
        if (!unlockedChars.includes('lumi')) {
          unlockedChars.push('lumi');
        }
      }

      const nextProgress = {
        ...prev,
        stars: prev.stars + starsEarned,
        diamonds: prev.diamonds + diamondsEarned,
        unlockedWorlds,
        unlockedCharacters: unlockedChars,
      };

      return recordMissionProgress(nextProgress, 'adventure', 1);
    });
  }, [starsCollected, diamondsCollected, currentWorldIdx, activeWorld, onUpdateProgress]);

  // Workout countdown timer
  useEffect(() => {
    if (!workoutMode && !externalDuration) return;
    if (!isPlaying || gameStatus !== 'playing' || isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleLevelCompletion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [workoutMode, externalDuration, isPlaying, gameStatus, isPaused, handleLevelCompletion]);
  const activeCharId = progress.selectedCharacter || 'bara';
  const characterImgRef = useRef<HTMLImageElement | null>(null);
  const characterImageCacheRef = useRef<Map<string, { img: HTMLImageElement; url: string }>>(new Map());

  // Clean up Object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      characterImageCacheRef.current.forEach((item) => {
        URL.revokeObjectURL(item.url);
      });
      characterImageCacheRef.current.clear();
    };
  }, []);

  // Load character SVG into Image with memory caching
  useEffect(() => {
    const tickFrame = Math.floor(distance) % 32;
    const cacheKey = `${activeCharId}_run_${tickFrame}_${JSON.stringify(progress.equippedWardrobe)}`;

    if (characterImageCacheRef.current.has(cacheKey)) {
      const cached = characterImageCacheRef.current.get(cacheKey);
      if (cached) {
        characterImgRef.current = cached.img;
      }
      return;
    }

    const svgStr = renderCharacterSvg({
      characterId: activeCharId,
      animState: 'run',
      equipped: progress.equippedWardrobe,
      width: 120,
      height: 120,
      tick: tickFrame,
    });
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.src = url;
    img.onload = () => {
      characterImageCacheRef.current.set(cacheKey, { img, url });
      const currentTickFrame = Math.floor(distance) % 32;
      if (tickFrame === currentTickFrame) {
        characterImgRef.current = img;
      }
    };
  }, [activeCharId, progress.equippedWardrobe, Math.floor(distance)]);

  // Player Ref
  const playerRef = useRef({
    lane: 1, // Start middle lane
    targetX: LANES[1],
    currentX: LANES[1],
    y: 0,
    vy: 0,
    isJumping: false,
    isDucking: false,
    duckTimer: 0,
    runFrame: 0,
  });

  const entitiesRef = useRef<Entity[]>([]);
  const backgroundOffsetRef = useRef<number>(0);
  const gameTimeRef = useRef<number>(0);
  const entityIdCounter = useRef<number>(0);

  // Restart level
  const restartLevel = () => {
    setIsPlaying(true);
    setScore(0);
    setStarsCollected(0);
    setDiamondsCollected(0);
    setDistance(0);
    setBossActive(false);
    setBossHp(100);
    setGameStatus('playing');

    playerRef.current = {
      lane: 1,
      targetX: LANES[1],
      currentX: LANES[1],
      y: 0,
      vy: 0,
      isJumping: false,
      isDucking: false,
      duckTimer: 0,
      runFrame: 0,
    };
    entitiesRef.current = [];
    backgroundOffsetRef.current = 0;
    gameTimeRef.current = 0;

    audio.playPowerup();
  };

  // Gesture handling
  useEffect(() => {
    if (!isPlaying || gameStatus !== 'playing') return;

    const p = playerRef.current;

    // Lane positioning
    if (gesture === 'tilt_left' && p.lane > 0) {
      p.lane = 0;
      p.targetX = LANES[0];
    } else if (gesture === 'tilt_right' && p.lane < 2) {
      p.lane = 2;
      p.targetX = LANES[2];
    } else if (
      gesture === 'standing' ||
      gesture === 'both_arms_up' ||
      gesture === 'hands_spread'
    ) {
      p.lane = 1;
      p.targetX = LANES[1];
    }

    // Jump state
    if (gesture === 'jump' && !p.isJumping && !p.isDucking) {
      p.vy = 13;
      p.isJumping = true;
      audio.playJump();
    }

    // Duck state
    if (gesture === 'duck' && !p.isJumping && !p.isDucking) {
      p.isDucking = true;
      p.duckTimer = 35;
      audio.playDuck();
    }

    // Boss clear gesture (Both arms up or Hands spread)
    if (bossActive && (gesture === 'both_arms_up' || gesture === 'hands_spread')) {
      setBossHp((prev) => {
        const next = Math.max(0, prev - 25);
        if (next === 0) {
          setBossActive(false);
          setStarsCollected((s) => s + 50);
          audio.playSuccess();
          addFloatingText('CẦU VỒNG DỌN SẠCH!', 400, 150);
        }
        return next;
      });
    }
  }, [gesture, isPlaying, gameStatus, bossActive]);

  const addFloatingText = (text: string, x: number, y: number) => {
    const id = Date.now() + Math.random();
    setFloatingText((prev) => [...prev, { id, text, x, y }]);
    scheduleTimeout(() => {
      setFloatingText((prev) => prev.filter((t) => t.id !== id));
    }, 1200);
  };

  // Main Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const updateGame = () => {
      if (!isPlaying || gameStatus !== 'playing' || isPaused) {
        drawGameScene();
        animId = requestAnimationFrame(updateGame);
        return;
      }

      gameTimeRef.current++;
      setDistance((d) => d + 0.1);
      setScore((s) => s + 1);

      const p = playerRef.current;
      p.currentX += (p.targetX - p.currentX) * 0.18;

      if (p.isJumping) {
        p.y += p.vy;
        p.vy -= 0.65;
        if (p.y <= 0) {
          p.y = 0;
          p.vy = 0;
          p.isJumping = false;
        }
      }

      if (p.isDucking) {
        p.duckTimer--;
        if (p.duckTimer <= 0) {
          p.isDucking = false;
        }
      }

      // Check Boss Trigger at distance = 500
      if (gameTimeRef.current === 800 && !bossActive) {
        setBossActive(true);
        setBossHp(100);
        audio.playPowerup();
        addFloatingText('MÂY MƯA KHỔNG LỒ XUẤT HIỆN!', 400, 120);
      }

      backgroundOffsetRef.current =
        (backgroundOffsetRef.current + (activeWorld.speed || 3.5)) % CANVAS_WIDTH;

      // Entities update
      const entities = entitiesRef.current;
      entities.forEach((ent) => {
        ent.y += activeWorld.speed || 3.5;
      });

      entitiesRef.current = entities.filter((ent) => {
        if (ent.y > CANVAS_HEIGHT + 50) return false;

        const playerHeight = p.isDucking ? 40 : 80;
        const playerFloorY = CANVAS_HEIGHT - 90;
        const playerYOnCanvas = playerFloorY - p.y;

        const isLaneMatch = Math.abs(ent.x - p.currentX) < 45;
        const isYMatch =
          ent.y > playerYOnCanvas && ent.y < playerYOnCanvas + playerHeight;

        if (isLaneMatch && isYMatch && !ent.collected) {
          ent.collected = true;

          if (ent.type === 'star') {
            setStarsCollected((s) => s + 1);
            audio.playCollect();
            addFloatingText('+10', ent.x, ent.y);
          } else if (ent.type === 'rainbow_star') {
            setStarsCollected((s) => s + 5);
            audio.playPowerup();
            addFloatingText('PERFECT! +50', ent.x, ent.y);
          } else if (ent.type === 'diamond') {
            setDiamondsCollected((d) => d + 1);
            audio.playDiamond();
            addFloatingText('💎 +1', ent.x, ent.y);
          } else if (ent.type === 'gift_box') {
            setStarsCollected((s) => s + 10);
            audio.playSuccess();
            addFloatingText('🎁 BẢO BỐI!', ent.x, ent.y);
          } else if (ent.type === 'obstacle_low' || ent.type === 'obstacle_high') {
            let hit = false;
            if (ent.type === 'obstacle_low' && !p.isJumping) hit = true;
            if (ent.type === 'obstacle_high' && !p.isDucking) hit = true;

            if (hit) {
              audio.playFail();
              setScore((s) => Math.max(0, s - 50));
            }
          }
          return false;
        }

        return true;
      });

      if (gameTimeRef.current % 70 === 0) {
        spawnEntity();
      }

      const hasExternalTime = externalDuration || workoutMode === '5min' || workoutMode === '10min';
      const targetTicks = hasExternalTime ? null : 2200;

      if (targetTicks && gameTimeRef.current >= targetTicks) {
        handleLevelCompletion();
      }

      drawGameScene();
      animId = requestAnimationFrame(updateGame);
    };

    const drawGameScene = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // 1. Background
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      grad.addColorStop(0, '#FFF3E0');
      grad.addColorStop(1, '#FFE0B2');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // 2. Road Tracks
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.beginPath();
      ctx.moveTo(100, CANVAS_HEIGHT);
      ctx.lineTo(340, 230);
      ctx.lineTo(460, 230);
      ctx.lineTo(700, CANVAS_HEIGHT);
      ctx.closePath();
      ctx.fill();

      // 3. Boss Rain Cloud
      if (bossActive) {
        ctx.fillStyle = '#64748B';
        ctx.beginPath();
        ctx.arc(400, 80, 45, 0, 2 * Math.PI);
        ctx.arc(360, 90, 35, 0, 2 * Math.PI);
        ctx.arc(440, 90, 35, 0, 2 * Math.PI);
        ctx.fill();

        // Boss HP Bar
        ctx.fillStyle = '#CBD5E1';
        ctx.fillRect(300, 30, 200, 12);
        ctx.fillStyle = '#3B82F6';
        ctx.fillRect(300, 30, 2 * bossHp, 12);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(300, 30, 200, 12);
      }

      // 4. Entities
      entitiesRef.current.forEach((ent) => {
        ctx.save();
        ctx.translate(ent.x, ent.y);

        if (ent.type === 'star') {
          ctx.fillStyle = '#FFD700';
          ctx.beginPath();
          ctx.arc(0, 0, 12, 0, 2 * Math.PI);
          ctx.fill();
        } else if (ent.type === 'rainbow_star') {
          ctx.fillStyle = '#FF4D6D';
          ctx.beginPath();
          ctx.arc(0, 0, 15, 0, 2 * Math.PI);
          ctx.fill();
        } else if (ent.type === 'diamond') {
          ctx.fillStyle = '#00E5FF';
          ctx.fillRect(-10, -10, 20, 20);
        } else if (ent.type === 'gift_box') {
          ctx.fillStyle = '#FFB6C1';
          ctx.fillRect(-12, -12, 24, 24);
        } else if (ent.type === 'obstacle_low') {
          ctx.fillStyle = '#94A3B8';
          ctx.fillRect(-18, 0, 36, 18);
        } else if (ent.type === 'obstacle_high') {
          ctx.fillStyle = '#8D6E63';
          ctx.fillRect(-40, -20, 80, 10);
        }

        ctx.restore();
      });

      // 5. Draw Player Character
      const p = playerRef.current;
      const x = p.currentX;
      const playerFloorY = CANVAS_HEIGHT - 90;
      const y = playerFloorY - p.y;

      if (characterImgRef.current) {
        ctx.drawImage(characterImgRef.current, x - 50, y - 50, 100, 100);
      } else {
        ctx.fillStyle = '#C88D58';
        ctx.beginPath();
        ctx.arc(x, y, 25, 0, 2 * Math.PI);
        ctx.fill();
      }

      // 6. Draw Floating Score Popups
      floatingText.forEach((t) => {
        ctx.font = '900 16px sans-serif';
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#2B2D42';
        ctx.lineWidth = 3;
        ctx.strokeText(t.text, t.x, t.y);
        ctx.fillText(t.text, t.x, t.y);
      });
    };

    const spawnEntity = () => {
      const typeChance = Math.random();
      const lane = Math.floor(Math.random() * 3);
      let type: Entity['type'] = 'star';

      if (typeChance < 0.45) type = 'star';
      else if (typeChance < 0.6) type = 'rainbow_star';
      else if (typeChance < 0.75) type = 'diamond';
      else if (typeChance < 0.9) type = Math.random() > 0.5 ? 'obstacle_low' : 'obstacle_high';
      else type = 'gift_box';

      entityIdCounter.current++;
      entitiesRef.current.push({
        id: `ent_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
        type,
        lane,
        x: LANES[lane],
        y: -30,
        w: 30,
        h: 30,
        collected: false,
      });
    };

    animId = requestAnimationFrame(updateGame);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, gameStatus, bossActive, activeWorld, currentWorldIdx, floatingText, handleLevelCompletion]);

  return (
    <div
      id="adventure-game-wrapper"
      className="flex flex-col items-center gap-6 w-full max-w-4xl mx-auto p-4 md:p-6 bg-white/95 backdrop-blur rounded-3xl border-4 border-emerald-200 shadow-2xl font-sans text-slate-800"
    >
      {/* Header Bar */}
      <div className="flex w-full items-center justify-between border-b pb-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition shadow-sm text-sm"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại
        </button>

        <div className="text-center flex flex-col items-center">
          <h2 className="text-xl md:text-2xl font-black text-emerald-700 uppercase tracking-wide">
            {activeWorld.name}
          </h2>
          {(workoutMode || externalDuration) && (
            <div className="flex items-center gap-1 mt-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              <span>⏱️ Vận Động: {timeLeft} giây còn lại</span>
            </div>
          )}
          {bossActive && (
            <p className="text-xs bg-indigo-100 text-indigo-700 font-extrabold px-3 py-0.5 rounded-full uppercase mt-0.5 animate-pulse">
              ⛈️ Thử thách Mây Mưa: Giơ 2 tay tạo Cầu Vồng!
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <button
            onClick={restartLevel}
            className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {gameStatus === 'playing' && (
        <div className="w-full flex flex-col gap-4">
          <div className="relative w-full aspect-video rounded-3xl overflow-hidden border-4 border-slate-200 bg-slate-900 shadow-inner">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
            <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100 flex items-center gap-3">
              <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
              <div>
                <span className="text-[9px] text-emerald-800 font-bold">SAO THU THẬP</span>
                <p className="text-lg font-extrabold text-emerald-900">+{starsCollected}</p>
              </div>
            </div>

            <div className="bg-sky-50 p-3 rounded-2xl border border-sky-100 flex items-center gap-3">
              <span className="text-2xl">💎</span>
              <div>
                <span className="text-[9px] text-sky-800 font-bold">KIM CƯƠNG</span>
                <p className="text-lg font-extrabold text-sky-900">+{diamondsCollected}</p>
              </div>
            </div>

            <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100 flex items-center gap-3">
              <Trophy className="w-8 h-8 text-amber-500" />
              <div>
                <span className="text-[9px] text-amber-800 font-bold">ĐIỂM SỐ</span>
                <p className="text-lg font-extrabold text-amber-900">{score}</p>
              </div>
            </div>

            <div className="bg-purple-50 p-3 rounded-2xl border border-purple-100 flex items-center gap-3">
              <span className="text-2xl">🏃</span>
              <div>
                <span className="text-[9px] text-purple-800 font-bold">ĐỘNG TÁC</span>
                <p className="text-xs font-extrabold text-purple-900 uppercase">{gesture}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {gameStatus === 'completed' && (
        <>
          <Confetti />
          <div className="flex flex-col items-center text-center p-8 bg-white rounded-3xl border-4 border-emerald-100 shadow-2xl max-w-lg w-full">
            <Trophy className="w-20 h-20 text-yellow-500 fill-yellow-400 mb-4 animate-bounce" />
            <h3 className="text-3xl font-black text-emerald-700">Màn Chơi Hoàn Thành!</h3>
            <p className="text-slate-500 text-sm mt-1">
              Bé đã hoàn thành xuất sắc {activeWorld.name}!
            </p>

            <div className="flex gap-4 mt-6">
              <button
                onClick={restartLevel}
                className="px-6 py-2.5 bg-emerald-500 text-white font-extrabold rounded-full shadow-md hover:bg-emerald-600 transition"
              >
                Chơi lại
              </button>
              <button
                onClick={onBack}
                className="px-6 py-2.5 bg-slate-200 text-slate-700 font-bold rounded-full shadow-sm hover:bg-slate-300 transition"
              >
                Menu chính
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

