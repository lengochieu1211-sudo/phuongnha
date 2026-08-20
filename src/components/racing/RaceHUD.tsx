/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  CameraViewMode,
  RaceSettings,
  RacingTrackConfig,
  CarConfig,
} from '../../types';
import { VehicleState, AIRacerState } from '../../lib/racing/VehiclePhysics';
import { SteeringState } from '../../lib/racing/MotionSteeringEngine';
import {
  Zap,
  Gauge,
  Trophy,
  Camera,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Shield,
  ChevronLeft,
} from 'lucide-react';

interface RaceHUDProps {
  player: VehicleState;
  aiRacers: AIRacerState[];
  steeringState: SteeringState;
  track: RacingTrackConfig;
  car: CarConfig;
  totalLaps: number;
  elapsedTimeMs: number;
  currentLapTimeMs: number;
  bestLapTimeMs: number;
  countdownNumber: number;
  phase: 'countdown' | 'racing' | 'finished' | 'paused';
  settings: RaceSettings;
  onNitroPress: () => void;
  onBrakePress: () => void;
  onBrakeRelease: () => void;
  onGasPress: () => void;
  onGasRelease: () => void;
  onSwitchCamera: () => void;
  onToggleSound: () => void;
  onExitRace?: () => void;
  isSoundMuted: boolean;
  activeVoiceText: string;
}

export const RaceHUD: React.FC<RaceHUDProps> = ({
  player,
  aiRacers,
  steeringState,
  track,
  car,
  totalLaps,
  elapsedTimeMs,
  currentLapTimeMs,
  bestLapTimeMs,
  countdownNumber,
  phase,
  settings,
  onNitroPress,
  onBrakePress,
  onBrakeRelease,
  onGasPress,
  onGasRelease,
  onSwitchCamera,
  onToggleSound,
  onExitRace,
  isSoundMuted,
  activeVoiceText,
}) => {
  const formatTime = (ms: number) => {
    if (ms <= 0) return '00:00.00';
    const totalSec = ms / 1000;
    const mins = Math.floor(totalSec / 60);
    const secs = Math.floor(totalSec % 60);
    const hundredths = Math.floor((ms % 1000) / 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${hundredths
      .toString()
      .padStart(2, '0')}`;
  };

  const getGear = (speedKmh: number) => {
    if (speedKmh < 5) return 'N';
    if (speedKmh < 45) return '1';
    if (speedKmh < 85) return '2';
    if (speedKmh < 125) return '3';
    if (speedKmh < 165) return '4';
    if (speedKmh < 205) return '5';
    return '6';
  };

  const totalRacers = 1 + aiRacers.length;

  return (
    <div
      id="race-hud-overlay"
      className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-2 md:p-4 pb-1.5 md:pb-4 z-20 overflow-hidden"
    >
      {/* 1. TOP BAR: Position, Laps, Times, Controls */}
      <div className="flex items-start justify-between w-full">
        {/* Left: Exit Button, Position & Lap Badge */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          <div className="flex items-center gap-2">
            {/* Exit Button */}
            <button
              id="race-exit-btn"
              onClick={onExitRace}
              className="px-3.5 py-2 md:px-4 md:py-2 rounded-2xl bg-rose-950/90 hover:bg-rose-900 border-2 border-rose-500/80 text-rose-100 font-black text-xs md:text-sm flex items-center gap-1 shadow-2xl transition-all active:scale-95 touch-manipulation z-30"
              title="Thoát cuộc đua"
            >
              <ChevronLeft className="w-5 h-5 text-rose-400" />
              <span>Thoát</span>
            </button>

            {/* Position Pill */}
            <div className="flex items-center gap-2 bg-slate-900/85 backdrop-blur-md border border-cyan-500/40 rounded-2xl px-3 py-1.5 md:px-4 md:py-2 text-white shadow-xl shadow-cyan-950/40">
              <Trophy className="w-5 h-5 md:w-6 md:h-6 text-amber-400 animate-pulse" />
              <div className="flex items-baseline gap-1">
                <span className="text-2xl md:text-3xl font-black italic tracking-tighter text-amber-400">
                  {player.rank === 1 ? '1ST' : player.rank === 2 ? '2ND' : player.rank === 3 ? '3RD' : `${player.rank}TH`}
                </span>
                <span className="text-xs md:text-sm font-semibold text-slate-400">/ {totalRacers}</span>
              </div>
            </div>
          </div>

          {/* Lap Counter */}
          <div className="bg-slate-900/85 backdrop-blur-md border border-purple-500/40 rounded-xl px-3 py-1.5 text-white flex items-center justify-between min-w-[120px] self-start">
            <span className="text-xs text-purple-300 font-bold uppercase tracking-wider">Vòng</span>
            <span className="text-lg font-black text-purple-400">
              {Math.min(player.lap, totalLaps)} / {totalLaps}
            </span>
          </div>

          {/* Shield active indicator */}
          {player.isShieldActive && (
            <div className="bg-cyan-500/90 text-slate-950 font-black text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg shadow-cyan-500/50 animate-bounce">
              <Shield className="w-3.5 h-3.5" />
              <span>KHIÊN BẢO VỆ ({Math.ceil(player.shieldDuration)}s)</span>
            </div>
          )}


          {/* Lightweight arcade damage indicator. No mesh deformation is required. */}
          {player.damage > 1 && (
            <div className="w-[132px] rounded-xl border border-rose-500/35 bg-slate-950/82 px-2.5 py-2 shadow-lg backdrop-blur-md md:w-[158px]">
              <div className="mb-1 flex items-center justify-between text-[9px] font-black uppercase tracking-wide text-slate-300">
                <span>Tình trạng xe</span>
                <span className={player.damage >= 70 ? 'text-rose-400' : player.damage >= 40 ? 'text-amber-400' : 'text-emerald-400'}>
                  {Math.max(0, Math.round(100 - player.damage))}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-700">
                <div
                  className={`h-full rounded-full transition-all ${player.damage >= 70 ? 'bg-rose-500' : player.damage >= 40 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                  style={{ width: `${Math.max(0, 100 - player.damage)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Center: Track Name & Timers */}
        <div className="flex flex-col items-center gap-1">
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-full px-4 py-1 flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300 tracking-wide uppercase">{track.name}</span>
          </div>

          <div className="bg-slate-950/90 backdrop-blur-lg border border-slate-800 rounded-2xl px-5 py-2 text-center shadow-2xl">
            <div className="text-xs font-semibold text-slate-400 tracking-wider">THỜI GIAN</div>
            <div className="text-2xl font-mono font-black text-cyan-400 tracking-tight">
              {formatTime(elapsedTimeMs)}
            </div>
            {bestLapTimeMs > 0 && (
              <div className="text-[11px] font-mono text-amber-400">
                Kỷ lục: {formatTime(bestLapTimeMs)}
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick Settings & Camera View */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            id="race-camera-toggle-btn"
            onClick={onSwitchCamera}
            className="w-11 h-11 rounded-2xl bg-slate-900/85 hover:bg-slate-800 border border-cyan-500/40 text-white flex flex-col items-center justify-center transition-all shadow-lg active:scale-95"
            title="Đổi góc nhìn camera"
          >
            <Camera className="w-5 h-5 text-cyan-400" />
            <span className="text-[9px] uppercase font-bold text-slate-300">{settings.cameraView}</span>
          </button>

          <button
            id="race-sound-toggle-btn"
            onClick={onToggleSound}
            className="w-11 h-11 rounded-2xl bg-slate-900/85 hover:bg-slate-800 border border-slate-700 text-white flex items-center justify-center transition-all shadow-lg active:scale-95"
          >
            {isSoundMuted ? (
              <VolumeX className="w-5 h-5 text-rose-400" />
            ) : (
              <Volume2 className="w-5 h-5 text-emerald-400" />
            )}
          </button>
        </div>
      </div>

      {/* 2. CENTER STAGE: Countdown stays centered. Drift/voice feedback is
          lifted into the upper safe area so it never covers the player car. */}
      <div className="flex flex-col items-center justify-center my-auto pointer-events-none">
        {phase === 'countdown' && (
          <div className="animate-scale-up text-center">
            {countdownNumber > 0 ? (
              <div className="text-8xl md:text-9xl font-black italic tracking-tighter text-amber-400 drop-shadow-[0_0_35px_rgba(251,191,36,0.8)] animate-pulse">
                {countdownNumber}
              </div>
            ) : (
              <div className="text-7xl md:text-9xl font-black italic tracking-tighter text-emerald-400 drop-shadow-[0_0_45px_rgba(52,211,153,0.9)] animate-bounce">
                XUẤT PHÁT!
              </div>
            )}
          </div>
        )}

        {/* Drift Combo Pop-up */}
        {player.isDrifting && (
          <div id="race-drift-feedback" className="absolute top-[20%] left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce">
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white font-black text-lg md:text-2xl px-5 py-1.5 rounded-full shadow-2xl shadow-rose-500/50 border border-amber-300">
              <Sparkles className="w-5 h-5 animate-spin" />
              <span>
                {player.driftMultiplier >= 3
                  ? '🔥 DRIFT HOÀN HẢO x' + player.driftMultiplier
                  : '✨ GOOD DRIFT x' + player.driftMultiplier}
              </span>
            </div>
            <span className="text-amber-300 font-black text-xl drop-shadow-md">
              +{player.driftScore} PTS
            </span>
          </div>
        )}

        {/* Voice Assistant Subtitle */}
        {activeVoiceText && (
          <div id="race-voice-subtitle" className="absolute top-[31%] left-1/2 -translate-x-1/2 max-w-[72vw] bg-slate-950/85 backdrop-blur-md border border-cyan-500/40 rounded-2xl px-4 md:px-6 py-1.5 md:py-2 text-cyan-200 text-xs md:text-base font-semibold shadow-2xl flex items-center gap-2 animate-fade-in text-center leading-snug">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span>{activeVoiceText}</span>
          </div>
        )}
      </div>

      {/* 3. BOTTOM SECTION: Speedometer, Virtual Steering Wheel & Touch Controls */}
      <div className="w-full flex items-end justify-between gap-2 md:gap-4">
        {/* Bottom Left: Speedometer & Gear */}
        <div className="flex flex-col gap-1 md:gap-2 pointer-events-auto">
          <div className="bg-slate-950/90 backdrop-blur-xl border border-cyan-500/40 rounded-2xl md:rounded-3xl p-2 md:p-4 flex items-center gap-2 md:gap-4 shadow-2xl shadow-cyan-950/60 min-w-[130px] md:min-w-[200px]">
            <div className="relative flex items-center justify-center w-10 h-10 md:w-16 md:h-16 rounded-full bg-slate-900 border border-slate-700">
              <span className="text-sm md:text-2xl font-black italic text-cyan-400">{getGear(player.speedKmh)}</span>
              <span className="absolute bottom-0.5 text-[7px] md:text-[9px] uppercase font-bold text-slate-400 scale-90">G</span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-baseline gap-0.5 md:gap-1">
                <span className="text-xl md:text-4xl font-black italic text-white tracking-tighter">
                  {Math.round(player.speedKmh)}
                </span>
                <span className="text-[9px] md:text-xs font-bold text-cyan-400 uppercase">KM/H</span>
              </div>

              {/* Speed Bar */}
              <div className="w-16 md:w-32 h-1 md:h-2 bg-slate-800 rounded-full overflow-hidden mt-0.5 border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-amber-400 transition-all duration-75"
                  style={{ width: `${Math.min(100, (player.speedKmh / player.maxSpeedKmh) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Nitro Meter Bar */}
          <div className="bg-slate-950/90 backdrop-blur-xl border border-cyan-500/40 rounded-xl md:rounded-2xl p-1.5 md:p-2.5 flex items-center gap-1.5 md:gap-3 shadow-xl">
            <Zap className={`w-4 h-4 md:w-5 md:h-5 ${player.isNitroActive ? 'text-amber-400 animate-bounce' : 'text-cyan-400'}`} />
            <div className="flex-1">
              <div className="flex justify-between text-[9px] md:text-[11px] font-bold mb-0.5">
                <span className="text-cyan-300">NITRO</span>
                <span className="text-cyan-400">{Math.round(player.nitroMeter)}%</span>
              </div>
              <div className="w-20 md:w-full h-1.5 md:h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div
                  className={`h-full transition-all duration-75 ${
                    player.isNitroActive
                      ? 'bg-gradient-to-r from-amber-400 via-rose-500 to-cyan-400 animate-pulse'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                  }`}
                  style={{ width: `${player.nitroMeter}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Center: Transparent Virtual Steering Wheel */}
        <div className="flex flex-col items-center gap-1 md:gap-1.5 pb-1 md:pb-2">
          {/* Wheel HUD rotating in sync with player hands */}
          <div
            id="race-steering-wheel"
            className="relative w-16 h-16 md:w-36 md:h-36 rounded-full border-2 md:border-4 border-cyan-400/50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center shadow-2xl transition-transform duration-75"
            style={{
              transform: `rotate(${steeringState.steeringAngleDeg}deg)`,
            }}
          >
            {/* Center Capybara Badge */}
            <div className="w-6 h-6 md:w-12 md:h-12 rounded-full bg-cyan-500/20 border border-cyan-400/80 flex items-center justify-center text-xs md:text-lg shadow-inner">
              🦫
            </div>
            {/* Steering Wheel Spokes */}
            <div className="absolute left-1 right-1 h-1 md:h-2.5 bg-cyan-400/60 rounded-full" />
            <div className="absolute top-1/2 bottom-1 w-1 md:w-2.5 bg-cyan-400/60 rounded-full" />
          </div>

          <div className="text-[8px] md:text-[11px] font-bold text-cyan-300/80 uppercase tracking-wider bg-slate-900/80 px-1.5 py-0.5 md:px-3 md:py-0.5 rounded-full border border-cyan-500/20 whitespace-nowrap">
            {steeringState.isHoldingWheel
              ? '✨ Đang nhận diện vô lăng'
              : 'Phím: A/D hoặc Mũi tên'}
          </div>
        </div>

        {/* Bottom Right: Action Pedals & Nitro Trigger */}
        <div className="flex items-center gap-1.5 md:gap-3 pointer-events-auto">
          {/* Brake Pedal */}
          <button
            id="race-brake-btn"
            onPointerDown={onBrakePress}
            onPointerUp={onBrakeRelease}
            onPointerLeave={onBrakeRelease}
            className="w-12 h-16 md:w-20 md:h-24 rounded-xl md:rounded-2xl bg-rose-950/80 hover:bg-rose-900 border-2 border-rose-500 text-rose-300 flex flex-col items-center justify-center font-black text-[9px] md:text-xs shadow-xl active:scale-95 touch-manipulation"
          >
            <span className="text-sm md:text-2xl mb-0.5 md:mb-1">🛑</span>
            <span>PHANH</span>
          </button>

          {/* Gas Pedal */}
          <button
            id="race-gas-btn"
            onPointerDown={onGasPress}
            onPointerUp={onGasRelease}
            onPointerLeave={onGasRelease}
            className="w-14 h-20 md:w-24 md:h-28 rounded-xl md:rounded-2xl bg-emerald-950/80 hover:bg-emerald-900 border-2 border-emerald-500 text-emerald-300 flex flex-col items-center justify-center font-black text-[10px] md:text-sm shadow-2xl active:scale-95 touch-manipulation"
          >
            <span className="text-lg md:text-3xl mb-0.5 md:mb-1">⚡</span>
            <span>TĂNG TỐC</span>
          </button>

          {/* Large Nitro Boost Button */}
          <button
            id="race-nitro-boost-btn"
            onClick={onNitroPress}
            disabled={player.nitroMeter < 10}
            className={`w-14 h-20 md:w-24 md:h-28 rounded-xl md:rounded-2xl flex flex-col items-center justify-center font-black text-[10px] md:text-sm shadow-2xl transition-all active:scale-95 touch-manipulation ${
              player.nitroMeter >= 10
                ? 'bg-gradient-to-t from-cyan-600 to-blue-500 hover:from-cyan-500 hover:to-blue-400 border-2 border-cyan-300 text-white shadow-cyan-500/50 animate-pulse'
                : 'bg-slate-900/60 border border-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Zap className="w-5 h-5 md:w-7 md:h-7 mb-0.5 md:mb-1 fill-current" />
            <span>NITRO</span>
          </button>
        </div>
      </div>
    </div>
  );
};
