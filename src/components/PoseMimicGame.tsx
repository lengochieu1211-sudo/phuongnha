/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Award, RefreshCw, Zap, Flame, ShieldAlert, ArrowLeft } from 'lucide-react';
import { PlayerProgress, GameGesture } from '../types';
import { audio } from '../lib/AudioEngine';
import { voiceGuide } from '../lib/VoiceGuideService';
import { VOICE_LINES } from '../lib/voiceLines.vi';

interface PoseMimicGameProps {
  progress: PlayerProgress;
  onUpdateProgress: (updater: (p: PlayerProgress) => PlayerProgress) => void;
  gesture: GameGesture;
  onBack: () => void;
}

interface MimicPose {
  id: string;
  title: string;
  instruction: string;
  gestureNeeded: GameGesture;
  points: number;
  imageRepresentation: string; // SVG shape cue
}

const POSES: MimicPose[] = [
  { id: 'left_arm', title: 'Cánh tay trái bay bổng', instruction: 'Giơ cao tay TRÁI của bé lên bầu trời nha!', gestureNeeded: 'left_arm_up', points: 15, imageRepresentation: 'left_up' },
  { id: 'right_arm', title: 'Cánh tay phải vẫy gọi', instruction: 'Giơ cao tay PHẢI của bé lên để bắt bướm nhé!', gestureNeeded: 'right_arm_up', points: 15, imageRepresentation: 'right_up' },
  { id: 'both_arms', title: 'Đón chào cầu vồng', instruction: 'Giơ cả HAI tay lên thật cao cùng một lúc!', gestureNeeded: 'both_arms_up', points: 20, imageRepresentation: 'both_up' },
  { id: 'hands_spread', title: 'Cánh chim đại bàng', instruction: 'Dang rộng hai tay ra hai bên thật thẳng nào!', gestureNeeded: 'hands_spread', points: 25, imageRepresentation: 'spread' },
  { id: 'duck', title: 'Trốn tìm cùng chú thỏ', instruction: 'Ngồi xổm hoặc cúi thấp đầu xuống né nhánh cây nhé!', gestureNeeded: 'duck', points: 20, imageRepresentation: 'duck' },
  { id: 'tilt_left', title: 'Nhành cây nghiêng trái', instruction: 'Nghiêng đầu và thân mình sang bên TRÁI một chút nhé!', gestureNeeded: 'tilt_left', points: 15, imageRepresentation: 'tilt_l' },
  { id: 'tilt_right', title: 'Nhành cây nghiêng phải', instruction: 'Nghiêng người thật dẻo sang bên PHẢI nha bé cưng!', gestureNeeded: 'tilt_right', points: 15, imageRepresentation: 'tilt_r' },
];

const CHEERS = ['Xuất sắc! 🎉', 'Rất tốt! ✨', 'Tiếp tục nào! 👍', 'Quá giỏi luôn! 💖', 'Tuyệt vời bé ơi! 🌈'];

export default function PoseMimicGame({ progress, onUpdateProgress, gesture, onBack }: PoseMimicGameProps) {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'game_over'>('intro');
  const [currentPoseIndex, setCurrentPoseIndex] = useState<number>(0);
  const [matchPercentage, setMatchPercentage] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(10); // 10s per pose
  const [cheerMsg, setCheerMsg] = useState<string>('');
  const [totalCompleted, setTotalCompleted] = useState<number>(0);

  const poseTimerRef = useRef<any>(null);
  const timeLeftRef = useRef<number>(10);
  const scoreRef = useRef<number>(0);
  const holdIntervalRef = useRef<any>(null);
  const activePose = POSES[currentPoseIndex];

  // Start game
  const startGame = () => {
    audio.playRoundStartJingle();
    voiceGuide.speak('Hãy làm theo các tư thế mẫu siêu dễ thương nào!', 'high');
    setScore(0);
    scoreRef.current = 0;
    setStreak(0);
    setTotalCompleted(0);
    setCurrentPoseIndex(0);
    setGameState('playing');
    resetPoseTimer();
  };

  const resetPoseTimer = () => {
    timeLeftRef.current = 10;
    setTimeLeft(10);
  };

  // Turn to next pose
  const nextPose = (success: boolean) => {
    if (success) {
      setTotalCompleted((prev) => prev + 1);
      setStreak((prev) => prev + 1);
      audio.playStarCollectSound();
      voiceGuide.speak(VOICE_LINES.mimic.perfectPose, 'medium');
      // Show cute cheer text
      const randomCheer = CHEERS[Math.floor(Math.random() * CHEERS.length)];
      setCheerMsg(randomCheer);
      setTimeout(() => setCheerMsg(''), 1800);
    } else {
      setStreak(0);
      audio.playFail();
      voiceGuide.speak(VOICE_LINES.mimic.hold, 'low');
      setCheerMsg('Thử lại nhé! 💪');
      setTimeout(() => setCheerMsg(''), 1800);
    }

    if (currentPoseIndex < POSES.length - 1) {
      setCurrentPoseIndex((prev) => prev + 1);
      resetPoseTimer();
    } else {
      // Completed all poses
      endGame();
    }
  };

  // End game summary
  const endGame = () => {
    setGameState('game_over');
    audio.playSuccess();
    voiceGuide.speak('Xuất sắc! Bạn đã vượt qua tất cả thử thách tư thế!', 'high');

    const finalScore = scoreRef.current;
    const starsEarned = Math.floor(finalScore / 12) + (totalCompleted === POSES.length ? 15 : 0);
    const diamondsEarned = Math.floor(finalScore / 35);

    onUpdateProgress((prev) => {
      const currentHigh = prev.highScores.mimic || 0;
      return {
        ...prev,
        stars: prev.stars + starsEarned,
        diamonds: prev.diamonds + diamondsEarned,
        highScores: {
          ...prev.highScores,
          mimic: Math.max(currentHigh, finalScore),
        },
      };
    });
  };

  // 10 second countdown per pose
  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      const nextTime = timeLeftRef.current - 1;
      timeLeftRef.current = nextTime;
      setTimeLeft(Math.max(0, nextTime));

      if (nextTime <= 0) {
        nextPose(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, currentPoseIndex]);

  // Real-time matching logic with holding meter
  useEffect(() => {
    if (gameState !== 'playing') return;

    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }

    if (gesture === activePose.gestureNeeded) {
      let progress = 0;
      holdIntervalRef.current = setInterval(() => {
        progress += 25;
        setMatchPercentage(Math.min(100, progress));
        if (progress >= 100) {
          clearInterval(holdIntervalRef.current);
          holdIntervalRef.current = null;

          const streakBonus = streak * 2;
          setScore((prev) => {
            const next = prev + activePose.points + streakBonus;
            scoreRef.current = next;
            return next;
          });
          setMatchPercentage(0);
          nextPose(true);
        }
      }, 150);
    } else {
      setMatchPercentage(0);
    }

    return () => {
      if (holdIntervalRef.current) {
        clearInterval(holdIntervalRef.current);
      }
    };
  }, [gesture, gameState, currentPoseIndex]);

  // Render pose icon visualization using beautiful SVGs
  const renderPoseRepresentation = (type: string) => {
    let limbPaths = null;

    if (type === 'left_up') {
      limbPaths = (
        <g>
          <line x1="80" y1="120" x2="50" y2="70" stroke="#F50057" strokeWidth="8" strokeLinecap="round" />
          <line x1="120" y1="120" x2="140" y2="160" stroke="#E0E0E0" strokeWidth="8" strokeLinecap="round" />
        </g>
      );
    } else if (type === 'right_up') {
      limbPaths = (
        <g>
          <line x1="80" y1="120" x2="60" y2="160" stroke="#E0E0E0" strokeWidth="8" strokeLinecap="round" />
          <line x1="120" y1="120" x2="150" y2="70" stroke="#F50057" strokeWidth="8" strokeLinecap="round" />
        </g>
      );
    } else if (type === 'both_up') {
      limbPaths = (
        <g>
          <line x1="80" y1="120" x2="50" y2="70" stroke="#F50057" strokeWidth="8" strokeLinecap="round" />
          <line x1="120" y1="120" x2="150" y2="70" stroke="#F50057" strokeWidth="8" strokeLinecap="round" />
        </g>
      );
    } else if (type === 'spread') {
      limbPaths = (
        <g>
          <line x1="80" y1="120" x2="35" y2="120" stroke="#F50057" strokeWidth="8" strokeLinecap="round" />
          <line x1="120" y1="120" x2="165" y2="120" stroke="#F50057" strokeWidth="8" strokeLinecap="round" />
        </g>
      );
    } else if (type === 'duck') {
      limbPaths = (
        <g>
          <line x1="80" y1="120" x2="60" y2="140" stroke="#F50057" strokeWidth="8" strokeLinecap="round" />
          <line x1="120" y1="120" x2="140" y2="140" stroke="#F50057" strokeWidth="8" strokeLinecap="round" />
          <line x1="100" y1="140" x2="100" y2="175" stroke="#F50057" strokeWidth="8" strokeLinecap="round" />
        </g>
      );
    } else if (type === 'tilt_l') {
      limbPaths = (
        <g style={{ transform: 'rotate(-15deg)', transformOrigin: '100px 180px' }}>
          <line x1="80" y1="120" x2="60" y2="150" stroke="#F50057" strokeWidth="8" strokeLinecap="round" />
          <line x1="120" y1="120" x2="140" y2="150" stroke="#F50057" strokeWidth="8" strokeLinecap="round" />
        </g>
      );
    } else if (type === 'tilt_r') {
      limbPaths = (
        <g style={{ transform: 'rotate(15deg)', transformOrigin: '100px 180px' }}>
          <line x1="80" y1="120" x2="60" y2="150" stroke="#F50057" strokeWidth="8" strokeLinecap="round" />
          <line x1="120" y1="120" x2="140" y2="150" stroke="#F50057" strokeWidth="8" strokeLinecap="round" />
        </g>
      );
    }

    return (
      <svg id="pose-visualizer-cue" className="w-48 h-48 drop-shadow-lg" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="85" fill="#FFF1F2" stroke="#FDA4AF" strokeWidth="3" />

        {/* Head */}
        <circle cx="100" cy="65" r="22" fill="#FFE4E6" stroke="#FB7185" strokeWidth="4" />
        {/* Smiling Eyes */}
        <path d="M92,62 Q96,58 100,62" stroke="#E11D48" strokeWidth="2.5" fill="none" />
        <path d="M104,62 Q108,58 112,62" stroke="#E11D48" strokeWidth="2.5" fill="none" />
        <path d="M96,73 Q100,77 104,73" stroke="#E11D48" strokeWidth="2.5" fill="none" />

        {/* Body Spine */}
        <line x1="100" y1="87" x2="100" y2="145" stroke="#FB7185" strokeWidth="8" strokeLinecap="round" />

        {/* Dynamic limbs overlay */}
        {limbPaths}

        {/* Ground pedestal */}
        <ellipse cx="100" cy="175" rx="50" ry="10" fill="#FFE4E6" />
      </svg>
    );
  };

  return (
    <div id="pose-mimic-container" className="flex flex-col items-center gap-6 w-full max-w-4xl mx-auto p-4 md:p-8 bg-rose-50/80 rounded-3xl border-4 border-rose-200 shadow-xl font-sans text-slate-800">
      {/* Header */}
      <div className="flex w-full items-center justify-between border-b-2 border-rose-100 pb-4">
        <button
          id="mimic-back-btn"
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-full font-bold bg-white text-rose-600 border border-rose-200 hover:bg-rose-100 transition shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại
        </button>

        <h2 className="text-2xl md:text-3xl font-extrabold text-rose-700 flex items-center gap-2">
          <Award className="w-8 h-8 text-rose-500 animate-pulse" />
          Mini Game: Làm Theo Động Tác
        </h2>

        <div className="flex items-center gap-2 bg-rose-100/80 px-4 py-1.5 rounded-full border border-rose-200">
          <Flame className="w-5 h-5 text-rose-600 animate-bounce" />
          <span className="font-extrabold text-sm text-rose-800">Chuỗi {streak}</span>
        </div>
      </div>

      {gameState === 'intro' && (
        <div id="mimic-intro-card" className="flex flex-col items-center text-center p-6 bg-white rounded-2xl border-2 border-rose-100 shadow-sm max-w-lg">
          <Award className="w-20 h-20 text-rose-400 mb-4 animate-bounce" />
          <h3 className="text-2xl font-black text-rose-600">Làm Theo Tư Thế!</h3>
          <p className="text-slate-600 text-sm mt-2 leading-relaxed">
            Trên màn hình sẽ xuất hiện một tư thế ngộ nghĩnh của nhân vật.
            Bé hãy nhanh chóng đứng đúng điệu bộ giống hệt vậy trước khi thời gian 10 giây kết thúc nha!
          </p>

          <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 text-xs text-rose-800 my-6 font-medium leading-relaxed">
            🌸 Mỗi tư thế làm đúng giúp bé tích thêm rất nhiều điểm và sao. Làm liên tục đúng sẽ được nhân đôi điểm thưởng đó!
          </div>

          <button
            id="start-mimic-btn"
            onClick={startGame}
            className="px-8 py-3 bg-rose-500 hover:bg-rose-600 text-white font-extrabold rounded-full text-lg shadow-lg hover:shadow-rose-200 transition transform hover:scale-105"
          >
            BẮT ĐẦU NGAY THÔI!
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left section: target cues and instructions */}
          <div className="md:col-span-7 flex flex-col items-center bg-white p-6 rounded-2xl border-2 border-rose-100 shadow-sm text-center">
            <div className="relative">
              {renderPoseRepresentation(activePose.imageRepresentation)}

              {/* Countdown badge */}
              <div id="pose-timer" className="absolute -top-3 -right-3 w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center font-black border-4 border-white shadow-md text-lg animate-pulse">
                {timeLeft}s
              </div>
            </div>

            <h3 className="text-xl font-extrabold text-rose-700 mt-5">{activePose.title}</h3>
            <p className="text-slate-600 text-sm mt-1 leading-relaxed px-4">
              {activePose.instruction}
            </p>

            {/* Matching percentage bar */}
            <div className="w-full mt-6">
              <div className="flex justify-between text-xs font-bold text-slate-500 mb-1.5 px-1">
                <span>Mức độ giống hệt:</span>
                <span>{matchPercentage}%</span>
              </div>
              <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${matchPercentage}%` }}
                />
              </div>
            </div>

            <p className="text-[10px] text-slate-400 mt-4 uppercase font-bold tracking-widest">
              Động tác {currentPoseIndex + 1} trên {POSES.length}
            </p>
          </div>

          {/* Right section: Scores and camera indicator */}
          <div className="md:col-span-5 flex flex-col gap-4">
            {/* Cheer pop messages */}
            <div className="h-20 flex items-center justify-center">
              {cheerMsg && (
                <div id="mimic-cheer" className="bg-yellow-400 text-slate-900 font-black text-xl px-6 py-2 rounded-full border-4 border-white shadow-lg animate-bounce">
                  {cheerMsg}
                </div>
              )}
            </div>

            {/* Score block */}
            <div className="bg-white p-5 rounded-2xl border-2 border-rose-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400">ĐIỂM HIỆN TẠI</p>
                <p className="text-4xl font-black text-rose-600">{score}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400">ĐÃ XONG</p>
                <p className="text-xl font-bold text-slate-700">{totalCompleted} / {POSES.length}</p>
              </div>
            </div>

            {/* Motion guide visual helper */}
            <div className="bg-rose-100/50 p-4 rounded-2xl border border-rose-200 text-xs text-rose-900 flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />
              <div>
                <p className="font-bold">Nhận dạng hiện tại:</p>
                <p className="opacity-90 mt-0.5">Bé đang làm tư thế: <b>{gesture === 'standing' ? 'Chuẩn bị' : gesture.toUpperCase()}</b></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {gameState === 'game_over' && (
        <div id="mimic-gameover-card" className="flex flex-col items-center text-center p-8 bg-white rounded-2xl border-2 border-rose-100 shadow-sm max-w-lg">
          <Award className="w-20 h-20 text-rose-500 animate-bounce mb-4" />
          <h3 className="text-3xl font-black text-rose-600">Hoàn Thành Hoàn Hảo!</h3>
          <p className="text-slate-500 text-sm mt-1">Bé bắt chước siêu đẳng cấp!</p>

          <div className="grid grid-cols-2 gap-4 w-full my-6 text-sm">
            <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
              <span className="text-xs text-slate-400 font-bold">ĐIỂM ĐẠT ĐƯỢC</span>
              <span className="text-3xl font-black text-rose-600">{score}</span>
            </div>
            <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
              <span className="text-xs text-slate-400 font-bold">HOÀN THÀNH</span>
              <span className="text-3xl font-black text-rose-600">{totalCompleted} / {POSES.length}</span>
            </div>
          </div>

          <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100/60 w-full mb-6">
            <h4 className="font-bold text-rose-700 text-sm mb-1">🎁 Quà tặng nhận được:</h4>
            <div className="flex justify-center gap-6 text-sm font-extrabold text-slate-700 mt-2">
              <span className="flex items-center gap-1">⭐ +{Math.max(1, Math.floor(score / 12))} Sao</span>
              <span className="flex items-center gap-1">💎 +{Math.max(0, Math.floor(score / 35))} Kim Cương</span>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              id="retry-mimic-btn"
              onClick={startGame}
              className="flex items-center gap-2 px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-extrabold rounded-full shadow-md transition transform hover:scale-105"
            >
              <RefreshCw className="w-5 h-5" />
              Tập lại
            </button>
            <button
              id="quit-mimic-btn"
              onClick={onBack}
              className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-full shadow-sm transition"
            >
              Về menu chính
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
