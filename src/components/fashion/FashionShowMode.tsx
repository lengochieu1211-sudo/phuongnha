/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Camera, Sparkles, Star, Award, Trophy, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useCameraPose } from '../../providers/CameraPoseContext';
import { audio } from '../../lib/AudioEngine';
import { voiceGuide } from '../../lib/VoiceGuideService';
import Confetti from '../Confetti';
import { PlayerProgress, GameGesture, CategoryType } from '../../types';
import { WARDROBE_ITEMS } from '../../utils/characterRenderer';
import RealisticWardrobeOverlay from './RealisticWardrobeOverlay';
import { FashionBodyAnchorEngine } from './FashionBodyAnchorEngine';

interface FashionShowModeProps {
  progress: PlayerProgress;
  onUpdateProgress: (updater: (p: PlayerProgress) => PlayerProgress) => void;
  onFinished: (score: number, starsEarned: number, diamondsEarned: number) => void;
  onBack: () => void;
  activeOutfitEmojis: string[];
  equippedIds: { [key in CategoryType]?: string };
}

interface FashionPose {
  id: string;
  name: string;
  emoji: string;
  gestureNeeded: GameGesture;
  points: number;
  description: string;
}

const FASHION_POSES: FashionPose[] = [
  { id: 'pose_both_up', name: 'Chào Ngôi Sao!', emoji: '🙌', gestureNeeded: 'both_arms_up', points: 100, description: 'Giơ hai tay lên thật cao để chào khán giả!' },
  { id: 'pose_spread', name: 'Cánh Chim Cầu Vồng', emoji: '🦅', gestureNeeded: 'hands_spread', points: 120, description: 'Dang rộng hai tay ra hai bên để tạo dáng bay!' },
  { id: 'pose_left_up', name: 'Chào Bên Trái', emoji: '↖️', gestureNeeded: 'left_arm_up', points: 100, description: 'Giơ cao tay trái vẫy chào nồng nhiệt!' },
  { id: 'pose_right_up', name: 'Chào Bên Phải', emoji: '↗️', gestureNeeded: 'right_arm_up', points: 100, description: 'Giơ cao tay phải vẫy chào nồng nhiệt!' },
  { id: 'pose_duck', name: 'Cúi Chào Quý Tộc', emoji: '🙇', gestureNeeded: 'duck', points: 150, description: 'Cúi khom lưng thật lịch sự gửi lời cảm ơn khán giả!' },
];

export default function FashionShowMode({
  progress,
  onUpdateProgress,
  onFinished,
  onBack,
  activeOutfitEmojis,
  equippedIds,
}: FashionShowModeProps) {
  const { gesture, getLatestPose, isStreaming, videoElement } = useCameraPose();

  const hairRef = useRef<HTMLDivElement | null>(null);
  const headAccessoryRef = useRef<HTMLDivElement | null>(null);
  const maskRef = useRef<HTMLDivElement | null>(null);
  const necklaceRef = useRef<HTMLDivElement | null>(null);
  const glovesLeftRef = useRef<HTMLDivElement | null>(null);
  const glovesRightRef = useRef<HTMLDivElement | null>(null);
  const hatRef = useRef<HTMLDivElement | null>(null);
  const glassesRef = useRef<HTMLDivElement | null>(null);
  const shirtRef = useRef<HTMLDivElement | null>(null);
  const shoesLeftRef = useRef<HTMLDivElement | null>(null);
  const shoesRightRef = useRef<HTMLDivElement | null>(null);
  const wingsRef = useRef<HTMLDivElement | null>(null);
  const backpackRef = useRef<HTMLDivElement | null>(null);
  const cameraCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const anchorEngineRef = useRef<FashionBodyAnchorEngine>(new FashionBodyAnchorEngine());

  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [matchPercentage, setMatchPercentage] = useState(0); // 0 to 100
  const [poseStreak, setPoseStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'completed'>('playing');

  // Imperative 60 FPS runway render loop
  useEffect(() => {
    let active = true;

    const renderLoop = () => {
      if (!active) return;

      // Draw camera preview onto cameraCanvas at 60 FPS
      if (videoElement && cameraCanvasRef.current) {
        const camCanvas = cameraCanvasRef.current;
        const ctx = camCanvas.getContext('2d');
        if (ctx) {
          ctx.save();
          // Always mirror video for a mirror-like experience
          ctx.translate(camCanvas.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(videoElement, 0, 0, camCanvas.width, camCanvas.height);
          ctx.restore();
        }
      }

      const latest = getLatestPose();
      const anchors = anchorEngineRef.current.update(latest.landmarks, true); // true for mirrored camera

      if (anchors && latest.bodyDetected && gameState === 'playing') {
        // Helper to update DOM transform
        const updateDom = (ref: React.RefObject<HTMLDivElement | null>, pos: { x: number; y: number; confidence: number }, widthPct: number, heightPct?: number, rotation = 0, yOffset = 0) => {
          const el = ref.current;
          if (!el) return;

          if (pos.confidence >= 0.45) {
            el.style.display = 'flex';
            el.style.left = `${pos.x * 100}%`;
            el.style.top = `${(pos.y + yOffset) * 100}%`;
            const safeWidth = Math.max(3, Math.min(95, widthPct * 100));
            el.style.width = `${safeWidth}%`;
            if (heightPct !== undefined) {
              const safeHeight = Math.max(3, Math.min(95, heightPct * 100));
              el.style.height = `${safeHeight}%`;
            }
            
            // Build transform string
            let transform = 'translate(-50%, -50%)';
            if (rotation !== 0) {
              transform += ` rotate(${rotation}deg)`;
            }
            el.style.transform = transform;
            el.style.opacity = '1';
          } else {
            el.style.opacity = '0';
            el.style.display = 'none';
          }
        };

        updateDom(hairRef, anchors.headCenter, anchors.headWidth * 1.75, anchors.headWidth * 1.95, anchors.torsoRotation, 0.04);
        const hatOffset = -anchors.headWidth * 0.42;
        updateDom(hatRef, anchors.headCenter, anchors.headWidth * 1.55, undefined, anchors.torsoRotation, hatOffset);
        updateDom(headAccessoryRef, anchors.headCenter, anchors.headWidth * 1.52, undefined, anchors.torsoRotation, -anchors.headWidth * 0.34);
        updateDom(glassesRef, anchors.headCenter, anchors.headWidth * 0.88, undefined, anchors.torsoRotation, 0.03);
        updateDom(maskRef, anchors.headCenter, anchors.headWidth * 1.03, anchors.headWidth * 0.68, anchors.torsoRotation, 0.055);

        const reliableHipWidth = anchors.hipCenter.confidence >= 0.45 ? anchors.hipWidth : anchors.shoulderWidth * 0.72;
        const fittedBodyWidth = Math.max(anchors.shoulderWidth * 1.54, reliableHipWidth * 1.32);
        const torsoH = Math.max(anchors.torsoHeight * 1.48, fittedBodyWidth * 1.05);
        updateDom(shirtRef, anchors.torsoCenter, fittedBodyWidth, torsoH, anchors.torsoRotation, 0.015);
        updateDom(necklaceRef, anchors.shoulderCenter, anchors.shoulderWidth * 0.82, anchors.torsoHeight * 0.62, anchors.torsoRotation, 0.11);

        const gloveWidth = Math.max(anchors.headWidth * 0.42, anchors.hipWidth * 0.24, 0.045);
        updateDom(glovesLeftRef, anchors.leftWrist, gloveWidth, gloveWidth * 1.15, 0, 0);
        updateDom(glovesRightRef, anchors.rightWrist, gloveWidth, gloveWidth * 1.15, 0, 0);
        updateDom(shoesLeftRef, anchors.leftAnkle, Math.max(anchors.hipWidth * 0.42, 0.075), undefined, 0, 0.02);
        updateDom(shoesRightRef, anchors.rightAnkle, Math.max(anchors.hipWidth * 0.42, 0.075), undefined, 0, 0.02);

        // 5. Wings overlay (Behind Torso Center, slightly scaled up)
        updateDom(wingsRef, anchors.torsoCenter, anchors.shoulderWidth * 2.85, anchors.torsoHeight * 1.5, anchors.torsoRotation, -0.05);

        // 6. Backpack overlay (Center of shoulders)
        updateDom(backpackRef, anchors.shoulderCenter, anchors.shoulderWidth * 1.15, anchors.torsoHeight * 0.9, anchors.torsoRotation, 0.1);
      } else {
        // Lost body tracking or calibration -> hide overlays
        const hide = (ref: React.RefObject<HTMLDivElement | null>) => {
          if (ref.current) ref.current.style.display = 'none';
        };
        hide(hairRef);
        hide(hatRef);
        hide(headAccessoryRef);
        hide(glassesRef);
        hide(maskRef);
        hide(necklaceRef);
        hide(shirtRef);
        hide(glovesLeftRef);
        hide(glovesRightRef);
        hide(shoesLeftRef);
        hide(shoesRightRef);
        hide(wingsRef);
        hide(backpackRef);
      }

      requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      active = false;
    };
  }, [getLatestPose, gameState, isStreaming, videoElement]);

  // Flash & photo mode states
  const [photoFlash, setPhotoFlash] = useState(false);
  const [photoCountdown, setPhotoCountdown] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);

  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activePose = FASHION_POSES[currentPoseIndex] || FASHION_POSES[0];

  // Speak when a new pose starts
  useEffect(() => {
    if (gameState !== 'playing') return;

    voiceGuide.speak(`Hãy tạo dáng: ${activePose.name}! ${activePose.description}`, 'high');
  }, [currentPoseIndex, gameState]);

  // Real-time matching logic
  useEffect(() => {
    if (gameState !== 'playing' || photoCountdown !== null) return;

    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    if (gesture === activePose.gestureNeeded) {
      let progressVal = 0;
      holdTimerRef.current = setInterval(() => {
        progressVal += 10;
        setMatchPercentage(Math.min(100, progressVal));

        if (progressVal >= 100) {
          clearInterval(holdTimerRef.current!);
          holdTimerRef.current = null;
          
          // Trigger pose capture countdown!
          triggerPhotoCountdown();
        }
      }, 150); // Takes ~1.5 seconds of holding
    } else {
      setMatchPercentage(0);
    }

    return () => {
      if (holdTimerRef.current) {
        clearInterval(holdTimerRef.current);
      }
    };
  }, [gesture, currentPoseIndex, gameState, photoCountdown]);

  const triggerPhotoCountdown = () => {
    audio.playPowerup();
    
    // Announce count-down through the shared voice profile (female/male/baby).
    voiceGuide.speak('Ba, hai, một... cười lên nào!', 'high');

    setPhotoCountdown(3);
    
    countdownIntervalRef.current = setInterval(() => {
      setPhotoCountdown((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current!);
          countdownIntervalRef.current = null;
          triggerCameraFlash();
          return null;
        }
        audio.playMenuClick();
        return prev - 1;
      });
    }, 800);
  };

  const triggerCameraFlash = () => {
    // Snap photo flash!
    audio.playDiceRoll();
    setPhotoFlash(true);
    setTimeout(() => setPhotoFlash(false), 150);

    // Save virtual snapshot of their outfit
    setCapturedPhotos((prev) => [...prev, activePose.id]);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);

    // Increment scores
    setScore((prev) => prev + activePose.points + (poseStreak * 15));
    setPoseStreak((prev) => prev + 1);

    // Sync stats
    onUpdateProgress((prev) => ({
      ...prev,
      parentStats: {
        ...prev.parentStats,
        starsEarnedToday: prev.parentStats.starsEarnedToday + 3,
      }
    }));

    // Transition to next pose
    setTimeout(() => {
      if (currentPoseIndex < FASHION_POSES.length - 1) {
        setCurrentPoseIndex((prev) => prev + 1);
        setMatchPercentage(0);
      } else {
        // Complete game!
        handleGameCompletion();
      }
    }, 1200);
  };

  const handleGameCompletion = () => {
    setGameState('completed');
    audio.playRoundStartJingle();
    setShowConfetti(true);

    const starsReward = 15 + poseStreak * 3;
    const diamondsReward = 3 + Math.floor(poseStreak / 2);

    // Save final results to user progression
    onUpdateProgress((prev) => {
      // High score tracking
      const previousHigh = prev.highScores?.fashion_show || 0;
      const nextHigh = Math.max(previousHigh, score + starsReward * 10);
      
      const updatedHighScores = {
        ...prev.highScores,
        fashion_show: nextHigh
      };

      return {
        ...prev,
        stars: prev.stars + starsReward,
        diamonds: prev.diamonds + diamondsReward,
        highScores: updatedHighScores,
        parentStats: {
          ...prev.parentStats,
          stagesCompleted: prev.parentStats.stagesCompleted + 1,
          starsEarnedToday: prev.parentStats.starsEarnedToday + starsReward,
        }
      };
    });

    voiceGuide.speak('Fashion Show hoàn thành! Bé trình diễn rất tuyệt vời!', 'high');
  };

  return (
    <div id="fashion-show-game" className="flex flex-col items-center gap-6 w-full max-w-5xl mx-auto p-4 md:p-6 bg-indigo-50/70 rounded-3xl border-4 border-indigo-200 shadow-xl relative select-none">
      {showConfetti && <Confetti />}

      {photoFlash && (
        <div className="absolute inset-0 bg-white z-50 animate-pulse pointer-events-none transition-all duration-100" />
      )}

      {/* Header */}
      <div className="flex w-full items-center justify-between border-b-2 border-indigo-100 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-full font-bold bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-100 transition shadow-xs text-xs"
        >
          ← Thoát Show
        </button>

        <h2 className="text-lg md:text-xl font-black text-indigo-800 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-yellow-500 fill-yellow-400" />
          Fashion Show Trình Diễn Cát Tường
        </h2>

        <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 bg-indigo-100 px-3.5 py-1.5 rounded-full">
          <span>Điểm: {score}</span>
          <span className="text-amber-500 font-extrabold">★ Combo x{poseStreak}</span>
        </div>
      </div>

      {gameState === 'playing' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full items-center">
          {/* Pose card details */}
          <div className="lg:col-span-1 bg-white p-5 rounded-2xl border-2 border-indigo-100 shadow-md flex flex-col items-center text-center gap-4">
            <span className="text-xs font-black bg-indigo-100 text-indigo-700 px-3.5 py-1 rounded-full uppercase tracking-wider">
              TƯ THẾ {currentPoseIndex + 1}/{FASHION_POSES.length}
            </span>

            <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl shadow-lg animate-bounce">
              {activePose.emoji}
            </div>

            <h3 className="text-xl font-black text-indigo-900">{activePose.name}</h3>
            <p className="text-xs text-slate-500 font-bold leading-relaxed">{activePose.description}</p>

            <div className="w-full flex flex-col gap-1 text-left bg-slate-50 p-3 rounded-xl border border-slate-200 text-[10px] font-bold text-slate-500">
              <span className="text-indigo-600">👗 Bộ cánh bé đang diện:</span>
              <div className="flex gap-1.5 mt-1 text-lg">
                {activeOutfitEmojis.map((emo, i) => (
                  <span key={i} className="bg-white p-1 rounded-md border border-slate-200 shadow-xs">{emo}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Action indicator and countdown */}
          <div className="lg:col-span-2 relative overflow-hidden aspect-[4/3] w-full max-w-xl mx-auto rounded-2xl border-4 border-indigo-200 shadow-2xl bg-slate-950 flex flex-col items-center justify-center">
            
            {/* Real-time Camera Stream Canvas */}
            <canvas 
              ref={cameraCanvasRef}
              width={640}
              height={480}
              className="absolute inset-0 w-full h-full object-cover z-0"
            />

            {/* CAMERA STAGE OVERLAYS (IMPERATIVE DOM REFS) */}
            <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
              <div ref={hairRef} className="absolute pointer-events-none items-center justify-center" style={{display:'none'}}><RealisticWardrobeOverlay itemId={equippedIds.hair} category="hair" /></div>
            <div ref={headAccessoryRef} className="absolute pointer-events-none items-center justify-center" style={{display:'none'}}><RealisticWardrobeOverlay itemId={equippedIds.headaccessory || equippedIds.bow} category={equippedIds.headaccessory ? 'headaccessory' : 'bow'} /></div>
            <div ref={maskRef} className="absolute pointer-events-none items-center justify-center" style={{display:'none'}}><RealisticWardrobeOverlay itemId={equippedIds.mask} category="mask" /></div>
            <div ref={necklaceRef} className="absolute pointer-events-none items-center justify-center" style={{display:'none'}}><RealisticWardrobeOverlay itemId={equippedIds.necklace} category="necklace" /></div>
            <div ref={glovesLeftRef} className="absolute pointer-events-none items-center justify-center" style={{display:'none'}}><RealisticWardrobeOverlay itemId={equippedIds.gloves} category="gloves" side="left" /></div>
            <div ref={glovesRightRef} className="absolute pointer-events-none items-center justify-center" style={{display:'none'}}><RealisticWardrobeOverlay itemId={equippedIds.gloves} category="gloves" side="right" /></div>
            {/* Hat overlay container */}
              <div 
                ref={hatRef} 
                className="absolute pointer-events-none select-none items-center justify-center text-center transition-all duration-75"
                style={{ display: 'none', filter: 'drop-shadow(0 10px 16px rgba(0,0,0,0.5))' }}
              >
                <RealisticWardrobeOverlay itemId={equippedIds?.hat || equippedIds?.crown} category={equippedIds?.crown ? 'crown' : 'hat'} />
              </div>

              {/* Glasses overlay */}
              <div 
                ref={glassesRef} 
                className="absolute pointer-events-none select-none items-center justify-center text-center transition-all duration-75"
                style={{ display: 'none', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))' }}
              >
                <RealisticWardrobeOverlay itemId={equippedIds?.glasses} category="glasses" />
              </div>

              {/* Shirt overlay */}
              <div 
                ref={shirtRef} 
                className="absolute pointer-events-none select-none items-center justify-center text-center transition-all duration-75"
                style={{ display: 'none', filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.4))' }}
              >
                <RealisticWardrobeOverlay itemId={equippedIds?.shirt} category="shirt" />
              </div>

              {/* Left Shoe */}
              <div 
                ref={shoesLeftRef} 
                className="absolute pointer-events-none select-none items-center justify-center text-center transition-all duration-75"
                style={{ display: 'none', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}
              >
                <RealisticWardrobeOverlay itemId={equippedIds?.shoes} category="shoes" side="left" />
              </div>

              {/* Right Shoe */}
              <div 
                ref={shoesRightRef} 
                className="absolute pointer-events-none select-none items-center justify-center text-center transition-all duration-75"
                style={{ display: 'none', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}
              >
                <RealisticWardrobeOverlay itemId={equippedIds?.shoes} category="shoes" side="right" />
              </div>

              {/* Wings overlay */}
              <div 
                ref={wingsRef} 
                className="absolute pointer-events-none select-none items-center justify-center text-center transition-all duration-75"
                style={{ display: 'none', filter: 'drop-shadow(0 10px 16px rgba(0,0,0,0.4))' }}
              >
                <RealisticWardrobeOverlay itemId={equippedIds?.wings} category="wings" />
              </div>

              {/* Backpack overlay */}
              <div 
                ref={backpackRef} 
                className="absolute pointer-events-none select-none items-center justify-center text-center transition-all duration-75"
                style={{ display: 'none', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.4))' }}
              >
                <RealisticWardrobeOverlay itemId={equippedIds?.backpack} category="backpack" />
              </div>
            </div>

            {/* Live Camera Runway HUD */}
            <div className="absolute inset-0 bg-slate-950/20 z-20 flex flex-col items-center justify-between p-4 pointer-events-none">
              
              {/* Photo Countdown */}
              {photoCountdown !== null ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2">
                  <div className="w-20 h-20 rounded-full bg-red-500 text-white flex items-center justify-center text-4xl font-black shadow-2xl animate-ping absolute" />
                  <div className="w-20 h-20 rounded-full bg-red-600 text-white flex items-center justify-center text-4xl font-black shadow-lg relative z-10">
                    {photoCountdown}
                  </div>
                  <span className="text-xs font-black text-white bg-red-600 px-3 py-1 rounded-full shadow-lg tracking-wider animate-pulse uppercase mt-4">Tạo dáng chuẩn - Sắp chụp ảnh! 📸</span>
                </div>
              ) : (
                <div className="w-full flex-1 flex flex-col justify-between pointer-events-none">
                  {/* Top: Feedback guide */}
                  <div className="text-center bg-black/60 px-4 py-2 rounded-xl border border-indigo-500/20 max-w-sm mx-auto backdrop-blur-xs">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider mb-0.5">Khớp Dáng Siêu Mẫu</h4>
                    <p className="text-[9px] text-indigo-200 font-bold">Hãy đứng trước camera, làm theo tư thế bên trái!</p>
                  </div>

                  {/* Bottom: Progress bar */}
                  <div className="w-full max-w-sm mx-auto flex flex-col items-center gap-1.5 bg-black/60 p-2.5 rounded-xl border border-slate-700/30 backdrop-blur-xs">
                    <div className="w-full h-4 bg-slate-900/80 rounded-full overflow-hidden border border-slate-800 flex items-center justify-center relative">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-100 absolute left-0"
                        style={{ width: `${matchPercentage}%` }}
                      />
                      <span className="relative z-10 text-[10px] font-black text-white drop-shadow-sm">{matchPercentage}%</span>
                    </div>

                    {matchPercentage > 0 ? (
                      <div className="text-[9px] font-black text-amber-300 animate-pulse uppercase tracking-wider">
                        Giữ nguyên dáng tuyệt vời! ⏳
                      </div>
                    ) : (
                      <div className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                        Chờ nhận diện đúng tư thế...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Completion screen */
        <div className="flex flex-col items-center text-center p-8 bg-white rounded-3xl border-4 border-indigo-100 shadow-2xl max-w-lg w-full mx-auto gap-4">
          <Trophy className="w-20 h-20 text-yellow-500 fill-yellow-400 animate-bounce" />
          <h3 className="text-2xl md:text-3xl font-black text-indigo-700">Màn Trình Diễn Hoàn Hảo!</h3>
          <p className="text-xs text-slate-500 font-bold leading-relaxed">
            Bé đã hoàn thành xuất sắc buổi biểu diễn thời trang Gương Phép Thuật với thần thái siêu mẫu!
          </p>

          <div className="grid grid-cols-2 gap-3 w-full my-4">
            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 flex flex-col justify-center">
              <span className="text-[10px] text-indigo-600 font-black uppercase">SAO NHẬN ĐƯỢC</span>
              <span className="text-2xl font-black text-indigo-700 flex items-center justify-center gap-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-500" />
                +{15 + poseStreak * 3}
              </span>
            </div>
            <div className="bg-pink-50/50 p-4 rounded-xl border border-pink-100 flex flex-col justify-center">
              <span className="text-[10px] text-pink-600 font-black uppercase">KIM CƯƠNG THƯỞNG</span>
              <span className="text-2xl font-black text-pink-700 flex items-center justify-center gap-1">
                💎 +{3 + Math.floor(poseStreak / 2)}
              </span>
            </div>
          </div>

          <div className="w-full text-left bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="text-xs font-black text-slate-600">📸 Album Ảnh Thời Trang Của Bé:</span>
            <div className="flex gap-2.5 mt-2 justify-center">
              {capturedPhotos.map((poseId, i) => {
                const pose = FASHION_POSES.find(p => p.id === poseId);
                return (
                  <div key={i} className="w-12 h-12 bg-white rounded-xl border-2 border-slate-300 shadow-md flex items-center justify-center text-2xl relative overflow-hidden">
                    <span>{pose?.emoji}</span>
                    <div className="absolute bottom-0 right-0 bg-indigo-500 text-white text-[8px] px-1 font-black">
                      ✓
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => onFinished(score, 15 + poseStreak * 3, 3 + Math.floor(poseStreak / 2))}
            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-sm rounded-full shadow-lg hover:shadow-indigo-100 transition flex items-center justify-center gap-2"
          >
            Nhận Phần Thưởng & Về Gương
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
