/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, Sparkles, Trophy, Music, ArrowLeft, RefreshCw } from 'lucide-react';
import { PlayerProgress, GameGesture } from '../types';
import { audio } from '../lib/AudioEngine';
import { voiceGuide } from '../lib/VoiceGuideService';
import { VOICE_LINES } from '../lib/voiceLines.vi';
import { recordMissionProgress } from '../utils/progression';

interface DanceGameProps {
  progress: PlayerProgress;
  onUpdateProgress: (updater: (p: PlayerProgress) => PlayerProgress) => void;
  gesture: GameGesture;
  onBack: () => void;
}

interface DanceBeat {
  id: string;
  gesture: GameGesture;
  timeOffset: number; // seconds from start
  label: string;
  emoji: string;
  color: string;
  hit: 'perfect' | 'great' | 'ok' | 'miss' | null;
}

const STATIC_BEATS_SEQUENCE: Omit<DanceBeat, 'id' | 'hit'>[] = [
  { gesture: 'left_arm_up', timeOffset: 2.0, label: 'Tay trái bay', emoji: '🫲', color: 'bg-emerald-400 border-emerald-300 shadow-emerald-200' },
  { gesture: 'right_arm_up', timeOffset: 4.5, label: 'Tay phải múa', emoji: '🫱', color: 'bg-pink-400 border-pink-300 shadow-pink-200' },
  { gesture: 'both_arms_up', timeOffset: 7.0, label: 'Cùng chào nhé', emoji: '🙌', color: 'bg-purple-400 border-purple-300 shadow-purple-200' },
  { gesture: 'tilt_left', timeOffset: 9.5, label: 'Lắc trái dẻo', emoji: '←', color: 'bg-amber-400 border-amber-300 shadow-amber-200' },
  { gesture: 'tilt_right', timeOffset: 12.0, label: 'Lắc phải ngoan', emoji: '→', color: 'bg-orange-400 border-orange-300 shadow-orange-200' },
  { gesture: 'hands_spread', timeOffset: 14.5, label: 'Xòe cánh hoa', emoji: '👐', color: 'bg-sky-400 border-sky-300 shadow-sky-200' },
  { gesture: 'jump', timeOffset: 17.0, label: 'Nhảy cao nào', emoji: '🦘', color: 'bg-teal-400 border-teal-300 shadow-teal-200' },
  { gesture: 'duck', timeOffset: 19.5, label: 'Cúi thấp trốn', emoji: '🙇', color: 'bg-indigo-400 border-indigo-300 shadow-indigo-200' },
  { gesture: 'left_arm_up', timeOffset: 22.0, label: 'Trái vẫy chào', emoji: '🫲', color: 'bg-emerald-400 border-emerald-300 shadow-emerald-200' },
  { gesture: 'right_arm_up', timeOffset: 24.5, label: 'Phải vẫy chào', emoji: '🫱', color: 'bg-pink-400 border-pink-300 shadow-pink-200' },
  { gesture: 'both_arms_up', timeOffset: 27.0, label: 'Vui thật vui', emoji: '🙌', color: 'bg-purple-400 border-purple-300 shadow-purple-200' },
];

export default function DanceGame({ progress, onUpdateProgress, gesture, onBack }: DanceGameProps) {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'game_over'>('intro');
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [beats, setBeats] = useState<DanceBeat[]>([]);
  const [playbackTime, setPlaybackTime] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [feedbackColor, setFeedbackColor] = useState<string>('text-yellow-400');

  const startTimeRef = useRef<number>(0);
  const animFrameRef = useRef<any>(null);
  const scoreRef = useRef<number>(0);

  // Initialize and duplicate/arrange the beats list
  const startGame = () => {
    audio.playRoundStartJingle();
    audio.stopMusic(); // Reset current procedural loop to coordinate with dance
    audio.startMusic(); // Restart fresh upbeat tone loops
    voiceGuide.speak('Cùng nhảy múa theo điệu nhạc vui nhộn nào!', 'high');

    const initializedBeats: DanceBeat[] = STATIC_BEATS_SEQUENCE.map((b, i) => ({
      ...b,
      id: `beat_${i}_${Date.now()}`,
      hit: null,
    }));

    setBeats(initializedBeats);
    setScore(0);
    scoreRef.current = 0;
    setCombo(0);
    setMaxCombo(0);
    setPlaybackTime(0);
    setFeedback('');
    setGameState('playing');

    startTimeRef.current = Date.now();
    animFrameRef.current = requestAnimationFrame(updatePlayback);
  };

  const updatePlayback = () => {
    if (!startTimeRef.current) return;
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    setPlaybackTime(elapsed);

    // End of track (e.g. 30 seconds limit)
    if (elapsed > 30) {
      endGame();
      return;
    }

    // Auto-miss evaluation for beats that went too far past the hit line (more than 1.0 second past)
    setBeats((prevBeats) =>
      prevBeats.map((b) => {
        if (b.hit === null && elapsed > b.timeOffset + 0.8) {
          setCombo(0);
          setFeedback('HỤT RỒI! 💨');
          setFeedbackColor('text-slate-400');
          return { ...b, hit: 'miss' };
        }
        return b;
      })
    );

    animFrameRef.current = requestAnimationFrame(updatePlayback);
  };

  // Check gesture matches during beats crossing
  useEffect(() => {
    if (gameState !== 'playing' || gesture === 'standing' || beats.length === 0) return;

    const matchedBeat = beats.find(
      (b) => b.hit === null && Math.abs(playbackTime - b.timeOffset) < 0.8 && b.gesture === gesture
    );

    if (!matchedBeat) return;

    const diff = Math.abs(playbackTime - matchedBeat.timeOffset);
    let rating: 'perfect' | 'great' | 'ok' = 'ok';
    let points = 10;

    if (diff < 0.25) {
      rating = 'perfect';
      points = 30;
      setFeedback('HOÀN HẢO! ⭐');
      setFeedbackColor('text-yellow-400 font-black scale-110');
      audio.playCollect();
    } else if (diff < 0.5) {
      rating = 'great';
      points = 20;
      setFeedback('TUYỆT VỜI! ✨');
      setFeedbackColor('text-pink-400 font-extrabold');
      audio.playCollect();
    } else {
      rating = 'ok';
      points = 10;
      setFeedback('CỐ LÊN! 👍');
      setFeedbackColor('text-sky-400 font-bold');
      audio.playPetCareAction();
    }

    setScore((s) => {
      const next = s + points;
      scoreRef.current = next;
      return next;
    });
    setCombo((c) => {
      const next = c + 1;
      if (next > maxCombo) setMaxCombo(next);
      return next;
    });

    setBeats((prev) =>
      prev.map((b) => (b.id === matchedBeat.id ? { ...b, hit: rating } : b))
    );
  }, [gesture, playbackTime, gameState, beats, maxCombo]);

  const endGame = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setGameState('game_over');
    audio.playSuccess();
    voiceGuide.speak(VOICE_LINES.dance.finish, 'high');

    const finalScore = scoreRef.current;
    // Reward calculations
    const starsEarned = Math.floor(finalScore / 12);
    const diamondsEarned = Math.floor(finalScore / 45);

    onUpdateProgress((prev) => {
      const currentHigh = prev.highScores.dance || 0;
      let updated = {
        ...prev,
        stars: prev.stars + starsEarned,
        diamonds: prev.diamonds + diamondsEarned,
        highScores: {
          ...prev.highScores,
          dance: Math.max(currentHigh, finalScore),
        },
      };
      return recordMissionProgress(updated, 'dance', 1);
    });
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <div id="dance-game-container" className="flex flex-col items-center gap-6 w-full max-w-4xl mx-auto p-4 md:p-8 bg-indigo-50/80 rounded-3xl border-4 border-indigo-200 shadow-xl font-sans text-slate-800">
      {/* Top Header */}
      <div className="flex w-full items-center justify-between border-b-2 border-indigo-100 pb-4">
        <button
          id="dance-back-btn"
          onClick={() => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
            onBack();
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-full font-bold bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-100 transition shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại
        </button>

        <h2 className="text-2xl md:text-3xl font-extrabold text-indigo-700 flex items-center gap-2">
          <Music className="w-8 h-8 text-pink-500 fill-pink-500 animate-bounce" />
          Mini Game: Vũ Điệu Vui Nhộn
        </h2>

        <div className="flex items-center gap-2 bg-indigo-100/80 px-4 py-1.5 rounded-full border border-indigo-200">
          <Trophy className="w-5 h-5 text-yellow-600" />
          <span className="font-extrabold text-sm text-indigo-800">Chuỗi {combo}</span>
        </div>
      </div>

      {gameState === 'intro' && (
        <div id="dance-intro-card" className="flex flex-col items-center text-center p-6 bg-white rounded-2xl border-2 border-indigo-100 shadow-sm max-w-lg">
          <Music className="w-20 h-20 text-indigo-400 mb-4 animate-bounce" />
          <h3 className="text-2xl font-black text-indigo-600">Vũ Điệu Ngọt Ngào!</h3>
          <p className="text-slate-600 text-sm mt-2 leading-relaxed">
            Hòa mình vào giai điệu lấp lánh và thực hiện các động tác nhảy khi các bong bóng rơi đúng vào vòng tròn đích nha bé!
          </p>

          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-xs text-indigo-800 my-6 font-medium leading-relaxed">
            ✨ Nhạc hay - Dáng chuẩn! Chuẩn bị đứng vững vàng trước camera cách 2m, nâng cao hai tay xòe dẻo để lấy điểm hoàn hảo!
          </div>

          <button
            id="start-dance-btn"
            onClick={startGame}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-full text-lg shadow-lg hover:shadow-indigo-200 transition transform hover:scale-105"
          >
            MỞ NHẠC & QUẨY THÔI!
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Music Flow Track Section */}
          <div className="md:col-span-8 flex flex-col bg-slate-900 border-4 border-indigo-300 rounded-3xl p-4 overflow-hidden relative shadow-inner aspect-[4/3] w-full justify-end">
            {/* Hit Line / Target Circles at the top */}
            <div className="absolute top-20 inset-x-0 flex justify-around px-8 z-10">
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-16 h-16 rounded-full border-4 border-dashed border-pink-400 flex items-center justify-center bg-pink-900/30 text-white font-black text-2xl animate-pulse">
                  🎯
                </div>
                <span className="text-[9px] font-bold text-pink-300 tracking-widest bg-pink-950/80 px-2 py-0.5 rounded">VÒNG KHỚP</span>
              </div>
            </div>

            {/* Stage spot lighting effects */}
            <div className="absolute inset-x-0 top-0 h-2/3 pointer-events-none opacity-20">
              <div className="absolute left-1/4 top-0 w-24 h-full bg-gradient-to-b from-cyan-400 to-transparent transform -rotate-12 origin-top" />
              <div className="absolute right-1/4 top-0 w-24 h-full bg-gradient-to-b from-purple-400 to-transparent transform rotate-12 origin-top" />
            </div>

            {/* Bubble Beats scrolling upwards */}
            <div className="absolute inset-0 overflow-hidden">
              {beats.map((b) => {
                // Determine vertical scroll percentage based on difference between target time and current playback time
                // A beat scrolls from bottom (0.0 seconds early) to top (hit bar)
                const scrollTimeWindow = 2.0; // takes 2 seconds to scroll fully from bottom to hit bar
                const timeDiff = b.timeOffset - playbackTime; // seconds until hit
                const percentFromTop = 20 + (timeDiff / scrollTimeWindow) * 70; // 20% at hit bar, 90% at bottom

                // If past threshold or already hit, we can handle visibility
                if (timeDiff < -0.8 || b.hit !== null) {
                  if (b.hit === null) return null; // missed
                  if (b.hit === 'miss') return null; // hide misses
                }

                // Only render if within active window
                if (timeDiff > scrollTimeWindow) return null;

                return (
                  <div
                    key={b.id}
                    className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none transition-all duration-75"
                    style={{
                      top: `${percentFromTop}%`,
                    }}
                  >
                    {/* Glowing outer ring */}
                    <div className="absolute -inset-2 rounded-full bg-indigo-500/10 blur-sm animate-ping" />

                    <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center text-2xl font-black text-white ${b.color}`}>
                      {b.emoji}
                    </div>
                    <span className="mt-1 bg-black/85 text-white font-bold text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider shadow">
                      {b.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bottom track label */}
            <div className="z-10 bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-700/80 flex justify-between items-center text-xs text-indigo-200">
              <span className="flex items-center gap-1">🎵 Nhịp điệu: <b className="text-white">Happy Jump Loop</b></span>
              <span>Thời gian: {playbackTime.toFixed(1)}s / 30s</span>
            </div>
          </div>

          {/* Right Section: Scores & interactive actions */}
          <div className="md:col-span-4 flex flex-col gap-4">
            {/* Visual hit precision feedback popup */}
            <div className="h-16 flex items-center justify-center text-center">
              {feedback && (
                <div id="dance-precision-feedback" className={`text-2xl font-black ${feedbackColor} tracking-wider transition-all duration-300 scale-105 filter drop-shadow-[0_2px_10px_rgba(255,255,255,0.4)]`}>
                  {feedback}
                </div>
              )}
            </div>

            {/* Scorecard */}
            <div className="bg-white p-5 rounded-2xl border-2 border-indigo-100 shadow-sm">
              <p className="text-xs font-bold text-slate-400">ĐIỂM NHẢY</p>
              <p className="text-4xl font-black text-indigo-600">{score}</p>
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-indigo-50 text-xs">
                <span className="text-slate-400 font-bold">KỶ LỤC CHUỖI</span>
                <span className="font-extrabold text-slate-700">{maxCombo} nhịp liên tiếp</span>
              </div>
            </div>

            {/* Quick Pose Guide Info */}
            <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 text-xs text-indigo-950">
              <p className="font-bold mb-1">🕺 Tư thế của bé lúc này:</p>
              <p className="font-extrabold text-indigo-700 text-sm capitalize">{gesture === 'standing' ? 'Sẵn Sàng Đứng Yên' : gesture.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      )}

      {gameState === 'game_over' && (
        <div id="dance-gameover-card" className="flex flex-col items-center text-center p-8 bg-white rounded-2xl border-2 border-indigo-100 shadow-sm max-w-lg">
          <Trophy className="w-20 h-20 text-yellow-500 animate-bounce mb-4" />
          <h3 className="text-3xl font-black text-indigo-600">Tuyệt Vời Bé Ơi!</h3>
          <p className="text-slate-500 text-sm mt-1">Giai điệu vui nhộn kết thúc hoàn hảo!</p>

          <div className="grid grid-cols-2 gap-4 w-full my-6 text-sm">
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
              <span className="text-xs text-slate-400 font-bold">ĐIỂM ĐẠT ĐƯỢC</span>
              <span className="text-3xl font-black text-indigo-600">{score}</span>
            </div>
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
              <span className="text-xs text-slate-400 font-bold">CHUỖI COMBO CAO NHẤT</span>
              <span className="text-3xl font-black text-indigo-600">{maxCombo}</span>
            </div>
          </div>

          <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/60 w-full mb-6">
            <h4 className="font-bold text-indigo-700 text-sm mb-1">🎁 Quà tặng nhận được:</h4>
            <div className="flex justify-center gap-6 text-sm font-extrabold text-slate-700 mt-2">
              <span className="flex items-center gap-1">⭐ +{Math.max(1, Math.floor(score / 12))} Sao</span>
              <span className="flex items-center gap-1">💎 +{Math.max(0, Math.floor(score / 45))} Kim Cương</span>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              id="retry-dance-btn"
              onClick={startGame}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-full shadow-md transition transform hover:scale-105"
            >
              <RefreshCw className="w-5 h-5" />
              Quẩy tiếp
            </button>
            <button
              id="quit-dance-btn"
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
