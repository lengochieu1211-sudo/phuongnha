/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Eye,
  EyeOff,
  Minimize2,
  Maximize2,
  Sparkles,
  Zap,
  Activity,
  Layers,
} from 'lucide-react';
import { GameGesture } from '../types';
import { useCameraPose } from '../providers/CameraPoseContext';

interface DraggableCameraPiPProps {
  visible: boolean;
  onToggleVisible: (show: boolean) => void;
}

export default function DraggableCameraPiP({
  visible,
  onToggleVisible,
}: DraggableCameraPiPProps) {
  const {
    isStreaming,
    gesture,
    poseStatus,
    bodyDetected,
    leftWrist,
    rightWrist,
    poseFps,
    poseConfidence,
    trackingFeedback,
    isSkeletonVisible,
    setIsSkeletonVisible,
    canvasElement,
  } = useCameraPose();

  const pipCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Position anchored from top-right
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 16, y: 75 });
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({
    startX: 0,
    startY: 0,
    posX: 16,
    posY: 75,
  });

  // RAF loop to mirror the master canvas to this local PIP canvas
  useEffect(() => {
    let animId: number;

    const renderLoop = () => {
      if (visible && isStreaming && !isMinimized && pipCanvasRef.current && canvasElement) {
        const destCtx = pipCanvasRef.current.getContext('2d');
        if (destCtx && canvasElement.width > 0 && canvasElement.height > 0) {
          destCtx.clearRect(0, 0, pipCanvasRef.current.width, pipCanvasRef.current.height);
          destCtx.drawImage(
            canvasElement,
            0,
            0,
            pipCanvasRef.current.width,
            pipCanvasRef.current.height
          );
        }
      }
      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [visible, isStreaming, isMinimized, canvasElement]);

  // Gesture translation for child
  const gestureLabel: { [key in GameGesture]?: string } = {
    standing: '🧍 ĐỨNG CHUẨN',
    left_arm_up: '✋ TAY TRÁI ↑',
    right_arm_up: '✋ TAY PHẢI ↑',
    both_arms_up: '🙌 HAI TAY ↑',
    jump: '🦘 NHẢY CAO',
    duck: '🙇 CÚI NÉ',
    tilt_left: '↖️ NGHIÊNG TRÁI',
    tilt_right: '↗️ NGHIÊNG PHẢI',
    hands_spread: '🦅 DANG TAY',
    clap: '👏 VỖ TAY',
    hands_head: '🙆 TAY LÊN ĐẦU',
    wave_left: '👋 VẪY TRÁI',
    wave_right: '👋 VẪY PHẢI',
    rainbow_skill: '🌈 CẦU VỒNG',
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;

    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    const currentPipWidth = isMinimized ? 160 : 220;
    const currentPipHeight = isMinimized ? 40 : 227;
    const pad = 12;

    const maxRight = Math.max(pad, screenW - currentPipWidth - pad);
    const maxTop = Math.max(pad, screenH - currentPipHeight - pad);

    const newRight = Math.max(pad, Math.min(maxRight, dragStartRef.current.posX - dx));
    const newTop = Math.max(pad, Math.min(maxTop, dragStartRef.current.posY + dy));

    setPosition({ x: newRight, y: newTop });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
  };

  const snapTo = (corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right') => {
    const pad = 16;
    const currentPipWidth = isMinimized ? 160 : 220;
    const currentPipHeight = isMinimized ? 40 : 227;

    if (corner === 'top-left') setPosition({ x: window.innerWidth - currentPipWidth - pad, y: 75 });
    if (corner === 'top-right') setPosition({ x: pad, y: 75 });
    if (corner === 'bottom-left') setPosition({ x: window.innerWidth - currentPipWidth - pad, y: window.innerHeight - currentPipHeight - pad });
    if (corner === 'bottom-right') setPosition({ x: pad, y: window.innerHeight - currentPipHeight - pad });
  };

  // Keep within bounds on window resize or orientation changes
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const currentPipWidth = isMinimized ? 160 : 220;
        const currentPipHeight = isMinimized ? 40 : 227;
        const pad = 16;

        const maxRight = Math.max(pad, screenW - currentPipWidth - pad);
        const maxTop = Math.max(pad, screenH - currentPipHeight - pad);

        return {
          x: Math.max(pad, Math.min(maxRight, prev.x)),
          y: Math.max(pad, Math.min(maxTop, prev.y)),
        };
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    // Call once to ensure correct initial layout bounds
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [isMinimized]);

  if (!visible || !isStreaming) {
    return null;
  }

  // True tracking state determination
  let statusBadgeColor = 'bg-emerald-500/90 text-white';
  let statusBadgeText = '🟢 ĐÃ NHẬN DIỆN HAI TAY';

  if (poseStatus === 'loading') {
    statusBadgeColor = 'bg-amber-500/90 text-black';
    statusBadgeText = '🟡 ĐANG TẢI MEDIAPIPE...';
  } else if (!bodyDetected) {
    statusBadgeColor = 'bg-rose-500/90 text-white';
    statusBadgeText = '🔴 CHƯA THẤY CƠ THỂ';
  } else if (!leftWrist.visible || !rightWrist.visible) {
    statusBadgeColor = 'bg-amber-500/90 text-black';
    statusBadgeText = '🟡 HÃY ĐƯA TAY VÀO KHUNG HÌNH';
  }

  return (
    <div
      id="camera-pip-widget"
      className="fixed z-50 transition-shadow select-none"
      style={{
        right: `${position.x}px`,
        top: `${position.y}px`,
        width: isMinimized ? '160px' : '220px',
      }}
    >
      {/* Floating Widget Container */}
      <div
        className="bg-slate-900/95 backdrop-blur-md rounded-2xl overflow-hidden border-2 border-emerald-400/80 shadow-2xl transition-all"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Header Bar */}
        <div className="bg-slate-950/90 px-2.5 py-1.5 flex items-center justify-between cursor-move border-b border-slate-800 text-white">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${bodyDetected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-[11px] font-black tracking-wider text-emerald-300">AI CAMERA</span>
            {poseFps > 0 && <span className="text-[9px] text-slate-400 font-mono">{poseFps}fps</span>}
          </div>

          <div className="flex items-center gap-1">
            {/* Toggle Skeleton */}
            <button
              onClick={() => setIsSkeletonVisible(!isSkeletonVisible)}
              className={`p-1 rounded transition ${
                isSkeletonVisible ? 'text-emerald-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-800'
              }`}
              title="Bật/Tắt Khung Xương AI"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>

            {/* Minimize */}
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition"
              title={isMinimized ? 'Mở rộng' : 'Thu nhỏ'}
            >
              {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>

            {/* Hide Preview (Stream remains active) */}
            <button
              onClick={() => onToggleVisible(false)}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-rose-400 transition"
              title="Ẩn khung hình camera (AI vẫn nhận cử chỉ bình thường)"
            >
              <EyeOff className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Canvas Stage (Draws video + skeleton) */}
        {!isMinimized && (
          <div className="relative aspect-4/3 w-full bg-slate-950">
            <canvas
              ref={pipCanvasRef}
              width={320}
              height={240}
              className="w-full h-full object-cover"
            />

            {/* Gesture Badge */}
            <div className="absolute top-1.5 left-1.5 bg-slate-900/90 backdrop-blur-xs text-emerald-400 border border-emerald-500/50 text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm">
              {gestureLabel[gesture] || gesture.toUpperCase()}
            </div>

            {/* Real Accurate Status Badge */}
            <div className={`absolute top-1.5 right-1.5 backdrop-blur-xs text-[8px] font-black px-1.5 py-0.5 rounded-md shadow-sm ${statusBadgeColor}`}>
              {leftWrist.visible && rightWrist.visible ? '2 TAY' : leftWrist.visible ? '1 TAY' : rightWrist.visible ? '1 TAY' : '0 TAY'}
            </div>

            {/* Distance / Placement Feedback */}
            {trackingFeedback !== 'ok' && (
              <div className="absolute bottom-1.5 inset-x-1.5 bg-amber-500/95 text-slate-950 font-black text-[9px] text-center py-1 rounded-md shadow-sm animate-bounce">
                {trackingFeedback === 'too_far' && '🟡 TIẾN LẠI GẦN HƠN'}
                {trackingFeedback === 'too_near' && '🟡 LÙI RA XA MỘT CHÚT'}
                {trackingFeedback === 'no_body' && '🔴 CHƯA THẤY BÉ'}
                {trackingFeedback === 'no_legs' && '🟡 LÙI THÊM ĐỂ THẤY CHÂN'}
                {trackingFeedback === 'not_centered' && '🟡 ĐỨNG VÀO GIỮA MÀN HÌNH'}
              </div>
            )}
          </div>
        )}

        {/* Minimized Quick Pill */}
        {isMinimized && (
          <div className="p-2 flex items-center justify-between bg-slate-900 text-xs">
            <span className="text-emerald-400 font-black text-[10px] truncate max-w-[100px]">
              {gestureLabel[gesture] || gesture}
            </span>
            <button
              onClick={() => setIsMinimized(false)}
              className="text-[10px] text-slate-400 hover:text-white underline"
            >
              Mở
            </button>
          </div>
        )}

        {/* Snap Buttons Footer */}
        {!isMinimized && (
          <div className="bg-slate-950 px-2 py-1 flex items-center justify-between text-[9px] text-slate-400 font-bold border-t border-slate-800/80">
            <span>Vị trí:</span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => snapTo('top-left')} className="hover:text-emerald-400 transition" title="Góc trên trái">
                ↖️
              </button>
              <button onClick={() => snapTo('top-right')} className="hover:text-emerald-400 transition" title="Góc trên phải">
                ↗️
              </button>
              <button onClick={() => snapTo('bottom-left')} className="hover:text-emerald-400 transition" title="Góc dưới trái">
                ↙️
              </button>
              <button onClick={() => snapTo('bottom-right')} className="hover:text-emerald-400 transition" title="Góc dưới phải">
                ↘️
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
