/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useManagedTimeout } from '../hooks/useManagedTimeout';
import {
  Sparkles,
  ArrowLeft,
  RotateCcw,
  Award,
  Clock,
  Settings,
  Bug,
  Hand,
  Shield,
  Zap,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { PlayerProgress, GameGesture, GameDifficulty } from '../types';
import { audio } from '../lib/AudioEngine';
import { voiceGuide } from '../lib/VoiceGuideService';
import { VOICE_LINES } from '../lib/voiceLines.vi';
import { poseDetector } from '../utils/poseDetector';
import { mapWristToGame } from '../utils/poseUtils';
import { useCameraPose } from '../providers/CameraPoseContext';

interface ChickenBlasterGameProps {
  progress: PlayerProgress;
  onUpdateProgress: (updater: (prev: PlayerProgress) => PlayerProgress) => void;
  gesture: GameGesture;
  onBack: () => void;
  workoutMode?: boolean;
  isPaused?: boolean;
}

export type ChickenType = 'normal' | 'fast' | 'hat' | 'golden' | 'giant_boss';
export type PowerUpType = 'slow_time' | 'big_bubble' | 'double_score' | 'rainbow_bubble';

interface ActiveChicken {
  id: string;
  type: ChickenType;
  x: number; // 0-100%
  y: number; // 0-100%
  vx: number; // speed %
  targetY: number;
  health: number;
  maxHealth: number;
  captured: boolean;
  bubbleY?: number;
  bubbleOpacity?: number;
  eggTimer?: number;
  nextEggTime?: number;
}

interface ActivePowerUpItem {
  id: string;
  type: PowerUpType;
  x: number;
  y: number;
  vy: number;
}

interface EggProjectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
}

interface BubbleProjectile {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  targetChickenId: string;
  scale: number;
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

export default function ChickenBlasterGame({
  progress,
  onUpdateProgress,
  gesture,
  onBack,
  workoutMode = false,
  isPaused = false,
}: ChickenBlasterGameProps) {
  const scheduleTimeout = useManagedTimeout();
  const { isStreaming, poseStatus } = useCameraPose();

  // Game state
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'boss_fight' | 'game_over'>(() => workoutMode ? 'playing' : 'intro');
  const [difficulty, setDifficulty] = useState<GameDifficulty>('normal');
  const [controlHand, setControlHand] = useState<'right' | 'left'>('right');
  const [controlMode, setControlMode] = useState<'camera' | 'touch'>('camera');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [debugMode, setDebugMode] = useState<boolean>(false);

  // Stats
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [rescuedChickens, setRescuedChickens] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [eggSplattered, setEggSplattered] = useState<boolean>(false);
  const [isPlayerDodging, setIsPlayerDodging] = useState<boolean>(false);

  // Tracking status
  const [isHandDetected, setIsHandDetected] = useState<boolean>(false);
  const [isUsingTouch, setIsUsingTouch] = useState<boolean>(false);
  const [wristRawPos, setWristRawPos] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  const [crosshairFlash, setCrosshairFlash] = useState<'green' | null>(null);
  const lastAutoFireTime = useRef<number>(0);

  // Crosshair & Lock On
  const [crosshairPos, setCrosshairPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [lockedTargetId, setLockedTargetId] = useState<string | null>(null);
  const [lockProgress, setLockProgress] = useState<number>(0); // 0 -> 100%
  const [lockStatusText, setLockStatusText] = useState<'searching' | 'aiming' | 'locked'>('searching');

  // Active Powerups
  const [activePowerUps, setActivePowerUps] = useState<{
    slowTime: number; // remaining duration in ms
    bigBubble: number;
    doubleScore: number;
    rainbowBubble: number;
  }>({ slowTime: 0, bigBubble: 0, doubleScore: 0, rainbowBubble: 0 });

  // Game Entities
  const [chickens, setChickens] = useState<ActiveChicken[]>([]);
  const [powerUpItems, setPowerUpItems] = useState<ActivePowerUpItem[]>([]);
  const [bubbles, setBubbles] = useState<BubbleProjectile[]>([]);
  const [eggs, setEggs] = useState<EggProjectile[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);

  // Refs for animation & high-frequency updates
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const rawAimPos = useRef<{ x: number; y: number }>({ x: 50, y: 50 });
  const smoothedAimPos = useRef<{ x: number; y: number }>({ x: 50, y: 50 });
  const targetChickenIdRef = useRef<string | null>(null);
  const lockProgressRef = useRef<number>(0);
  const lockCooldownUntil = useRef<number>(0);
  const debugTargetDistRef = useRef<number>(0);
  const debugHitRadiusRef = useRef<number>(0);
  const lastShootTime = useRef<number>(0);
  const lastLockBeepTime = useRef<number>(0);
  const lastSpawnTime = useRef<number>(0);
  const chickenCounter = useRef<number>(0);
  const bossSpawnedRef = useRef<boolean>(false);
  const chickensRef = useRef<ActiveChicken[]>([]);
  const powerUpsRef = useRef<ActivePowerUpItem[]>([]);
  const activePowerUpsRef = useRef(activePowerUps);

  useEffect(() => {
    chickensRef.current = chickens;
  }, [chickens]);

  useEffect(() => {
    powerUpsRef.current = powerUpItems;
  }, [powerUpItems]);

  useEffect(() => {
    activePowerUpsRef.current = activePowerUps;
  }, [activePowerUps]);

  // Safety reminder
  useEffect(() => {
    voiceGuide.speak(VOICE_LINES.safety.warmup, 'medium');
  }, []);

  // MediaPipe Pose & Wrist Tracker
  useEffect(() => {
    const handlePoseResults = (res: any) => {
      if (isPaused) return;
      if (gameState !== 'playing' && gameState !== 'boss_fight') return;

      if (res.status === 'running') {
        if (controlMode === 'camera') {
          const targetWrist = controlHand === 'right' ? res.rightWrist : res.leftWrist;
          const mapped = mapWristToGame(targetWrist, { confidenceThreshold: 0.45, minX: 5, maxX: 95, minY: 10, maxY: 90 });

          if (mapped.visible) {
            setIsHandDetected(true);
            setIsUsingTouch(false);
            setWristRawPos({ x: mapped.rawX, y: mapped.rawY });
            rawAimPos.current = { x: mapped.gameX, y: mapped.gameY };
          } else {
            setIsHandDetected(false);
          }
        }
      } else {
        if (controlMode === 'camera') {
          setIsHandDetected(false);
        }
      }

      // Check dodge gesture (duck, tilt_left, tilt_right, jump)
      if (
        res.gesture === 'duck' ||
        res.gesture === 'tilt_left' ||
        res.gesture === 'tilt_right' ||
        res.gesture === 'jump'
      ) {
        setIsPlayerDodging(true);
      } else {
        setIsPlayerDodging(false);
      }
    };

    const unsub = poseDetector.addListener(handlePoseResults);
    return () => {
      unsub();
    };
  }, [controlHand, controlMode, isPaused, gameState]);

  // Calculate Hitbox Radius based on difficulty & powerup (Refined sizes)
  const getHitboxRadius = (c: ActiveChicken, diff: GameDifficulty, hasBigBubble: boolean) => {
    let baseRadius = diff === 'easy' ? 9.5 : diff === 'normal' ? 7.5 : 5.5; // percentage of screen
    let sizeMult = 1.0;
    if (c.type === 'giant_boss') sizeMult = 1.6;
    else if (c.type === 'hat') sizeMult = 1.1;
    else if (c.type === 'golden' || c.type === 'fast') sizeMult = 0.9;

    let radius = baseRadius * sizeMult;
    if (hasBigBubble) radius *= 1.2;
    return radius;
  };

  const addFloatingText = (text: string, x: number, y: number, color: string) => {
    setFloatingTexts((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), text, x, y, color, opacity: 1 },
    ]);
  };

  // Trigger firing ONE bubble targeting specific coordinates
  const shootBubble = useCallback(
    (targetX: number, targetY: number) => {
      audio.playBubbleShoot();

      setBubbles((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          x: 50, // Shoot from bottom center
          y: 92,
          targetX,
          targetY,
          targetChickenId: '',
          scale: 0.5,
          alpha: 1,
        },
      ]);

      const hasBigBubble = activePowerUpsRef.current.bigBubble > 0;
      const isDoubleScore = activePowerUpsRef.current.doubleScore > 0;

      // Find the closest active chicken that is hit by our crosshair
      let hitChicken: ActiveChicken | null = null;
      let closestDist = Infinity;

      chickensRef.current.forEach((c) => {
        if (!c.captured) {
          const dist = Math.hypot(c.x - targetX, c.y - targetY);
          const radius = getHitboxRadius(c, difficulty, hasBigBubble);
          if (dist <= radius && dist < closestDist) {
            closestDist = dist;
            hitChicken = c;
          }
        }
      });

      if (hitChicken) {
        const targetChicken: ActiveChicken = hitChicken;
        setCrosshairFlash('green');
        scheduleTimeout(() => setCrosshairFlash(null), 150);

        setChickens((prev) =>
          prev.map((c) => {
            if (c.id !== targetChicken.id || c.captured) return c;

            const nextHealth = c.health - 1;
            if (nextHealth <= 0) {
              // Captured!
              audio.playBubbleCapture();
              audio.playChickenCluck();

              let basePts =
                c.type === 'giant_boss' ? 200 : c.type === 'golden' ? 50 : c.type === 'hat' ? 25 : 10;
              if (isDoubleScore) basePts *= 2;

              setScore((s) => s + basePts);
              setRescuedChickens((r) => r + 1);

              setCombo((cb) => {
                const n = cb + 1;
                if (n > maxCombo) setMaxCombo(n);
                if (n === 5) voiceGuide.speak(VOICE_LINES.chickenblaster.highCombo, 'high');
                return n;
              });

              if (c.type === 'golden') {
                audio.playDiamond();
                addFloatingText(`👑 GÀ VÀNG! +${basePts} 💎`, c.x, c.y, '#FFD700');
                voiceGuide.speak(VOICE_LINES.chickenblaster.goldenChicken, 'high');
              } else if (c.type === 'giant_boss') {
                audio.playSuccess();
                addFloatingText(`🌟 BOSS VỀ CHUỒNG! +${basePts}`, c.x, c.y, '#FF4081');
                voiceGuide.praiseRandom();
              } else {
                addFloatingText(`🫧 BẮT THÀNH CÔNG! +${basePts}`, c.x, c.y, '#00E5FF');
              }

              // Spawn powerup occasionally on capture
              if (Math.random() < 0.25 && c.type !== 'giant_boss') {
                spawnPowerUpItem(c.x, c.y);
              }

              return {
                ...c,
                health: 0,
                captured: true,
                bubbleY: c.y,
                bubbleOpacity: 1,
              };
            } else {
              // Damaged hat or boss
              audio.playPetCareAction();
              addFloatingText('TRÚNG MỤC TIÊU! 🫧', c.x, c.y, '#FFEE58');
              return { ...c, health: nextHealth };
            }
          })
        );
      }
    },
    [difficulty, maxCombo]
  );

  const spawnPowerUpItem = (x: number, y: number) => {
    const types: PowerUpType[] = ['slow_time', 'big_bubble', 'double_score', 'rainbow_bubble'];
    const chosen = types[Math.floor(Math.random() * types.length)];
    setPowerUpItems((prev) => [
      ...prev,
      { id: `pow_${Date.now()}_${Math.random()}`, type: chosen, x, y, vy: 10 },
    ]);
  };

  const collectPowerUp = (type: PowerUpType, x: number, y: number) => {
    audio.playStarCollectSound();
    let label = '';
    let duration = 7000;

    setActivePowerUps((prev) => {
      const next = { ...prev };
      if (type === 'slow_time') {
        next.slowTime = duration;
        label = '⏱️ CHẬM THỜI GIAN!';
      } else if (type === 'big_bubble') {
        next.bigBubble = duration;
        label = '🫧 BONG BÓNG KHỔNG LỒ!';
      } else if (type === 'double_score') {
        next.doubleScore = duration;
        label = '⭐️ X2 ĐIỂM SỐ!';
      } else if (type === 'rainbow_bubble') {
        next.rainbowBubble = duration;
        label = '🌈 BẮN SIÊU TỐC!';
      }
      return next;
    });

    addFloatingText(label, x, y, '#A855F7');
  };

  const startGame = () => {
    audio.playRoundStartJingle();
    voiceGuide.speak(VOICE_LINES.chickenblaster.start, 'high');

    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setRescuedChickens(0);
    timeLeftRef.current = 60;
    setTimeLeft(60);
    setChickens([]);
    setPowerUpItems([]);
    setBubbles([]);
    setEggs([]);
    setFloatingTexts([]);
    setLockedTargetId(null);
    setLockProgress(0);
    bossSpawnedRef.current = false;
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
    voiceGuide.speak(VOICE_LINES.chickenblaster.finish, 'high');

    const finalScore = scoreRef.current;
    const starsEarned = Math.max(2, Math.floor(finalScore / 25));
    const diamondsEarned = Math.floor(finalScore / 80);

    onUpdateProgress((prev) => {
      const currentHigh = prev.highScores.chickenblaster || 0;
      const newHigh = Math.max(currentHigh, finalScore);
      return {
        ...prev,
        stars: prev.stars + starsEarned,
        diamonds: prev.diamonds + diamondsEarned,
        highScores: { ...prev.highScores, chickenblaster: newHigh },
        parentStats: {
          ...prev.parentStats,
          starsEarnedToday: prev.parentStats.starsEarnedToday + starsEarned,
          stagesCompleted: prev.parentStats.stagesCompleted + 1,
        },
      };
    });
  };

  // Countdown timer
  useEffect(() => {
    if ((gameState !== 'playing' && gameState !== 'boss_fight') || isPaused) return;

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

      // Spawn Boss when 22s remaining
      if (nextTime === 22 && !bossSpawnedRef.current) {
        bossSpawnedRef.current = true;
        setGameState('boss_fight');
        voiceGuide.speak(VOICE_LINES.chickenblaster.giantBoss, 'high');
        spawnGiantBoss();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, workoutMode, isPaused]);

  const spawnGiantBoss = () => {
    setChickens((prev) => [
      ...prev,
      {
        id: 'giant_boss',
        type: 'giant_boss',
        x: 50,
        y: 35,
        vx: 8,
        targetY: 35,
        health: 6,
        maxHealth: 6,
        captured: false,
        eggTimer: 1800,
        nextEggTime: Date.now() + 1000 + Math.random() * 1000,
      },
    ]);
  };

  const spawnChicken = () => {
    chickenCounter.current++;
    const roll = Math.random();
    let type: ChickenType = 'normal';
    let health = 1;
    let speed = 12;

    if (roll < 0.15) {
      type = 'golden';
      speed = 22;
    } else if (roll < 0.35) {
      type = 'fast';
      speed = 28;
    } else if (roll < 0.55) {
      type = 'hat';
      health = 2;
      speed = 10;
    }

    const spawnLeft = Math.random() < 0.5;
    const x = spawnLeft ? 10 : 90;
    const vx = spawnLeft ? speed : -speed;
    const y = Math.random() * 35 + 25; // 25% to 60% height

    setChickens((prev) => [
      ...prev,
      {
        id: `chicken_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
        type,
        x,
        y,
        vx,
        targetY: y,
        health,
        maxHealth: health,
        captured: false,
        nextEggTime: Date.now() + 2500 + Math.random() * 2500,
      },
    ]);
  };

  const spawnEgg = (fromX: number, fromY: number) => {
    setEggs((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        x: fromX,
        y: fromY,
        vx: (50 - fromX) * 0.25,
        vy: 42,
        rotation: 0,
      },
    ]);
  };

  // Main game physics & animation loop
  useEffect(() => {
    if (gameState !== 'playing' && gameState !== 'boss_fight') return;

    let lastTick = performance.now();

    const ticker = (timeNow: number) => {
      if (isPaused) {
        lastTick = timeNow;
        animFrameRef.current = requestAnimationFrame(ticker);
        return;
      }
      const dt = Math.min(0.1, (timeNow - lastTick) / 1000);
      lastTick = timeNow;

      // 1. Update active power-up timers
      setActivePowerUps((prev) => {
        const ms = dt * 1000;
        return {
          slowTime: Math.max(0, prev.slowTime - ms),
          bigBubble: Math.max(0, prev.bigBubble - ms),
          doubleScore: Math.max(0, prev.doubleScore - ms),
          rainbowBubble: Math.max(0, prev.rainbowBubble - ms),
        };
      });

      // 2. Crosshair Smoothing (Responsive bám tay, alpha = 0.4)
      const dx = rawAimPos.current.x - smoothedAimPos.current.x;
      const dy = rawAimPos.current.y - smoothedAimPos.current.y;
      const moveDist = Math.hypot(dx, dy);

      if (moveDist > 0.05) {
        const factor = 0.4;
        smoothedAimPos.current.x += dx * factor;
        smoothedAimPos.current.y += dy * factor;
      }

      // 3. AUTO-FIRE SYSTEM (Aim -> Shoot every 350ms)
      const hasBigBubble = activePowerUpsRef.current.bigBubble > 0;

      // Check powerup item under crosshair
      const targetPowerUp = powerUpsRef.current.find((pow) => {
        const dist = Math.hypot(pow.x - smoothedAimPos.current.x, pow.y - smoothedAimPos.current.y);
        return dist < 8;
      });

      if (targetPowerUp) {
        collectPowerUp(targetPowerUp.type, targetPowerUp.x, targetPowerUp.y);
        setPowerUpItems((prev) => prev.filter((p) => p.id !== targetPowerUp.id));
      }

      const isInputActive = controlMode === 'camera'
        ? (isHandDetected && isStreaming && poseStatus === 'running')
        : true;

      let finalAimX = smoothedAimPos.current.x;
      let finalAimY = smoothedAimPos.current.y;

      // Evaluate proximity to closest chicken
      let isNearChicken = false;
      let closestChickenCenter: { x: number; y: number } | null = null;
      let closestChickenDist = Infinity;

      chickensRef.current.forEach((c) => {
        if (!c.captured) {
          const dist = Math.hypot(c.x - smoothedAimPos.current.x, c.y - smoothedAimPos.current.y);
          const radius = getHitboxRadius(c, difficulty, hasBigBubble);
          if (dist <= radius) {
            isNearChicken = true;
          }
          if (dist < closestChickenDist) {
            closestChickenDist = dist;
            closestChickenCenter = { x: c.x, y: c.y };
          }
        }
      });

      // Easy/Normal Aim Assist (Section XIV)
      if (difficulty === 'easy' || difficulty === 'normal') {
        const pullRadius = difficulty === 'easy' ? 12 : 6;
        if (closestChickenCenter && closestChickenDist < pullRadius) {
          const pullFactor = difficulty === 'easy' ? 0.35 : 0.15;
          finalAimX += (closestChickenCenter.x - finalAimX) * pullFactor;
          finalAimY += (closestChickenCenter.y - finalAimY) * pullFactor;
          isNearChicken = true;
        }
      }

      // Auto-fire rate: 1 bubble every 350ms, or 180ms with rainbow bubble! (Section X)
      const hasRainbow = activePowerUpsRef.current.rainbowBubble > 0;
      const fireInterval = hasRainbow ? 180 : 350;
      if (isInputActive && timeNow - lastAutoFireTime.current >= fireInterval && (gameState === 'playing' || gameState === 'boss_fight')) {
        lastAutoFireTime.current = timeNow;
        shootBubble(finalAimX, finalAimY);
      }

      // Sync high-frequency state to React UI
      setCrosshairPos({ x: finalAimX, y: finalAimY });
      setLockProgress(0); // Lock progress not needed anymore
      if (isInputActive) {
        setLockStatusText(isNearChicken ? 'locked' : 'searching'); // yellow if near, white otherwise
      } else {
        setLockStatusText('searching');
      }

      // 4. Spawn regular chickens
      const isSlowTime = activePowerUpsRef.current.slowTime > 0;
      const baseSpawnInterval = difficulty === 'easy' ? 2200 : difficulty === 'normal' ? 1600 : 1100;
      const spawnInterval = isSlowTime ? baseSpawnInterval * 1.5 : baseSpawnInterval;

      if (timeNow - lastSpawnTime.current > spawnInterval && gameState === 'playing') {
        lastSpawnTime.current = timeNow;
        spawnChicken();
      }

      // 5. Update Chickens position & behavior
      const speedMultiplier = isSlowTime ? 0.4 : 1.0;

      setChickens((prev) =>
        prev
          .map((c) => {
            if (c.captured) {
              // Floating up happily in a bubble
              const nextY = (c.bubbleY || c.y) - 32 * dt;
              return {
                ...c,
                bubbleY: nextY,
                bubbleOpacity: (c.bubbleOpacity || 1) - 0.4 * dt,
              };
            }

            let nextX = c.x + c.vx * speedMultiplier * dt;
            let nextVx = c.vx;

            // Bounce on screen edges
            if (nextX < 10) {
              nextX = 10;
              nextVx = Math.abs(c.vx);
            } else if (nextX > 90) {
              nextX = 90;
              nextVx = -Math.abs(c.vx);
            }

            // Frame-independent timestamp egg throwing (Section XVII)
            if (!c.captured && (c.type === 'giant_boss' || c.type === 'hat')) {
              const eggTime = c.nextEggTime || 0;
              if (Date.now() >= eggTime) {
                spawnEgg(c.x, c.y);
                voiceGuide.speak(VOICE_LINES.chickenblaster.dodgeEgg, 'high');
                const cd = c.type === 'giant_boss'
                  ? 1000 + Math.random() * 1000
                  : 2500 + Math.random() * 2500;
                c.nextEggTime = Date.now() + cd;
              }
            }

            return {
              ...c,
              x: nextX,
              vx: nextVx,
            };
          })
          .filter((c) => {
            if (c.captured && (c.bubbleY || 0) < -10) return false;
            return true;
          })
      );

      // 6. Update Powerup floating items
      setPowerUpItems((prev) =>
        prev
          .map((p) => ({ ...p, y: p.y + p.vy * dt }))
          .filter((p) => p.y < 95)
      );

      // 7. Update Flying Bubbles
      setBubbles((prev) =>
        prev
          .map((b) => {
            const nextX = b.x + (b.targetX - b.x) * 9 * dt;
            const nextY = b.y + (b.targetY - b.y) * 9 * dt;
            return {
              ...b,
              x: nextX,
              y: nextY,
              scale: Math.min(1.3, b.scale + 1.4 * dt),
              alpha: b.alpha - 0.8 * dt,
            };
          })
          .filter((b) => b.alpha > 0.05)
      );

      // 8. Update Flying Eggs & Dodge Detection
      setEggs((prev) =>
        prev
          .map((egg) => {
            const nextY = egg.y + egg.vy * dt;
            const nextX = egg.x + egg.vx * dt;

            // When egg reaches player height
            if (nextY > 80 && nextY < 95 && Math.abs(nextX - 50) < 30) {
              if (isPlayerDodging) {
                // Successfully dodged egg!
                audio.playPowerup();
                addFloatingText('NÉ THÀNH CÔNG! ✨', 50, 78, '#4CAF50');
                return { ...egg, y: 150 }; // remove
              } else {
                // Hit by egg!
                audio.playEggSplat();
                setEggSplattered(true);
                setCombo(0); // Reset combo
                setScore((s) => Math.max(0, s - 5)); // Small deduction, non-violent
                scheduleTimeout(() => setEggSplattered(false), 1800);
                return { ...egg, y: 150 }; // remove
              }
            }

            return {
              ...egg,
              x: nextX,
              y: nextY,
              rotation: egg.rotation + 200 * dt,
            };
          })
          .filter((egg) => egg.y < 120)
      );

      // 9. Update Floating Texts
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
  }, [gameState, difficulty, isPlayerDodging, isHandDetected, shootBubble]);

  // Touch Pointer Fallback handler
  const handlePointerMove = (e: React.PointerEvent) => {
    // STRICT RULE: In camera mode, pointer events NEVER alter aim crosshair!
    if (controlMode === 'camera') return;

    if (!containerRef.current || (gameState !== 'playing' && gameState !== 'boss_fight')) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(10, Math.min(90, ((e.clientY - rect.top) / rect.height) * 100));

    setIsUsingTouch(true);
    setIsHandDetected(true);
    rawAimPos.current = { x, y };
  };

  return (
    <div
      ref={containerRef}
      id="chicken-blaster-game"
      onPointerMove={handlePointerMove}
      className="relative w-full max-w-4xl h-[92dvh] max-h-[calc(100dvh-32px)] landscape:max-h-[calc(100dvh-16px)] md:h-[600px] bg-gradient-to-b from-sky-200 via-amber-100 to-emerald-200 rounded-3xl overflow-hidden border-4 border-amber-300 shadow-2xl flex flex-col justify-between select-none touch-none"
    >
      {/* Cartoon Farm Background */}
      <div className="absolute inset-0 pointer-events-none opacity-25">
        <div className="absolute top-10 left-8 text-6xl">🏡</div>
        <div className="absolute top-6 right-12 text-6xl">🌾</div>
        <div className="absolute bottom-10 left-1/4 text-5xl">🌻</div>
        <div className="absolute bottom-8 right-1/4 text-5xl">🚜</div>
      </div>

      {/* Header HUD */}
      <header className="flex items-center justify-between p-3.5 bg-white/85 backdrop-blur-md border-b-2 border-amber-200 z-30">
        {!workoutMode && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 font-black text-xs rounded-full transition shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            Menu Chính
          </button>
        )}

        <div className="flex items-center gap-2">
          <span className="text-2xl">🐔</span>
          <h2 className="text-lg font-black text-amber-800">Gà Tinh Nghịch</h2>

          {/* Control Mode Badge */}
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
              controlMode === 'touch' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {controlMode === 'touch'
              ? '👇 Điều khiển cảm ứng'
              : `📸 Camera (${controlHand === 'right' ? 'Tay phải' : 'Tay trái'})`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Dodge Status */}
          <div
            className={`px-3 py-1 rounded-full text-xs font-black transition ${
              isPlayerDodging ? 'bg-emerald-500 text-white animate-pulse' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {isPlayerDodging ? 'ĐANG NÉ TRỨNG! 🛡️' : 'ĐỨNG BẮN'}
          </div>

          {/* Timer */}
          <div className="flex items-center gap-1 bg-amber-500 text-white px-3 py-1 rounded-full font-black text-xs shadow-xs">
            <Clock className="w-3.5 h-3.5" />
            {workoutMode ? "Vận Động" : `${timeLeft}s`}
          </div>

          {/* Settings & Dev Debug Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 bg-amber-100 text-amber-800 hover:bg-amber-200 rounded-full transition"
            title="Cài đặt game"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Settings Modal / Bottom Sheet */}
      {showSettings && (
        <>
          {/* Backdrop on mobile for the Bottom Sheet */}
          <div
            className="md:hidden fixed inset-0 bg-black/40 z-[99]"
            onClick={() => setShowSettings(false)}
          />
          <div className="fixed md:absolute bottom-0 md:bottom-auto md:top-16 inset-x-0 md:inset-x-auto md:right-4 p-6 md:p-4 bg-white/95 backdrop-blur-md rounded-t-3xl md:rounded-2xl border-t-4 md:border border-amber-300 shadow-2xl md:shadow-xl z-[100] md:z-50 text-xs text-amber-950 flex flex-col gap-3 w-full md:w-64 max-h-[85vh] md:max-h-none overflow-y-auto">
            {/* Grab bar on mobile */}
            <div className="md:hidden w-12 h-1.5 bg-amber-200 rounded-full mx-auto mb-2" />

            <div className="flex justify-between items-center border-b pb-1">
              <h4 className="font-black text-sm text-amber-800">Cài Đặt Game</h4>
              <button
                onClick={() => setShowSettings(false)}
                className="md:hidden text-slate-400 hover:text-slate-600 font-extrabold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Control Mode Switcher */}
            <div>
              <label className="font-bold text-slate-600 block mb-1">Chế độ điều khiển:</label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  onClick={() => { setControlMode('camera'); setIsHandDetected(false); }}
                  className={`py-1.5 rounded-xl font-black transition ${
                    controlMode === 'camera'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  📸 Camera
                </button>
                <button
                  onClick={() => { setControlMode('touch'); setIsHandDetected(true); }}
                  className={`py-1.5 rounded-xl font-black transition ${
                    controlMode === 'touch'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  👇 Cảm ứng
                </button>
              </div>
            </div>

            {/* Control Hand Choice */}
            {controlMode === 'camera' && (
              <div>
                <label className="font-bold text-slate-600 block mb-1">Tay điều khiển camera:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setControlHand('right')}
                    className={`py-1.5 rounded-xl font-black transition ${
                      controlHand === 'right'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    🖐️ Tay Phải
                  </button>
                  <button
                    onClick={() => setControlHand('left')}
                    className={`py-1.5 rounded-xl font-black transition ${
                      controlHand === 'left'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    🤚 Tay Trái
                  </button>
                </div>
              </div>
            )}

            {/* Debug Mode */}
            <div className="flex items-center justify-between pt-1 border-t">
              <span className="font-bold text-slate-600">Developer Debug Overlay:</span>
              <button
                onClick={() => setDebugMode(!debugMode)}
                className={`p-1.5 rounded-lg transition ${
                  debugMode ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                <Bug className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="mt-2 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 font-extrabold rounded-xl text-center transition"
            >
              Xong
            </button>
          </div>
        </>
      )}

      {/* Stats Bar */}
      {(gameState === 'playing' || gameState === 'boss_fight') && (
        <div className="flex items-center justify-between px-6 py-2 bg-amber-50/90 text-xs font-black text-amber-950 z-20 border-b border-amber-200/50">
          <div className="flex items-center gap-4">
            <span className="text-base font-extrabold text-amber-800">Điểm: {score}</span>
            {combo > 1 && (
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2.5 py-0.5 rounded-full animate-bounce">
                COMBO x{combo}!
              </span>
            )}
          </div>

          {/* Active Powerup Badges */}
          <div className="flex items-center gap-1.5">
            {activePowerUps.slowTime > 0 && (
              <span className="bg-purple-600 text-white px-2 py-0.5 rounded-full text-[10px] animate-pulse">
                ⏱️ CHẬM
              </span>
            )}
            {activePowerUps.bigBubble > 0 && (
              <span className="bg-cyan-600 text-white px-2 py-0.5 rounded-full text-[10px] animate-pulse">
                🫧 KHỔNG LỒ
              </span>
            )}
            {activePowerUps.doubleScore > 0 && (
              <span className="bg-amber-500 text-white px-2 py-0.5 rounded-full text-[10px] animate-pulse">
                ⭐️ X2 ĐIỂM
              </span>
            )}
            {activePowerUps.rainbowBubble > 0 && (
              <span className="bg-pink-500 text-white px-2 py-0.5 rounded-full text-[10px] animate-pulse">
                🌈 KHÓA TỐC
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-emerald-800">Về chuồng: {rescuedChickens} 🐔</span>
            {gameState === 'boss_fight' && (
              <span className="bg-rose-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                ⚠️ BOSS KHỔNG LỒ!
              </span>
            )}
          </div>
        </div>
      )}

      {/* Missing Hand Warning Overlay */}
      {!isHandDetected && (gameState === 'playing' || gameState === 'boss_fight') && controlMode === 'camera' && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-5 py-2.5 rounded-full shadow-lg z-40 flex items-center gap-3 animate-bounce text-xs font-black">
          <Hand className="w-4 h-4" />
          <span>Mình chưa thấy tay của bạn! Hãy giơ tay {controlHand === 'right' ? 'phải' : 'trái'} lên nhé!</span>
          <button
            onClick={() => setControlMode('touch')}
            className="ml-2 px-2.5 py-1 bg-white text-amber-900 rounded-full text-[10px] hover:bg-amber-100 font-black transition"
          >
            Chuyển Cảm Ứng
          </button>
        </div>
      )}

      {/* Soft Egg Splatter Screen Overlay */}
      {eggSplattered && (
        <div className="absolute inset-0 bg-yellow-200/60 backdrop-blur-xs flex flex-col items-center justify-center z-40 pointer-events-none">
          <div className="text-7xl animate-bounce mb-2">🥚💥</div>
          <h3 className="text-2xl font-black text-amber-900 drop-shadow-md">Trứng Trúng Màn Hình Rồi!</h3>
          <p className="text-amber-800 text-xs font-bold mt-1">Bé nhớ nghiêng người hoặc cúi xuống để né nhé!</p>
        </div>
      )}

      {/* Game Stage Area */}
      <div className="relative flex-1 w-full overflow-hidden">
        {/* Debug Raw Wrist Pointer Marker */}
        {debugMode && isHandDetected && (
          <div
            className="absolute w-5 h-5 rounded-full bg-blue-500 border-2 border-white text-[8px] font-bold text-white flex items-center justify-center pointer-events-none z-30 transform -translate-x-1/2 -translate-y-1/2 shadow-lg"
            style={{ left: `${rawAimPos.current.x}%`, top: `${rawAimPos.current.y}%` }}
            title="WRIST AIM"
          >
            🔵
          </div>
        )}
        {/* Intro Screen */}
        {gameState === 'intro' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-white/95 backdrop-blur-sm z-30 text-center">
            <div className="text-6xl mb-3 animate-bounce">🐔🫧🥚</div>
            <h2 className="text-3xl font-black text-amber-600">Bắt Gà Bằng Bong Bóng</h2>
            <p className="text-slate-600 text-sm max-w-md mt-2 leading-relaxed">
              Di chuyển tay để di chuyển tâm ngắm – Bong bóng sẽ tự động bắn liên tục để đưa các chú gà về chuồng an toàn!
            </p>

            <div className="grid grid-cols-3 gap-3 my-5 max-w-md w-full text-xs">
              <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200">
                <span className="text-xl">🖐️ 🎯</span>
                <p className="font-bold text-amber-800 mt-1">Tự Động Bắn</p>
                <p className="text-[10px] text-slate-500">Rê tay ngắm, đạn tự bắn</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-2xl border border-yellow-200">
                <span className="text-xl">👑</span>
                <p className="font-bold text-yellow-800 mt-1">Gà Vàng Thưởng</p>
                <p className="text-[10px] text-slate-500">Thưởng điểm sao cao</p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
                <span className="text-xl">🧎‍♂️ ↔️</span>
                <p className="font-bold text-emerald-800 mt-1">Né Trứng Bay</p>
                <p className="text-[10px] text-slate-500">Nghiêng hoặc cúi người</p>
              </div>
            </div>

            {/* Hand Selection & Difficulty */}
            <div className="flex flex-col gap-3 mb-6">
              <div className="flex items-center gap-3 justify-center">
                <span className="text-xs font-bold text-slate-500">Tay điều khiển:</span>
                <button
                  onClick={() => setControlHand('right')}
                  className={`px-3 py-1 rounded-full text-xs font-black transition ${
                    controlHand === 'right' ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  🖐️ Tay Phải
                </button>
                <button
                  onClick={() => setControlHand('left')}
                  className={`px-3 py-1 rounded-full text-xs font-black transition ${
                    controlHand === 'left' ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  🤚 Tay Trái
                </button>
              </div>

              <div className="flex items-center gap-2 justify-center">
                <span className="text-xs font-bold text-slate-500">Độ khó:</span>
                {(['easy', 'normal', 'fast'] as GameDifficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase transition ${
                      difficulty === d
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                    }`}
                  >
                    {d === 'easy' ? 'Dễ' : d === 'normal' ? 'Vừa' : 'Nhanh'}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={startGame}
              className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm rounded-full shadow-lg transform hover:scale-105 transition"
            >
              BẮT ĐẦU VUI CHƠI!
            </button>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState === 'game_over' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-white/95 backdrop-blur-sm z-30 text-center">
            <Award className="w-20 h-20 text-yellow-500 animate-bounce mb-2" />
            <h2 className="text-3xl font-black text-amber-600">Nông Trại Bình Yên!</h2>
            <p className="text-slate-500 text-xs font-bold mt-1">Các chú gà tinh nghịch đã về chuồng an toàn!</p>

            <div className="grid grid-cols-3 gap-3 my-6 max-w-md w-full">
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Tổng Điểm</span>
                <p className="text-3xl font-black text-amber-600">{score}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-2xl border border-orange-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Max Combo</span>
                <p className="text-3xl font-black text-orange-600">x{maxCombo}</p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Gà Đã Bắt</span>
                <p className="text-3xl font-black text-emerald-600">{rescuedChickens}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={startGame}
                className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-full shadow-md transition"
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

        {/* Chickens */}
        {chickens.map((c) => {
          if (!c.captured) {
            const isTargeted = lockedTargetId === c.id;

            return (
              <div
                key={c.id}
                className={`absolute flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 select-none ${
                  isTargeted ? 'scale-110' : ''
                }`}
                style={{
                  left: `${c.x}%`,
                  top: `${c.y}%`,
                  transform: `translate(-50%, -50%) scaleX(${c.vx > 0 ? -1 : 1})`,
                }}
              >
                <div className="relative">
                  <span className={`${c.type === 'giant_boss' ? 'text-7xl animate-pulse' : 'text-5xl'}`}>
                    {c.type === 'golden' ? '🐔' : c.type === 'hat' ? '🎩' : c.type === 'giant_boss' ? '🐓' : '🐔'}
                  </span>

                  {c.type === 'hat' && <span className="absolute -top-3 left-2 text-2xl">🎩</span>}
                  {c.type === 'golden' && (
                    <span className="absolute -top-3 left-2 text-xl animate-spin">✨</span>
                  )}

                  {/* Health hearts for multi-hit chickens */}
                  {c.maxHealth > 1 && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-1 bg-white/80 px-1.5 py-0.5 rounded-full shadow-xs">
                      {Array.from({ length: c.health }).map((_, i) => (
                        <span key={i} className="w-2 h-2 rounded-full bg-rose-500" />
                      ))}
                    </div>
                  )}

                  {/* Dev Debug Hitbox Overlay */}
                  {debugMode && (
                    <div
                      className="absolute border-2 border-dashed border-emerald-400 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"
                      style={{
                        width: `${getHitboxRadius(c, difficulty, activePowerUps.bigBubble > 0) * 2}%`,
                        height: `${getHitboxRadius(c, difficulty, activePowerUps.bigBubble > 0) * 2}%`,
                      }}
                    />
                  )}
                </div>
              </div>
            );
          } else {
            // Captured in shiny floating bubble
            return (
              <div
                key={c.id}
                className="absolute flex items-center justify-center pointer-events-none transform -translate-x-1/2 -translate-y-1/2 transition-all"
                style={{
                  left: `${c.x}%`,
                  top: `${c.bubbleY}%`,
                  opacity: c.bubbleOpacity,
                }}
              >
                <div className="relative w-16 h-16 rounded-full bg-cyan-200/60 border-2 border-cyan-400 shadow-lg flex items-center justify-center animate-bounce">
                  <span className="text-3xl">🐔</span>
                  <span className="absolute text-[10px] font-black text-cyan-800 -bottom-3 bg-white/80 px-1.5 rounded-full">
                    Bye bye! ✨
                  </span>
                </div>
              </div>
            );
          }
        })}

        {/* Floating PowerUp Collectible Items */}
        {powerUpItems.map((p) => (
          <div
            key={p.id}
            className="absolute text-2xl animate-bounce pointer-events-none transform -translate-x-1/2 -translate-y-1/2 bg-purple-100 border border-purple-400 p-1.5 rounded-full shadow-md"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            {p.type === 'slow_time' && '⏱️'}
            {p.type === 'big_bubble' && '🫧'}
            {p.type === 'double_score' && '⭐️'}
            {p.type === 'rainbow_bubble' && '🌈'}
          </div>
        ))}

        {/* Flying Bubbles */}
        {bubbles.map((b) => (
          <div
            key={b.id}
            className="absolute rounded-full border-2 border-white pointer-events-none"
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: '32px',
              height: '32px',
              backgroundColor: 'rgba(0, 229, 255, 0.45)',
              boxShadow: '0 0 16px rgba(0, 229, 255, 0.8)',
              transform: `translate(-50%, -50%) scale(${b.scale})`,
              opacity: b.alpha,
            }}
          />
        ))}

        {/* Flying Eggs */}
        {eggs.map((e) => (
          <div
            key={e.id}
            className="absolute text-3xl pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${e.x}%`,
              top: `${e.y}%`,
              transform: `translate(-50%, -50%) rotate(${e.rotation}deg)`,
            }}
          >
            🥚
          </div>
        ))}

        {/* AIM CROSSHAIR (Section XIII) */}
        {(gameState === 'playing' || gameState === 'boss_fight') && (
          <div
            className={`absolute w-12 h-12 rounded-full pointer-events-none transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-75 z-20 ${
              crosshairFlash === 'green'
                ? 'border-4 border-emerald-400 bg-emerald-400/30 scale-110'
                : lockStatusText === 'locked'
                ? 'border-3 border-amber-400 bg-amber-400/20'
                : 'border-2 border-white/80 bg-white/10'
            }`}
            style={{
              left: `${crosshairPos.x}%`,
              top: `${crosshairPos.y}%`,
            }}
          >
            {/* Inner Dot */}
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                crosshairFlash === 'green'
                  ? 'bg-emerald-400 animate-ping'
                  : lockStatusText === 'locked'
                  ? 'bg-amber-400'
                  : 'bg-white'
              }`}
            />

            {/* Lock Status Text Badge */}
            <div
              className={`absolute -bottom-5 text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs whitespace-nowrap ${
                crosshairFlash === 'green'
                  ? 'bg-emerald-500 text-white'
                  : lockStatusText === 'locked'
                  ? 'bg-amber-400 text-amber-950'
                  : 'bg-black/60 text-white'
              }`}
            >
              {crosshairFlash === 'green'
                ? 'TRÚNG! 🎯'
                : lockStatusText === 'locked'
                ? 'NGẮM GÀ 🎯'
                : 'TÌM GÀ'}
            </div>
          </div>
        )}

        {/* Floating Text FX */}
        {floatingTexts.map((t) => (
          <div
            key={t.id}
            className="absolute font-black text-sm pointer-events-none transform -translate-x-1/2 -translate-y-1/2 z-30"
            style={{
              left: `${t.x}%`,
              top: `${t.y}%`,
              color: t.color,
              opacity: t.opacity,
              textShadow: '0 2px 4px rgba(0,0,0,0.4)',
            }}
          >
            {t.text}
          </div>
        ))}

        {/* Developer Mode Debug Information Panel */}
        {debugMode && (
          <div className="absolute bottom-2 left-2 p-3 bg-black/85 backdrop-blur-md rounded-xl text-[10px] font-mono text-green-400 border border-green-500/40 z-50 flex flex-col gap-1 shadow-2xl pointer-events-none">
            <div className="font-bold text-amber-300 border-b border-green-500/30 pb-0.5">DEVELOPER DEBUG OVERLAY</div>
            <div>CONTROL MODE: {controlMode.toUpperCase()} ({controlMode === 'camera' ? (controlHand === 'right' ? 'Right Wrist' : 'Left Wrist') : 'Touch/Mouse'})</div>
            <div>HAND DETECTED: {isHandDetected ? 'YES ✓' : 'NO ❌'}</div>
            <div>RAW WRIST: {wristRawPos.x.toFixed(2)} / {wristRawPos.y.toFixed(2)}</div>
            <div>RAW AIM (MAPPED): X: {rawAimPos.current.x.toFixed(1)}%, Y: {rawAimPos.current.y.toFixed(1)}%</div>
            <div>SMOOTH AIM: X: {smoothedAimPos.current.x.toFixed(1)}%, Y: {smoothedAimPos.current.y.toFixed(1)}%</div>
          </div>
        )}
      </div>

      {/* Footer Guidance (Section XVIII) */}
      <footer className="p-3 bg-white/80 backdrop-blur-md border-t border-amber-200 text-center text-xs font-bold text-amber-900 z-30">
        Diễu hành tay để di chuyển tâm ngắm – Bong bóng sẽ tự bắn liên tục! Khi thấy trứng 🥚 bay tới nhớ nghiêng người sang bên để né nhé!
      </footer>
    </div>
  );
}
