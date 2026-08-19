/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  LudoPlayer,
  LudoPiece,
  MagicTile,
  LudoColor,
  CharacterId,
} from '../../types';
import {
  TRACK_GRID_COORDS,
  HOME_STRETCH_COORDS,
  YARD_SLOT_COORDS,
  GOAL_CENTER_COORD,
} from '../../lib/LudoGameEngine';

interface LudoBoardProps {
  players: LudoPlayer[];
  currentTurnIndex: number;
  validPieces: number[]; // valid piece IDs of current player
  selectedPieceId: number | null;
  previewCoords: { x: number; y: number }[];
  magicTiles: MagicTile[];
  movingPieceInfo?: { playerId: number; pieceId: number; currentCoord: { x: number; y: number } } | null;
  onSelectPiece: (pieceId: number) => void;
}

export default function LudoBoard({
  players,
  currentTurnIndex,
  validPieces,
  selectedPieceId,
  previewCoords,
  magicTiles,
  movingPieceInfo,
  onSelectPiece,
}: LudoBoardProps) {
  const currentPlayer = players[currentTurnIndex];

  // Mascot Icon Helper
  const getMascotAvatar = (mascot: CharacterId) => {
    switch (mascot) {
      case 'bara':
        return '🐻';
      case 'may':
        return '☁️';
      case 'bong':
        return '🐰';
      case 'miu':
        return '🐱';
      case 'lumi':
        return '🦄';
      default:
        return '🐴';
    }
  };

  // Color Map
  const colorMap: Record<LudoColor, { base: string; light: string; border: string; glow: string; text: string }> = {
    red: {
      base: '#F43F5E',
      light: '#FFE4E6',
      border: '#FDA4AF',
      glow: 'rgba(244, 63, 94, 0.4)',
      text: '#9F1239',
    },
    blue: {
      base: '#0EA5E9',
      light: '#E0F2FE',
      border: '#7DD3FC',
      glow: 'rgba(14, 165, 233, 0.4)',
      text: '#075985',
    },
    yellow: {
      base: '#F59E0B',
      light: '#FEF3C7',
      border: '#FCD34D',
      glow: 'rgba(245, 158, 11, 0.4)',
      text: '#92400E',
    },
    green: {
      base: '#10B981',
      light: '#D1FAE5',
      border: '#6EE7B7',
      glow: 'rgba(16, 185, 129, 0.4)',
      text: '#065F46',
    },
    purple: {
      base: '#A855F7',
      light: '#F3E8FF',
      border: '#D8B4FE',
      glow: 'rgba(168, 85, 247, 0.4)',
      text: '#6B21A8',
    },
  };

  // Check if tile is in preview route
  const getPreviewStepNumber = (gx: number, gy: number) => {
    const idx = previewCoords.findIndex((c) => Math.abs(c.x - gx) < 0.2 && Math.abs(c.y - gy) < 0.2);
    return idx >= 0 ? idx + 1 : null;
  };

  // Find magic tile at track index
  const getMagicTileAt = (trackIdx: number) => {
    return magicTiles.find((m) => m.trackIndex === trackIdx);
  };

  // Cell size percentage for 15x15 grid
  const cellSize = 100 / 15; // 6.666%

  return (
    <div
      id="ludo-board-container"
      className="relative w-full max-w-[540px] aspect-square bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-3xl p-2 md:p-3 border-4 border-purple-200 shadow-2xl overflow-hidden select-none"
      style={{
        boxShadow: '0 20px 40px -15px rgba(124, 58, 237, 0.2), inset 0 2px 6px rgba(255, 255, 255, 0.8)',
      }}
    >
      {/* Outer Board Grid (15x15) */}
      <div className="relative w-full h-full bg-white/90 rounded-2xl border-2 border-purple-100 overflow-hidden">
        {/* 1. Four Corner Yards (Chuồng 4 góc) */}
        {players.map((p, idx) => {
          const colStyle = colorMap[p.color] || colorMap.red;
          // Coordinates of 4 yards in 15x15 grid (each yard is 6x6 cells)
          const yardPosition =
            idx === 0
              ? { left: '0%', top: '0%' } // Top-Left (Red)
              : idx === 1
              ? { left: '0%', bottom: '0%' } // Bottom-Left (Blue)
              : idx === 2
              ? { right: '0%', bottom: '0%' } // Bottom-Right (Yellow)
              : { right: '0%', top: '0%' }; // Top-Right (Purple)

          return (
            <div
              key={`yard-${p.id}`}
              className="absolute w-[40%] h-[40%] rounded-2xl p-2 flex flex-col justify-between shadow-xs border-2"
              style={{
                ...yardPosition,
                backgroundColor: colStyle.light,
                borderColor: colStyle.border,
              }}
            >
              {/* Yard Header */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1">
                  <span className="text-xl md:text-2xl animate-bounce">{getMascotAvatar(p.mascot)}</span>
                  <span className="text-[11px] md:text-xs font-black" style={{ color: colStyle.text }}>
                    {p.name}
                  </span>
                </div>
                <div
                  className="w-3 h-3 rounded-full shadow-xs"
                  style={{ backgroundColor: colStyle.base }}
                />
              </div>

              {/* Yard Inner 4 Slots Container */}
              <div className="bg-white/80 rounded-xl p-1.5 grid grid-cols-2 gap-1.5 justify-items-center items-center shadow-inner">
                {p.pieces.map((piece, slotIdx) => {
                  const isYard = piece.state === 'yard';
                  const isCurrent = p.id === currentPlayer.id;
                  const isValid = isCurrent && validPieces.includes(piece.id);
                  const isSelected = isCurrent && selectedPieceId === piece.id;

                  return (
                    <div
                      key={`yard-slot-${piece.id}`}
                      onClick={() => {
                        if (isYard && isValid) {
                          onSelectPiece(piece.id);
                        }
                      }}
                      className={`w-7 h-7 md:w-9 md:h-9 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                        isYard
                          ? isValid
                            ? 'cursor-pointer animate-pulse ring-4 ring-yellow-400 scale-110 shadow-lg'
                            : 'cursor-default'
                          : 'border-dashed border-slate-300 bg-slate-100/50'
                      }`}
                      style={{
                        backgroundColor: isYard ? colStyle.base : undefined,
                        borderColor: isYard ? '#fff' : undefined,
                      }}
                    >
                      {isYard && (
                        <div className="flex flex-col items-center">
                          <span className="text-base md:text-lg leading-none">
                            {getMascotAvatar(p.mascot)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* 2. Track Cells (52 ô đường đua quanh bàn cờ) */}
        {TRACK_GRID_COORDS.map((coord, trackIdx) => {
          const magic = getMagicTileAt(trackIdx);
          const stepNum = getPreviewStepNumber(coord.x, coord.y);

          // Identify if it's a spawn start tile
          const spawnPlayer = players.find((p) => p.startTrackIndex === trackIdx);
          const spawnColor = spawnPlayer ? colorMap[spawnPlayer.color] : null;

          return (
            <div
              key={`track-${trackIdx}`}
              className={`absolute rounded-lg flex items-center justify-center font-bold text-[9px] md:text-[10px] transition-all duration-200 ${
                stepNum
                  ? 'bg-amber-300 ring-4 ring-amber-400 text-amber-950 font-black scale-110 z-20 animate-pulse shadow-lg'
                  : spawnColor
                  ? 'border-2 shadow-xs'
                  : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'
              }`}
              style={{
                left: `${coord.x * cellSize}%`,
                top: `${coord.y * cellSize}%`,
                width: `${cellSize}%`,
                height: `${cellSize}%`,
                backgroundColor: stepNum
                  ? '#FDE047'
                  : spawnColor
                  ? spawnColor.light
                  : undefined,
                borderColor: spawnColor ? spawnColor.border : undefined,
              }}
            >
              {/* Step number on preview */}
              {stepNum ? (
                <span className="text-xs md:text-sm font-black text-rose-600 animate-bounce">
                  {stepNum}
                </span>
              ) : magic ? (
                <span className="text-xs md:text-sm">{magic.icon}</span>
              ) : spawnColor ? (
                <span className="text-[10px] font-black" style={{ color: spawnColor.text }}>
                  ★
                </span>
              ) : null}
            </div>
          );
        })}

        {/* 3. Four Home Stretch Lanes (Làn về đích 4 màu) */}
        {players.map((p) => {
          const colStyle = colorMap[p.color] || colorMap.red;
          const coords = HOME_STRETCH_COORDS[p.id] || [];

          return coords.map((coord, homeIdx) => {
            const stepNum = getPreviewStepNumber(coord.x, coord.y);

            return (
              <div
                key={`home-lane-${p.id}-${homeIdx}`}
                className={`absolute rounded-lg flex items-center justify-center font-black text-[10px] md:text-xs border transition-all ${
                  stepNum
                    ? 'bg-amber-300 ring-4 ring-amber-400 text-amber-950 scale-110 z-20 animate-pulse shadow-lg'
                    : 'shadow-inner'
                }`}
                style={{
                  left: `${coord.x * cellSize}%`,
                  top: `${coord.y * cellSize}%`,
                  width: `${cellSize}%`,
                  height: `${cellSize}%`,
                  backgroundColor: stepNum ? '#FDE047' : colStyle.light,
                  borderColor: colStyle.border,
                  color: colStyle.text,
                }}
              >
                {stepNum ? (
                  <span className="text-xs md:text-sm text-rose-600">{stepNum}</span>
                ) : (
                  <span>{homeIdx + 1}</span>
                )}
              </div>
            );
          });
        })}

        {/* 4. Central Goal Area (Ô Đích Vàng Trung Tâm 3x3) */}
        <div
          id="central-ludo-goal"
          className="absolute rounded-2xl bg-gradient-to-br from-amber-200 via-yellow-100 to-rose-200 border-3 border-amber-300 shadow-lg flex flex-col items-center justify-center z-10"
          style={{
            left: '40%',
            top: '40%',
            width: '20%',
            height: '20%',
          }}
        >
          <div className="text-2xl md:text-3xl animate-bounce">👑</div>
          <span className="text-[10px] font-black text-amber-900 uppercase tracking-tighter">
            VỀ ĐÍCH
          </span>
        </div>

        {/* 5. Active Pieces Rendering On Track & Home Stretch */}
        {players.map((player) => {
          const colStyle = colorMap[player.color] || colorMap.red;

          return player.pieces.map((piece) => {
            // Skip pieces in yard (already rendered in yard slots)
            if (piece.state === 'yard') return null;

            // Determine Grid Coordinate
            let gx = 0;
            let gy = 0;

            if (piece.state === 'track') {
              const c = TRACK_GRID_COORDS[piece.trackIndex];
              if (c) {
                gx = c.x;
                gy = c.y;
              }
            } else if (piece.state === 'home_stretch') {
              const c = HOME_STRETCH_COORDS[player.id]?.[piece.homeIndex - 1];
              if (c) {
                gx = c.x;
                gy = c.y;
              }
            } else if (piece.state === 'finished') {
              gx = GOAL_CENTER_COORD.x;
              gy = GOAL_CENTER_COORD.y;
            }

            const isCurrent = player.id === currentPlayer.id;
            const isValid = isCurrent && validPieces.includes(piece.id);
            const isSelected = isCurrent && selectedPieceId === piece.id;

            return (
              <div
                key={`piece-${player.id}-${piece.id}`}
                onClick={() => {
                  if (isValid) {
                    onSelectPiece(piece.id);
                  }
                }}
                className={`absolute rounded-full flex items-center justify-center border-2 border-white shadow-xl transition-all duration-300 z-30 ${
                  isValid
                    ? 'cursor-pointer ring-4 ring-yellow-400 scale-120 animate-bounce hover:scale-130'
                    : 'cursor-default'
                } ${isSelected ? 'ring-4 ring-rose-500 scale-125' : ''}`}
                style={{
                  left: `${gx * cellSize + cellSize * 0.1}%`,
                  top: `${gy * cellSize + cellSize * 0.1}%`,
                  width: `${cellSize * 0.8}%`,
                  height: `${cellSize * 0.8}%`,
                  backgroundColor: colStyle.base,
                }}
              >
                <span className="text-base md:text-xl leading-none drop-shadow-sm">
                  {getMascotAvatar(player.mascot)}
                </span>

                {/* Finished Star Badge */}
                {piece.state === 'finished' && (
                  <span className="absolute -top-1 -right-1 text-[10px]">⭐</span>
                )}
              </div>
            );
          });
        })}

        {/* 6. Dynamic Animated Moving Piece during Step Jump */}
        {movingPieceInfo && (
          <div
            className="absolute rounded-full flex items-center justify-center border-2 border-white shadow-2xl z-40 animate-bounce"
            style={{
              left: `${movingPieceInfo.currentCoord.x * cellSize + cellSize * 0.05}%`,
              top: `${movingPieceInfo.currentCoord.y * cellSize + cellSize * 0.05}%`,
              width: `${cellSize * 0.9}%`,
              height: `${cellSize * 0.9}%`,
              backgroundColor: '#FF4081',
              boxShadow: '0 0 20px #FF4081',
            }}
          >
            <span className="text-2xl leading-none">✨</span>
          </div>
        )}
      </div>
    </div>
  );
}
