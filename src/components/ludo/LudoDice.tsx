/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, Hand, Volume2 } from 'lucide-react';
import { audio } from '../../lib/AudioEngine';

interface LudoDiceProps {
  value: number | null;
  isRolling: boolean;
  canRoll: boolean;
  currentPlayerName: string;
  currentPlayerColor: string;
  onRoll: () => void;
  gestureDetected?: string;
  enableCameraClap?: boolean;
}

export default function LudoDice({
  value,
  isRolling,
  canRoll,
  currentPlayerName,
  currentPlayerColor,
  onRoll,
  gestureDetected,
  enableCameraClap = true,
}: LudoDiceProps) {
  const [displayValue, setDisplayValue] = useState<number>(value || 6);

  // Rapidly cycle numbers during rolling animation
  useEffect(() => {
    if (isRolling) {
      const interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 6) + 1);
      }, 70);
      return () => clearInterval(interval);
    } else if (value) {
      setDisplayValue(value);
    }
  }, [isRolling, value]);

  // Color theme helpers
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'red':
        return {
          bg: 'bg-rose-500 hover:bg-rose-600 active:bg-rose-700',
          shadow: 'shadow-rose-300',
          border: 'border-rose-300',
          badge: 'bg-rose-100 text-rose-800',
        };
      case 'blue':
        return {
          bg: 'bg-sky-500 hover:bg-sky-600 active:bg-sky-700',
          shadow: 'shadow-sky-300',
          border: 'border-sky-300',
          badge: 'bg-sky-100 text-sky-800',
        };
      case 'yellow':
        return {
          bg: 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700',
          shadow: 'shadow-amber-300',
          border: 'border-amber-300',
          badge: 'bg-amber-100 text-amber-800',
        };
      case 'purple':
      case 'green':
      default:
        return {
          bg: 'bg-purple-500 hover:bg-purple-600 active:bg-purple-700',
          shadow: 'shadow-purple-300',
          border: 'border-purple-300',
          badge: 'bg-purple-100 text-purple-800',
        };
    }
  };

  const theme = getColorClasses(currentPlayerColor);

  // Render 3D Dice Face Dots
  const renderDiceDots = (num: number) => {
    switch (num) {
      case 1:
        return (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-rose-500 shadow-inner ring-4 ring-rose-200" />
          </div>
        );
      case 2:
        return (
          <div className="w-full h-full flex justify-between p-3">
            <div className="w-4 h-4 rounded-full bg-slate-800 self-start shadow-xs" />
            <div className="w-4 h-4 rounded-full bg-slate-800 self-end shadow-xs" />
          </div>
        );
      case 3:
        return (
          <div className="w-full h-full flex justify-between p-3">
            <div className="w-4 h-4 rounded-full bg-slate-800 self-start shadow-xs" />
            <div className="w-4 h-4 rounded-full bg-slate-800 self-center shadow-xs" />
            <div className="w-4 h-4 rounded-full bg-slate-800 self-end shadow-xs" />
          </div>
        );
      case 4:
        return (
          <div className="w-full h-full grid grid-cols-2 gap-3 p-3">
            <div className="w-4 h-4 rounded-full bg-slate-800 shadow-xs" />
            <div className="w-4 h-4 rounded-full bg-slate-800 justify-self-end shadow-xs" />
            <div className="w-4 h-4 rounded-full bg-slate-800 shadow-xs" />
            <div className="w-4 h-4 rounded-full bg-slate-800 justify-self-end shadow-xs" />
          </div>
        );
      case 5:
        return (
          <div className="w-full h-full relative p-3">
            <div className="absolute top-3 left-3 w-4 h-4 rounded-full bg-slate-800 shadow-xs" />
            <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-slate-800 shadow-xs" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-800 shadow-xs" />
            <div className="absolute bottom-3 left-3 w-4 h-4 rounded-full bg-slate-800 shadow-xs" />
            <div className="absolute bottom-3 right-3 w-4 h-4 rounded-full bg-slate-800 shadow-xs" />
          </div>
        );
      case 6:
      default:
        return (
          <div className="w-full h-full grid grid-cols-2 gap-x-4 gap-y-2 p-3 items-center justify-items-center">
            <div className="w-4 h-4 rounded-full bg-rose-500 shadow-xs" />
            <div className="w-4 h-4 rounded-full bg-rose-500 shadow-xs" />
            <div className="w-4 h-4 rounded-full bg-rose-500 shadow-xs" />
            <div className="w-4 h-4 rounded-full bg-rose-500 shadow-xs" />
            <div className="w-4 h-4 rounded-full bg-rose-500 shadow-xs" />
            <div className="w-4 h-4 rounded-full bg-rose-500 shadow-xs" />
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      {/* 3D Dice Box */}
      <div
        id="ludo-3d-dice"
        onClick={() => {
          if (canRoll && !isRolling) {
            onRoll();
          }
        }}
        className={`relative w-20 h-20 md:w-24 md:h-24 bg-white rounded-3xl border-4 ${
          theme.border
        } shadow-xl flex items-center justify-center cursor-pointer transform transition-all duration-200 ${
          isRolling
            ? 'animate-spin scale-110 shadow-2xl rotate-12'
            : canRoll
            ? 'hover:scale-105 hover:shadow-2xl animate-bounce'
            : 'opacity-90'
        }`}
        style={{
          boxShadow: canRoll ? '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 0 15px rgba(255, 215, 0, 0.5)' : undefined,
        }}
      >
        {renderDiceDots(displayValue)}

        {/* Six Glow Halo */}
        {displayValue === 6 && !isRolling && (
          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-400 to-rose-400 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md animate-pulse">
            +1 LƯỢT! ⭐
          </div>
        )}
      </div>

      {/* Action Button for Touch/Click */}
      <button
        id="btn-roll-dice"
        disabled={!canRoll || isRolling}
        onClick={onRoll}
        className={`px-6 py-3.5 rounded-full font-black text-sm md:text-base text-white shadow-lg transition-all duration-200 flex items-center gap-2 ${
          canRoll && !isRolling
            ? `${theme.bg} ${theme.shadow} hover:scale-105 active:scale-95 cursor-pointer ring-4 ring-white/60`
            : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-60'
        }`}
      >
        <Sparkles className="w-5 h-5 animate-spin" />
        {isRolling ? 'ĐANG LĂN XÚC XẮC...' : canRoll ? `TUNG XÚC XẮC 🎲` : `CHỌN QUÂN ĐI 🏇`}
      </button>

      {/* Camera Gesture Tip */}
      {enableCameraClap && canRoll && (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-[11px] font-bold text-amber-800 animate-pulse">
          <Hand className="w-3.5 h-3.5 text-amber-600" />
          <span>Vỗ tay • giơ 2 tay • dang 2 tay để tung!</span>
        </div>
      )}
    </div>
  );
}
