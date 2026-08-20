import React from 'react';
import { Camera, HelpCircle, LogOut, Volume2, VolumeX, Shield, Zap } from 'lucide-react';
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
}

export function DuoRaceHUD({ engine, track, poseStatus, poseFps, isSoundMuted, onToggleSound, onExit, onGuide, onSwitchCamera }: Props) {
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
  return (
    <div className="absolute inset-0 z-30 pointer-events-none">
      <div className="absolute left-1/2 top-0 h-full w-px bg-white/25 shadow-[0_0_12px_rgba(255,255,255,.4)] portrait:left-0 portrait:top-1/2 portrait:h-px portrait:w-full" />
      <div className="absolute left-2 top-2 pointer-events-none">{stat('P1', p1, 'cyan')}</div>
      <div className="absolute right-2 top-2 pointer-events-none portrait:left-2 portrait:right-auto portrait:top-[calc(50%+0.5rem)]">{stat('P2', p2, 'pink')}</div>
      <div className="absolute left-1/2 top-2 -translate-x-1/2 rounded-full border border-white/10 bg-slate-950/75 px-3 py-1 text-[9px] font-black text-white backdrop-blur-md">{track.name}</div>
      {engine.phase === 'countdown' && <div className="absolute inset-0 flex items-center justify-center"><div className="text-7xl md:text-9xl font-black italic text-amber-300 drop-shadow-[0_0_30px_rgba(251,191,36,.8)]">{engine.countdownNumber > 0 ? engine.countdownNumber : 'GO!'}</div></div>}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 pointer-events-auto">
        <div className="rounded-xl bg-slate-950/75 px-2 py-1 text-[9px] font-bold text-slate-300"><span className={poseStatus[0] ? 'text-emerald-300' : 'text-rose-300'}>P1 {poseStatus[0] ? '✓' : '!'}</span> · <span className={poseStatus[1] ? 'text-emerald-300' : 'text-rose-300'}>P2 {poseStatus[1] ? '✓' : '!'}</span> · {poseFps}fps</div>
        <button onClick={onGuide} className="rounded-xl bg-violet-600/90 p-2 text-white" title="Cử chỉ"><HelpCircle className="w-4 h-4"/></button>
        <button onClick={onSwitchCamera} className="rounded-xl bg-cyan-700/90 p-2 text-white" title="Góc nhìn"><Camera className="w-4 h-4"/></button>
        <button onClick={onToggleSound} className="rounded-xl bg-slate-800/90 p-2 text-white">{isSoundMuted ? <VolumeX className="w-4 h-4"/> : <Volume2 className="w-4 h-4"/>}</button>
        <button onClick={onExit} className="rounded-xl bg-rose-600/90 p-2 text-white"><LogOut className="w-4 h-4"/></button>
      </div>
    </div>
  );
}
