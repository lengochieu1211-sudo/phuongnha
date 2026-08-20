/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  Circle,
  RefreshCw,
  Camera,
  Activity,
  Zap,
  Sparkles,
  Award,
  ArrowLeft,
  Sliders,
  ShieldCheck,
  Target,
  Compass,
  Cpu,
  Eye,
} from 'lucide-react';
import { GameGesture } from '../types';
import { audio } from '../lib/AudioEngine';
import { voiceGuide } from '../lib/VoiceGuideService';
import { useCameraPose } from '../providers/CameraPoseContext';
import { drawImageContain } from '../utils/cameraFrame';
import { TrackingMode } from '../utils/poseDetector';

interface MotionTestScreenProps {
  onBack: () => void;
}

interface GestureTestItem {
  id: GameGesture;
  label: string;
  desc: string;
  icon: string;
}

const GESTURE_CHECKLIST: GestureTestItem[] = [
  { id: 'standing', label: 'Đứng Thẳng Người', desc: 'Đứng thẳng người trước camera', icon: '🧍' },
  { id: 'left_arm_up', label: 'Giơ Tay Trái', desc: 'Giơ cao tay trái qua đầu', icon: '🙋‍♂️' },
  { id: 'right_arm_up', label: 'Giơ Tay Phải', desc: 'Giơ cao tay phải qua đầu', icon: '🙋‍♀️' },
  { id: 'both_arms_up', label: 'Giơ Cả Hai Tay', desc: 'Giơ cả 2 tay lên cao chào đón', icon: '🙌' },
  { id: 'hands_spread', label: 'Dang Rộng Hai Tay', desc: 'Dang rộng 2 tay như cánh chim', icon: '🦅' },
  { id: 'jump', label: 'Nhảy Bật Cao', desc: 'Nhún chân nhảy lên một cái thật khỏe', icon: '🦘' },
  { id: 'duck', label: 'Cúi Người / Ngồi Xổm', desc: 'Hạ thấp người xuống để né chướng ngại', icon: '🙇' },
  { id: 'tilt_left', label: 'Nghiêng Trái', desc: 'Nghiêng người sang bên trái', icon: '↖️' },
  { id: 'tilt_right', label: 'Nghiêng Phải', desc: 'Nghiêng người sang bên phải', icon: '↗️' },
  { id: 'clap', label: 'Vỗ Tay', desc: 'Chắp hoặc vỗ 2 bàn tay trước ngực', icon: '👏' },
];

export default function MotionTestScreen({ onBack }: MotionTestScreenProps) {
  const {
    isStreaming,
    isCameraReady,
    poseStatus,
    startCamera,
    stopCamera,
    trackingMode,
    setTrackingMode,
    gesture,
    rawGesture,
    leftWrist,
    rightWrist,
    bodyDetected,
    fullBodyDetected,
    poseConfidence,
    poseFps,
    trackingFeedback,
    canvasElement,
    videoElement,
    isSkeletonVisible,
    setIsSkeletonVisible,
    steeringAngleDeg,
    steeringNormalized,
  } = useCameraPose();

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [completedGestures, setCompletedGestures] = useState<Set<GameGesture>>(new Set());
  const [activeTab, setActiveTab] = useState<'checklist' | 'targets' | 'steering'>('checklist');

  // Targets state
  const [leftTargetHit, setLeftTargetHit] = useState<boolean>(false);
  const [rightTargetHit, setRightTargetHit] = useState<boolean>(false);
  const [targetScore, setTargetScore] = useState<number>(0);

  // Auto start camera if not started & enable skeleton diagnostic overlay
  useEffect(() => {
    setIsSkeletonVisible(true);
    if (!isStreaming) {
      startCamera();
    }
  }, [isStreaming, startCamera, setIsSkeletonVisible]);

  // Mirror master canvas to preview canvas in real time
  useEffect(() => {
    let animId: number;

    const renderLoop = () => {
      if (isStreaming && previewCanvasRef.current && canvasElement) {
        const destCtx = previewCanvasRef.current.getContext('2d');
        if (destCtx && canvasElement.width > 0 && canvasElement.height > 0) {
          drawImageContain(
            destCtx,
            canvasElement,
            previewCanvasRef.current.width,
            previewCanvasRef.current.height,
            false,
          );
        }
      }
      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [isStreaming, canvasElement]);

  // Mark gesture as completed when actually performed with body detected
  useEffect(() => {
    if (gesture && bodyDetected && poseStatus === 'running' && !completedGestures.has(gesture)) {
      setCompletedGestures((prev) => {
        const next = new Set(prev);
        next.add(gesture);
        return next;
      });
      audio.playCollect();
    }
  }, [gesture, bodyDetected, poseStatus, completedGestures]);

  // Check Target Collisions
  useEffect(() => {
    if (activeTab !== 'targets' || !isStreaming) return;

    const targetRadius = 0.14;

    if (leftWrist.visible) {
      const distL = Math.hypot(leftWrist.x - 0.2, leftWrist.y - 0.35);
      if (distL < targetRadius) {
        if (!leftTargetHit) {
          setLeftTargetHit(true);
          setTargetScore((s) => s + 10);
          audio.playPop();
          setTimeout(() => setLeftTargetHit(false), 700);
        }
      }
    }

    if (rightWrist.visible) {
      const distR = Math.hypot(rightWrist.x - 0.8, rightWrist.y - 0.35);
      if (distR < targetRadius) {
        if (!rightTargetHit) {
          setRightTargetHit(true);
          setTargetScore((s) => s + 10);
          audio.playPop();
          setTimeout(() => setRightTargetHit(false), 700);
        }
      }
    }
  }, [activeTab, isStreaming, leftWrist, rightWrist, leftTargetHit, rightTargetHit]);

  const resetChecklist = () => {
    setCompletedGestures(new Set());
    audio.playPowerup();
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 flex flex-col gap-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 md:p-5 rounded-3xl border-2 border-emerald-100 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            title="Quay lại"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🩺</span>
              <h1 className="text-lg md:text-xl font-black text-slate-900">
                Kiểm Tra MediaPipe Pose & Tọa Độ Tay
              </h1>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Nguồn camera duy nhất cho Chém Trái Cây, Gà Tinh Nghịch và Zombie
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => (isStreaming ? stopCamera() : startCamera())}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-xs transition shadow-sm ${
              isStreaming
                ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200'
                : 'bg-emerald-500 text-white hover:bg-emerald-600'
            }`}
          >
            <Camera className="w-4 h-4" />
            {isStreaming ? 'Tắt Camera' : 'Mở Camera'}
          </button>

          <button
            onClick={resetChecklist}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl font-black bg-slate-100 text-slate-600 hover:bg-slate-200 transition text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Làm Mới
          </button>
        </div>
      </div>

      {/* Main Grid: Left Stage (7 cols), Right Panel (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 cols: Interactive Camera Canvas Viewport */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="relative aspect-video w-full rounded-3xl overflow-hidden border-4 border-emerald-400 bg-slate-950 shadow-2xl flex items-center justify-center">
            {isStreaming ? (
              <>
                {/* Real Canvas rendering with MediaPipe skeleton */}
                <canvas
                  ref={previewCanvasRef}
                  width={640}
                  height={480}
                  className="w-full h-full object-contain bg-black"
                />

                {/* Hand Target Zones Overlay */}
                {activeTab === 'targets' && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Left Target */}
                    <div
                      className={`absolute w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center transition-all ${
                        leftTargetHit
                          ? 'border-emerald-400 bg-emerald-500/60 scale-125 shadow-lg shadow-emerald-500/50'
                          : 'border-blue-400 bg-blue-500/25 animate-pulse'
                      }`}
                      style={{ left: '12%', top: '25%' }}
                    >
                      <span className="text-2xl">✋</span>
                      <span className="text-[10px] font-black text-white">TAY TRÁI</span>
                      <span className="text-[8px] text-blue-200 font-mono">X: 0.2 / Y: 0.35</span>
                    </div>

                    {/* Right Target */}
                    <div
                      className={`absolute w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center transition-all ${
                        rightTargetHit
                          ? 'border-emerald-400 bg-emerald-500/60 scale-125 shadow-lg shadow-emerald-500/50'
                          : 'border-pink-400 bg-pink-500/25 animate-pulse'
                      }`}
                      style={{ right: '12%', top: '25%' }}
                    >
                      <span className="text-2xl">✋</span>
                      <span className="text-[10px] font-black text-white">TAY PHẢI</span>
                      <span className="text-[8px] text-pink-200 font-mono">X: 0.8 / Y: 0.35</span>
                    </div>

                    {/* Score pill */}
                    <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-white text-xs font-black">
                      🎯 Điểm Chạm Mục Tiêu: <span className="text-emerald-400 font-mono">{targetScore}</span>
                    </div>
                  </div>
                )}

                {/* Tracking Feedback Alert */}
                {trackingFeedback !== 'ok' && (
                  <div className="absolute inset-x-4 top-4 bg-black/80 backdrop-blur-md text-amber-300 px-4 py-2 rounded-2xl border border-amber-400/50 flex items-center justify-center gap-2 pointer-events-none animate-pulse">
                    <span className="text-lg">🧍</span>
                    <span className="text-xs font-black">
                      {trackingFeedback === 'no_body' && 'Bé hãy đứng lùi lại khoảng 2m để camera nhìn thấy nhé!'}
                      {trackingFeedback === 'too_near' && 'Bé đứng hơi gần, hãy lùi ra một chút xíu nha!'}
                      {trackingFeedback === 'too_far' && 'Bé có thể bước lại gần camera hơn một chút!'}
                      {trackingFeedback === 'no_legs' && 'Lùi lại một chút để AI nhìn thấy cả đôi chân bé nhé!'}
                      {trackingFeedback === 'not_centered' && 'Bé hãy đứng vào chính giữa khung hình nha!'}
                    </span>
                  </div>
                )}

                {/* Bottom Left Quick Status Overlay */}
                <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-700/80 shadow-lg pointer-events-none text-white flex items-center gap-3">
                  <div>
                    <p className="text-[9px] font-extrabold text-slate-400 uppercase">CỬ CHỈ HIỆN TẠI</p>
                    <p className="text-sm font-black text-emerald-400 uppercase mt-0.5">
                      {gesture === 'standing' ? '🧍 Đứng Thẳng' : gesture.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div className="h-6 w-px bg-slate-700" />
                  <div>
                    <p className="text-[9px] font-extrabold text-slate-400 uppercase">FPS / CONF</p>
                    <p className="text-xs font-bold text-slate-200 font-mono">
                      {poseFps} fps · {Math.round(poseConfidence * 100)}%
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                <Camera className="w-16 h-16 text-slate-600 mb-3" />
                <h4 className="text-white font-black text-base">Camera Đang Tắt</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Bấm nút bên dưới để cấp quyền camera và kích hoạt nhận diện khớp cử động.
                </p>
                <button
                  onClick={() => startCamera()}
                  className="mt-4 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-full text-xs shadow-lg transition"
                >
                  Mở Camera Ngay
                </button>
              </div>
            )}
          </div>

          {/* Mode Switcher & Skeleton Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border-2 border-emerald-100 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-700">Chế độ nhận diện:</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setTrackingMode('mediapipe')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                    trackingMode === 'mediapipe'
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  MediaPipe Pose (Chuẩn AI)
                </button>
                <button
                  onClick={() => setTrackingMode('pixel_motion')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                    trackingMode === 'pixel_motion'
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Chuyển Động Cơ Bản
                </button>
              </div>
            </div>

            <button
              onClick={() => setIsSkeletonVisible(!isSkeletonVisible)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                isSkeletonVisible
                  ? 'bg-teal-50 text-teal-700 border border-teal-200'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {isSkeletonVisible ? '👁️ Ẩn Khung Xương' : '👁️ Hiện Khung Xương'}
            </button>
          </div>
        </div>

        {/* Right 5 cols: Developer Debug HUD & Interactive Tests */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Developer Debug Telemetry Panel */}
          <div className="bg-slate-900 text-white p-4 rounded-3xl border border-slate-800 shadow-lg font-mono text-xs">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                  TELEMETRY DEBUG STATUS
                </span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  poseStatus === 'running'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : poseStatus === 'loading'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                }`}
              >
                {poseStatus.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[11px]">
              <div>
                <span className="text-slate-500 block text-[10px]">CAMERA STREAM:</span>
                <span className={isStreaming ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                  {isStreaming ? 'READY' : 'OFFLINE'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px]">VIDEO ELEMENT:</span>
                <span className={videoElement && videoElement.videoWidth > 0 ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                  {videoElement && videoElement.videoWidth > 0
                    ? `${videoElement.videoWidth} x ${videoElement.videoHeight}`
                    : 'WAITING FRAME'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px]">MEDIAPIPE POSE:</span>
                <span className={poseStatus === 'running' ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                  {poseStatus.toUpperCase()}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px]">BODY DETECTED:</span>
                <span className={bodyDetected ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                  {bodyDetected ? (fullBodyDetected ? 'FULL BODY (YES)' : 'UPPER BODY (YES)') : 'NO'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px]">POSE FPS:</span>
                <span className="text-emerald-400 font-bold">{poseFps} FPS</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px]">GESTURE:</span>
                <span className="text-cyan-400 font-bold">{gesture}</span>
              </div>

              {/* Left Wrist Telemetry */}
              <div className="col-span-2 p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-blue-300 font-bold">TAY TRÁI (LEFT WRIST):</span>
                </div>
                <span className={leftWrist.visible ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {leftWrist.visible
                    ? `X: ${leftWrist.x.toFixed(2)} / Y: ${leftWrist.y.toFixed(2)} (v: ${Math.round(leftWrist.velocity)}%)`
                    : 'NOT DETECTED'}
                </span>
              </div>

              {/* Right Wrist Telemetry */}
              <div className="col-span-2 p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                  <span className="text-pink-300 font-bold">TAY PHẢI (RIGHT WRIST):</span>
                </div>
                <span className={rightWrist.visible ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {rightWrist.visible
                    ? `X: ${rightWrist.x.toFixed(2)} / Y: ${rightWrist.y.toFixed(2)} (v: ${Math.round(rightWrist.velocity)}%)`
                    : 'NOT DETECTED'}
                </span>
              </div>
            </div>
          </div>

          {/* Test Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('checklist')}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition ${
                activeTab === 'checklist' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              10 Cử Chỉ Cơ Thể
            </button>
            <button
              onClick={() => setActiveTab('targets')}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition ${
                activeTab === 'targets' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chạm Bia 2 Cổ Tay
            </button>
          </div>

          {/* Tab 1: Checklist */}
          {activeTab === 'checklist' && (
            <div className="bg-white p-4 rounded-3xl border-2 border-emerald-100 shadow-sm flex flex-col gap-2 max-h-[340px] overflow-y-auto">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-extrabold text-slate-500">
                  Tiến độ: {completedGestures.size}/{GESTURE_CHECKLIST.length}
                </span>
                <span className="text-xs font-black text-emerald-600">
                  {Math.round((completedGestures.size / GESTURE_CHECKLIST.length) * 100)}% Hoàn Thành
                </span>
              </div>

              {GESTURE_CHECKLIST.map((item) => {
                const isDone = completedGestures.has(item.id);
                const isCurrent = gesture === item.id;

                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-2.5 rounded-2xl border transition ${
                      isDone
                        ? 'bg-emerald-50/60 border-emerald-200'
                        : isCurrent
                        ? 'bg-amber-50 border-amber-300'
                        : 'bg-slate-50 border-slate-200/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{item.icon}</span>
                      <div>
                        <p className={`text-xs font-black ${isDone ? 'text-emerald-900' : 'text-slate-800'}`}>
                          {item.label}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">{item.desc}</p>
                      </div>
                    </div>

                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    ) : isCurrent ? (
                      <span className="text-[10px] font-black text-amber-600 px-2 py-0.5 bg-amber-100 rounded-full">
                        Đang làm
                      </span>
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 2: Targets Game */}
          {activeTab === 'targets' && (
            <div className="bg-white p-5 rounded-3xl border-2 border-emerald-100 shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-2 text-emerald-700">
                <Target className="w-5 h-5" />
                <h3 className="text-sm font-black">Thử Thách Chạm Bia 2 Tay</h3>
              </div>
              <p className="text-xs text-slate-600">
                Đưa bàn tay trái chạm vào ô tròn xanh bên trái, và bàn tay phải chạm vào ô tròn hồng bên phải để kiểm tra tọa độ di chuyển.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className={`p-4 rounded-2xl border text-center transition ${
                  leftTargetHit ? 'bg-emerald-100 border-emerald-400' : 'bg-blue-50 border-blue-200'
                }`}>
                  <span className="text-2xl">✋</span>
                  <p className="text-xs font-black text-blue-900 mt-1">Bia Tay Trái</p>
                  <p className="text-[10px] text-slate-500">Tọa độ: X ~ 0.2, Y ~ 0.35</p>
                </div>

                <div className={`p-4 rounded-2xl border text-center transition ${
                  rightTargetHit ? 'bg-emerald-100 border-emerald-400' : 'bg-pink-50 border-pink-200'
                }`}>
                  <span className="text-2xl">✋</span>
                  <p className="text-xs font-black text-pink-900 mt-1">Bia Tay Phải</p>
                  <p className="text-[10px] text-slate-500">Tọa độ: X ~ 0.8, Y ~ 0.35</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
