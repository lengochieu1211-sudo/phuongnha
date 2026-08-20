/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Clock, Flame, Sparkles, Award, RotateCcw, Play, CheckCircle } from 'lucide-react';
import { PlayerProgress, GameGesture } from '../types';
import { audio } from '../lib/AudioEngine';
import { voiceGuide } from '../lib/VoiceGuideService';
import { VOICE_LINES } from '../lib/voiceLines.vi';
import FruitSlashGame from './FruitSlashGame';
import ChickenBlasterGame from './ChickenBlasterGame';
import SweetZombieGame from './SweetZombieGame';
import StarCatcherGame from './StarCatcherGame';

interface RandomWorkoutGameProps {
  progress: PlayerProgress;
  onUpdateProgress: (updater: (prev: PlayerProgress) => PlayerProgress) => void;
  gesture: GameGesture;
  mode: '5min' | '10min';
  onBack: () => void;
}

interface WorkoutSegment {
  title: string;
  gameType: 'warmup' | 'fruitslash' | 'chickenblaster' | 'sweetzombie' | 'starcatcher' | 'cooldown';
  durationSeconds: number;
  icon: string;
  description: string;
}

export default function RandomWorkoutGame({
  progress,
  onUpdateProgress,
  gesture,
  mode,
  onBack,
}: RandomWorkoutGameProps) {
  const totalDuration = mode === '5min' ? 300 : 600; // 5m or 10m

  const segments: WorkoutSegment[] = React.useMemo(() => {
    return mode === '5min'
      ? [
          {
            title: 'Khởi Động Nhẹ Nhàng',
            gameType: 'warmup',
            durationSeconds: 45,
            icon: '🤸‍♀️',
            description: 'Xoay khớp cổ tay, nâng cao đùi và hít thở thật sâu cùng Bara!',
          },
          {
            title: 'Chém Trái Cây',
            gameType: 'fruitslash',
            durationSeconds: 90,
            icon: '🍉',
            description: 'Vung tay nhanh nhẹn chém thật nhiều hoa quả thơm ngon!',
          },
          {
            title: 'Gà Tinh Nghịch',
            gameType: 'chickenblaster',
            durationSeconds: 90,
            icon: '🐔',
            description: 'Giơ tay ngắm bắn bong bóng đưa các bạn gà về chuồng!',
          },
          {
            title: 'Bắt Sao Thả Lỏng',
            gameType: 'starcatcher',
            durationSeconds: 75,
            icon: '⭐',
            description: 'Vươn tay đón các vì sao lấp lánh và thư giãn cơ thể.',
          },
        ]
      : [
          {
            title: 'Khởi Động Toàn Thân',
            gameType: 'warmup',
            durationSeconds: 60,
            icon: '🤸‍♀️',
            description: 'Khởi động khớp cổ tay, khớp vai và hít thở nhịp nhàng!',
          },
          {
            title: 'Chém Trái Cây',
            gameType: 'fruitslash',
            durationSeconds: 100,
            icon: '🍉',
            description: 'Vung hai tay liên tục giải phóng năng lượng tươi mới!',
          },
          {
            title: 'Gà Tinh Nghịch',
            gameType: 'chickenblaster',
            durationSeconds: 100,
            icon: '🐔',
            description: 'Nhanh tay ngắm bắn và nghiêng người né trứng bay!',
          },
          {
            title: 'Zombie Kẹo Ngọt',
            gameType: 'sweetzombie',
            durationSeconds: 110,
            icon: '🧸',
            description: 'Tạo các dáng tay đẹp mắt để đánh thức các bạn quái vật!',
          },
          {
            title: 'Bắt Sao Tinh Vân',
            gameType: 'starcatcher',
            durationSeconds: 130,
            icon: '✨',
            description: 'Đón các ngôi sao cầu vồng và thu thập năng lượng vũ trụ!',
          },
          {
            title: 'Thả Lỏng & Hồi Phục',
            gameType: 'cooldown',
            durationSeconds: 100,
            icon: '🧘‍♂️',
            description: 'Hít sâu thở chậm, thả lỏng toàn thân và vỗ tay khen ngợi bản thân!',
          },
        ];
  }, [mode]);

  const [currentSegmentIdx, setCurrentSegmentIdx] = useState<number>(0);
  const [segmentTimeLeft, setSegmentTimeLeft] = useState<number>(segments[0].durationSeconds);
  const [totalTimeElapsed, setTotalTimeElapsed] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [caloriesBurned, setCaloriesBurned] = useState<number>(0);

  const currentSegment = segments[currentSegmentIdx];

  // Safety reminder on session start
  useEffect(() => {
    voiceGuide.speak(VOICE_LINES.safety.warmup, 'high');
    const introTimer = window.setTimeout(() => {
      voiceGuide.speak(
        mode === '5min' ? VOICE_LINES.workout.start5min : VOICE_LINES.workout.start10min,
        'high'
      );
    }, 2000);
    return () => window.clearTimeout(introTimer);
  }, [mode]);

  const segmentTimeLeftRef = useRef<number>(segments[0]?.durationSeconds || 30);

  // Overall workout ticker
  useEffect(() => {
    if (isFinished || isPaused) return;

    const timer = setInterval(() => {
      setTotalTimeElapsed((prev) => prev + 1);
      let met = 5.0; // moderate gaming
      if (currentSegment.gameType === 'warmup') met = 3.5;
      else if (currentSegment.gameType === 'cooldown') met = 2.0;
      else if (['fruitslash', 'chickenblaster', 'sweetzombie', 'starcatcher'].includes(currentSegment.gameType)) met = 5.5;

      const kcalPerSec = (met * 3.5 * 25 / 200) / 60; // MET formula for 25kg child
      setCaloriesBurned((prev) => +(prev + kcalPerSec).toFixed(3));

      const nextTime = segmentTimeLeftRef.current - 1;
      segmentTimeLeftRef.current = nextTime;
      setSegmentTimeLeft(Math.max(0, nextTime));

      if (nextTime <= 0) {
        if (currentSegmentIdx < segments.length - 1) {
          const nextIdx = currentSegmentIdx + 1;
          setCurrentSegmentIdx(nextIdx);
          segmentTimeLeftRef.current = segments[nextIdx].durationSeconds;
          setSegmentTimeLeft(segments[nextIdx].durationSeconds);
          audio.playPowerup();
          voiceGuide.praiseRandom();
        } else {
          clearInterval(timer);
          completeSession();
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentSegmentIdx, isFinished, isPaused, segments]);

  const completeSession = () => {
    setIsFinished(true);
    audio.playSuccess();
    voiceGuide.speak(VOICE_LINES.workout.finish, 'high');

    const bonusStars = mode === '5min' ? 25 : 50;
    const bonusDiamonds = mode === '5min' ? 5 : 12;

    onUpdateProgress((prev) => ({
      ...prev,
      stars: prev.stars + bonusStars,
      diamonds: prev.diamonds + bonusDiamonds,
      parentStats: {
        ...prev.parentStats,
        workoutSessions: prev.parentStats.workoutSessions + 1,
        todayPlayMinutes: prev.parentStats.todayPlayMinutes + (mode === '5min' ? 5 : 10),
        starsEarnedToday: prev.parentStats.starsEarnedToday + bonusStars,
      },
    }));
  };

  const progressPercent = Math.min(100, Math.round((totalTimeElapsed / totalDuration) * 100));

  return (
    <div id="random-workout-session" className="relative w-full max-w-4xl flex flex-col gap-3 select-none">
      {/* Top Banner Progress */}
      <header className="bg-white/90 backdrop-blur-md p-4 rounded-3xl border-2 border-red-200 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="flex items-center gap-1 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 font-black text-xs rounded-full transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Rời Buổi Tập
          </button>

          <button
            onClick={() => setIsPaused((p) => !p)}
            className={`flex items-center gap-1 px-3 py-1 rounded-full font-black text-xs transition shadow-sm ${
              isPaused
                ? 'bg-green-500 hover:bg-green-600 text-white animate-pulse'
                : 'bg-amber-100 hover:bg-amber-200 text-amber-800'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Clock className="w-3.5 h-3.5" />}
            {isPaused ? 'Tiếp Tục' : 'Tạm Dừng'}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xl">{currentSegment.icon}</span>
          <div>
            <h3 className="text-sm font-black text-slate-800">
              Phần {currentSegmentIdx + 1}/{segments.length}: {currentSegment.title}
            </h3>
            <p className="text-[11px] font-bold text-slate-500">{currentSegment.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-black text-xs">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            {Math.round(caloriesBurned)} kcal
          </div>
          <div className="flex items-center gap-1 bg-red-500 text-white px-3 py-1 rounded-full font-black text-xs">
            <Clock className="w-3.5 h-3.5" />
            {Math.floor((totalDuration - totalTimeElapsed) / 60)}:
            {String((totalDuration - totalTimeElapsed) % 60).padStart(2, '0')}
          </div>
        </div>
      </header>

      {/* Segment Timeline Progress Bar */}
      <div className="w-full bg-white/70 backdrop-blur-sm p-3 rounded-2xl border border-red-100 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
          <span>Tiến trình buổi tập ({progressPercent}%)</span>
          <span>Chuyển màn sau: {segmentTimeLeft}s</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex gap-1 p-0.5 border border-slate-200">
          {segments.map((seg, idx) => {
            const isPast = idx < currentSegmentIdx;
            const isCurrent = idx === currentSegmentIdx;
            return (
              <div
                key={idx}
                className={`h-full rounded-full transition-all duration-300 ${
                  isPast
                    ? 'bg-emerald-500 flex-1'
                    : isCurrent
                    ? 'bg-gradient-to-r from-red-500 to-orange-500 flex-1 animate-pulse'
                    : 'bg-slate-200 flex-1 opacity-60'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Main Active Segment Content Area */}
      {!isFinished ? (
        <div className="w-full">
          {currentSegment.gameType === 'warmup' && (
            <div className="w-full h-[480px] bg-gradient-to-b from-rose-100 to-orange-100 rounded-3xl border-4 border-rose-200 p-8 flex flex-col items-center justify-center text-center shadow-xl">
              <div className="text-7xl mb-4 animate-bounce">🤸‍♀️✨</div>
              <h2 className="text-3xl font-black text-rose-700">Khởi Động Cùng Bara Nào!</h2>
              <p className="text-slate-600 text-sm max-w-md mt-2 leading-relaxed">
                Bé hãy đứng thẳng, xoay tròn hai cổ tay, nhún nhảy nhẹ nhàng và hít một hơi thật sâu để chuẩn bị năng lượng nhé!
              </p>

              <div className="mt-8 flex items-center gap-2 bg-white/80 backdrop-blur-sm px-6 py-2 rounded-full border border-rose-200 shadow-sm">
                <Clock className="w-5 h-5 text-rose-500 animate-spin" />
                <span className="text-base font-black text-rose-800">
                  Bắt đầu trò chơi trong: {segmentTimeLeft}s
                </span>
              </div>
            </div>
          )}

          {currentSegment.gameType === 'fruitslash' && (
            <FruitSlashGame
              progress={progress}
              onUpdateProgress={onUpdateProgress}
              gesture={gesture}
              onBack={onBack}
              workoutMode={true}
              isPaused={isPaused}
            />
          )}

          {currentSegment.gameType === 'chickenblaster' && (
            <ChickenBlasterGame
              progress={progress}
              onUpdateProgress={onUpdateProgress}
              gesture={gesture}
              onBack={onBack}
              workoutMode={true}
              isPaused={isPaused}
            />
          )}

          {currentSegment.gameType === 'sweetzombie' && (
            <SweetZombieGame
              progress={progress}
              onUpdateProgress={onUpdateProgress}
              gesture={gesture}
              onBack={onBack}
              workoutMode={true}
              isPaused={isPaused}
            />
          )}

          {currentSegment.gameType === 'starcatcher' && (
            <StarCatcherGame
              progress={progress}
              onUpdateProgress={onUpdateProgress}
              gesture={gesture}
              onBack={onBack}
              workoutMode={true}
              isPaused={isPaused}
            />
          )}

          {currentSegment.gameType === 'cooldown' && (
            <div className="w-full h-[480px] bg-gradient-to-b from-teal-100 to-sky-100 rounded-3xl border-4 border-teal-200 p-8 flex flex-col items-center justify-center text-center shadow-xl">
              <div className="text-7xl mb-4 animate-bounce">🧘‍♂️🌸</div>
              <h2 className="text-3xl font-black text-teal-700">Thả Lỏng & Hít Thở</h2>
              <p className="text-slate-600 text-sm max-w-md mt-2 leading-relaxed">
                Thả lỏng hai cánh tay, đưa hai tay lên cao hít vào thật sâu, rồi từ từ hạ xuống thở ra nhẹ nhàng. Bé đã làm rất xuất sắc!
              </p>

              <div className="mt-8 flex items-center gap-2 bg-white/80 backdrop-blur-sm px-6 py-2 rounded-full border border-teal-200 shadow-sm">
                <span className="text-base font-black text-teal-800">
                  Hoàn thành sau: {segmentTimeLeft}s
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Final Workout Completion Summary */
        <div className="w-full h-[500px] bg-white rounded-3xl border-4 border-emerald-300 p-8 flex flex-col items-center justify-center text-center shadow-2xl">
          <Award className="w-24 h-24 text-yellow-500 animate-bounce mb-3" />
          <h2 className="text-3xl md:text-4xl font-black text-emerald-700">
            Hoàn Thành Xuất Sắc Buổi Tập!
          </h2>
          <p className="text-slate-500 text-xs font-bold mt-1">
            Bé đã kiên trì vận động và giải phóng năng lượng tuyệt vời!
          </p>

          <div className="grid grid-cols-3 gap-4 my-6 max-w-md w-full">
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Thời Gian</span>
              <p className="text-2xl font-black text-emerald-700">{mode === '5min' ? '5 Phút' : '10 Phút'}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-2xl border border-orange-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Năng Lượng Tiêu Hao</span>
              <p className="text-2xl font-black text-orange-600">{Math.round(caloriesBurned)} kcal</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Thưởng Ngôi Sao</span>
              <p className="text-2xl font-black text-yellow-600">+{mode === '5min' ? 25 : 50} ⭐</p>
            </div>
          </div>

          <button
            onClick={onBack}
            className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-xs rounded-full shadow-lg transition transform hover:scale-105"
          >
            QUAY VỀ MENU CHÍNH
          </button>
        </div>
      )}
    </div>
  );
}
