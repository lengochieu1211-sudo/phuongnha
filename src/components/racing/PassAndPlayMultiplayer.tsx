/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CharacterId, RacingTrackId, CarModelId } from '../../types';
import { TRACK_CATALOG } from '../../lib/racing/TrackData';
import { CAR_CATALOG } from '../../lib/racing/CarData';
import { Users, Trophy, Play, ChevronLeft, Sparkles, UserPlus } from 'lucide-react';

export interface LocalPlayerEntry {
  name: string;
  character: CharacterId;
  carId: CarModelId;
  color: string;
  bestTimeMs?: number;
}

interface PassAndPlayMultiplayerProps {
  onStartTournament: (players: LocalPlayerEntry[], trackId: RacingTrackId) => void;
  onBack: () => void;
}

export const PassAndPlayMultiplayer: React.FC<PassAndPlayMultiplayerProps> = ({
  onStartTournament,
  onBack,
}) => {
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(2);
  const [selectedTrack, setSelectedTrack] = useState<RacingTrackId>('neon_city');
  const [players, setPlayers] = useState<LocalPlayerEntry[]>([
    { name: 'Bé 1', character: 'bara', carId: 'bara_gt', color: '#c2884a' },
    { name: 'Bé 2', character: 'may', carId: 'may_cloud_gt', color: '#38bdf8' },
    { name: 'Bé 3', character: 'bong', carId: 'bong_rabbit_r', color: '#f472b6' },
    { name: 'Bé 4', character: 'lumi', carId: 'lumi_hyper', color: '#a855f7' },
  ]);

  const updatePlayer = (index: number, changes: Partial<LocalPlayerEntry>) => {
    setPlayers((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...changes };
      return copy;
    });
  };

  const handleStart = () => {
    const activePlayers = players.slice(0, playerCount);
    onStartTournament(activePlayers, selectedTrack);
  };

  return (
    <div
      id="pass-and-play-multiplayer-setup"
      className="w-full h-full min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 select-none overflow-y-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center gap-2"
        >
          <ChevronLeft className="w-5 h-5 text-cyan-400" />
          <span>Quay lại</span>
        </button>

        <h1 className="text-xl md:text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-400 to-cyan-400">
          ĐUA XE NHIỀU NGƯỜI (PASS & PLAY)
        </h1>

        <div className="w-20" />
      </div>

      {/* Main Setup Body */}
      <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full my-auto py-4">
        {/* Step 1: Select Player Count */}
        <div className="flex flex-col items-center gap-3">
          <span className="text-xs md:text-sm font-bold text-slate-300 uppercase tracking-wider">
            1. CÓ BAO NHIÊU BẠN CÙNG ĐUA?
          </span>
          <div className="flex gap-4">
            {([2, 3, 4] as const).map((count) => (
              <button
                key={count}
                onClick={() => setPlayerCount(count)}
                className={`w-20 h-16 rounded-2xl font-black text-xl flex flex-col items-center justify-center gap-1 border transition-all active:scale-95 ${
                  playerCount === count
                    ? 'bg-gradient-to-t from-cyan-600 to-blue-500 border-cyan-300 text-white shadow-xl shadow-cyan-950/60 scale-105'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span>{count}</span>
                <span className="text-[10px] uppercase font-bold text-cyan-200">Bạn</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Player Profiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {players.slice(0, playerCount).map((p, idx) => (
            <div
              key={idx}
              className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-4 flex flex-col gap-3 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400 uppercase">TAY ĐUA #{idx + 1}</span>
                <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: p.color }} />
              </div>

              {/* Name Input */}
              <input
                type="text"
                value={p.name}
                onChange={(e) => updatePlayer(idx, { name: e.target.value })}
                placeholder={`Tên bạn ${idx + 1}`}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:border-cyan-400 focus:outline-none"
              />

              {/* Select Car */}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-bold text-slate-400">Chọn xe:</span>
                <select
                  value={p.carId}
                  onChange={(e) => updatePlayer(idx, { carId: e.target.value as CarModelId })}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-cyan-300 focus:outline-none"
                >
                  {CAR_CATALOG.map((car) => (
                    <option key={car.id} value={car.id}>
                      {car.name} ({car.subTitle})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>

        {/* Step 3: Select Track */}
        <div className="flex flex-col gap-2 bg-slate-900/80 p-4 rounded-3xl border border-slate-800">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            2. CHỌN ĐƯỜNG ĐUA THI ĐẤU:
          </span>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {TRACK_CATALOG.map((track) => (
              <button
                key={track.id}
                onClick={() => setSelectedTrack(track.id)}
                className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                  selectedTrack === track.id
                    ? 'bg-purple-950/60 border-purple-400 text-purple-200 shadow-lg'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="text-2xl">{track.icon}</span>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-bold truncate">{track.name}</span>
                  <span className="text-[10px] text-slate-400">{track.subtitle}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Start Button */}
      <div className="max-w-md mx-auto w-full">
        <button
          onClick={handleStart}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-slate-950 font-black text-lg shadow-2xl shadow-cyan-950/60 flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <Play className="w-6 h-6 fill-current" />
          <span>BẮT ĐẦU GIẢI ĐUA ({playerCount} BÉ)</span>
        </button>
      </div>
    </div>
  );
};
