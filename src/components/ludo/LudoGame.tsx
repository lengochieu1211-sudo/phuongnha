/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Award,
  Volume2,
  VolumeX,
  Camera,
  CameraOff,
  Clock,
  HelpCircle,
  Trophy,
  Play,
  Pause,
  Bot,
  User,
} from 'lucide-react';
import {
  LudoPlayer,
  LudoRules,
  LudoGameState,
  PlayerProgress,
  GameGesture,
  CharacterId,
} from '../../types';
import { getCharacterEmoji } from '../../utils/characterRenderer';
import {
  LudoGameEngine,
  DEFAULT_RULES,
  DEFAULT_PLAYERS_SETUP,
} from '../../lib/LudoGameEngine';
import { audio } from '../../lib/AudioEngine';
import { voiceGuide } from '../../lib/VoiceGuideService';
import { VOICE_LINES } from '../../lib/voiceLines.vi';
import { VOICE_MANIFEST } from '../../lib/voiceManifest';
import LudoBoard from './LudoBoard';
import LudoDice from './LudoDice';
import LudoSetupModal from './LudoSetupModal';
import { useCameraPose } from '../../providers/CameraPoseContext';

interface LudoGameProps {
  progress: PlayerProgress;
  onUpdateProgress: (updater: (prev: PlayerProgress) => PlayerProgress) => void;
  gesture?: GameGesture;
  onBack: () => void;
}

export default function LudoGame({
  progress,
  onUpdateProgress,
  gesture,
  onBack,
}: LudoGameProps) {
  const [engine] = useState<LudoGameEngine>(() => new LudoGameEngine());
  const [gameState, setGameState] = useState<LudoGameState>(engine.state);
  const [showSetupModal, setShowSetupModal] = useState<boolean>(true);
  const {
    isStreaming: isCameraStreaming,
    startCamera,
    stopCamera,
    trackingMode,
    trackingFeedback,
  } = useCameraPose();
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [previewCoords, setPreviewCoords] = useState<{ x: number; y: number }[]>([]);
  const [movingPieceInfo, setMovingPieceInfo] = useState<{
    playerId: number;
    pieceId: number;
    currentCoord: { x: number; y: number };
  } | null>(null);

  // Pop Bubble Capture Effect state
  const [popCaptureEvent, setPopCaptureEvent] = useState<{
    victimName: string;
    victimMascot: CharacterId;
  } | null>(null);

  // Voice announcement text banner
  const [voiceText, setVoiceText] = useState<string>(VOICE_LINES.ludo.start);

  // Turn time countdown
  const [turnTimeRemaining, setTurnTimeRemaining] = useState<number>(0);

  // Previous state for undo feature
  const [previousTurnState, setPreviousTurnState] = useState<LudoGameState | null>(null);

  // Last gesture triggered roll to prevent multiple triggers
  const lastGestureRef = useRef<string>('');

  // Mascot emoji helper
  const getMascotAvatar = (mascot: CharacterId) => getCharacterEmoji(mascot);

  // Speak helper using the unified VoiceGuide service
  const speakVoice = (textOrKey: string, isKey: boolean = false) => {
    if (isKey) {
      const [cat, subKey] = textOrKey.split('.');
      const entry = VOICE_MANIFEST[cat]?.[subKey];
      if (entry) {
        setVoiceText(entry.text);
      }
      voiceGuide.playKey(textOrKey, 'medium');
    } else {
      setVoiceText(textOrKey);
      voiceGuide.speak(textOrKey, 'medium');
    }
  };

  // Sync engine state to React state & auto-save session
  const updateState = () => {
    const newState = { ...engine.state };
    setGameState(newState);
    LudoGameEngine.saveSession(newState);
  };

  // Start new game
  const handleStartGame = (players: LudoPlayer[], rules: LudoRules) => {
    engine.initGame(players, rules);
    updateState();
    setShowSetupModal(false);
    audio.playGameStart();
    speakVoice('ludo.start', true);
  };

  // Resume saved game
  const handleResumeGame = (savedState: LudoGameState) => {
    engine.state = savedState;
    updateState();
    setShowSetupModal(false);
    audio.playPowerup();
    speakVoice('Chào mừng trở lại! Mình tiếp tục chơi nhé!');
  };

  // Execute Dice Roll
  const handleRollDice = () => {
    if (gameState.hasRolled || gameState.isRolling || gameState.isGameOver || isPaused) return;

    // Save previous state before roll for undo
    setPreviousTurnState(JSON.parse(JSON.stringify(engine.state)));

    engine.state.isRolling = true;
    updateState();
    audio.playDiceRoll();

    setTimeout(() => {
      engine.state.isRolling = false;
      const rolledVal = engine.rollDice();
      updateState();

      const currentPlayer = engine.getCurrentPlayer();
      if (rolledVal === 6 && !currentPlayer.isAI) {
        onUpdateProgress((prev) => ({
          ...prev,
          highScores: {
            ...prev.highScores,
            ludo_rolled_six: (prev.highScores?.ludo_rolled_six || 0) + 1,
          },
        }));
      }

      // Play recorded key for specific die rolls
      const rolledKeys = ['', 'ludo.one', 'ludo.two', 'ludo.three', 'ludo.four', 'ludo.five', 'ludo.six'];
      const key = rolledKeys[rolledVal];
      if (key) {
        speakVoice(key, true);
      } else {
        speakVoice(VOICE_LINES.ludo.rollResult(currentPlayer.name, rolledVal));
      }

      // Check if no legal moves exist
      if (engine.state.validPiecesToMove.length === 0) {
        speakVoice(`Rất tiếc! Không có quân nào đi được. Đổi lượt tiếp theo nhé!`);
        setTimeout(() => {
          advanceToNextTurn();
        }, 1800);
      } else if (
        engine.state.validPiecesToMove.length === 1 &&
        engine.state.rules.autoMoveSingle &&
        !currentPlayer.isAI
      ) {
        // Auto select and move if only 1 option available
        setTimeout(() => {
          handlePieceSelect(engine.state.validPiecesToMove[0]);
        }, 1200);
      }
    }, 600);
  };

  // Select piece and execute movement animation
  const handlePieceSelect = (pieceId: number) => {
    if (!gameState.hasRolled || gameState.isMoving || gameState.isGameOver) return;
    const currentPlayer = engine.getCurrentPlayer();

    // Calculate move route
    const piece = currentPlayer.pieces.find((p) => p.id === pieceId);
    if (!piece) return;

    const calc = engine.calculateMoveRoute(currentPlayer, piece, gameState.diceValue || 1);
    setPreviewCoords(calc.routeCoords);
    engine.state.selectedPieceId = pieceId;
    updateState();

    // Start Step-by-Step Hop Animation
    engine.state.isMoving = true;
    updateState();

    let stepIndex = 0;
    const hopInterval = gameState.rules.moveSpeed === 'fast' ? 120 : 200;

    const hopTimer = setInterval(() => {
      if (stepIndex < calc.routeCoords.length) {
        setMovingPieceInfo({
          playerId: currentPlayer.id,
          pieceId: piece.id,
          currentCoord: calc.routeCoords[stepIndex],
        });
        audio.playPieceHop();
        stepIndex++;
      } else {
        clearInterval(hopTimer);
        setMovingPieceInfo(null);
        setPreviewCoords([]);

        // Finalize Move in Engine
        const result = engine.executeMove(pieceId);
        engine.state.isMoving = false;
        updateState();

        // Handle Capture POP effect
        if (result.captured) {
          audio.playPieceCapture();
          setPopCaptureEvent({
            victimName: result.captured.playerName,
            victimMascot: result.captured.mascot,
          });
          speakVoice('ludo.capture', true);
          setTimeout(() => setPopCaptureEvent(null), 2500);
        }

        // Handle Magic Tile Event
        if (result.magicTileEvent) {
          audio.playMagicTileTrigger();
          if (result.magicTileEvent.type === 'rainbow') {
            speakVoice(VOICE_LINES.ludo.rainbowJump);
          } else if (result.magicTileEvent.type === 'star') {
            speakVoice(VOICE_LINES.ludo.starBonus);
          }
        }

        // Handle Piece Goal Arrival
        if (piece.state === 'finished') {
          audio.playHomeCheer();
          speakVoice('ludo.home', true);
        }

        // Check if Game Over
        if (engine.state.isGameOver) {
          handleGameOver();
          return;
        }

        // Check roll again or advance turn
        if (result.canRollAgain) {
          audio.playPowerup();
          speakVoice('ludo.again', true);
          engine.state.diceValue = null;
          engine.state.hasRolled = false;
          engine.state.validPiecesToMove = [];
          engine.state.selectedPieceId = null;
          updateState();
        } else {
          setTimeout(() => {
            advanceToNextTurn();
          }, 800);
        }
      }
    }, hopInterval);
  };

  // Advance turn to next player
  const advanceToNextTurn = () => {
    const nextPlayer = engine.nextTurn();
    updateState();
    speakVoice('ludo.yourTurn', true);
  };

  // Undo last action (if allowed before turn ends)
  const handleUndo = () => {
    if (!previousTurnState || gameState.isMoving) return;
    engine.state = JSON.parse(JSON.stringify(previousTurnState));
    setPreviousTurnState(null);
    setPreviewCoords([]);
    updateState();
    audio.playUndo();
    speakVoice('Đã hoàn tác nước vừa chọn!');
  };

  // AI Automatic Play Logic
  useEffect(() => {
    const currentPlayer = engine.getCurrentPlayer();
    if (
      currentPlayer &&
      currentPlayer.isAI &&
      !showSetupModal &&
      !gameState.isGameOver &&
      !isPaused &&
      !gameState.isMoving
    ) {
      if (!gameState.hasRolled && !gameState.isRolling) {
        const timer = setTimeout(() => {
          handleRollDice();
        }, 1200);
        return () => clearTimeout(timer);
      } else if (gameState.hasRolled && gameState.validPiecesToMove.length > 0) {
        const bestMove = engine.getBestAIMove(currentPlayer, gameState.diceValue || 1);
        if (bestMove !== null) {
          const timer = setTimeout(() => {
            handlePieceSelect(bestMove);
          }, 1000);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [
    gameState.currentTurnIndex,
    gameState.hasRolled,
    gameState.isRolling,
    gameState.isGameOver,
    isPaused,
    showSetupModal,
  ]);

  // V5.13: After the player confirms Ludo rules, keep camera running only when
  // gesture dice-roll is enabled. App.tsx still treats Ludo as a camera-capable screen
  // so entering the game/calibration can initialize the stream reliably.
  useEffect(() => {
    if (showSetupModal || trackingMode === 'keyboard_only') return;

    if (gameState.rules.enableCameraClap) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [
    showSetupModal,
    gameState.rules.enableCameraClap,
    trackingMode,
    startCamera,
    stopCamera,
  ]);

  // Camera Gesture (Clap / Both Arms Up / Hands Spread) for Rolling Dice
  useEffect(() => {
    if (!gesture || !gameState.rules.enableCameraClap || showSetupModal || isPaused) return;

    if (
      (gesture === 'clap' || gesture === 'both_arms_up' || gesture === 'hands_spread') &&
      lastGestureRef.current !== gesture
    ) {
      lastGestureRef.current = gesture;
      const currentPlayer = engine.getCurrentPlayer();
      if (!currentPlayer.isAI && !gameState.hasRolled && !gameState.isRolling) {
        handleRollDice();
      }
    }

    if (gesture === 'standing') {
      lastGestureRef.current = '';
    }
  }, [
    gesture,
    gameState.rules.enableCameraClap,
    gameState.hasRolled,
    gameState.isRolling,
    showSetupModal,
    isPaused,
  ]);

  // Handle Game Over & Reward Stars
  const handleGameOver = () => {
    audio.playVictory();
    speakVoice(VOICE_LINES.ludo.allFinish);

    const winnerId = engine.state.winnerId;
    const winnerPlayer = engine.state.players.find((p) => p.id === winnerId);
    const playerWon = winnerPlayer && !winnerPlayer.isAI;

    onUpdateProgress((prev) => {
      const updatedAchievements = [...prev.achievements];
      if (!updatedAchievements.includes('ludo_racer')) {
        updatedAchievements.push('ludo_racer');
      }

      const newScores = { ...prev.highScores };
      newScores.ludo_matches_played = (newScores.ludo_matches_played || 0) + 1;
      
      if (playerWon) {
        newScores.ludo_matches_won = (newScores.ludo_matches_won || 0) + 1;
        newScores.ludo_home_champion = 1;
        
        if (engine.state.rules.magicTilesEnabled || engine.state.theme === 'starry') {
          newScores.ludo_magic_track_win = 1;
        }
      }

      return {
        ...prev,
        stars: prev.stars + (playerWon ? 15 : 8),
        highScores: newScores,
        achievements: updatedAchievements,
      };
    });

    LudoGameEngine.clearSession();
  };

  const currentPlayer = engine.getCurrentPlayer();

  return (
    <div
      id="ludo-main-screen"
      className="w-full min-h-[90vh] flex flex-col items-center justify-between p-2 md:p-4 bg-gradient-to-b from-purple-100 via-pink-50 to-indigo-100 rounded-3xl relative overflow-hidden"
    >
      {/* 1. Header Toolbar */}
      <div className="w-full max-w-5xl flex items-center justify-between gap-2 p-3 bg-white/90 backdrop-blur-md rounded-2xl border-2 border-purple-200 shadow-md">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-4 h-4" /> MENU
        </button>

        {/* Current Turn Badge */}
        <div className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-md animate-pulse">
          <span className="text-lg md:text-xl">{getMascotAvatar(currentPlayer.mascot)}</span>
          <span className="text-xs md:text-sm font-black uppercase tracking-wide">
            LƯỢT CỦA: {currentPlayer.name} {currentPlayer.isAI ? '🤖' : '👤'}
          </span>
        </div>

        {/* Actions (Undo, Reset, Rules) */}
        <div className="flex items-center gap-2">
          {previousTurnState && (
            <button
              onClick={handleUndo}
              className="p-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-black flex items-center gap-1 transition"
              title="Hoàn tác nước đi"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">HOÀN TÁC</span>
            </button>
          )}

          <button
            onClick={() => setShowSetupModal(true)}
            className="p-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs font-black transition"
            title="Tạo ván mới"
          >
            VÁN MỚI 🎲
          </button>
        </div>
      </div>

      {/* 2. Voice Guide Message Banner */}
      <div className="w-full max-w-2xl my-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl shadow-md text-center text-xs md:text-sm font-bold flex items-center justify-center gap-2 animate-in fade-in">
        <Volume2 className="w-4 h-4 shrink-0 animate-bounce" />
        <span>{voiceText}</span>
      </div>

      {/* 3. Main Play Area: Ludo Board + Interactive Dice Side Panel */}
      <div className="w-full max-w-5xl flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center justify-center">
        {/* Left Side / Top: Players Status Card (Lg: col-span-3) */}
        <div className="lg:col-span-3 flex lg:flex-col gap-2 justify-center order-2 lg:order-1">
          {gameState.players.map((p, idx) => {
            const isTurn = p.id === currentPlayer.id;
            return (
              <div
                key={`player-card-${p.id}`}
                className={`p-3 rounded-2xl border-2 transition-all flex items-center justify-between ${
                  isTurn
                    ? 'bg-white border-purple-500 shadow-lg scale-102 ring-2 ring-purple-300'
                    : 'bg-white/70 border-slate-200 opacity-80'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="text-2xl">{getMascotAvatar(p.mascot)}</div>
                  <div>
                    <div className="text-xs font-black text-slate-800 flex items-center gap-1">
                      {p.name} {p.isAI ? <Bot className="w-3 h-3 text-indigo-500" /> : <User className="w-3 h-3 text-purple-500" />}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Về đích: {p.finishedCount}/{p.pieces.length}
                    </div>
                  </div>
                </div>

                {/* Rank Badge if finished */}
                {p.rank && (
                  <div className="px-2 py-0.5 bg-amber-400 text-amber-950 font-black text-xs rounded-full shadow-xs">
                    Hạng {p.rank} 🏆
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Center: Ludo Board (Lg: col-span-6) */}
        <div className="lg:col-span-6 flex items-center justify-center order-1 lg:order-2">
          <LudoBoard
            players={gameState.players}
            currentTurnIndex={gameState.currentTurnIndex}
            validPieces={gameState.validPiecesToMove}
            selectedPieceId={gameState.selectedPieceId}
            previewCoords={previewCoords}
            magicTiles={gameState.magicTiles}
            movingPieceInfo={movingPieceInfo}
            onSelectPiece={handlePieceSelect}
          />
        </div>

        {/* Right Side / Bottom: 3D Dice & Action Control (Lg: col-span-3) */}
        <div className="lg:col-span-3 flex flex-col items-center justify-center gap-4 bg-white/80 backdrop-blur-sm p-4 rounded-3xl border-2 border-purple-200 shadow-lg order-3">
          <div className="text-center">
            <span className="text-[11px] font-black text-slate-500 uppercase">
              BẢNG ĐIỀU KHIỂN
            </span>
            <h3 className="text-sm md:text-base font-black text-slate-800">
              LƯỢT: {currentPlayer.name}
            </h3>
          </div>

          <div
            className={`w-full max-w-[240px] flex items-center justify-between gap-2 px-3 py-2 rounded-2xl border text-[10px] font-black ${
              !gameState.rules.enableCameraClap
                ? 'bg-slate-100 border-slate-200 text-slate-500'
                : isCameraStreaming
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}
          >
            <span className="flex items-center gap-1.5">
              {gameState.rules.enableCameraClap ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
              CAMERA CỬ CHỈ
            </span>
            <span>
              {!gameState.rules.enableCameraClap
                ? 'TẮT'
                : isCameraStreaming
                ? 'BẬT'
                : 'ĐANG MỞ...'}
            </span>
          </div>

          {gameState.rules.enableCameraClap && (
            <div className="w-full max-w-[240px] -mt-2 text-center text-[9px] text-slate-500">
              {isCameraStreaming
                ? `Nhận diện: ${gesture || 'standing'} • ${trackingFeedback.replaceAll('_', ' ')}`
                : 'Camera sẽ tự mở để nhận cử chỉ tung xúc xắc.'}
            </div>
          )}

          <LudoDice
            value={gameState.diceValue}
            isRolling={gameState.isRolling}
            canRoll={!gameState.hasRolled && !currentPlayer.isAI && !gameState.isGameOver}
            currentPlayerName={currentPlayer.name}
            currentPlayerColor={currentPlayer.color}
            onRoll={handleRollDice}
            gestureDetected={gesture}
            enableCameraClap={gameState.rules.enableCameraClap}
          />

          {/* Turn status tips */}
          <div className="text-center text-xs text-slate-600">
            {gameState.hasRolled ? (
              <span className="font-bold text-purple-700 animate-pulse">
                👉 Chạm vào quân đang sáng trên bàn cờ để đi!
              </span>
            ) : currentPlayer.isAI ? (
              <span className="text-slate-500 italic">🤖 Máy AI đang suy nghĩ...</span>
            ) : (
              <span>Tung xúc xắc để bắt đầu lượt!</span>
            )}
          </div>
        </div>
      </div>

      {/* 4. Pop Capture Visual Overlay */}
      {popCaptureEvent && (
        <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center z-50 animate-in zoom-in fade-in">
          <div className="bg-white p-6 rounded-3xl border-4 border-rose-400 shadow-2xl text-center max-w-sm">
            <div className="text-5xl animate-bounce">🫧 POP! 💥</div>
            <h3 className="text-lg font-black text-slate-800 mt-2">
              Ối! {popCaptureEvent.victimName} về chuồng rồi!
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Bạn {getMascotAvatar(popCaptureEvent.victimMascot)} bay nhẹ về chuồng lấy lại năng lượng nhé!
            </p>
          </div>
        </div>
      )}

      {/* 5. Game Over Victory Modal */}
      {gameState.isGameOver && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl border-4 border-amber-300 text-center animate-in zoom-in">
            <div className="text-5xl animate-bounce">🏆 🌟 🎊</div>
            <h2 className="text-2xl font-black text-slate-800 mt-3">
              KẾT THÚC ĐƯỜNG ĐUA!
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Tất cả các bạn nhỏ đã hoàn thành đường đua thật xuất sắc!
            </p>

            {/* Ranking List */}
            <div className="my-6 space-y-2">
              {gameState.players
                .slice()
                .sort((a, b) => (a.rank || 99) - (b.rank || 99))
                .map((p, idx) => (
                  <div
                    key={`rank-row-${p.id}`}
                    className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🌟'}
                      </span>
                      <span className="text-xl">{getMascotAvatar(p.mascot)}</span>
                      <span className="text-xs font-black text-slate-800">{p.name}</span>
                    </div>
                    <span className="text-xs font-black text-purple-700">
                      HẠNG {p.rank || idx + 1}
                    </span>
                  </div>
                ))}
            </div>

            {/* Reward stars */}
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 font-bold text-xs flex items-center justify-center gap-2 mb-6">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Thưởng hoàn thành ván đấu: +8 Ngôi sao ⭐</span>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={onBack}
                className="px-5 py-3 rounded-full border-2 border-slate-300 font-bold text-slate-600 text-xs hover:bg-slate-100 transition"
              >
                VỀ MENU CHÍNH
              </button>
              <button
                onClick={() => setShowSetupModal(true)}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-full shadow-lg transition transform hover:scale-105"
              >
                CHƠI VÁN MỚI 🎲
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Setup Modal */}
      {showSetupModal && (
        <LudoSetupModal
          onStartGame={handleStartGame}
          onResumeSavedGame={handleResumeGame}
          onBack={onBack}
        />
      )}
    </div>
  );
}
