/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useManagedTimeout } from '../hooks/useManagedTimeout';
import { Sparkles, ArrowLeft, RotateCcw, Zap, Award, Volume2, Shield, Clock } from 'lucide-react';
import { PlayerProgress, GameGesture, GameDifficulty } from '../types';
import { audio } from '../lib/AudioEngine';
import { voiceGuide } from '../lib/VoiceGuideService';
import { VOICE_LINES } from '../lib/voiceLines.vi';
import { poseDetector, WristPosition } from '../utils/poseDetector';
import { mapWristToGame } from '../utils/poseUtils';
import { useCameraPose } from '../providers/CameraPoseContext';

interface FruitSlashGameProps {
  progress: PlayerProgress;
  onUpdateProgress: (updater: (prev: PlayerProgress) => PlayerProgress) => void;
  gesture: GameGesture;
  onBack: () => void;
  workoutMode?: boolean;
  isPaused?: boolean;
}

export type FruitType =
  | 'watermelon'
  | 'orange'
  | 'apple'
  | 'strawberry'
  | 'pineapple'
  | 'kiwi'
  | 'banana'
  | 'mango'
  | 'ink_cloud'
  | 'powerup_clock'
  | 'powerup_magnet'
  | 'powerup_double';

interface ActiveFruit {
  id: string;
  type: FruitType;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  vx: number; // velocity X (% per sec)
  vy: number; // velocity Y (% per sec)
  radius: number; // in %
  rotation: number;
  vRot: number;
  isSliced: boolean;
  sliceAngle?: number;
  sliceTime?: number;
  leftHalfOffset?: { x: number; y: number; rot: number };
  rightHalfOffset?: { x: number; y: number; rot: number };
}

interface JuiceParticle {
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
  scale: number;
  opacity: number;
}

const FRUIT_CONFIGS: { [key in FruitType]: { name: string; emoji: string; color: string; juiceColor: string; points: number } } = {
  watermelon: { name: 'Dưa Hấu', emoji: '🍉', color: '#4CAF50', juiceColor: '#FF2A6D', points: 10 },
  orange: { name: 'Cam', emoji: '🍊', color: '#FF9800', juiceColor: '#FF9800', points: 10 },
  apple: { name: 'Táo', emoji: '🍎', color: '#F44336', juiceColor: '#FF5252', points: 10 },
  strawberry: { name: 'Dâu Tây', emoji: '🍓', color: '#E91E63', juiceColor: '#FF4081', points: 15 },
  pineapple: { name: 'Dứa', emoji: '🍍', color: '#FFEB3B', juiceColor: '#FFEE58', points: 15 },
  kiwi: { name: 'Kiwi', emoji: '🥝', color: '#8BC34A', juiceColor: '#8BC34A', points: 15 },
  banana: { name: 'Chuối', emoji: '🍌', color: '#FFD600', juiceColor: '#FFF176', points: 10 },
  mango: { name: 'Xoài', emoji: '🥭', color: '#FFA000', juiceColor: '#FFB300', points: 15 },
  ink_cloud: { name: 'Quả Mây Đen', emoji: '☁️', color: '#37474F', juiceColor: '#263238', points: 0 },
  powerup_clock: { name: 'Đồng Hồ Chậm', emoji: '⏰', color: '#00BCD4', juiceColor: '#80DEEA', points: 20 },
  powerup_magnet: { name: 'Nam Châm', emoji: '🧲', color: '#E040FB', juiceColor: '#EA80FC', points: 20 },
  powerup_double: { name: 'Nhân Đôi', emoji: '2️⃣', color: '#FFD700', juiceColor: '#FFE082', points: 25 },
};

export default function FruitSlashGame({
  progress,
  onUpdateProgress,
  gesture,
  onBack,
  workoutMode = false,
  isPaused = false,
}: FruitSlashGameProps) {
  const scheduleTimeout = useManagedTimeout();
  const { trackingMode, isStreaming } = useCameraPose();
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'game_over'>(() => workoutMode ? 'playing' : 'intro');
  const [difficulty, setDifficulty] = useState<GameDifficulty>('normal');
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [totalFruitsSpawned, setTotalFruitsSpawned] = useState<number>(0);
  const [totalFruitsSliced, setTotalFruitsSliced] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [inkSplattered, setInkSplattered] = useState<boolean>(false);
  const [rainbowCooldown, setRainbowCooldown] = useState<number>(0); // 0 = ready, up to 100%
  const [hasShield, setHasShield] = useState<boolean>(false);
  const [slowMoTime, setSlowMoTime] = useState<number>(0);
  const [doubleScoreTime, setDoubleScoreTime] = useState<number>(0);
  const [magnetTime, setMagnetTime] = useState<number>(0);

  // Entities
  const [fruits, setFruits] = useState<ActiveFruit[]>([]);
  const [particles, setParticles] = useState<JuiceParticle[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);

  // Slashing blades paths
  const leftBladeTrail = useRef<{ x: number; y: number; time: number }[]>([]);
  const rightBladeTrail = useRef<{ x: number; y: number; time: number }[]>([]);
  const lastLeftWrist = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastRightWrist = useRef<{ x: number; y: number; time: number } | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasTrailRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const fruitIdCounter = useRef<number>(0);
  const lastSpawnTime = useRef<number>(0);
  const rainbowReadyRef = useRef<boolean>(true);

  // Voice guide warmup safety reminder
  useEffect(() => {
    voiceGuide.speak(VOICE_LINES.safety.warmup, 'medium');
  }, []);

  // Listen to pose detector wrist updates
  useEffect(() => {
    const handlePoseResults = (res: any) => {
      if (isPaused) return;
      if (gameState !== 'playing') return;

      // In touch/keyboard mode, camera pose updates do not move the blade
      if (trackingMode === 'keyboard_only') return;

      const leftMapped = mapWristToGame(res.leftWrist, { minX: 2, maxX: 98, minY: 2, maxY: 98 });
      const rightMapped = mapWristToGame(res.rightWrist, { minX: 2, maxX: 98, minY: 2, maxY: 98 });

      if (leftMapped.visible) {
        updateBlade('left', leftMapped.gameX, leftMapped.gameY);
      } else {
        lastLeftWrist.current = null;
        leftBladeTrail.current = [];
      }

      if (rightMapped.visible) {
        updateBlade('right', rightMapped.gameX, rightMapped.gameY);
      } else {
        lastRightWrist.current = null;
        rightBladeTrail.current = [];
      }

      // Check cross hands for Rainbow Slash skill
      if (
        res.leftWrist &&
        res.rightWrist &&
        res.leftWrist.visible &&
        res.rightWrist.visible &&
        rainbowReadyRef.current &&
        gameState === 'playing'
      ) {
        const dx = Math.abs(res.leftWrist.x - res.rightWrist.x);
        const dy = Math.abs(res.leftWrist.y - res.rightWrist.y);
        // If wrists cross within 16% and are in mid/upper screen
        if (dx < 0.16 && dy < 0.16 && res.leftWrist.y < 0.75) {
          triggerRainbowSlash();
        }
      }
    };

    const unsub = poseDetector.addListener(handlePoseResults);
    return () => {
      unsub();
    };
  }, [gameState, trackingMode, isPaused]);

  const triggerRainbowSlash = () => {
    if (!rainbowReadyRef.current) return;
    rainbowReadyRef.current = false;
    setRainbowCooldown(100);
    audio.playRainbowSlash();
    voiceGuide.speak(VOICE_LINES.fruitslash.rainbowSkill, 'high');

    let actualSlicedCount = 0;

    // Slice all active un-sliced fruits on screen!
    setFruits((prev) =>
      prev.map((f) => {
        if (!f.isSliced && f.type !== 'ink_cloud') {
          actualSlicedCount++;
          spawnJuiceExplosion(f.x, f.y, FRUIT_CONFIGS[f.type].juiceColor);
          addFloatingText('🌈 RAINBOW SLICE +50', f.x, f.y, '#FF4081');
          return {
            ...f,
            isSliced: true,
            sliceAngle: Math.PI / 4,
            sliceTime: Date.now(),
            leftHalfOffset: { x: -3, y: -2, rot: -20 },
            rightHalfOffset: { x: 3, y: 2, rot: 20 },
          };
        }
        return f;
      })
    );

    if (actualSlicedCount > 0) {
      setScore((s) => s + actualSlicedCount * 30);
      setTotalFruitsSliced((c) => c + actualSlicedCount);
      setCombo((c) => c + actualSlicedCount);
    }

    // Cooldown timer (10 seconds)
    const cdInterval = setInterval(() => {
      setRainbowCooldown((cd) => {
        if (cd <= 10) {
          clearInterval(cdInterval);
          rainbowReadyRef.current = true;
          return 0;
        }
        return cd - 10;
      });
    }, 1000);
  };

  // Update blade trajectory & detect fruit intersections
  const updateBlade = (hand: 'left' | 'right', x: number, y: number) => {
    const now = Date.now();
    const trail = hand === 'left' ? leftBladeTrail.current : rightBladeTrail.current;
    const lastPosRef = hand === 'left' ? lastLeftWrist : lastRightWrist;

    trail.push({ x, y, time: now });
    // Keep trail to last 12 points
    if (trail.length > 12) trail.shift();

    if (lastPosRef.current) {
      const dt = (now - lastPosRef.current.time) / 1000;
      if (dt > 0) {
        const dx = x - lastPosRef.current.x;
        const dy = y - lastPosRef.current.y;
        const speed = Math.sqrt(dx * dx + dy * dy) / dt; // % per second

        // Check if hand moved fast enough to be a slash (speed > 80% / s)
        if (speed > 80 && gameState === 'playing') {
          checkFruitSlash(lastPosRef.current.x, lastPosRef.current.y, x, y, speed);
        }
      }
    }

    lastPosRef.current = { x, y, time: now };
  };

  // Line segment vs Circle hitbox intersection
  const checkFruitSlash = (x1: number, y1: number, x2: number, y2: number, speed: number) => {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    let newlySliced = 0;

    setFruits((prevFruits) =>
      prevFruits.map((fruit) => {
        if (fruit.isSliced) return fruit;

        // Hitbox distance to line segment
        const dist = distToSegment(fruit.x, fruit.y, x1, y1, x2, y2);
        // Kids-friendly forgiving hitbox (fruit radius + 2.5%)
        const hitRadius = difficulty === 'easy' ? fruit.radius * 1.3 : fruit.radius * 1.1;

        if (dist <= hitRadius) {
          // HIT!
          newlySliced++;

          if (fruit.type === 'ink_cloud') {
            // Hit obstacle!
            if (hasShield) {
              setHasShield(false);
              audio.playShield();
              addFloatingText('🛡️ KHIÊN BẢO VỆ!', fruit.x, fruit.y, '#00BCD4');
            } else {
              audio.playInkSplat();
              voiceGuide.speak(VOICE_LINES.fruitslash.inkCloud, 'high');
              setInkSplattered(true);
              setCombo(0);
              scheduleTimeout(() => setInkSplattered(false), 3000);
            }
            return { ...fruit, isSliced: true };
          }

          // Powerup handling
          if (fruit.type === 'powerup_clock') {
            audio.playSlowMotion();
            setSlowMoTime(6);
            addFloatingText('⏰ CHẬM LẠI 6s', fruit.x, fruit.y, '#00BCD4');
          } else if (fruit.type === 'powerup_magnet') {
            audio.playStarCollectSound();
            setMagnetTime(7);
            addFloatingText('🧲 NAM CHÂM TRÁI CÂY', fruit.x, fruit.y, '#E040FB');
          } else if (fruit.type === 'powerup_double') {
            audio.playStarCollectSound();
            setDoubleScoreTime(8);
            addFloatingText('2️⃣ NHÂN ĐÔI ĐIỂM!', fruit.x, fruit.y, '#FFD700');
          } else {
            audio.playSlash();
            audio.playFruitJuice();
          }

          // Juice burst particles
          spawnJuiceExplosion(fruit.x, fruit.y, FRUIT_CONFIGS[fruit.type].juiceColor);

          // Points
          const basePts = FRUIT_CONFIGS[fruit.type].points;
          const multi = doubleScoreTime > 0 ? 2 : 1;
          const awardedPts = basePts * multi;

          setScore((s) => s + awardedPts);
          setTotalFruitsSliced((c) => c + 1);

          return {
            ...fruit,
            isSliced: true,
            sliceAngle: angle,
            sliceTime: Date.now(),
            leftHalfOffset: { x: -2.5 * Math.cos(angle + Math.PI / 2), y: -2.5 * Math.sin(angle + Math.PI / 2), rot: -15 },
            rightHalfOffset: { x: 2.5 * Math.cos(angle + Math.PI / 2), y: 2.5 * Math.sin(angle + Math.PI / 2), rot: 15 },
          };
        }
        return fruit;
      })
    );

    // Multi-cut combo processing
    if (newlySliced > 1) {
      audio.playCombo();
      if (newlySliced === 2) {
        addFloatingText('🔥 DOUBLE CUT! +20', (x1 + x2) / 2, (y1 + y2) / 2, '#FF9800');
        setScore((s) => s + 20);
        voiceGuide.speak(VOICE_LINES.fruitslash.double, 'low');
      } else if (newlySliced >= 3) {
        addFloatingText(`⚡ TRIPLE COMBO x${newlySliced}! +50`, (x1 + x2) / 2, (y1 + y2) / 2, '#E91E63');
        setScore((s) => s + 50);
        voiceGuide.speak(VOICE_LINES.fruitslash.triple, 'low');
      }
    }

    if (newlySliced > 0) {
      setCombo((c) => {
        const next = c + newlySliced;
        if (next > maxCombo) setMaxCombo(next);
        if (next === 5) {
          voiceGuide.speak(VOICE_LINES.fruitslash.combo5, 'low');
        } else if (next % 6 === 0) {
          voiceGuide.praiseRandom();
        }
        return next;
      });
    }
  };

  const distToSegment = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    const projX = x1 + t * (x2 - x1);
    const projY = y1 + t * (y2 - y1);
    return Math.sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY));
  };

  const spawnJuiceExplosion = (x: number, y: number, color: string) => {
    const newParts: JuiceParticle[] = Array.from({ length: 16 }).map((_, i) => ({
      id: Date.now() + i + Math.random(),
      x,
      y,
      vx: (Math.random() - 0.5) * 35,
      vy: (Math.random() - 0.5) * 35 - 5,
      color,
      size: Math.random() * 8 + 4,
      alpha: 1,
    }));
    setParticles((prev) => [...prev, ...newParts]);
  };

  const addFloatingText = (text: string, x: number, y: number, color: string) => {
    setFloatingTexts((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), text, x, y, color, scale: 1.2, opacity: 1 },
    ]);
  };

  // Start game loop
  const startGame = () => {
    audio.playRoundStartJingle();
    voiceGuide.speak(VOICE_LINES.fruitslash.ready, 'high');
    scheduleTimeout(() => {
      voiceGuide.speak(VOICE_LINES.fruitslash.start, 'high');
    }, 1800);

    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setTotalFruitsSpawned(0);
    setTotalFruitsSliced(0);
    setTimeLeft(60);
    timeLeftRef.current = 60;
    setFruits([]);
    setParticles([]);
    setFloatingTexts([]);
    setRainbowCooldown(0);
    rainbowReadyRef.current = true;
    setHasShield(false);
    setSlowMoTime(0);
    setDoubleScoreTime(0);
    setMagnetTime(0);
    setGameState('playing');
  };

  const scoreRef = useRef<number>(0);
  const timeLeftRef = useRef<number>(60);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  const endGame = () => {
    setGameState('game_over');
    audio.playSuccess();
    voiceGuide.speak(VOICE_LINES.fruitslash.finish, 'high');

    const finalScore = scoreRef.current;
    const starsEarned = Math.max(2, Math.floor(finalScore / 25));
    const diamondsEarned = Math.floor(finalScore / 80);

    onUpdateProgress((prev) => {
      const currentHigh = prev.highScores.fruitslash || 0;
      const newHigh = Math.max(currentHigh, finalScore);
      return {
        ...prev,
        stars: prev.stars + starsEarned,
        diamonds: prev.diamonds + diamondsEarned,
        highScores: { ...prev.highScores, fruitslash: newHigh },
        parentStats: {
          ...prev.parentStats,
          starsEarnedToday: prev.parentStats.starsEarnedToday + starsEarned,
          stagesCompleted: prev.parentStats.stagesCompleted + 1,
        },
      };
    });
  };

  // Timer countdown - starts only once per game session
  useEffect(() => {
    if (gameState !== 'playing' || isPaused) return;

    const timer = setInterval(() => {
      if (workoutMode) {
        // Workout mode is governed externally
        // Powerup timers countdown still ticks down
        setSlowMoTime((s) => Math.max(0, s - 1));
        setDoubleScoreTime((d) => Math.max(0, d - 1));
        setMagnetTime((m) => Math.max(0, m - 1));
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

      // Powerup timers countdown
      setSlowMoTime((s) => Math.max(0, s - 1));
      setDoubleScoreTime((d) => Math.max(0, d - 1));
      setMagnetTime((m) => Math.max(0, m - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, workoutMode, isPaused]);

  // Spawner and physics ticker
  useEffect(() => {
    if (gameState !== 'playing') return;

    let lastTick = performance.now();

    const ticker = (timeNow: number) => {
      if (isPaused) {
        lastTick = timeNow;
        animFrameRef.current = requestAnimationFrame(ticker);
        return;
      }
      const dt = Math.min(0.1, (timeNow - lastTick) / 1000);
      lastTick = timeNow;

      // 1. Spawning
      const spawnInterval = difficulty === 'easy' ? 1800 : difficulty === 'normal' ? 1300 : 900;
      const speedModifier = slowMoTime > 0 ? 0.45 : 1;

      if (timeNow - lastSpawnTime.current > spawnInterval) {
        lastSpawnTime.current = timeNow;
        spawnRandomFruits();
      }

      // 2. Update Fruit Positions & Physics
      setFruits((prev) => {
        return prev
          .map((f) => {
            const gravity = 48 * speedModifier; // % / sec^2

            let currentVx = f.vx * speedModifier;
            let currentVy = (f.vy + gravity * dt) * speedModifier;

            // Magnet effect pulls toward center/hands
            if (magnetTime > 0 && !f.isSliced && f.type !== 'ink_cloud') {
              const targetX = 50;
              currentVx += (targetX - f.x) * 1.5 * dt;
            }

            const nextX = f.x + currentVx * dt;
            const nextY = f.y + currentVy * dt;
            const nextRot = f.rotation + f.vRot * dt * speedModifier;

            return {
              ...f,
              x: nextX,
              y: nextY,
              vy: f.vy + gravity * dt,
              rotation: nextRot,
            };
          })
          .filter((f) => {
            // Keep fruit until it falls below screen or fades out
            if (f.y > 115) {
              if (!f.isSliced && f.type !== 'ink_cloud') {
                // Fruit missed, combo resets
                setCombo(0);
              }
              return false;
            }
            return true;
          });
      });

      // 3. Update Particles
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx * dt,
            y: p.y + p.vy * dt,
            vy: p.vy + 60 * dt, // gravity
            alpha: p.alpha - 1.2 * dt,
          }))
          .filter((p) => p.alpha > 0.05)
      );

      // 4. Update Floating Texts
      setFloatingTexts((prev) =>
        prev
          .map((t) => ({
            ...t,
            y: t.y - 12 * dt,
            opacity: t.opacity - 0.9 * dt,
          }))
          .filter((t) => t.opacity > 0.05)
      );

      // 5. Draw glowing blade trails on canvas
      drawBladeTrails();

      animFrameRef.current = requestAnimationFrame(ticker);
    };

    animFrameRef.current = requestAnimationFrame(ticker);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameState, difficulty, slowMoTime, magnetTime]);

  // Spawns 1 to 3 fruits tossed upwards from the bottom
  const spawnRandomFruits = () => {
    const types: FruitType[] = [
      'watermelon',
      'orange',
      'apple',
      'strawberry',
      'pineapple',
      'kiwi',
      'banana',
      'mango',
    ];

    // Chance for obstacle or powerup
    const count = difficulty === 'easy' ? 1 : Math.random() < 0.4 ? 2 : 1;

    for (let i = 0; i < count; i++) {
      let chosenType: FruitType = types[Math.floor(Math.random() * types.length)];
      const roll = Math.random();
      if (roll < 0.12) {
        chosenType = 'ink_cloud'; // Obstacle
      } else if (roll < 0.16) {
        chosenType = 'powerup_clock';
      } else if (roll < 0.19) {
        chosenType = 'powerup_magnet';
      } else if (roll < 0.22) {
        chosenType = 'powerup_double';
      }

      fruitIdCounter.current++;
      const spawnX = Math.random() * 60 + 20; // 20% to 80%
      const vx = (50 - spawnX) * 0.4 + (Math.random() - 0.5) * 15;
      const vy = -(Math.random() * 12 + 65); // Toss upwards

      setFruits((prev) => [
        ...prev,
        {
          id: `fruit_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
          type: chosenType,
          x: spawnX,
          y: 105,
          vx,
          vy,
          radius: chosenType === 'ink_cloud' ? 6.5 : 5.5,
          rotation: Math.random() * 360,
          vRot: (Math.random() - 0.5) * 200,
          isSliced: false,
        },
      ]);
      setTotalFruitsSpawned((s) => s + 1);
    }
  };

  // Render blade trails on HTML5 canvas
  const drawBladeTrails = () => {
    const canvas = canvasTrailRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const renderTrail = (trail: { x: number; y: number; time: number }[], strokeColor: string, glowColor: string) => {
      if (trail.length < 2) return;
      ctx.save();
      ctx.beginPath();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let i = 0; i < trail.length - 1; i++) {
        const pt1 = trail[i];
        const pt2 = trail[i + 1];
        const alpha = (i + 1) / trail.length;

        ctx.strokeStyle = strokeColor;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 15;
        ctx.lineWidth = alpha * 12 + 2;

        const x1 = (pt1.x / 100) * canvas.width;
        const y1 = (pt1.y / 100) * canvas.height;
        const x2 = (pt2.x / 100) * canvas.width;
        const y2 = (pt2.y / 100) * canvas.height;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.restore();
    };

    renderTrail(leftBladeTrail.current, 'rgba(0, 229, 255, 0.95)', '#00E5FF'); // Cyan left blade
    renderTrail(rightBladeTrail.current, 'rgba(255, 64, 129, 0.95)', '#FF4081'); // Pink right blade
  };

  // Mouse/touch slash support (active when in Touch Mode or explicitly enabled)
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!containerRef.current || gameState !== 'playing') return;
    if (trackingMode !== 'keyboard_only' && isStreaming) return; // Prevent pointer overriding camera mode
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    updateBlade('right', x, y);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!containerRef.current || gameState !== 'playing') return;
    if (trackingMode !== 'keyboard_only' && isStreaming) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    updateBlade('right', x, y);
  };

  return (
    <div
      ref={containerRef}
      id="fruit-slash-game"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      className="relative w-full max-w-4xl h-[92dvh] max-h-[calc(100dvh-32px)] landscape:max-h-[calc(100dvh-16px)] md:h-[600px] bg-gradient-to-b from-amber-50 via-orange-50 to-pink-100 rounded-3xl overflow-hidden border-4 border-orange-300 shadow-2xl flex flex-col justify-between select-none touch-none cursor-crosshair"
    >
      {/* Blade Trail Canvas Layer */}
      <canvas
        ref={canvasTrailRef}
        width={800}
        height={600}
        className="absolute inset-0 w-full h-full pointer-events-none z-20"
      />

      {/* Top Header HUD */}
      <header className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-md border-b-2 border-orange-200 z-30">
        {!workoutMode && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 font-black text-xs rounded-full transition shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            Menu Chính
          </button>
        )}

        <div className="flex items-center gap-2">
          <span className="text-2xl">🍉</span>
          <h2 className="text-lg md:text-xl font-black text-orange-600">Chém Trái Cây</h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Rainbow Skill Button */}
          <button
            onClick={triggerRainbowSlash}
            disabled={rainbowCooldown > 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-black text-xs transition shadow-md ${
              rainbowCooldown === 0
                ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white animate-pulse cursor-pointer hover:scale-105'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {rainbowCooldown === 0 ? 'Cầu Vồng (Bắt Chéo Tay)' : `${Math.ceil(rainbowCooldown / 10)}s`}
          </button>

          {/* Time Left */}
          <div className="flex items-center gap-1.5 bg-orange-500 text-white px-3 py-1.5 rounded-full font-black text-xs shadow-sm">
            <Clock className="w-3.5 h-3.5" />
            {workoutMode ? "Vận Động" : `${timeLeft}s`}
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      {gameState === 'playing' && (
        <div className="flex items-center justify-between px-6 py-2 bg-orange-50/90 text-xs font-black text-orange-950 z-20">
          <div className="flex items-center gap-4">
            <span className="text-base font-extrabold text-orange-600">Điểm: {score}</span>
            {combo > 1 && (
              <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-2.5 py-0.5 rounded-full animate-bounce">
                COMBO x{combo}!
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {slowMoTime > 0 && <span className="bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full">⏰ Chậm ({slowMoTime}s)</span>}
            {doubleScoreTime > 0 && <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">2️⃣ x2 Điểm ({doubleScoreTime}s)</span>}
            {magnetTime > 0 && <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">🧲 Nam Châm ({magnetTime}s)</span>}
            <span className="text-slate-500">
              Độ chính xác: {totalFruitsSpawned > 0 ? Math.round((totalFruitsSliced / totalFruitsSpawned) * 100) : 100}%
            </span>
          </div>
        </div>
      )}

      {/* Ink Cloud Splatter Overlay Effect */}
      {inkSplattered && (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center z-40 transition-all duration-300">
          <div className="text-6xl animate-bounce mb-2">☁️</div>
          <h3 className="text-2xl font-black text-white drop-shadow-md">Ối! Mây Đen Che Khuất Rồi!</h3>
          <p className="text-slate-200 text-xs font-bold mt-1">Cẩn thận đừng chém vào quả mây đen nhé!</p>
        </div>
      )}

      {/* Main Game Stage */}
      <div className="relative flex-1 w-full overflow-hidden">
        {/* Intro View */}
        {gameState === 'intro' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-white/95 backdrop-blur-sm z-30 text-center">
            <div className="text-6xl mb-3 animate-bounce">🍉🍊🍓</div>
            <h2 className="text-3xl font-black text-orange-600">Chém Trái Cây Tươi Vui</h2>
            <p className="text-slate-600 text-sm max-w-md mt-2 leading-relaxed">
              Bé hãy vung hai cánh tay trước camera thật nhanh như một kiếm sĩ hoa quả!
              Chém trúng nhiều trái cây cùng lúc để đạt chuỗi Combo siêu to khổng lồ.
            </p>

            <div className="grid grid-cols-3 gap-3 my-5 max-w-md w-full text-xs">
              <div className="bg-orange-50 p-3 rounded-2xl border border-orange-200">
                <span className="text-xl">🫲 🫱</span>
                <p className="font-bold text-orange-800 mt-1">Hai Tay Cùng Chém</p>
                <p className="text-[10px] text-slate-500">Vung tay thật nhanh</p>
              </div>
              <div className="bg-pink-50 p-3 rounded-2xl border border-pink-200">
                <span className="text-xl">🌈</span>
                <p className="font-bold text-pink-800 mt-1">Bắt Chéo Hai Tay</p>
                <p className="text-[10px] text-slate-500">Kỹ năng Cầu Vồng</p>
              </div>
              <div className="bg-slate-100 p-3 rounded-2xl border border-slate-300">
                <span className="text-xl">☁️</span>
                <p className="font-bold text-slate-700 mt-1">Né Mây Đen</p>
                <p className="text-[10px] text-slate-500">Đừng chém mây nhé!</p>
              </div>
            </div>

            {/* Difficulty Selector */}
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xs font-bold text-slate-500">Độ khó:</span>
              {(['easy', 'normal', 'fast'] as GameDifficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase transition ${
                    difficulty === d
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                  }`}
                >
                  {d === 'easy' ? 'Dễ' : d === 'normal' ? 'Vừa' : 'Nhanh'}
                </button>
              ))}
            </div>

            <button
              onClick={startGame}
              className="px-8 py-3 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-black text-sm rounded-full shadow-lg transform hover:scale-105 transition"
            >
              BẮT ĐẦU CHƠI NGAY!
            </button>
          </div>
        )}

        {/* Game Over View */}
        {gameState === 'game_over' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-white/95 backdrop-blur-sm z-30 text-center">
            <Award className="w-20 h-20 text-yellow-500 animate-bounce mb-2" />
            <h2 className="text-3xl font-black text-orange-600">Tuyệt Vời Lắm Kiếm Sĩ!</h2>
            <p className="text-slate-500 text-xs font-bold mt-1">Bé đã vung tay chém trái cây siêu nhanh nhẹn!</p>

            <div className="grid grid-cols-3 gap-3 my-6 max-w-md w-full">
              <div className="bg-orange-50 p-4 rounded-2xl border border-orange-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Tổng Điểm</span>
                <p className="text-3xl font-black text-orange-600">{score}</p>
              </div>
              <div className="bg-pink-50 p-4 rounded-2xl border border-pink-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Max Combo</span>
                <p className="text-3xl font-black text-pink-600">x{maxCombo}</p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Trái Đã Chém</span>
                <p className="text-3xl font-black text-emerald-600">{totalFruitsSliced}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={startGame}
                className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-full shadow-md transition"
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

        {/* Active Fruits Rendering */}
        {fruits.map((f) => {
          const cfg = FRUIT_CONFIGS[f.type];
          if (!f.isSliced) {
            return (
              <div
                key={f.id}
                className="absolute flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 select-none"
                style={{
                  left: `${f.x}%`,
                  top: `${f.y}%`,
                  transform: `translate(-50%, -50%) rotate(${f.rotation}deg)`,
                }}
              >
                <div className="relative">
                  <span className="text-5xl filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.15)]">
                    {cfg.emoji}
                  </span>
                </div>
              </div>
            );
          } else {
            // Sliced in two halves
            return (
              <div
                key={f.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none"
                style={{ left: `${f.x}%`, top: `${f.y}%` }}
              >
                {/* Left half */}
                <div
                  className="absolute text-4xl transform transition-all duration-300 opacity-80"
                  style={{
                    transform: `translate(${f.leftHalfOffset?.x || -3}px, ${f.leftHalfOffset?.y || -2}px) rotate(${f.leftHalfOffset?.rot || -20}deg)`,
                  }}
                >
                  {cfg.emoji}
                </div>
                {/* Right half */}
                <div
                  className="absolute text-4xl transform transition-all duration-300 opacity-80"
                  style={{
                    transform: `translate(${f.rightHalfOffset?.x || 3}px, ${f.rightHalfOffset?.y || 2}px) rotate(${f.rightHalfOffset?.rot || 20}deg)`,
                  }}
                >
                  {cfg.emoji}
                </div>
              </div>
            );
          }
        })}

        {/* Juice Splash Particles */}
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
              transform: 'translate(-50%, -50%)',
              boxShadow: `0 0 8px ${p.color}`,
            }}
          />
        ))}

        {/* Floating Text Notifications */}
        {floatingTexts.map((t) => (
          <div
            key={t.id}
            className="absolute font-black text-sm md:text-base pointer-events-none transform -translate-x-1/2 -translate-y-1/2 transition-all"
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

      {/* Bottom Guidance Prompt */}
      <footer className="p-3 bg-white/70 backdrop-blur-md border-t border-orange-200 text-center text-xs font-bold text-orange-800 z-30">
        Vung tay trái hoặc tay phải qua trái cây để chém! Bắt chéo 2 tay để kích hoạt Cầu Vồng 🌈
      </footer>
    </div>
  );
}
