/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  LudoPlayer,
  LudoPiece,
  LudoRules,
  LudoGameState,
  MagicTile,
  CharacterId,
  LudoColor,
} from '../types';

export const TRACK_TOTAL_TILES = 52;
export const HOME_STRETCH_TILES = 6;

// 15x15 Standard Ludo Grid Coordinates for each track tile (0..51)
// Outer path starting from Player 0 (Red / Top-Left) at index 0 (6, 1)
export const TRACK_GRID_COORDS: { x: number; y: number }[] = [
  // Top Arm - Downwards (0..4)
  { x: 6, y: 1 }, { x: 6, y: 2 }, { x: 6, y: 3 }, { x: 6, y: 4 }, { x: 6, y: 5 },
  // Left side of Right Arm (5..10)
  { x: 5, y: 6 }, { x: 4, y: 6 }, { x: 3, y: 6 }, { x: 2, y: 6 }, { x: 1, y: 6 }, { x: 0, y: 6 },
  // Tip of Left (11, 12)
  { x: 0, y: 7 }, { x: 0, y: 8 },
  // Bottom of Left Arm (13..17) -> Player 1 (Blue) starts here at 13 (1, 8)
  { x: 1, y: 8 }, { x: 2, y: 8 }, { x: 3, y: 8 }, { x: 4, y: 8 }, { x: 5, y: 8 },
  // Left side of Bottom Arm (18..23)
  { x: 6, y: 9 }, { x: 6, y: 10 }, { x: 6, y: 11 }, { x: 6, y: 12 }, { x: 6, y: 13 }, { x: 6, y: 14 },
  // Tip of Bottom (24, 25)
  { x: 7, y: 14 }, { x: 8, y: 14 },
  // Right side of Bottom Arm (26..30) -> Player 2 (Yellow) starts here at 26 (8, 13)
  { x: 8, y: 13 }, { x: 8, y: 12 }, { x: 8, y: 11 }, { x: 8, y: 10 }, { x: 8, y: 9 },
  // Bottom side of Right Arm (31..36)
  { x: 9, y: 8 }, { x: 10, y: 8 }, { x: 11, y: 8 }, { x: 12, y: 8 }, { x: 13, y: 8 }, { x: 14, y: 8 },
  // Tip of Right (37, 38)
  { x: 14, y: 7 }, { x: 14, y: 6 },
  // Top side of Right Arm (39..43) -> Player 3 (Purple/Green) starts here at 39 (13, 6)
  { x: 13, y: 6 }, { x: 12, y: 6 }, { x: 11, y: 6 }, { x: 10, y: 6 }, { x: 9, y: 6 },
  // Right side of Top Arm (44..49)
  { x: 8, y: 5 }, { x: 8, y: 4 }, { x: 8, y: 3 }, { x: 8, y: 2 }, { x: 8, y: 1 }, { x: 8, y: 0 },
  // Tip of Top (50, 51)
  { x: 7, y: 0 }, { x: 6, y: 0 },
];

// Home Stretch Grid Coordinates (indices 1..6) for each player
export const HOME_STRETCH_COORDS: Record<number, { x: number; y: number }[]> = {
  0: [ // Player 0 (Red - Top arm going down)
    { x: 7, y: 1 }, { x: 7, y: 2 }, { x: 7, y: 3 }, { x: 7, y: 4 }, { x: 7, y: 5 }, { x: 7, y: 6 },
  ],
  1: [ // Player 1 (Blue - Left arm going right)
    { x: 1, y: 7 }, { x: 2, y: 7 }, { x: 3, y: 7 }, { x: 4, y: 7 }, { x: 5, y: 7 }, { x: 6, y: 7 },
  ],
  2: [ // Player 2 (Yellow - Bottom arm going up)
    { x: 7, y: 13 }, { x: 7, y: 12 }, { x: 7, y: 11 }, { x: 7, y: 10 }, { x: 7, y: 9 }, { x: 7, y: 8 },
  ],
  3: [ // Player 3 (Purple/Green - Right arm going left)
    { x: 13, y: 7 }, { x: 12, y: 7 }, { x: 11, y: 7 }, { x: 10, y: 7 }, { x: 9, y: 7 }, { x: 8, y: 7 },
  ],
};

// Yard Slots Grid Coordinates (4 slots in each corner yard)
export const YARD_SLOT_COORDS: Record<number, { x: number; y: number }[]> = {
  0: [ // Red (Top-Left 0..5, 0..5)
    { x: 1.8, y: 1.8 }, { x: 3.8, y: 1.8 }, { x: 1.8, y: 3.8 }, { x: 3.8, y: 3.8 },
  ],
  1: [ // Blue (Bottom-Left 0..5, 9..14)
    { x: 1.8, y: 10.8 }, { x: 3.8, y: 10.8 }, { x: 1.8, y: 12.8 }, { x: 3.8, y: 12.8 },
  ],
  2: [ // Yellow (Bottom-Right 9..14, 9..14)
    { x: 10.8, y: 10.8 }, { x: 12.8, y: 10.8 }, { x: 10.8, y: 12.8 }, { x: 12.8, y: 12.8 },
  ],
  3: [ // Purple/Green (Top-Right 9..14, 0..5)
    { x: 10.8, y: 1.8 }, { x: 12.8, y: 1.8 }, { x: 10.8, y: 3.8 }, { x: 12.8, y: 3.8 },
  ],
};

// Goal Center Coordinates
export const GOAL_CENTER_COORD = { x: 7, y: 7 };

export const DEFAULT_RULES: LudoRules = {
  gameMode: 'magic',
  piecesPerPlayer: 4,
  spawnRules: 'one_or_six',
  rollSixBonus: true,
  allowCapture: true,
  exactFinish: false,
  magicTiles: true,
  moveSpeed: 'normal',
  turnTimeLimit: 0,
  autoMoveSingle: true,
  enableCameraClap: true,
};

export const PRESET_RULES: Record<string, LudoRules> = {
  quick: {
    gameMode: 'quick',
    piecesPerPlayer: 2,
    spawnRules: 'one_or_six',
    rollSixBonus: true,
    allowCapture: true,
    exactFinish: false,
    magicTiles: true,
    moveSpeed: 'fast',
    turnTimeLimit: 0,
    autoMoveSingle: true,
    enableCameraClap: true,
  },
  classic: {
    gameMode: 'classic',
    piecesPerPlayer: 4,
    spawnRules: 'six_only',
    rollSixBonus: true,
    allowCapture: true,
    exactFinish: true,
    magicTiles: false,
    moveSpeed: 'normal',
    turnTimeLimit: 0,
    autoMoveSingle: false,
    enableCameraClap: false,
  },
  magic: {
    gameMode: 'magic',
    piecesPerPlayer: 4,
    spawnRules: 'one_or_six',
    rollSixBonus: true,
    allowCapture: true,
    exactFinish: false,
    magicTiles: true,
    moveSpeed: 'normal',
    turnTimeLimit: 0,
    autoMoveSingle: true,
    enableCameraClap: true,
  },
};

export const DEFAULT_PLAYERS_SETUP = (count: 2 | 3 | 4 = 4, piecesCount = 4): LudoPlayer[] => {
  const configs: { name: string; mascot: CharacterId; color: LudoColor; isAI: boolean }[] = [
    { name: 'Bara', mascot: 'bara', color: 'red', isAI: false },
    { name: 'Mây', mascot: 'may', color: 'blue', isAI: false },
    { name: 'Bông', mascot: 'bong', color: 'yellow', isAI: count <= 2 },
    { name: 'Miu', mascot: 'miu', color: 'purple', isAI: count <= 3 },
  ];

  return configs.slice(0, count).map((cfg, idx) => {
    const startIdx = idx * 13;
    const entryIdx = (startIdx + 51) % TRACK_TOTAL_TILES;

    const pieces: LudoPiece[] = Array.from({ length: piecesCount }).map((_, pIdx) => ({
      id: pIdx,
      playerId: idx,
      state: 'yard',
      trackIndex: -1,
      stepCount: 0,
      homeIndex: 0,
    }));

    return {
      id: idx,
      name: cfg.name,
      mascot: cfg.mascot,
      color: cfg.color,
      isAI: cfg.isAI,
      aiDifficulty: 'normal',
      startTrackIndex: startIdx,
      entryTrackIndex: entryIdx,
      pieces,
      finishedCount: 0,
    };
  });
};

export const GENERATE_MAGIC_TILES = (): MagicTile[] => {
  return [
    { trackIndex: 4, type: 'rainbow', label: 'Cầu Vồng +2', icon: '🌈' },
    { trackIndex: 10, type: 'star', label: 'Sao May Mắn ⭐', icon: '⭐' },
    { trackIndex: 17, type: 'rainbow', label: 'Cầu Vồng +2', icon: '🌈' },
    { trackIndex: 23, type: 'gift', label: 'Hộp Quà 🎁', icon: '🎁' },
    { trackIndex: 30, type: 'rainbow', label: 'Cầu Vồng +2', icon: '🌈' },
    { trackIndex: 36, type: 'star', label: 'Sao May Mắn ⭐', icon: '⭐' },
    { trackIndex: 43, type: 'cloud', label: 'Mây Lướt +1', icon: '☁️' },
    { trackIndex: 48, type: 'snail', label: 'Ốc Sên -1', icon: '🐌' },
  ];
};

export class LudoGameEngine {
  public state: LudoGameState;

  constructor(initialState?: LudoGameState) {
    if (initialState) {
      this.state = initialState;
    } else {
      const defaultPlayers = DEFAULT_PLAYERS_SETUP(4, 4);
      this.state = {
        players: defaultPlayers,
        currentTurnIndex: 0,
        diceValue: null,
        hasRolled: false,
        isRolling: false,
        validPiecesToMove: [],
        selectedPieceId: null,
        previewSteps: [],
        isMoving: false,
        consecutiveSixes: 0,
        winnerOrder: [],
        isGameOver: false,
        magicTiles: GENERATE_MAGIC_TILES(),
        rules: DEFAULT_RULES,
        lastActionMessage: 'Chào mừng các bạn đến với Cờ Cá Ngựa Kỳ Diệu!',
        historyLog: ['Trận đấu bắt đầu!'],
      };
    }
  }

  // Initialize new game with custom player configs and rules
  public initGame(players: LudoPlayer[], rules: LudoRules): LudoGameState {
    this.state = {
      players,
      currentTurnIndex: 0,
      diceValue: null,
      hasRolled: false,
      isRolling: false,
      validPiecesToMove: [],
      selectedPieceId: null,
      previewSteps: [],
      isMoving: false,
      consecutiveSixes: 0,
      winnerOrder: [],
      isGameOver: false,
      magicTiles: rules.magicTiles ? GENERATE_MAGIC_TILES() : [],
      rules,
      lastActionMessage: `Đến lượt bạn ${players[0].name}! Hãy tung xúc xắc nhé.`,
      historyLog: [`Bắt đầu ván cờ với ${players.length} người chơi!`],
    };
    return this.state;
  }

  // Roll dice with deterministic outcome
  public rollDice(forcedValue?: number): number {
    const value = forcedValue !== undefined ? forcedValue : Math.floor(Math.random() * 6) + 1;
    this.state.diceValue = value;
    this.state.hasRolled = true;

    const currentPlayer = this.getCurrentPlayer();
    this.state.validPiecesToMove = this.getValidPiecesToMove(currentPlayer, value);

    if (value === 6) {
      this.state.consecutiveSixes++;
    } else {
      this.state.consecutiveSixes = 0;
    }

    return value;
  }

  public getCurrentPlayer(): LudoPlayer {
    return this.state.players[this.state.currentTurnIndex];
  }

  // Check if player can spawn a piece from yard
  public canSpawnPiece(diceValue: number): boolean {
    if (this.state.rules.spawnRules === 'one_or_six') {
      return diceValue === 1 || diceValue === 6;
    }
    return diceValue === 6;
  }

  // Get list of pieces that can make a legal move with given dice value
  public getValidPiecesToMove(player: LudoPlayer, diceValue: number): number[] {
    const validPieceIds: number[] = [];

    for (const piece of player.pieces) {
      if (piece.state === 'finished') continue;

      if (piece.state === 'yard') {
        if (this.canSpawnPiece(diceValue)) {
          // Check if own piece is already sitting on start tile
          const ownPieceAtStart = player.pieces.find(
            (p) => p.state === 'track' && p.trackIndex === player.startTrackIndex
          );
          if (!ownPieceAtStart) {
            validPieceIds.push(piece.id);
          }
        }
      } else if (piece.state === 'track') {
        const nextStepCount = piece.stepCount + diceValue;

        if (nextStepCount <= 51) {
          const nextTrackIndex = (player.startTrackIndex + nextStepCount) % TRACK_TOTAL_TILES;
          // Check if own piece is blocking the destination tile
          const ownPieceAtDest = player.pieces.find(
            (p) => p.id !== piece.id && p.state === 'track' && p.trackIndex === nextTrackIndex
          );
          if (!ownPieceAtDest) {
            validPieceIds.push(piece.id);
          }
        } else {
          // Entering Home Stretch
          const homeIndex = nextStepCount - 51;
          if (homeIndex <= HOME_STRETCH_TILES) {
            // Check if own piece is blocking that home slot
            const ownPieceAtHome = player.pieces.find(
              (p) => p.id !== piece.id && p.state === 'home_stretch' && p.homeIndex === homeIndex
            );
            if (!ownPieceAtHome) {
              validPieceIds.push(piece.id);
            }
          }
        }
      } else if (piece.state === 'home_stretch') {
        const nextHomeIndex = piece.homeIndex + diceValue;
        if (nextHomeIndex <= HOME_STRETCH_TILES) {
          const ownPieceAtHome = player.pieces.find(
            (p) => p.id !== piece.id && p.state === 'home_stretch' && p.homeIndex === nextHomeIndex
          );
          if (!ownPieceAtHome) {
            validPieceIds.push(piece.id);
          }
        } else if (!this.state.rules.exactFinish && nextHomeIndex > HOME_STRETCH_TILES) {
          validPieceIds.push(piece.id);
        }
      }
    }

    return validPieceIds;
  }

  // Calculate step-by-step route coordinates for visual preview & animation
  public calculateMoveRoute(
    player: LudoPlayer,
    piece: LudoPiece,
    diceValue: number
  ): {
    routeCoords: { x: number; y: number }[];
    finalState: 'track' | 'home_stretch' | 'finished';
    finalTrackIndex: number;
    finalHomeIndex: number;
    capturedPiece?: { player: LudoPlayer; piece: LudoPiece };
    magicTileEvent?: MagicTile;
  } {
    const routeCoords: { x: number; y: number }[] = [];

    if (piece.state === 'yard') {
      const startCoord = TRACK_GRID_COORDS[player.startTrackIndex];
      routeCoords.push(startCoord);

      // Check capture on spawn tile
      let captured: { player: LudoPlayer; piece: LudoPiece } | undefined;
      if (this.state.rules.allowCapture) {
        for (const otherPlayer of this.state.players) {
          if (otherPlayer.id === player.id) continue;
          const victim = otherPlayer.pieces.find(
            (p) => p.state === 'track' && p.trackIndex === player.startTrackIndex
          );
          if (victim) {
            captured = { player: otherPlayer, piece: victim };
            break;
          }
        }
      }

      return {
        routeCoords,
        finalState: 'track',
        finalTrackIndex: player.startTrackIndex,
        finalHomeIndex: 0,
        capturedPiece: captured,
      };
    }

    let currentStep = piece.stepCount;
    let currentHomeIndex = piece.homeIndex;
    let finalState: 'track' | 'home_stretch' | 'finished' = piece.state;
    let finalTrackIndex = piece.trackIndex;
    let finalHomeIndex = piece.homeIndex;

    for (let step = 1; step <= diceValue; step++) {
      if (finalState === 'track') {
        currentStep++;
        if (currentStep <= 51) {
          const tIdx = (player.startTrackIndex + currentStep) % TRACK_TOTAL_TILES;
          routeCoords.push(TRACK_GRID_COORDS[tIdx]);
          finalTrackIndex = tIdx;
        } else {
          finalState = 'home_stretch';
          currentHomeIndex = currentStep - 51;
          const hCoord = HOME_STRETCH_COORDS[player.id]?.[currentHomeIndex - 1] || GOAL_CENTER_COORD;
          routeCoords.push(hCoord);
          finalHomeIndex = currentHomeIndex;
        }
      } else if (finalState === 'home_stretch') {
        currentHomeIndex++;
        if (currentHomeIndex <= HOME_STRETCH_TILES) {
          const hCoord = HOME_STRETCH_COORDS[player.id]?.[currentHomeIndex - 1] || GOAL_CENTER_COORD;
          routeCoords.push(hCoord);
          finalHomeIndex = currentHomeIndex;
          if (currentHomeIndex === HOME_STRETCH_TILES) {
            finalState = 'finished';
          }
        } else {
          finalState = 'finished';
          routeCoords.push(GOAL_CENTER_COORD);
        }
      }
    }

    // Check Capture on destination tile
    let captured: { player: LudoPlayer; piece: LudoPiece } | undefined;
    if (finalState === 'track' && this.state.rules.allowCapture) {
      for (const otherPlayer of this.state.players) {
        if (otherPlayer.id === player.id) continue;
        const victim = otherPlayer.pieces.find(
          (p) => p.state === 'track' && p.trackIndex === finalTrackIndex
        );
        if (victim) {
          captured = { player: otherPlayer, piece: victim };
          break;
        }
      }
    }

    // Check Magic Tile
    let magicEvent: MagicTile | undefined;
    if (finalState === 'track' && this.state.rules.magicTiles) {
      const tile = this.state.magicTiles.find((m) => m.trackIndex === finalTrackIndex);
      if (tile) {
        magicEvent = tile;
      }
    }

    return {
      routeCoords,
      finalState,
      finalTrackIndex,
      finalHomeIndex,
      capturedPiece: captured,
      magicTileEvent: magicEvent,
    };
  }

  // Execute the move of a piece
  public executeMove(pieceId: number): {
    success: boolean;
    route: { x: number; y: number }[];
    captured?: { playerName: string; mascot: CharacterId; color: LudoColor };
    magicTileEvent?: MagicTile;
    hasWon?: boolean;
    canRollAgain: boolean;
  } {
    const player = this.getCurrentPlayer();
    const diceVal = this.state.diceValue || 1;
    const piece = player.pieces.find((p) => p.id === pieceId);

    if (!piece) {
      return { success: false, route: [], canRollAgain: false };
    }

    const calculation = this.calculateMoveRoute(player, piece, diceVal);

    // Apply state change to piece
    if (piece.state === 'yard') {
      piece.state = 'track';
      piece.trackIndex = calculation.finalTrackIndex;
      piece.stepCount = 0;
      piece.homeIndex = 0;
    } else {
      piece.state = calculation.finalState;
      piece.trackIndex = calculation.finalTrackIndex;
      piece.stepCount += diceVal;
      piece.homeIndex = calculation.finalHomeIndex;
    }

    let capturedInfo: { playerName: string; mascot: CharacterId; color: LudoColor } | undefined;

    // Apply capture
    if (calculation.capturedPiece) {
      const victim = calculation.capturedPiece.piece;
      victim.state = 'yard';
      victim.trackIndex = -1;
      victim.stepCount = 0;
      victim.homeIndex = 0;
      capturedInfo = {
        playerName: calculation.capturedPiece.player.name,
        mascot: calculation.capturedPiece.player.mascot,
        color: calculation.capturedPiece.player.color,
      };
      this.state.historyLog.push(
        `💥 ${player.name} đã đá quân của ${calculation.capturedPiece.player.name} bay về chuồng!`
      );
    }

    // Apply Magic Tile Bonus
    if (calculation.magicTileEvent) {
      const m = calculation.magicTileEvent;
      if (m.type === 'rainbow') {
        // Boost +2 steps
        piece.trackIndex = (piece.trackIndex + 2) % TRACK_TOTAL_TILES;
        piece.stepCount += 2;
      } else if (m.type === 'snail') {
        // Slow -1 step
        piece.trackIndex = (piece.trackIndex - 1 + TRACK_TOTAL_TILES) % TRACK_TOTAL_TILES;
        piece.stepCount = Math.max(0, piece.stepCount - 1);
      } else if (m.type === 'cloud') {
        // Glide +1 step
        piece.trackIndex = (piece.trackIndex + 1) % TRACK_TOTAL_TILES;
        piece.stepCount += 1;
      }
    }

    // Check if piece reached goal
    if (piece.state === 'finished') {
      player.finishedCount++;
      this.state.historyLog.push(`🏆 Một quân của ${player.name} đã về đích an toàn!`);
    }

    // Check player victory
    let playerWon = false;
    if (player.finishedCount >= player.pieces.length && !this.state.winnerOrder.includes(player.id)) {
      playerWon = true;
      const rank = this.state.winnerOrder.length + 1;
      player.rank = rank;
      this.state.winnerOrder.push(player.id);
      this.state.historyLog.push(`🥇 ${player.name} đã hoàn thành toàn bộ quân và đạt Hạng ${rank}!`);

      if (this.state.winnerOrder.length >= this.state.players.length - 1) {
        this.state.isGameOver = true;
      }
    }

    // Determine if player gets bonus roll
    let canRollAgain = false;
    if (this.state.rules.rollSixBonus && diceVal === 6 && !playerWon && !this.state.isGameOver) {
      canRollAgain = true;
    }

    return {
      success: true,
      route: calculation.routeCoords,
      captured: capturedInfo,
      magicTileEvent: calculation.magicTileEvent,
      hasWon: playerWon,
      canRollAgain,
    };
  }

  // Advance turn to next active player
  public nextTurn(): LudoPlayer {
    this.state.diceValue = null;
    this.state.hasRolled = false;
    this.state.validPiecesToMove = [];
    this.state.selectedPieceId = null;
    this.state.previewSteps = [];

    if (this.state.isGameOver) {
      return this.getCurrentPlayer();
    }

    let nextIdx = (this.state.currentTurnIndex + 1) % this.state.players.length;
    let attempts = 0;

    // Skip players who have already finished all their pieces
    while (
      this.state.players[nextIdx].finishedCount >= this.state.players[nextIdx].pieces.length &&
      attempts < this.state.players.length
    ) {
      nextIdx = (nextIdx + 1) % this.state.players.length;
      attempts++;
    }

    this.state.currentTurnIndex = nextIdx;
    const nextPlayer = this.state.players[nextIdx];
    this.state.lastActionMessage = `Đến lượt bạn ${nextPlayer.name}!`;

    return nextPlayer;
  }

  // Smart Local AI Move Selector
  public getBestAIMove(player: LudoPlayer, diceValue: number): number | null {
    const validPieceIds = this.getValidPiecesToMove(player, diceValue);
    if (validPieceIds.length === 0) return null;
    if (validPieceIds.length === 1) return validPieceIds[0];

    // Difficulty: Easy -> pure random
    if (player.aiDifficulty === 'easy') {
      const randIdx = Math.floor(Math.random() * validPieceIds.length);
      return validPieceIds[randIdx];
    }

    let bestScore = -Infinity;
    let bestPieceId = validPieceIds[0];

    for (const pId of validPieceIds) {
      const piece = player.pieces.find((p) => p.id === pId);
      if (!piece) continue;

      let score = 0;
      const calc = this.calculateMoveRoute(player, piece, diceValue);

      // 1. Finishing a piece is highest priority
      if (calc.finalState === 'finished') {
        score += 120;
      }
      // 2. Capturing an opponent
      if (calc.capturedPiece) {
        score += 90;
      }
      // 3. Spawning a new piece onto board
      if (piece.state === 'yard') {
        score += 70;
      }
      // 4. Entering home stretch
      if (calc.finalState === 'home_stretch') {
        score += 50;
      }
      // 5. Advancing closer to home
      score += piece.stepCount * 0.8;

      // 6. Magic Tile bonus
      if (calc.magicTileEvent) {
        if (calc.magicTileEvent.type === 'rainbow' || calc.magicTileEvent.type === 'star') {
          score += 30;
        }
      }

      // 7. Small randomness for natural feeling in 'normal' difficulty
      if (player.aiDifficulty === 'normal') {
        score += (Math.random() - 0.5) * 20;
      }

      if (score > bestScore) {
        bestScore = score;
        bestPieceId = pId;
      }
    }

    return bestPieceId;
  }

  // Persistence helpers
  public static saveSession(state: LudoGameState): void {
    try {
      localStorage.setItem('ludo_active_session', JSON.stringify(state));
    } catch (e) {
      console.warn('Ludo save session error', e);
    }
  }

  public static loadSession(): LudoGameState | null {
    try {
      const data = localStorage.getItem('ludo_active_session');
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Ludo load session error', e);
    }
    return null;
  }

  public static clearSession(): void {
    try {
      localStorage.removeItem('ludo_active_session');
    } catch (e) {
      // Safe ignore
    }
  }
}
