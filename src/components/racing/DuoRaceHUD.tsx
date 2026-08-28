import React from 'react';
import { Camera, HelpCircle, LogOut, Volume2, VolumeX, Shield, Zap, ArrowLeft, ArrowRight, Gauge } from 'lucide-react';
import { RaceEngine } from '../../lib/racing/RaceEngine';
import { RacingTrackConfig } from '../../types';

interface Props {
  engine: RaceEngine;
  track: RacingTrackConfig;
  poseStatus: [boolean, boolean];
  poseFps: number;
  isSoundMuted: boolean;
  onToggleSound: () => void;
  onExit: () => void;
  onGuide: () => void;
  onSwitchCamera: () => void;
  onManualSteer: (player: 1 | 2, steer: number) => void;
  onManualBrake: (player: 1 | 2, braking: boolean) => void;
  onManualNitro: (player: 1 | 2) => void;
  onManualShield: (player: 1 | 2) => void;
}

export function DuoRaceHUD({
  engine, track, poseStatus, poseFps, isSoundMuted, onToggleSound, onExit, onGuide,
  onSwitchCamera, onManualSteer, onManualBrake, onManualNitro, onManualShield,
}: Props) {
  const p1 = engine.physics.player;
  const p2 = engine.physics.getLocalSecondPlayer();
  if (!p2) return null;

  const stat = (label: string, state: any, tone: 'cyan'|'pink') => (
    <div className={`rounded-2xl border px-2.5 py-2 backdrop-blur-md ${tone === 'cyan' ? 'border-cyan-400/40 bg-cyan-950/65' : 'border-pink-400/40 bg-pink-950/65'}`}>
      <div className={`text-[10px] font-black uppercase ${tone === 'cyan' ? 'text-cyan-300' : 'text-pink-300'}`}>{label} · Hạng {state.rank}</div>
      <div className="flex items-end gap-1"><span className="text-xl md:text-3xl font-black text-white">{Math.round(state.speedKmh)}</span><span className="pb-1 text-[8px] font-bold text-slate-400">KM/H</span></div>
      <div className="mt-1 flex items-center gap-1 text-[9px] font-bold text-slate-300"><Zap className="w-3 h-3 text-amber-300"/> {Math.round(state.nitroMeter || 0)}% {state.isShieldActive && <><Shield className="ml-1 w-3 h-3 text-cyan-300"/> Khiên</>}</div>
      {(state.damage || 0) > 1 && <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/35"><div className={`h-full rounded-full ${(state.damage || 0) >= 70 ? 'bg-rose-500' : (state.damage || 0) >= 40 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${Math.max(0, 100 - (state.damage || 0))}%` }} /></div>}
    </div>
  );

  const hold = (down: () => void, up: () => void) => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => { e.preventDefault(); e.currentTarget.setPointerCapture?.(e.pointerId); down(); },
    onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => { e.preventDefault(); up(); },
    onPointerCancel: up,
    onPointerLeave: up,
  });

  const manualPad = (player: 1 | 2, tone: 'cyan'|'pink') => {
    if (poseStatus[player - 1]) return null;
    const toneClass = tone === 'cyan' ? 'border-cyan-300/50 bg-cyan-950/75' : 'border-pink-300/50 bg-pink-950/75';
    return (
      <div className={`pointer-events-auto rounded-2xl border p-2 backdrop-blur-md ${toneClass}`} aria-label={`Điều khiển dự phòng P${player}`}>
        <div className="mb-1 text-center text-[9px] font-black text-white">P{player} · ĐIỀU KHIỂN TAY</div>
        <div className="grid grid-cols-4 gap-1.5">
          <button {...hold(() => onManualSteer(player, -1), () => onManualSteer(player, 0))} className="touch-none rounded-xl bg-white/15 p-2 text-white active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300" aria-label={`P${player} lái trái`}><ArrowLeft className="mx-auto h-5 w-5"/></button>
          <button {...hold(() => onManualSteer(player, 1), () => onManualSteer(player, 0))} className="touch-none rounded-xl bg-white/15 p-2 text-white active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300" aria-label={`P${player} lái phải`}><ArrowRight className="mx-auto h-5 w-5"/></button>
          <button {...hold(() => onManualBrake(player, true), () => onManualBrake(player, false))} className="touch-none rounded-xl bg-rose-500/80 p-2 text-white active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300" aria-label={`P${player} phanh`}><Gauge className="mx-auto h-5 w-5"/></button>
          <button onClick={() => onManualNitro(player)} className="rounded-xl bg-amber-500/90 p-2 text-white active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300" aria-label={`P${player} Nitro`}><Zap className="mx-auto h-5 w-5"/></button>
        </div>
        <button onClick={() => onManualShield(player)} className="mt-1.5 w-full rounded-xl bg-violet-600/85 px-2 py-1.5 text-[9px] font-black text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"><Shield className="mr-1 inline h-3.5 w-3.5"/> KHIÊN</button>
      </div>
    );
  };

  return (
    <div className="absolute inset-0 z-30 pointer-events-none">
      <div className="absolute left-1/2 top-0 h-full w-px bg-white/25 shadow-[0_0_12px_rgba(255,255,255,.4)] portrait:left-0 portrait:top-1/2 portrait:h-px portrait:w-full" />
      <div className="absolute left-2 top-2 pointer-events-none">{stat('P1', p1, 'cyan')}</div>
      <div className="absolute right-2 top-2 pointer-events-none portrait:left-2 portrait:right-auto portrait:top-[calc(50%+0.5rem)]">{stat('P2', p2, 'pink')}</div>
      <div className="absolute left-1/2 top-2 -translate-x-1/2 rounded-full border border-white/10 bg-slate-950/75 px-3 py-1 text-[9px] font-black text-white backdrop-blur-md">{track.name}</div>
      {engine.phase === 'countdown' && <div className="absolute inset-0 flex items-center justify-center"><div className="text-7xl md:text-9xl font-black italic text-amber-300 drop-shadow-[0_0_30px_rgba(251,191,36,.8)]">{engine.countdownNumber > 0 ? engine.countdownNumber : 'GO!'}</div></div>}

      {!poseStatus[0] && <div className="absolute bottom-14 left-2 w-[min(46vw,260px)] portrait:bottom-[calc(50%+3.1rem)]">{manualPad(1, 'cyan')}</div>}
      {!poseStatus[1] && <div className="absolute bottom-14 right-2 w-[min(46vw,260px)] portrait:bottom-14 portrait:left-2 portrait:right-auto">{manualPad(2, 'pink')}</div>}

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 pointer-events-auto">
        <div className="rounded-xl bg-slate-950/75 px-2 py-1 text-[9px] font-bold text-slate-300"><span className={poseStatus[0] ? 'text-emerald-300' : 'text-amber-300'}>P1 {poseStatus[0] ? 'CAM ✓' : 'TAY'}</span> · <span className={poseStatus[1] ? 'text-emerald-300' : 'text-amber-300'}>P2 {poseStatus[1] ? 'CAM ✓' : 'TAY'}</span> · {poseFps}fps</div>
        <button onClick={onGuide} className="rounded-xl bg-violet-600/90 p-2 text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300" title="Cử chỉ"><HelpCircle className="w-4 h-4"/></button>
        <button onClick={onSwitchCamera} className="rounded-xl bg-cyan-700/90 p-2 text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300" title="Góc nhìn"><Camera className="w-4 h-4"/></button>
        <button onClick={onToggleSound} className="rounded-xl bg-slate-800/90 p-2 text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300">{isSoundMuted ? <VolumeX className="w-4 h-4"/> : <Volume2 className="w-4 h-4"/>}</button>
        <button onClick={onExit} className="rounded-xl bg-rose-600/90 p-2 text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"><LogOut className="w-4 h-4"/></button>
      </div>
    </div>
  );
}
