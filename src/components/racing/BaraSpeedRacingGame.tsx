/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CarConfig,
  CarModelId,
  CarCustomization,
  RacingTrackConfig,
  RacingTrackId,
  RaceMode,
  RaceSettings,
  PlayerRaceProfile,
  PlayerProgress,
  GameGesture,
  CameraViewMode,
} from '../../types';
import {
  CAR_CATALOG,
  loadRaceProfile,
  saveRaceProfile,
  DEFAULT_CUSTOMIZATION,
} from '../../lib/racing/CarData';
import { TRACK_CATALOG } from '../../lib/racing/TrackData';
import { RaceEngine, RaceResult, RaceStatePhase } from '../../lib/racing/RaceEngine';
import { raceAudio } from '../../lib/racing/RaceAudio';
import { audio } from '../../lib/AudioEngine';
import { MotionSteeringEngine, SteeringState } from '../../lib/racing/MotionSteeringEngine';
import { VOICE_LINES } from '../../lib/voiceLines.vi';
import { poseDetector, WristPosition, PoseLandmark } from '../../utils/poseDetector';
import { voiceGuide } from '../../lib/VoiceGuideService';
import { isExternalCar, prefetchExternalCarAsset, shouldUseExternalCar } from '../../lib/racing/ExternalCarModelLoader';
import { detectDeviceClass } from '../../utils/graphicsQuality';

import { GarageScreen } from './GarageScreen';
import { Race3DCanvas } from './Race3DCanvas';
import { RaceHUD } from './RaceHUD';
import { RacePodium } from './RacePodium';
import { MotionSteeringCalibration } from './MotionSteeringCalibration';
import { PassAndPlayMultiplayer, LocalPlayerEntry } from './PassAndPlayMultiplayer';

import {
  Trophy,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
  Gauge,
  Camera,
  Users,
  Compass,
  Award,
  ChevronLeft,
  Settings as SettingsIcon,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface BaraSpeedRacingGameProps {
  progress: PlayerProgress;
  onUpdateProgress: (updater: (prev: PlayerProgress) => PlayerProgress) => void;
  gesture?: GameGesture;
  onBack: () => void;
}

type RacingSubScreen =
  | 'mode_select'
  | 'garage'
  | 'track_select'
  | 'in_race'
  | 'podium'
  | 'calibration'
  | 'pass_and_play';


const RACE_SETTINGS_STORAGE_KEY = 'phuong_nha_race_settings_v54';
const DEFAULT_RACE_SETTINGS: RaceSettings = {
  controlMode: 'camera_motion',
  autoSteerAssist: true,
  autoThrottle: true,
  steeringSensitivity: 'normal',
  deadZoneAngle: 5,
  cameraShake: 'normal',
  reducedMotion: false,
  cameraView: 'close_chase',
  quality: 'auto',
  soundVolume: 1.0,
  engineVolume: 0.8,
};

const QUALITY_PRESETS: { id: RaceSettings['quality']; label: string; hint: string }[] = [
  { id: 'auto', label: '✨ Tự động', hint: 'Tự nhận PC / điện thoại / TV' },
  { id: 'low', label: '📱 Điện thoại', hint: 'Xe đẹp, giảm cảnh + bóng để mượt' },
  { id: 'medium', label: '📺 TV / Mi Box', hint: 'Cân bằng cho màn hình lớn' },
  { id: 'high', label: '🖥️ PC đẹp', hint: 'Xe Ultra + bóng + cảnh chi tiết' },
];

export default function BaraSpeedRacingGame({
  progress,
  onUpdateProgress,
  gesture = 'standing',
  onBack,
}: BaraSpeedRacingGameProps) {
  // 1. Profile State
  const [profile, setProfile] = useState<PlayerRaceProfile>(() => loadRaceProfile());
  const [currentSubScreen, setCurrentSubScreen] = useState<RacingSubScreen>('mode_select');

  // 2. Race Configuration State
  const [selectedTrackId, setSelectedTrackId] = useState<RacingTrackId>('neon_city');
  const [selectedCarId, setSelectedCarId] = useState<CarModelId>(profile.selectedCarId || 'bara_gt');
  const [raceMode, setRaceMode] = useState<RaceMode>('quick_race');
  const [cameraView, setCameraView] = useState<CameraViewMode>('close_chase');

  // 3. Settings State — persisted so the chosen Phone / TV / PC profile survives refreshes.
  const [raceSettings, setRaceSettings] = useState<RaceSettings>(() => {
    if (typeof window === 'undefined') return DEFAULT_RACE_SETTINGS;
    try {
      const saved = localStorage.getItem(RACE_SETTINGS_STORAGE_KEY);
      return saved ? { ...DEFAULT_RACE_SETTINGS, ...JSON.parse(saved) } : DEFAULT_RACE_SETTINGS;
    } catch {
      return DEFAULT_RACE_SETTINGS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(RACE_SETTINGS_STORAGE_KEY, JSON.stringify(raceSettings));
    } catch {
      // Storage may be unavailable in private/locked-down browser modes.
    }
  }, [raceSettings]);

  // V5.16: warm NETWORK cache only while choosing a track. Do not parse a 20–40 MB
  // ASCII FBX in the background because FBXLoader parsing itself runs on the main thread.
  useEffect(() => {
    const deviceClass = detectDeviceClass();
    if (
      currentSubScreen !== 'track_select' ||
      !isExternalCar(selectedCarId) ||
      !shouldUseExternalCar(selectedCarId, deviceClass)
    ) return;

    const timer = window.setTimeout(() => {
      prefetchExternalCarAsset(selectedCarId).catch(() => undefined);
    }, 120);

    return () => window.clearTimeout(timer);
  }, [selectedCarId, currentSubScreen]);

  // Warm the small PC asphalt file in browser cache without uploading it to WebGL yet.
  useEffect(() => {
    if (detectDeviceClass() !== 'desktop') return;
    const img = new Image();
    img.decoding = 'async';
    img.src = `${((import.meta as any).env?.BASE_URL || '/')}assets/pc-hd/asphalt-hd.webp`;
  }, []);

  // 4. Engine & HUD State
  const [engine, setEngine] = useState<RaceEngine | null>(null);
  const [raceResult, setRaceResult] = useState<RaceResult | null>(null);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [activeVoiceText, setActiveVoiceText] = useState<string>('');
  const [showExitModal, setShowExitModal] = useState(false);
  const [raceSceneReady, setRaceSceneReady] = useState(false);
  const [raceLoadingText, setRaceLoadingText] = useState('Đang chuẩn bị đường đua...');
  const countdownStartedRef = useRef(false);
  const savedPhaseRef = useRef<RaceStatePhase>('racing');

  // Pause and Exit Handlers
  const handlePauseAndShowExitModal = useCallback(() => {
    if (engine) {
      savedPhaseRef.current = engine.phase;
      engine.phase = 'paused';
      raceAudio.stopEngine();
      raceAudio.setDriftSound(false, 0);
    }
    setShowExitModal(true);
    raceAudio.playMenuClick();
  }, [engine]);

  const handleResumeRace = useCallback(() => {
    if (engine) {
      engine.phase = savedPhaseRef.current || 'racing';
      if (engine.phase === 'racing') {
        raceAudio.startEngine();
      }
    }
    setShowExitModal(false);
    raceAudio.playMenuClick();
  }, [engine]);

  const handleConfirmExitToRaceMenu = useCallback(() => {
    if (engine) {
      engine.destroy();
      setEngine(null);
    }
    setShowExitModal(false);
    setCurrentSubScreen('mode_select');
    raceAudio.playMenuClick();
  }, [engine]);

  const handleConfirmExitToAppMain = useCallback(() => {
    if (engine) {
      engine.destroy();
      setEngine(null);
    }
    setShowExitModal(false);
    onBack();
    raceAudio.playMenuClick();
  }, [engine, onBack]);

  // 5. Steering & Input State
  const steeringEngineRef = useRef<MotionSteeringEngine>(new MotionSteeringEngine());
  const [steeringState, setSteeringState] = useState<SteeringState>({
    steerValue: 0,
    steeringAngleDeg: 0,
    isHoldingWheel: false,
    nitroTriggered: false,
    brakeTriggered: false,
    handsConfidence: 0,
    rawSteerValue: 0,
    rawAngleDeg: 0,
    neutralAngleDeg: 0,
    effectiveAngleDeg: 0,
  });

  const [lastWristData, setLastWristData] = useState<{
    leftWrist?: WristPosition;
    rightWrist?: WristPosition;
    landmarks?: PoseLandmark[];
  }>({});

  // 6. Multiplayer Tournament State
  const [tournamentPlayers, setTournamentPlayers] = useState<LocalPlayerEntry[]>([]);
  const [currentTournamentIndex, setCurrentTournamentIndex] = useState<number>(0);
  const [tournamentResults, setTournamentResults] = useState<{ player: LocalPlayerEntry; timeMs: number }[]>([]);

  // Track & Car Objects
  const currentTrack = TRACK_CATALOG.find((t) => t.id === selectedTrackId) || TRACK_CATALOG[0];
  const currentCar = CAR_CATALOG.find((c) => c.id === selectedCarId) || CAR_CATALOG[0];
  const currentCustomization: CarCustomization =
    profile.carCustomizations[selectedCarId] || {
      ...DEFAULT_CUSTOMIZATION,
      paintColor: currentCar.defaultColor,
    };

  // Voice synthesis speaker
  const speakVoice = useCallback((text: string) => {
    setActiveVoiceText(text);
    if (!isSoundMuted) {
      voiceGuide.speak(text, 'high');
    }
  }, [isSoundMuted]);

  // Update profile handler
  const handleUpdateProfile = (newProfile: PlayerRaceProfile) => {
    setProfile(newProfile);
    saveRaceProfile(newProfile);
  };

  // Convert camera pose and game gestures to real-time steering input
  useEffect(() => {
    const unsubscribe = poseDetector.addListener((result) => {
      setLastWristData({
        leftWrist: result.leftWrist,
        rightWrist: result.rightWrist,
        landmarks: result.landmarks,
      });

      if (!engine || engine.phase !== 'racing' || raceSettings.controlMode !== 'camera_motion') return;

      // Process wrist/landmark angles via steering engine
      const steerRes = steeringEngineRef.current.processPose(
        result.leftWrist,
        result.rightWrist,
        result.landmarks
      );

      let steer = steerRes.steerValue;
      let nitro = steerRes.nitroTriggered;
      let brake = steerRes.brakeTriggered;

      // Only override with tilt gestures if hands are not currently holding wheel
      if (!steerRes.isHoldingWheel) {
        const activeGesture = result.gesture || gesture;
        if (activeGesture === 'tilt_left' || activeGesture === 'left_arm_up') {
          steer = Math.min(steer, -0.85);
        } else if (activeGesture === 'tilt_right' || activeGesture === 'right_arm_up') {
          steer = Math.max(steer, 0.85);
        }
      }

      const activeGesture = result.gesture || gesture;
      if (activeGesture === 'both_arms_up' || activeGesture === 'jump') {
        nitro = true;
      }

      if (activeGesture === 'duck') {
        brake = true;
      }

      const isHolding = steerRes.isHoldingWheel || activeGesture === 'tilt_left' || activeGesture === 'tilt_right';

      setSteeringState({
        ...steerRes,
        steerValue: steer,
        steeringAngleDeg: isHolding ? (steerRes.isHoldingWheel ? steerRes.steeringAngleDeg : steer * 35) : 0,
        isHoldingWheel: isHolding,
        nitroTriggered: nitro,
        brakeTriggered: brake,
        handsConfidence: isHolding ? 0.95 : 0.3,
      });

      engine.setSteeringInput(steer);
      if (nitro) engine.triggerNitro();
      if (brake) engine.setBrakeInput(true);
      else engine.setBrakeInput(false);
    });

    return () => {
      unsubscribe();
    };
  }, [engine, gesture]);

  // Keyboard controls listener for in-race
  useEffect(() => {
    if (!engine || currentSubScreen !== 'in_race') return;

    const keysDown = new Set<string>();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (showExitModal) {
          handleResumeRace();
        } else {
          handlePauseAndShowExitModal();
        }
        return;
      }
      keysDown.add(e.code);
      updateControls();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDown.delete(e.code);
      updateControls();
    };

    const updateControls = () => {
      if (!engine || engine.phase === 'finished') return;

      // Camera view toggle (always allowed)
      if (keysDown.has('KeyC')) {
        handleCycleCameraView();
        keysDown.delete('KeyC');
      }

      // Guard gameplay steering, throttle, brake, nitro to keyboard mode only
      if (raceSettings.controlMode !== 'keyboard') return;

      // Throttle (Gas)
      if (keysDown.has('ArrowUp') || keysDown.has('KeyW')) {
        engine.setThrottleInput(1.0);
      } else if (!raceSettings.autoThrottle) {
        engine.setThrottleInput(0);
      }

      // Brake / Reverse
      if (keysDown.has('ArrowDown') || keysDown.has('KeyS')) {
        engine.setBrakeInput(true);
      } else {
        engine.setBrakeInput(false);
      }

      // Steering
      let steer = 0;
      if (keysDown.has('ArrowLeft') || keysDown.has('KeyA')) {
        steer -= 1.0;
      }
      if (keysDown.has('ArrowRight') || keysDown.has('KeyD')) {
        steer += 1.0;
      }
      engine.setSteeringInput(steer);

      // Nitro
      if (keysDown.has('Space') || keysDown.has('ShiftLeft') || keysDown.has('ShiftRight')) {
        engine.triggerNitro();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [engine, currentSubScreen, raceSettings.autoThrottle]);

  // Start race runner
  const handleStartRace = (trackId: RacingTrackId, carId: CarModelId, mode: RaceMode) => {
    setSelectedTrackId(trackId);
    setSelectedCarId(carId);
    setRaceMode(mode);
    setShowExitModal(false);

    raceAudio.init();

    const newEngine = new RaceEngine(trackId, carId, mode, raceSettings, (lineKey, text) => {
      if (text) speakVoice(text);
      else if (VOICE_LINES.racing[lineKey as keyof typeof VOICE_LINES.racing]) {
        const val = VOICE_LINES.racing[lineKey as keyof typeof VOICE_LINES.racing];
        if (typeof val === 'string') speakVoice(val);
      }
    });

    countdownStartedRef.current = false;
    setRaceSceneReady(false);
    setRaceLoadingText(
      isExternalCar(carId)
        ? 'Đang nạp xe 3D và tối ưu đường đua...'
        : 'Đang dựng đường đua và cảnh vật...'
    );

    setEngine(newEngine);
    setCurrentSubScreen('in_race');
  };

  const handleRaceSceneReady = useCallback(() => {
    if (!engine || countdownStartedRef.current) return;

    countdownStartedRef.current = true;
    setRaceSceneReady(true);
    setRaceLoadingText('Sẵn sàng!');

    // Countdown begins only AFTER FBX parsing + shader compilation + first scene render.
    // This turns the old "3...2..." stutter into a controlled loading phase.
    audio.playRaceStartJingle();
    engine.startCountdown(() => {
      speakVoice(VOICE_LINES.racing.go);
    });
    speakVoice(VOICE_LINES.racing.countdown3);
  }, [engine]);

  // Check race finish polling in requestAnimationFrame loop
  useEffect(() => {
    if (!engine || currentSubScreen !== 'in_race') return;

    let animId: number;

    const checkFinish = () => {
      if (engine.isFinished && engine.raceResult && !raceResult) {
        const res = engine.raceResult;
        setRaceResult(res);

        // Update progress & rewards
        onUpdateProgress((prev) => {
          const updatedScores = { ...prev.highScores };
          const driftKey = `racing_${selectedTrackId}`;
          updatedScores[driftKey] = Math.max(prev.highScores?.[driftKey] || 0, res.totalDriftScore);
          
          // Increment completed races
          updatedScores.racing_completed_count = (prev.highScores?.racing_completed_count || 0) + 1;
          
          // Drift max score
          updatedScores.racing_max_drift = Math.max(prev.highScores?.racing_max_drift || 0, res.totalDriftScore);
          
          // Rank 1 wins
          if (res.rank === 1) {
            updatedScores.racing_rank_1_count = (prev.highScores?.racing_rank_1_count || 0) + 1;
            
            // Check specific track wins
            if (selectedTrackId === 'neon_city') {
              updatedScores.racing_track_neon_city_win = 1;
            }
          }
          
          // Track overall nitro usage
          updatedScores.racing_nitro_triggered = (prev.highScores?.racing_nitro_triggered || 0) + 1;

          return {
            ...prev,
            stars: prev.stars + res.starsEarned,
            diamonds: prev.diamonds + res.diamondsEarned,
            highScores: updatedScores,
          };
        });

        // Update race profile stats
        handleUpdateProfile({
          ...profile,
          totalDriftScore: profile.totalDriftScore + res.totalDriftScore,
          racesWon: res.rank === 1 ? profile.racesWon + 1 : profile.racesWon,
          bestLapTimes: {
            ...profile.bestLapTimes,
            [selectedTrackId]: Math.min(
              profile.bestLapTimes[selectedTrackId] || 999999,
              res.bestLapTimeMs
            ),
          },
        });

        // If in Pass and Play tournament mode
        if (raceMode === 'pass_and_play' && tournamentPlayers.length > 0) {
          const currentP = tournamentPlayers[currentTournamentIndex];
          if (currentP) {
            setTournamentResults((prev) => [...prev, { player: currentP, timeMs: res.totalTimeMs }]);
          }
          if (currentTournamentIndex < tournamentPlayers.length - 1) {
            setCurrentTournamentIndex((prev) => prev + 1);
          }
        }

        if (res.rank === 1) {
          speakVoice(VOICE_LINES.racing.firstPlace);
        } else {
          speakVoice(VOICE_LINES.racing.finishGood);
        }

        setTimeout(() => {
          setCurrentSubScreen('podium');
        }, 1200);
      } else {
        animId = requestAnimationFrame(checkFinish);
      }
    };

    animId = requestAnimationFrame(checkFinish);
    return () => cancelAnimationFrame(animId);
  }, [engine, currentSubScreen, raceResult, selectedTrackId, raceMode, tournamentPlayers, currentTournamentIndex, profile]);

  // Cycle camera views
  const handleCycleCameraView = () => {
    const views: CameraViewMode[] = ['chase', 'close_chase', 'hood', 'cockpit', 'cinematic'];
    const nextIdx = (views.indexOf(cameraView) + 1) % views.length;
    const nextView = views[nextIdx];
    setCameraView(nextView);
    raceAudio.playMenuClick();
  };

  // Toggle sound
  const handleToggleSound = () => {
    const next = !isSoundMuted;
    setIsSoundMuted(next);
    raceAudio.setMute(next);
  };

  return (
    <div
      id="bara-speed-racing-container"
      className="relative w-full h-full min-h-screen bg-slate-950 text-white font-sans overflow-hidden select-none"
    >
      {/* 1. Mode Select Screen (Main Racing Hub) */}
      {currentSubScreen === 'mode_select' && (
        <div
          id="racing-hub-screen"
          className="w-full h-full min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 flex flex-col justify-between p-6 overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-200 font-black flex items-center gap-2 transition backdrop-blur-md"
            >
              <ChevronLeft className="w-5 h-5 text-cyan-400" />
              <span>Menu Chính</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/40 px-3.5 py-1.5 rounded-full font-black text-amber-300 text-sm">
                <span>⭐</span>
                <span>{progress.stars.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-cyan-500/20 border border-cyan-400/40 px-3.5 py-1.5 rounded-full font-black text-cyan-300 text-sm">
                <span>💎</span>
                <span>{progress.diamonds.toLocaleString()}</span>
              </div>
              <button
                onClick={handleToggleSound}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300"
              >
                {isSoundMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Hero Branding */}
          <div className="flex flex-col items-center text-center my-auto py-6 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500/20 via-pink-500/20 to-amber-500/20 border border-cyan-400/40 px-5 py-1.5 rounded-full text-xs font-black tracking-widest text-cyan-300 uppercase mb-3 shadow-lg">
              <Sparkles className="w-4 h-4 text-cyan-300 animate-spin" />
              <span>ARCADE SPEED & DRIFT SIMULATOR</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-400 to-cyan-400 drop-shadow-2xl">
              BARA SPEED RACING
            </h1>
            <p className="text-sm md:text-base font-bold text-slate-300 mt-2 max-w-xl leading-relaxed">
              Trải nghiệm cảm giác tốc độ arcade đỉnh cao! Drift bốc lửa, tăng tốc Nitro thần tốc và đua xe 3D siêu mượt.
            </p>

            {/* Camera Motion Highlight Banner */}
            <div className="w-full max-w-2xl mt-4 bg-gradient-to-r from-cyan-950/80 via-blue-900/60 to-purple-950/80 border-2 border-cyan-400/60 rounded-3xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-2xl shrink-0 animate-pulse">
                  🏎️
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black bg-cyan-400 text-slate-950 px-2 py-0.5 rounded-full uppercase">
                      Camera AI Đang Bật
                    </span>
                    <span className="text-xs text-cyan-300 font-bold">Vô-lăng ảo 2 tay</span>
                  </div>
                  <p className="text-xs text-slate-200 mt-0.5 leading-snug">
                    <strong className="text-cyan-300">2 tay giơ trước ngực</strong> bẻ lái như cầm vô lăng • <strong className="text-amber-300">Giơ 2 tay lên cao</strong> bật NITRO 🚀!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setCurrentSubScreen('calibration')}
                  className="px-3.5 py-2 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-md transition active:scale-95"
                >
                  Cân Chỉnh 📷
                </button>
              </div>
            </div>

            {/* Quick Game Modes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full mt-8">
              {/* Quick Race Mode */}
              <div
                id="mode-quick-race-card"
                onClick={() => {
                  setRaceMode('quick_race');
                  setCurrentSubScreen('track_select');
                  raceAudio.playMenuClick();
                }}
                className="group relative bg-gradient-to-br from-cyan-950/60 to-slate-900/80 border-2 border-cyan-500/40 hover:border-cyan-400 rounded-3xl p-5 text-left cursor-pointer transition-all hover:scale-102 hover:shadow-2xl hover:shadow-cyan-950/60 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-4xl">🏎️</span>
                  <span className="text-[10px] font-black bg-cyan-500 text-slate-950 px-2.5 py-0.5 rounded-full uppercase">
                    PHỔ BIẾN
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-white group-hover:text-cyan-300 transition">
                    Đua Nhanh (Quick Race)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Đua cùng 3 đối thủ AI thông minh trên các cung đường neon lung linh.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800 text-xs font-black text-cyan-400">
                  <span>3 Vòng đua</span>
                  <Play className="w-4 h-4 fill-cyan-400" />
                </div>
              </div>

              {/* Gara & Nâng Cấp */}
              <div
                id="mode-garage-card"
                onClick={() => {
                  setCurrentSubScreen('garage');
                  raceAudio.playMenuClick();
                  speakVoice(VOICE_LINES.racing.garageWelcome);
                }}
                className="group relative bg-gradient-to-br from-amber-950/60 to-slate-900/80 border-2 border-amber-500/40 hover:border-amber-400 rounded-3xl p-5 text-left cursor-pointer transition-all hover:scale-102 hover:shadow-2xl hover:shadow-amber-950/60 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-4xl">🛠️</span>
                  <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full uppercase">
                    9 SIÊU XE 3D
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-white group-hover:text-amber-300 transition">
                    Gara Xe & Độ Xe
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Độ màu sơn bóng, cánh gió GT, đèn neon gầm, mâm sao & nâng cấp động cơ.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800 text-xs font-black text-amber-400">
                  <span>Tùy biến xe</span>
                  <Play className="w-4 h-4 fill-amber-400" />
                </div>
              </div>

              {/* Đua Nhiều Người (Pass & Play) */}
              <div
                id="mode-multiplayer-card"
                onClick={() => {
                  setCurrentSubScreen('pass_and_play');
                  raceAudio.playMenuClick();
                }}
                className="group relative bg-gradient-to-br from-purple-950/60 to-slate-900/80 border-2 border-purple-500/40 hover:border-purple-400 rounded-3xl p-5 text-left cursor-pointer transition-all hover:scale-102 hover:shadow-2xl hover:shadow-purple-950/60 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-4xl">👥</span>
                  <span className="text-[10px] font-black bg-purple-500 text-white px-2.5 py-0.5 rounded-full uppercase">
                    2-4 BÉ CHƠI
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-white group-hover:text-purple-300 transition">
                    Đua Tiếp Sức Cùng Bạn
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Giải đấu tính giờ luân phiên cùng bạn bè và gia đình trên 1 thiết bị!
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800 text-xs font-black text-purple-400">
                  <span>Giải đấu gia đình</span>
                  <Play className="w-4 h-4 fill-purple-400" />
                </div>
              </div>

              {/* Time Attack Mode */}
              <div
                id="mode-time-attack-card"
                onClick={() => {
                  setRaceMode('time_attack');
                  setCurrentSubScreen('track_select');
                  raceAudio.playMenuClick();
                }}
                className="group relative bg-gradient-to-br from-rose-950/60 to-slate-900/80 border-2 border-rose-500/40 hover:border-rose-400 rounded-3xl p-5 text-left cursor-pointer transition-all hover:scale-102 hover:shadow-2xl hover:shadow-rose-950/60 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-4xl">⏱️</span>
                  <span className="text-[10px] font-black bg-rose-500 text-white px-2.5 py-0.5 rounded-full uppercase">
                    KỶ LỤC TỐC ĐỘ
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-white group-hover:text-rose-300 transition">
                    Đua Tính Giờ (Time Attack)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Chinh phục thời gian kỷ lục từng vòng đua không có chướng ngại vật cản trở.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800 text-xs font-black text-rose-400">
                  <span>Lập kỷ lục mới</span>
                  <Play className="w-4 h-4 fill-rose-400" />
                </div>
              </div>

              {/* Drift Challenge */}
              <div
                id="mode-drift-card"
                onClick={() => {
                  setRaceMode('drift_challenge');
                  setCurrentSubScreen('track_select');
                  raceAudio.playMenuClick();
                }}
                className="group relative bg-gradient-to-br from-emerald-950/60 to-slate-900/80 border-2 border-emerald-500/40 hover:border-emerald-400 rounded-3xl p-5 text-left cursor-pointer transition-all hover:scale-102 hover:shadow-2xl hover:shadow-emerald-950/60 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-4xl">🔥</span>
                  <span className="text-[10px] font-black bg-emerald-500 text-slate-950 px-2.5 py-0.5 rounded-full uppercase">
                    KỸ NĂNG CAO
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-white group-hover:text-emerald-300 transition">
                    Thử Thách Drift Khói Lửa
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Ôm cua trượt lốp gom điểm combo Drift nhân đôi để rinh rương phần thưởng.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800 text-xs font-black text-emerald-400">
                  <span>Drift x Combo</span>
                  <Play className="w-4 h-4 fill-emerald-400" />
                </div>
              </div>

              {/* Vô Lăng Camera Cảm Biến */}
              <div
                id="mode-calibration-card"
                onClick={() => {
                  setCurrentSubScreen('calibration');
                  raceAudio.playMenuClick();
                  speakVoice(VOICE_LINES.racing.holdSteering);
                }}
                className="group relative bg-gradient-to-br from-blue-950/60 to-slate-900/80 border-2 border-blue-500/40 hover:border-blue-400 rounded-3xl p-5 text-left cursor-pointer transition-all hover:scale-102 hover:shadow-2xl hover:shadow-blue-950/60 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-4xl">📷</span>
                  <span className="text-[10px] font-black bg-blue-500 text-white px-2.5 py-0.5 rounded-full uppercase">
                    CỬ CHỈ CAMERA
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-white group-hover:text-blue-300 transition">
                    Cài Đặt Vô Lăng Cử Chỉ
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Lái xe bằng 2 tay không cần chạm phím qua camera webcam của bạn!
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800 text-xs font-black text-blue-400">
                  <span>Cân chỉnh camera</span>
                  <Play className="w-4 h-4 fill-blue-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Device-aware graphics presets. Runtime FPS protection can still lower render scale if needed. */}
          <div className="w-full max-w-4xl mx-auto mb-4 rounded-2xl border border-slate-700 bg-slate-900/80 p-3">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="shrink-0">
                <div className="text-xs font-black text-white uppercase tracking-wide">Đồ họa đua xe</div>
                <div className="text-[10px] text-slate-400">Ưu tiên xe rõ, tự hạ tải nếu FPS thấp</div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 flex-1">
                {QUALITY_PRESETS.map((preset) => {
                  const active = raceSettings.quality === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setRaceSettings((prev) => ({ ...prev, quality: preset.id }))}
                      title={preset.hint}
                      className={`rounded-xl px-2.5 py-2 text-left border transition active:scale-95 ${
                        active
                          ? 'border-cyan-400 bg-cyan-500/20 text-cyan-100 shadow-md shadow-cyan-950/40'
                          : 'border-slate-700 bg-slate-950/70 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <div className="text-[11px] font-black">{preset.label}</div>
                      <div className="text-[9px] mt-0.5 opacity-70 leading-tight">{preset.hint}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Footer Controls Info */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800/80 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-300">Phím điều khiển:</span>
              <span className="bg-slate-800 px-2 py-0.5 rounded font-mono text-cyan-300">W / ↑</span> Ga |{' '}
              <span className="bg-slate-800 px-2 py-0.5 rounded font-mono text-cyan-300">A/D / ←/→</span> Lái |{' '}
              <span className="bg-slate-800 px-2 py-0.5 rounded font-mono text-amber-300">Space</span> Nitro |{' '}
              <span className="bg-slate-800 px-2 py-0.5 rounded font-mono text-rose-300">S / ↓</span> Thắng |{' '}
              <span className="bg-slate-800 px-2 py-0.5 rounded font-mono text-purple-300">C</span> Góc nhìn
            </div>
            <div className="text-slate-500 font-semibold">
              Tổng điểm Drift: <span className="text-amber-400 font-bold">{profile.totalDriftScore.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Track Selection Screen */}
      {currentSubScreen === 'track_select' && (
        <div
          id="racing-track-select-screen"
          className="w-full h-full min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentSubScreen('mode_select')}
              className="px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center gap-2"
            >
              <ChevronLeft className="w-5 h-5 text-cyan-400" />
              <span>Quay lại</span>
            </button>

            <h1 className="text-2xl md:text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-400 to-cyan-400">
              CHỌN ĐƯỜNG ĐUA KỲ DIỆU
            </h1>

            <div className="w-20" />
          </div>

          {/* Track Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto w-full my-auto py-6">
            {TRACK_CATALOG.map((track) => {
              const isUnlocked =
                profile.unlockedTracks.includes(track.id) || track.unlockStars <= progress.stars;
              const isSelected = track.id === selectedTrackId;
              const bestTime = profile.bestLapTimes[track.id];

              return (
                <div
                  key={track.id}
                  onClick={() => {
                    if (isUnlocked) {
                      setSelectedTrackId(track.id);
                      raceAudio.playMenuClick();
                    }
                  }}
                  className={`relative rounded-3xl p-6 border-2 transition-all flex flex-col justify-between ${
                    isUnlocked
                      ? isSelected
                        ? 'bg-gradient-to-b from-slate-900 to-cyan-950/80 border-cyan-400 shadow-2xl shadow-cyan-950/60 scale-102 cursor-pointer'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 cursor-pointer'
                      : 'bg-slate-950 border-slate-900 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-4xl">{track.icon}</span>
                      <span
                        className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                          track.difficulty === 'easy'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : track.difficulty === 'normal'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        Độ khó: {track.difficulty}
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-white mb-1">{track.name}</h3>
                    <p className="text-xs text-cyan-300 font-bold mb-2">{track.subtitle}</p>
                    <p className="text-xs text-slate-400 leading-relaxed">{track.description}</p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                    <div className="text-[11px] text-slate-400">
                      <div>Chiều dài: <span className="text-slate-200 font-bold">{track.lengthMeters}m</span></div>
                      {bestTime && (
                        <div>Kỷ lục: <span className="text-amber-400 font-bold">{(bestTime / 1000).toFixed(2)}s</span></div>
                      )}
                    </div>

                    {isUnlocked ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartRace(track.id, selectedCarId, raceMode);
                        }}
                        className="px-4 py-2 rounded-full font-black text-xs bg-gradient-to-r from-amber-400 to-rose-500 text-slate-950 hover:opacity-90 shadow-lg flex items-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5 fill-slate-950" />
                        <span>XUẤT PHÁT</span>
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-slate-500">
                        Cần {track.unlockStars} ⭐
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-center gap-4 py-3">
            <button
              onClick={() => setCurrentSubScreen('garage')}
              className="px-6 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center gap-2 border border-amber-500/30"
            >
              <span>🏎️ Vào Gara Đổi Xe</span>
            </button>
            <button
              onClick={() => handleStartRace(selectedTrackId, selectedCarId, raceMode)}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 text-white font-black text-sm shadow-xl shadow-cyan-950/60 hover:opacity-95 flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>BẮT ĐẦU ĐUA NGAY</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Garage & Customization Screen */}
      {currentSubScreen === 'garage' && (
        <GarageScreen
          profile={profile}
          playerProgress={progress}
          onUpdateProfile={handleUpdateProfile}
          onUpdatePlayerProgress={onUpdateProgress}
          onBack={() => setCurrentSubScreen('mode_select')}
          qualitySetting={raceSettings.quality}
          onSelectCarAndRace={(carId) => {
            setSelectedCarId(carId);
            handleStartRace(selectedTrackId, carId, raceMode);
          }}
        />
      )}

      {/* 4. Motion Steering Calibration Screen */}
      {currentSubScreen === 'calibration' && (
        <MotionSteeringCalibration
          settings={raceSettings}
          lastWristData={lastWristData}
          onUpdateSettings={(newSet) => setRaceSettings((prev) => ({ ...prev, ...newSet }))}
          onBack={() => setCurrentSubScreen('mode_select')}
          onDone={() => {
            setRaceSettings((prev) => ({ ...prev, controlMode: 'camera_motion' }));
            setCurrentSubScreen('mode_select');
          }}
        />
      )}

      {/* 5. Pass & Play Multiplayer Setup Screen */}
      {currentSubScreen === 'pass_and_play' && (
        <PassAndPlayMultiplayer
          onStartTournament={(players, trackId) => {
            setTournamentPlayers(players);
            setCurrentTournamentIndex(0);
            setTournamentResults([]);
            setSelectedTrackId(trackId);
            setSelectedCarId(players[0].carId);
            handleStartRace(trackId, players[0].carId, 'pass_and_play');
          }}
          onBack={() => setCurrentSubScreen('mode_select')}
        />
      )}

      {/* 6. Active 3D Race Screen */}
      {currentSubScreen === 'in_race' && engine && (
        <div id="in-race-viewport" className="relative w-full h-full min-h-screen overflow-hidden">
          {/* 3D WebGL Canvas Layer */}
          <Race3DCanvas
            engine={engine}
            track={currentTrack}
            car={currentCar}
            customization={currentCustomization}
            cameraView={cameraView}
            qualitySetting={raceSettings.quality}
            onReady={handleRaceSceneReady}
          />

          {!raceSceneReady && (
            <div className="absolute inset-0 z-40 bg-slate-950 flex items-center justify-center p-6">
              <div className="w-full max-w-md rounded-3xl border border-cyan-400/30 bg-slate-900/95 p-6 text-center shadow-2xl">
                <div className="mx-auto h-14 w-14 rounded-full border-4 border-cyan-300/20 border-t-cyan-300 animate-spin" />
                <h3 className="mt-5 text-xl font-black text-white">Chuẩn Bị Đường Đua</h3>
                <p className="mt-2 text-sm font-bold text-cyan-200">{raceLoadingText}</p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-cyan-400 to-violet-400 animate-pulse" />
                </div>
                <p className="mt-3 text-[10px] text-slate-400">
                  Countdown chỉ bắt đầu sau khi scene đã render ổn định.
                </p>
              </div>
            </div>
          )}

          {/* In-Game HUD Overlay */}
          <RaceHUD
            player={engine.physics.player}
            aiRacers={engine.physics.aiRacers}
            steeringState={steeringState}
            track={currentTrack}
            car={currentCar}
            totalLaps={engine.totalLaps}
            elapsedTimeMs={engine.totalElapsedTimeMs}
            currentLapTimeMs={engine.currentLapTimeMs}
            bestLapTimeMs={engine.bestLapTimeMs}
            countdownNumber={engine.countdownNumber}
            phase={engine.phase}
            settings={raceSettings}
            onNitroPress={() => engine.triggerNitro()}
            onBrakePress={() => engine.setBrakeInput(true)}
            onBrakeRelease={() => engine.setBrakeInput(false)}
            onGasPress={() => engine.setThrottleInput(1.0)}
            onGasRelease={() => {
              if (!raceSettings.autoThrottle) engine.setThrottleInput(0);
            }}
            onSwitchCamera={handleCycleCameraView}
            onToggleSound={handleToggleSound}
            onExitRace={handlePauseAndShowExitModal}
            isSoundMuted={isSoundMuted}
            activeVoiceText={activeVoiceText}
          />

          {/* Exit Confirmation Modal Overlay */}
          {showExitModal && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in pointer-events-auto">
              <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 border-2 border-rose-500/70 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl text-center flex flex-col items-center gap-5">
                <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-500/60 flex items-center justify-center text-3xl animate-bounce shadow-lg shadow-rose-500/30">
                  🏎️
                </div>

                <div>
                  <h3 className="text-2xl font-black italic text-white tracking-tight">
                    Tạm Dừng Cuộc Đua
                  </h3>
                  <p className="text-amber-300 font-extrabold text-base mt-1">
                    Bạn muốn thoát cuộc đua?
                  </p>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                    Tiến trình và điểm số của vòng đua hiện tại sẽ không được lưu.
                  </p>
                </div>

                <div className="flex flex-col gap-3 w-full mt-2">
                  {/* Resume Race Button */}
                  <button
                    id="resume-race-btn"
                    onClick={handleResumeRace}
                    className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-sm shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>Tiếp Tục Đua</span>
                  </button>

                  {/* Return to Racing Menu (mode_select) */}
                  <button
                    id="exit-to-race-menu-btn"
                    onClick={handleConfirmExitToRaceMenu}
                    className="w-full py-3 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-cyan-300 hover:text-cyan-200 font-black text-sm flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-cyan-400" />
                    <span>Về Menu Đua Xe</span>
                  </button>

                  {/* Return to App Main Menu (onBack) */}
                  <button
                    id="exit-to-app-main-menu-btn"
                    onClick={handleConfirmExitToAppMain}
                    className="w-full py-2.5 px-5 rounded-2xl bg-slate-900/80 hover:bg-rose-950/60 border border-rose-500/30 text-rose-300 hover:text-rose-200 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4 text-rose-400" />
                    <span>Về Menu Chính (Toàn App)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7. Post-Race Podium Screen */}
      {currentSubScreen === 'podium' && raceResult && (
        <RacePodium
          result={raceResult}
          track={currentTrack}
          car={currentCar}
          onReplay={() => {
            setRaceResult(null);
            handleStartRace(selectedTrackId, selectedCarId, raceMode);
          }}
          onChooseTrack={() => {
            setRaceResult(null);
            setCurrentSubScreen('track_select');
          }}
          onGoGarage={() => {
            setRaceResult(null);
            setCurrentSubScreen('garage');
          }}
          onHome={() => {
            setRaceResult(null);
            setCurrentSubScreen('mode_select');
          }}
        />
      )}
    </div>
  );
}