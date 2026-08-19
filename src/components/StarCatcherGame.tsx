/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Star, Zap, Clock, Timer, Award, ArrowLeft, RotateCcw, Sparkles, Gift } from 'lucide-react';
import { PlayerProgress, GameGesture } from '../types';
import { audio } from '../lib/AudioEngine';
import { voiceGuide } from '../lib/VoiceGuideService';
import { VOICE_LINES } from '../lib/voiceLines.vi';
import { useCameraPose } from '../providers/CameraPoseContext';
import { mapWristToGame } from '../utils/poseUtils';
import { recordMissionProgress } from '../utils/progression';
import Confetti from './Confetti';

interface StarCatcherGameProps {
  progress: PlayerProgress;
  onUpdateProgress: (updater: (p: PlayerProgress) => PlayerProgress) => void;
  gesture: GameGesture;
  onBack: () => void;
  workoutMode?: boolean;
  isPaused?: boolean;
}

interface CatchableStar {
  id: string;
  quadrant: 'top_left' | 'top_right' | 'top_center' | 'bottom_center' | 'mid_left' | 'mid_right';
  x: number; // percentage width
  y: number; // percentage height
  requiredGesture: GameGesture;
  spawnTime: number;
  lifetime: number; // ms
  type: 'star' | 'rainbow_star' | 'diamond' | 'butterfly' | 'gift';
  emoji: string;
  points: number;
}

export default function StarCatcherGame({
  progress,
  onUpdateProgress,
  gesture,
  onBack,
  workoutMode = false,
  isPaused = false,
}: StarCatcherGameProps) {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'game_over'>(() => workoutMode ? 'playing' : 'intro');
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number>(100);
  const [totalSpawned, setTotalSpawned] = useState<number>(0);
  const [totalCaught, setTotalCaught] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(45); // 45 seconds game
  const [activeStars, setActiveStars] = useState<CatchableStar[]>([]);
  const [particles, setParticles] = useState<{ x: number; y: number; color: string; id: number }[]>([]);
  const [controlMode, setControlMode] = useState<'camera' | 'touch'>('camera');

  // Reaction time calculations
  const [avgReactionTime, setAvgReactionTime] = useState<number>(0);
  const [reactionsList, setReactionsList] = useState<number[]>([]);

  const lastSpawnRef = useRef<number>(0);
  const starIdCounter = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  const activeStarsRef = useRef<CatchableStar[]>([]);

  useEffect(() => {
    activeStarsRef.current = activeStars;
  }, [activeStars]);

  const { leftWrist, rightWrist, getLatestPose } = useCameraPose();

  const handleCatchStar = (star: CatchableStar) => {
    if (star.type === 'rainbow_star' || star.type === 'gift') {
      audio.playPowerup();
    } else if (star.type === 'diamond') {
      audio.playDiamond();
    } else {
      audio.playStarCollectSound();
    }

    const reaction = Date.now() - star.spawnTime;
    setReactionsList((prev) => [...prev, reaction]);

    const updatedReactions = [...reactionsList, reaction];
    const sum = updatedReactions.reduce((a, b) => a + b, 0);
    setAvgReactionTime(Math.round(sum / updatedReactions.length));

    // Pop particles
    spawnParticles(star.x, star.y);

    // Boost score and combos
    setScore((s) => {
      const next = s + star.points;
      scoreRef.current = next;
      return next;
    });
    setTotalCaught((c) => c + 1);

    setCombo((c) => {
      const next = c + 1;
      if (next > maxCombo) setMaxCombo(next);

      if (next === 5) {
        audio.playCombo();
        voiceGuide.speak(VOICE_LINES.starcatcher.combo5, 'low');
      } else if (next === 10) {
        audio.playCombo();
        voiceGuide.speak(VOICE_LINES.starcatcher.combo10, 'low');
      } else if (next % 4 === 0) {
        voiceGuide.praiseRandom();
      }

      return next;
    });

    // Remove the caught star
    setActiveStars((prev) => prev.filter((s) => s.id !== star.id));

    // Update daily mission progress immediately (only for star & rainbow_star!)
    if (star.type === 'star' || star.type === 'rainbow_star') {
      onUpdateProgress((prev) => {
        return recordMissionProgress(prev, 'stars', 1);
      });
    }
  };

  const timeLeftRef = useRef<number>(45);

  // Start game
  const startGame = () => {
    audio.playRoundStartJingle();
    voiceGuide.speak(VOICE_LINES.starcatcher.start, 'high');
    setScore(0);
    scoreRef.current = 0;
    setCombo(0);
    setMaxCombo(0);
    setAccuracy(100);
    setTotalSpawned(0);
    setTotalCaught(0);
    timeLeftRef.current = 45;
    setTimeLeft(45);
    setAvgReactionTime(0);
    setReactionsList([]);
    setActiveStars([]);
    setGameState('playing');
    lastSpawnRef.current = Date.now();
  };

  // End game
  const endGame = () => {
    setGameState('game_over');
    audio.playSuccess();
    voiceGuide.speak(VOICE_LINES.starcatcher.finish, 'high');

    const finalScore = scoreRef.current;
    // Reward player with stars and diamonds based on score
    const starsEarned = Math.max(1, Math.floor(finalScore / 15));
    const diamondsEarned = Math.max(0, Math.floor(finalScore / 50));

    onUpdateProgress((prev) => {
      const currentHigh = prev.highScores.starcatcher || 0;
      return {
        ...prev,
        stars: prev.stars + starsEarned,
        diamonds: prev.diamonds + diamondsEarned,
        highScores: {
          ...prev.highScores,
          starcatcher: Math.max(currentHigh, finalScore),
        },
      };
    });
  };

  // Manage countdown timer
  useEffect(() => {
    if (gameState !== 'playing' || isPaused) return;
    if (workoutMode) return; // Workout mode is governed externally

    const interval = setInterval(() => {
      const nextTime = timeLeftRef.current - 1;
      timeLeftRef.current = nextTime;
      setTimeLeft(Math.max(0, nextTime));

      if (nextTime <= 0) {
        clearInterval(interval);
        endGame();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState, workoutMode, isPaused]);

  // Game spawner loop (stable loop using refs to avoid constant recreations)
  useEffect(() => {
    if (gameState !== 'playing' || isPaused) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const currentScore = scoreRef.current;
      const spawnCooldown = Math.max(750, 1800 - currentScore * 15);

      if (now - lastSpawnRef.current > spawnCooldown && activeStarsRef.current.length < 3) {
        spawnStar();
        lastSpawnRef.current = now;
      }

      // Check for expired stars
      setActiveStars((prev) => {
        const fresh = prev.filter((s) => {
          const expired = now - s.spawnTime > s.lifetime;
          if (expired) {
            // Missed a star
            setCombo(0);
          }
          return !expired;
        });

        return fresh;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [gameState, isPaused]);

  // Accuracy updater
  useEffect(() => {
    if (totalSpawned > 0) {
      setAccuracy(Math.min(100, Math.round((totalCaught / totalSpawned) * 100)));
    }
  }, [totalCaught, totalSpawned]);

  // Spawn star config
  const spawnStar = () => {
    const quadrants: ('top_left' | 'top_right' | 'top_center' | 'bottom_center' | 'mid_left' | 'mid_right')[] = [
      'top_left',
      'top_right',
      'top_center',
      'bottom_center',
      'mid_left',
      'mid_right',
    ];

    const currentQuads = activeStarsRef.current.map((s) => s.quadrant);
    const available = quadrants.filter((q) => !currentQuads.includes(q));
    if (available.length === 0) return;

    const chosenQuad = available[Math.floor(Math.random() * available.length)];

    let x = 50;
    let y = 50;
    let requiredGesture: GameGesture = 'standing';

    if (chosenQuad === 'top_left') {
      x = 20;
      y = 25;
      requiredGesture = 'left_arm_up';
    } else if (chosenQuad === 'top_right') {
      x = 80;
      y = 25;
      requiredGesture = 'right_arm_up';
    } else if (chosenQuad === 'top_center') {
      x = 50;
      y = 18;
      requiredGesture = 'both_arms_up';
    } else if (chosenQuad === 'bottom_center') {
      x = 50;
      y = 75;
      requiredGesture = 'duck';
    } else if (chosenQuad === 'mid_left') {
      x = 18;
      y = 52;
      requiredGesture = 'tilt_left';
    } else if (chosenQuad === 'mid_right') {
      x = 82;
      y = 52;
      requiredGesture = 'tilt_right';
    }

    // Determine type
    const rand = Math.random();
    let type: CatchableStar['type'] = 'star';
    let emoji = '⭐';
    let points = 10;

    if (rand < 0.5) {
      type = 'star';
      emoji = '⭐';
      points = 10;
    } else if (rand < 0.7) {
      type = 'rainbow_star';
      emoji = '🌈';
      points = 30;
      voiceGuide.speak(VOICE_LINES.starcatcher.rainbowStar, 'low');
    } else if (rand < 0.85) {
      type = 'diamond';
      emoji = '💎';
      points = 25;
    } else if (rand < 0.93) {
      type = 'butterfly';
      emoji = '🦋';
      points = 15;
    } else {
      type = 'gift';
      emoji = '🎁';
      points = 50;
      voiceGuide.speak(VOICE_LINES.starcatcher.giftBox, 'low');
    }

    starIdCounter.current++;
    setTotalSpawned((s) => s + 1);

    const newStar: CatchableStar = {
      id: `star_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
      quadrant: chosenQuad,
      x,
      y,
      requiredGesture,
      spawnTime: Date.now(),
      lifetime: Math.max(2000, 4200 - score * 40),
      type,
      emoji,
      points,
    };

    setActiveStars((prev) => [...prev, newStar]);
  };

  // Real-time wrist position and gesture checking for collisions
  useEffect(() => {
    if (gameState !== 'playing' || activeStars.length === 0 || isPaused) return;

    const latest = getLatestPose();
    const matchedStar = activeStars.find((s) => {
      const leftMapped = mapWristToGame(latest.leftWrist || leftWrist, { minX: 5, maxX: 95, minY: 10, maxY: 90 });
      const rightMapped = mapWristToGame(latest.rightWrist || rightWrist, { minX: 5, maxX: 95, minY: 10, maxY: 90 });

      // Strict hitbox range (9% of screen coordinates for regular, 13% for special)
      const isWristCloseNormal = (leftMapped.visible && Math.hypot(leftMapped.gameX - s.x, leftMapped.gameY - s.y) < 9) ||
                                 (rightMapped.visible && Math.hypot(rightMapped.gameX - s.x, rightMapped.gameY - s.y) < 9);

      const isWristCloseSpecial = (leftMapped.visible && Math.hypot(leftMapped.gameX - s.x, leftMapped.gameY - s.y) < 13) ||
                                  (rightMapped.visible && Math.hypot(rightMapped.gameX - s.x, rightMapped.gameY - s.y) < 13);

      if (s.type === 'star') {
        // Regular star: MUST be collected strictly by physical wrist overlap
        return isWristCloseNormal;
      } else {
        // Special star: MUST have wrist close AND matching gesture (wrist hitbox + gesture)
        const isGestureMatch = (gesture !== 'standing' && s.requiredGesture === gesture);
        return isWristCloseSpecial && isGestureMatch;
      }
    });

    if (matchedStar) {
      handleCatchStar(matchedStar);
    }
  }, [gesture, activeStars, gameState, getLatestPose, isPaused]);

  // Particle explosion
  const spawnParticles = (x: number, y: number) => {
    const colors = ['#FFEB3B', '#FF2A6D', '#03A9F4', '#E040FB', '#4CAF50', '#FF9800'];
    const newParts = Array.from({ length: 14 }).map((_, i) => ({
      x: x + (Math.random() * 10 - 5),
      y: y + (Math.random() * 10 - 5),
      color: colors[Math.floor(Math.random() * colors.length)],
      id: Date.now() + i,
    }));
    setParticles((prev) => [...prev, ...newParts]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParts.find((np) => np.id === p.id)));
    }, 1200);
  };

  return (
    <div id="star-catcher-container" className="flex flex-col items-center gap-6 w-full max-w-4xl mx-auto p-4 md:p-8 bg-pink-50/80 rounded-3xl border-4 border-pink-200 shadow-xl font-sans text-slate-800">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row w-full items-center justify-between border-b-2 border-pink-100 pb-4 gap-4">
        <div className="flex items-center gap-3">
          {!workoutMode && (
            <button
              id="starcatcher-back-btn"
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 rounded-full font-bold bg-white text-pink-600 border border-pink-200 hover:bg-pink-100 transition shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
              Quay lại
            </button>
          )}

          <h2 className="text-xl md:text-2xl font-extrabold text-pink-700 flex items-center gap-2">
            <Star className="w-6 h-6 md:w-8 md:h-8 text-yellow-500 fill-yellow-500 animate-spin" />
            Bắt Ngôi Sao
          </h2>
        </div>

        {/* Control Mode Toggle Selector */}
        <div className="flex items-center gap-1.5 bg-pink-100/60 p-1 rounded-full border border-pink-200 text-xs">
          <button
            id="mode-camera-toggle"
            onClick={() => setControlMode('camera')}
            className={`px-3 py-1.5 rounded-full font-bold transition-all ${controlMode === 'camera' ? 'bg-pink-500 text-white shadow-md' : 'text-pink-600 hover:bg-pink-200/50'}`}
          >
            🎥 CAMERA
          </button>
          <button
            id="mode-touch-toggle"
            onClick={() => setControlMode('touch')}
            className={`px-3 py-1.5 rounded-full font-bold transition-all ${controlMode === 'touch' ? 'bg-pink-500 text-white shadow-md' : 'text-pink-600 hover:bg-pink-200/50'}`}
          >
            👆 CẢM ỨNG
          </button>
        </div>

        <div className="flex items-center gap-2 bg-pink-100/80 px-4 py-1.5 rounded-full border border-pink-200">
          <Timer className="w-5 h-5 text-pink-600 animate-pulse" />
          <span className="font-extrabold text-sm text-pink-800">{workoutMode ? "Tập Luyện" : `${timeLeft}s`}</span>
        </div>
      </div>

      {gameState === 'intro' && (
        <div id="catcher-intro-card" className="flex flex-col items-center text-center p-6 bg-white rounded-2xl border-2 border-pink-100 shadow-sm max-w-lg">
          <Star className="w-20 h-20 text-yellow-400 fill-yellow-400 mb-4 animate-bounce" />
          <h3 className="text-2xl font-black text-pink-600">Luật chơi vui nhộn!</h3>
          <p className="text-slate-600 text-sm mt-2 leading-relaxed">
            Các ngôi sao phép thuật, cầu vồng và kim cương sẽ xuất hiện khắp màn hình.
            Bé hãy dùng chuyển động cơ thể để bắt lấy chúng nhé!
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full my-6 text-xs text-left">
            <div className="bg-pink-50 p-2.5 rounded-xl border border-pink-100">
              <p className="font-bold text-pink-700">⭐ Góc Trái Cao</p>
              <p className="text-slate-500">Tay TRÁI lên cao 🫲</p>
            </div>
            <div className="bg-pink-50 p-2.5 rounded-xl border border-pink-100">
              <p className="font-bold text-pink-700">⭐ Góc Phải Cao</p>
              <p className="text-slate-500">Tay PHẢI lên cao 🫱</p>
            </div>
            <div className="bg-pink-50 p-2.5 rounded-xl border border-pink-100">
              <p className="font-bold text-pink-700">🌈 Cầu Vồng Trên</p>
              <p className="text-slate-500">HAI tay lên cao 🙌</p>
            </div>
            <div className="bg-pink-50 p-2.5 rounded-xl border border-pink-100">
              <p className="font-bold text-pink-700">💎 Kim Cương</p>
              <p className="text-slate-500">Cúi / Ngồi xổm 🙇</p>
            </div>
            <div className="bg-pink-50 p-2.5 rounded-xl border border-pink-100">
              <p className="font-bold text-pink-700">🦋 Bướm Trái</p>
              <p className="text-slate-500">Nghiêng sang trái ↖️</p>
            </div>
            <div className="bg-pink-50 p-2.5 rounded-xl border border-pink-100">
              <p className="font-bold text-pink-700">🎁 Hộp Quà Phải</p>
              <p className="text-slate-500">Nghiêng sang phải ↗️</p>
            </div>
          </div>

          <button
            id="start-catcher-btn"
            onClick={startGame}
            className="px-8 py-3 bg-pink-500 hover:bg-pink-600 text-white font-extrabold rounded-full text-lg shadow-lg hover:shadow-pink-200 transition transform hover:scale-105"
          >
            SẴN SÀNG CHƯA? CHƠI THÔI!
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="w-full flex flex-col gap-4">
          {/* Stats Bar */}
          <div id="playing-stats-bar" className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-pink-100 flex items-center gap-3">
              <Award className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-[10px] text-slate-400 font-bold">ĐIỂM SỐ</p>
                <p className="text-lg font-black text-slate-700">{score}</p>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-pink-100 flex items-center gap-3">
              <Zap className="w-8 h-8 text-emerald-500 animate-bounce" />
              <div>
                <p className="text-[10px] text-slate-400 font-bold">COMBO</p>
                <p className="text-lg font-black text-emerald-600">{combo}</p>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-pink-100 flex items-center gap-3">
              <Clock className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-[10px] text-slate-400 font-bold">PHẢN ỨNG</p>
                <p className="text-lg font-black text-blue-600">{avgReactionTime ? `${(avgReactionTime / 1000).toFixed(2)}s` : '--'}</p>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-pink-100 flex items-center gap-3">
              <Star className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-[10px] text-slate-400 font-bold">CHÍNH XÁC</p>
                <p className="text-lg font-black text-purple-600">{accuracy}%</p>
              </div>
            </div>
          </div>

          {/* Active Catcher Stage Area */}
          <div id="star-catcher-stage" className="relative w-full aspect-video bg-slate-900 border-4 border-pink-200 rounded-3xl overflow-hidden shadow-inner flex items-center justify-center">
            {/* Soft grid coordinates indicators in background */}
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 opacity-5 pointer-events-none">
              <div className="border-r border-b border-white" />
              <div className="border-b border-white" />
              <div className="border-r border-white" />
              <div />
            </div>

            {/* Instruction prompts on stage based on target quadrant */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-center text-slate-400 text-[10px] uppercase tracking-widest bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700">
              Vận động tay chân theo vị trí xuất hiện!
            </div>

            {/* Active stars loop */}
            {activeStars.map((s) => {
              const age = Date.now() - s.spawnTime;
              const opacity = Math.max(0.2, 1 - age / s.lifetime);

              return (
                <div
                  key={s.id}
                  onClick={() => {
                    if (controlMode === 'touch') {
                      handleCatchStar(s);
                    }
                  }}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-pulse cursor-pointer hover:scale-125 transition-transform active:scale-95"
                  style={{
                    left: `${s.x}%`,
                    top: `${s.y}%`,
                    opacity,
                    transition: 'all 0.1s ease',
                  }}
                >
                  {/* Glowing halo behind star */}
                  <div className="absolute -inset-4 bg-yellow-400/25 blur-md rounded-full animate-ping" />

                  <span className="text-5xl select-none filter drop-shadow-[0_0_15px_rgba(255,235,59,0.8)]">
                    {s.emoji}
                  </span>

                  <span className="mt-1 bg-black/80 text-white font-extrabold text-[8px] md:text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {s.requiredGesture === 'left_arm_up' && '🫲 TAY TRÁI'}
                    {s.requiredGesture === 'right_arm_up' && '🫱 TAY PHẢI'}
                    {s.requiredGesture === 'both_arms_up' && '🙌 HAI TAY'}
                    {s.requiredGesture === 'duck' && '🙇 CÚI NGƯỜI'}
                    {s.requiredGesture === 'tilt_left' && '↖️ NGHIÊNG TRÁI'}
                    {s.requiredGesture === 'tilt_right' && '↗️ NGHIÊNG PHẢI'}
                  </span>
                </div>
              );
            })}

            {/* Particles effects popping */}
            {particles.map((p) => (
              <div
                key={p.id}
                className="absolute w-2.5 h-2.5 rounded-full pointer-events-none transition-all duration-1000"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  backgroundColor: p.color,
                  transform: 'scale(2.2)',
                  boxShadow: `0 0 12px ${p.color}`,
                }}
              />
            ))}

            {/* Active camera visual indicator inside bottom center */}
            <div className="absolute bottom-3 left-3 bg-white/10 text-white text-[9px] px-2 py-1 rounded-full border border-white/20 backdrop-blur-sm">
              Camera: {gesture === 'standing' ? 'Chuẩn bị' : gesture.toUpperCase()}
            </div>
          </div>
        </div>
      )}

      {gameState === 'game_over' && (
        <>
          <Confetti />
          <div id="catcher-gameover-card" className="flex flex-col items-center text-center p-8 bg-white rounded-2xl border-2 border-pink-100 shadow-sm max-w-lg">
            <Award className="w-20 h-20 text-yellow-500 animate-bounce mb-4" />
            <h3 className="text-3xl font-black text-pink-600">Hoàn Thành Tuyệt Vời!</h3>
            <p className="text-slate-500 text-sm mt-1">Bé vận động siêu nhanh nhẹn và dẻo dai!</p>

          <div className="grid grid-cols-2 gap-4 w-full my-6 text-sm">
            <div className="bg-pink-50 p-4 rounded-xl border border-pink-100 flex flex-col justify-center">
              <span className="text-xs text-slate-400 font-bold">ĐIỂM ĐẠT ĐƯỢC</span>
              <span className="text-3xl font-black text-pink-600">{score}</span>
            </div>
            <div className="bg-pink-50 p-4 rounded-xl border border-pink-100 flex flex-col justify-center">
              <span className="text-xs text-slate-400 font-bold">KỶ LỤC COMBO</span>
              <span className="text-3xl font-black text-pink-600">{maxCombo}</span>
            </div>
          </div>

          <div className="bg-pink-50/50 p-4 rounded-2xl border border-pink-100/60 w-full mb-6">
            <h4 className="font-bold text-pink-700 text-sm mb-1">🎁 Quà tặng nhận được:</h4>
            <div className="flex justify-center gap-6 text-sm font-extrabold text-slate-700 mt-2">
              <span className="flex items-center gap-1">⭐ +{Math.max(1, Math.floor(score / 15))} Sao</span>
              <span className="flex items-center gap-1">💎 +{Math.max(0, Math.floor(score / 50))} Kim Cương</span>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              id="retry-catcher-btn"
              onClick={startGame}
              className="flex items-center gap-2 px-6 py-2.5 bg-pink-500 hover:bg-pink-600 text-white font-extrabold rounded-full shadow-md transition transform hover:scale-105"
            >
              <RotateCcw className="w-5 h-5" />
              Chơi lại
            </button>
            <button
              id="quit-catcher-btn"
              onClick={onBack}
              className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-full shadow-sm transition"
            >
              Về menu chính
            </button>
          </div>
        </div>
      </>
    )}
    </div>
  );
}
