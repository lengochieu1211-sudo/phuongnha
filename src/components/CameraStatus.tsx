/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Camera, CameraOff, Sparkles, Zap, ShieldAlert, CheckCircle, HelpCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { GameGesture } from '../types';
import { useCameraPose } from '../providers/CameraPoseContext';

interface CameraStatusProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  feedback: 'ok' | 'far' | 'near' | 'no_body';
  gesture: GameGesture;
  trackingMode: 'mediapipe' | 'pixel_motion' | 'keyboard_only';
  onModeChange: (mode: 'mediapipe' | 'pixel_motion' | 'keyboard_only') => void;
  isStreaming: boolean;
  onToggleStreaming: (stream: boolean) => void;
}

export default function CameraStatus({
  videoRef,
  canvasRef,
  feedback,
  gesture,
  trackingMode,
  onModeChange,
  isStreaming,
  onToggleStreaming,
}: CameraStatusProps) {
  const { cameraError, startCamera } = useCameraPose();
  const [showHelp, setShowHelp] = useState(false);

  // Status map
  const statusConfig = {
    ok: { label: 'Đã nhận diện 🟢', color: 'bg-emerald-500 text-white border-emerald-400', desc: 'Bé đứng rất đẹp rồi!' },
    far: { label: 'Đứng gần hơn một chút 🟡', color: 'bg-amber-500 text-white border-amber-400', desc: 'Xích lại gần camera một xíu nhé.' },
    near: { label: 'Đứng xa hơn một chút 🟡', color: 'bg-amber-600 text-white border-amber-500', desc: 'Chỉ cần lùi nếu đầu hoặc hai tay đang bị cắt khỏi khung.' },
    no_body: { label: 'Chưa thấy người rõ 🔴', color: 'bg-rose-500 text-white border-rose-400', desc: 'Hãy để camera thấy rõ đầu, vai và ít nhất một tay. Nhiều game chỉ cần nửa người trên.' },
  };

  const gestureVN: { [key in GameGesture]: string } = {
    standing: 'Đang đứng chuẩn bị',
    left_arm_up: 'Giơ tay trái 🫲',
    right_arm_up: 'Giơ tay phải 🫱',
    both_arms_up: 'Giơ hai tay 🙌',
    jump: 'Nhảy bật cao! 🦘',
    duck: 'Cúi người né! 🙇',
    tilt_left: 'Nghiêng sang trái ↖️',
    tilt_right: 'Nghiêng sang phải ↗️',
    hands_spread: 'Dang rộng hai tay 👐',
    clap: 'Vỗ tay 👏',
    hands_head: 'Đặt tay lên đầu 🙆‍♀️',
    wave_left: 'Vẫy tay trái 👋',
    wave_right: 'Vẫy tay phải 👋',
    rainbow_skill: 'Tung chiêu cầu vồng 🌈',
  };

  return (
    <div id="camera-status-container" className="flex flex-col gap-4 bg-white/90 backdrop-blur-md p-5 rounded-3xl border-4 border-pink-200 shadow-xl max-w-md w-full">
      {/* Header with Camera controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-pink-700 flex items-center gap-2">
          <Camera className="w-6 h-6 animate-pulse" />
          Camera Của Bé
        </h3>

        <div className="flex gap-2">
          <button
            id="toggle-help-btn"
            onClick={() => setShowHelp(!showHelp)}
            className="p-2 rounded-full hover:bg-pink-100 text-pink-600 transition"
            title="Hướng dẫn"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <button
            id="toggle-camera-btn"
            onClick={() => onToggleStreaming(!isStreaming)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-bold text-sm transition shadow-sm ${
              isStreaming
                ? 'bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-300'
                : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border border-emerald-300'
            }`}
          >
            {isStreaming ? (
              <>
                <CameraOff className="w-4 h-4" />
                Tắt Camera
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                Mở Camera
              </>
            )}
          </button>
        </div>
      </div>

      {showHelp && (
        <div id="camera-help-box" className="bg-pink-50 p-3.5 rounded-2xl text-xs text-pink-800 leading-relaxed border border-pink-100">
          <p className="font-semibold mb-1">💡 Làm sao để chơi tốt nhất?</p>
          <ol className="list-decimal pl-4 space-y-1">
            <li>Không có khoảng cách cố định: ưu tiên để camera thấy rõ đầu, vai và hai tay; toàn thân chỉ cần cho chế độ tương ứng.</li>
            <li>Đảm bảo phòng đủ sáng, không đứng ngược sáng lớn.</li>
            <li>Đứng một mình trong khung hình để máy nhận diện đúng nhất.</li>
            <li>Nếu camera quá chậm hoặc không có camera, bé hãy chọn chế độ <b>"Giả lập bằng Bàn Phím"</b> bên dưới để chơi cực vui bằng phím nha!</li>
          </ol>
        </div>
      )}

      {/* Camera Live Feed Card */}
      <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden border-4 border-purple-200 bg-slate-900 shadow-inner flex items-center justify-center">
        {isStreaming ? (
          <>
            {/* Display Canvas with custom rendered skeleton/overlays */}
            <canvas
              ref={canvasRef}
              id="webcam-canvas-output"
              width={640}
              height={480}
              className="w-full h-full object-contain bg-black"
            />

            {/* Dotted target silhouette when no body detected */}
            {feedback === 'no_body' && (
              <div id="target-silhouette" className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/40">
                <svg className="w-2/3 h-5/6 text-white/50 animate-pulse" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  {/* Head */}
                  <circle cx="50" cy="20" r="10" strokeDasharray="3,3" />
                  {/* Torso */}
                  <line x1="50" y1="30" x2="50" y2="60" strokeDasharray="3,3" />
                  {/* Arms */}
                  <path d="M25 35 Q50 30 75 35" strokeDasharray="3,3" />
                  <path d="M25 35 V55" strokeDasharray="3,3" />
                  <path d="M75 35 V55" strokeDasharray="3,3" />
                  {/* Legs */}
                  <path d="M50 60 L35 85" strokeDasharray="3,3" />
                  <path d="M50 60 L65 85" strokeDasharray="3,3" />
                </svg>
                <span className="absolute bottom-4 bg-black/75 px-3 py-1 rounded-full text-white text-xs font-bold font-sans">
                  Đứng lùi lại, căn khớp khung người nhé bé!
                </span>
              </div>
            )}
          </>
        ) : (
          <div id="camera-inactive-placeholder" className="flex flex-col items-center justify-center p-4 text-center text-slate-400">
            {cameraError ? (
              <div className="flex flex-col items-center gap-2 p-2 text-rose-300">
                <AlertTriangle className="w-10 h-10 text-rose-400 animate-bounce" />
                <p className="text-xs font-bold text-rose-300 leading-tight max-w-[280px]">
                  {cameraError}
                </p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => startCamera()}
                    className="flex items-center gap-1 px-3 py-1 bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold rounded-full transition shadow-md"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Thử lại
                  </button>
                  <button
                    onClick={() => onModeChange('keyboard_only')}
                    className="flex items-center gap-1 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-900 text-xs font-bold rounded-full transition shadow-md"
                  >
                    ⌨️ Bàn phím
                  </button>
                </div>
              </div>
            ) : (
              <>
                <CameraOff className="w-12 h-12 text-slate-500 mb-2" />
                <p className="text-sm font-semibold text-slate-300">Camera đang tắt</p>
                <p className="text-xs text-slate-500 mt-1 max-w-[250px]">
                  Hãy nhấn nút "Mở Camera" phía trên hoặc chuyển sang "Giả lập bằng Bàn phím" để chơi.
                </p>
              </>
            )}
          </div>
        )}

        {/* Current Recognized Gesture overlay */}
        {isStreaming && feedback === 'ok' && (
          <div id="gesture-bubble" className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-pink-100 shadow-md pointer-events-none animate-bounce">
            <p className="text-[10px] font-bold text-slate-500 tracking-wider">ĐỘNG TÁC ĐANG LÀM</p>
            <p className="text-sm font-extrabold text-pink-600">{gestureVN[gesture]}</p>
          </div>
        )}
      </div>

      {/* Positioning Feedback Notification */}
      {isStreaming && (
        <div id="positioning-feedback-box" className={`border-2 rounded-2xl p-3 flex flex-col gap-1 transition ${statusConfig[feedback].color}`}>
          <div className="flex items-center gap-2 font-bold text-sm">
            {feedback === 'ok' ? (
              <CheckCircle className="w-5 h-5 shrink-0" />
            ) : (
              <ShieldAlert className="w-5 h-5 shrink-0 animate-bounce" />
            )}
            <span>{statusConfig[feedback].label}</span>
          </div>
          <p className="text-xs opacity-90 leading-tight">
            {statusConfig[feedback].desc}
          </p>
        </div>
      )}

      {/* Mode selectors */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-pink-800 uppercase tracking-wider">
          Chế độ điều khiển
        </label>
        <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            id="mode-mediapipe-btn"
            onClick={() => onModeChange('mediapipe')}
            className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-[10px] font-bold transition ${
              trackingMode === 'mediapipe'
                ? 'bg-pink-500 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Skeletal (AI)
          </button>
          <button
            id="mode-pixel-btn"
            onClick={() => onModeChange('pixel_motion')}
            className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-[10px] font-bold transition ${
              trackingMode === 'pixel_motion'
                ? 'bg-pink-500 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Zap className="w-4 h-4" />
            Vận Động
          </button>
          <button
            id="mode-keyboard-btn"
            onClick={() => onModeChange('keyboard_only')}
            className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-[10px] font-bold transition ${
              trackingMode === 'keyboard_only'
                ? 'bg-pink-500 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            ⌨️
            Bàn Phím
          </button>
        </div>
        {trackingMode === 'keyboard_only' && (
          <p id="keyboard-guide" className="text-[10px] text-pink-600 font-medium text-center leading-tight">
            💡 Dùng <b>Mũi tên Trái/Phải</b> (Nghiêng), <b>Mũi tên Lên</b> (Nhảy), <b>Mũi tên Xuống</b> (Cúi), <b>Phím A</b> (Tay Trái), <b>Phím D</b> (Tay Phải), <b>Phím W</b> (2 Tay)!
          </p>
        )}
      </div>
    </div>
  );
}
