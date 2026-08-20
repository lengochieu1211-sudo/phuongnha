/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GameScreen, PlayerProgress, GameGesture, WorldConfig } from './types';
import { loadProgress, saveProgress, WORLDS, evaluateAchievements } from './utils/progression';
import { audio } from './lib/AudioEngine';
import { recordedVoice } from './lib/RecordedVoiceService';
import { voiceGuide } from './lib/VoiceGuideService';
import { raceAudio } from './lib/racing/RaceAudio';
import { useCameraPose } from './providers/CameraPoseContext';

import MainMenu from './components/MainMenu';
import GameCanvas from './components/GameCanvas';
import StarCatcherGame from './components/StarCatcherGame';
import PoseMimicGame from './components/PoseMimicGame';
import DanceGame from './components/DanceGame';
import PetCareGame from './components/PetCareGame';
import MotionTestScreen from './components/MotionTestScreen';
import ParentPlayGame from './components/ParentPlayGame';
import FruitSlashGame from './components/FruitSlashGame';
import ChickenBlasterGame from './components/ChickenBlasterGame';
import SweetZombieGame from './components/SweetZombieGame';
import RandomWorkoutGame from './components/RandomWorkoutGame';
import LudoGame from './components/ludo/LudoGame';
import BaraSpeedRacingGame from './components/racing/BaraSpeedRacingGame';
import FashionGame from './components/fashion/FashionGame';
import CameraChallengeGame from './components/CameraChallengeGame';
import CalibrationScreen from './components/CalibrationScreen';
import CompanionSelectorModal from './components/CompanionSelectorModal';
import WardrobeScreen from './components/WardrobeScreen';
import ParentDashboardModal from './components/ParentDashboardModal';
import DailyMissionsModal from './components/DailyMissionsModal';
import VoiceSettingsModal from './components/VoiceSettingsModal';
import DraggableCameraPiP from './components/DraggableCameraPiP';
import LandscapeNotice from './components/LandscapeNotice';
import TVModeModal from './components/TVModeModal';

export default function App() {
  const isTVDisplay = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tv') === '1';
  const [progress, setProgress] = useState<PlayerProgress>(() => loadProgress());
  const [currentScreen, setCurrentScreen] = useState<GameScreen>('menu');
  const [selectedWorld, setSelectedWorld] = useState<WorldConfig>(WORLDS[0]);
  const [workoutMode, setWorkoutMode] = useState<'5min' | '10min' | null>(null);

  // Calibration states per profile
  const [calibratedProfiles, setCalibratedProfiles] = useState<Record<string, boolean>>({
    wrist: false,
    upper_body: false,
    full_body: false,
    racing_two_hands: false,
  });
  const [showCalibration, setShowCalibration] = useState<boolean>(false);
  const [pendingTargetScreen, setPendingTargetScreen] = useState<{
    screen: GameScreen;
    options?: { world?: WorldConfig; workoutMode?: '5min' | '10min' };
  } | null>(null);

  // Modals
  const [showCompanionSelector, setShowCompanionSelector] = useState<boolean>(false);
  const [showWardrobe, setShowWardrobe] = useState<boolean>(false);
  const [showParentDashboard, setShowParentDashboard] = useState<boolean>(false);
  const [showDailyMissions, setShowDailyMissions] = useState<boolean>(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState<boolean>(false);
  const [showTVMode, setShowTVMode] = useState<boolean>(false);

  // Sound state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showPipCamera, setShowPipCamera] = useState<boolean>(true);

  // Single Camera & Pose Provider Hook
  const {
    isStreaming,
    startCamera,
    stopCamera,
    gesture,
    trackingFeedback,
    setSimulatedGesture,
    trackingMode,
  } = useCameraPose();

  // Save progress on changes with central achievement evaluation
  const updateProgress = (updater: (prev: PlayerProgress) => PlayerProgress) => {
    setProgress((prev) => {
      const updated = updater(prev);
      const { progress: evaluatedProgress } = evaluateAchievements(updated);
      saveProgress(evaluatedProgress);
      return evaluatedProgress;
    });
  };

  // Accumulate play minutes automatically when in a game
  useEffect(() => {
    if (currentScreen === 'menu') return;

    const interval = setInterval(() => {
      updateProgress((prev) => ({
        ...prev,
        parentStats: {
          ...prev.parentStats,
          todayPlayMinutes: prev.parentStats.todayPlayMinutes + 1,
        },
      }));
    }, 60000); // every 1 minute

    return () => clearInterval(interval);
  }, [currentScreen]);

  // Stop any game-owned audio/voice as soon as the app returns to the hub.
  // This is intentionally centralized so an individual game's missed cleanup cannot
  // leave music, engine RPM, drift or TTS speaking after exit.
  useEffect(() => {
    if (currentScreen === 'menu') {
      voiceGuide.stop();
      recordedVoice.stopAll();
      raceAudio.stopAll();
      audio.stopAllImmediate();
    }
  }, [currentScreen]);

  // Sound toggle
  const toggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    audio.setMuteSound(!nextState);
    audio.setMuteMusic(!nextState);
  };

  // Calibration requirement helper
  const getRequiredCalibrationProfile = (screen: GameScreen): string => {
    if (trackingMode === 'keyboard_only') return 'none';

    // Most motion games only need a stable torso + two hands. Requiring feet
    // blocked play on phone front cameras that cannot frame a full body indoors.
    if ([
      'mimic',
      'adventure',
      'workout',
      'randomworkout',
      'workout_session',
      'ninja',
      'goalkeeper',
      'magicacademy',
      'dance',
      'parentplay',
    ].includes(screen)) {
      return 'upper_body';
    }

    // Racing chooses 1P/2P only after opening its own hub, so do not force a
    // single-player calibration before the user can choose the race mode.
    if (screen === 'racing' || screen === 'ludo') return 'none';

    if (['fruitslash', 'chickenblaster', 'sweetzombie', 'starcatcher'].includes(screen)) {
      return 'wrist';
    }

    return 'none';
  };

  const isProfileSatisfied = (profile: string): boolean => {
    if (profile === 'none') return true;
    if (profile === 'wrist') {
      return calibratedProfiles.wrist || calibratedProfiles.upper_body || calibratedProfiles.full_body || calibratedProfiles.racing_two_hands;
    }
    if (profile === 'upper_body') {
      return calibratedProfiles.upper_body || calibratedProfiles.full_body || calibratedProfiles.racing_two_hands;
    }
    if (profile === 'full_body') {
      return calibratedProfiles.full_body;
    }
    if (profile === 'racing_two_hands') {
      return calibratedProfiles.racing_two_hands;
    }
    return false;
  };

  // Screen selection
  const handleSelectScreen = (
    screen: GameScreen,
    options?: { world?: WorldConfig; workoutMode?: '5min' | '10min' }
  ) => {
    if (options?.world) setSelectedWorld(options.world);
    if (options?.workoutMode !== undefined) setWorkoutMode(options.workoutMode);

    const reqProfile = getRequiredCalibrationProfile(screen);
    if (reqProfile !== 'none' && !isProfileSatisfied(reqProfile) && screen !== 'menu') {
      setPendingTargetScreen({ screen, options });
      setShowCalibration(true);
    } else {
      setCurrentScreen(screen);
    }
    audio.playPowerup();
  };

  // Keyboard navigation fallback listener (only when explicitly in keyboard_only mode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Never process keyboard gesture overrides when camera mode is active
      if (trackingMode !== 'keyboard_only') return;

      if (e.code === 'ArrowLeft') {
        setSimulatedGesture('tilt_left');
      } else if (e.code === 'ArrowRight') {
        setSimulatedGesture('tilt_right');
      } else if (e.code === 'ArrowUp' || e.code === 'Space') {
        setSimulatedGesture('jump');
      } else if (e.code === 'ArrowDown') {
        setSimulatedGesture('duck');
      } else if (e.key === 'a' || e.key === 'A') {
        setSimulatedGesture('left_arm_up');
      } else if (e.key === 'd' || e.key === 'D') {
        setSimulatedGesture('right_arm_up');
      } else if (e.key === 'w' || e.key === 'W') {
        setSimulatedGesture('both_arms_up');
      } else if (e.key === 's' || e.key === 'S') {
        setSimulatedGesture('hands_spread');
      }
    };

    const handleKeyUp = () => {
      if (trackingMode !== 'keyboard_only') return;
      setTimeout(() => {
        setSimulatedGesture('standing');
      }, 300);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setSimulatedGesture, trackingMode, isStreaming]);

  // Manage camera lifecycle only for screens that actually consume pose/camera data.
  // This prevents webcam/MediaPipe from burning battery/GPU in screens that do not consume camera data.
  useEffect(() => {
    const cameraScreens: GameScreen[] = [
      'adventure', 'racing', 'starcatcher', 'mimic', 'dance', 'fruitslash',
      'chickenblaster', 'sweetzombie', 'workout_session', 'parentplay',
      'dressing', 'ninja', 'goalkeeper', 'magicacademy', 'ludo', 'petcare', 'cameratest', 'calibration'
    ];
    const needsCamera = showCalibration || cameraScreens.includes(currentScreen);
    if (trackingMode === 'keyboard_only' || !needsCamera) {
      stopCamera();
    } else {
      startCamera();
    }
  }, [currentScreen, showCalibration, trackingMode, startCamera, stopCamera]);

  return (
    <div
      id="phuong-nha-app"
      className={`${isTVDisplay ? 'tv-display text-[1.08rem]' : ''} h-[100dvh] w-screen flex flex-col bg-[#FFFAF0] font-sans text-[#4A4A4A] overflow-hidden relative`}
      style={{
        backgroundImage:
          'radial-gradient(circle at 10% 20%, rgba(255, 182, 193, 0.3) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(173, 216, 230, 0.3) 0%, transparent 40%)',
      }}
    >
      {/* Landscape notice & PIP Camera Controls toggle */}
      {['chickenblaster', 'fruitslash', 'sweetzombie', 'starcatcher', 'mimic', 'dance', 'racing', 'workout_session', 'adventure', 'parentplay', 'ninja', 'goalkeeper', 'magicacademy', 'ludo'].includes(currentScreen) && (
        <LandscapeNotice showPip={showPipCamera} onTogglePip={setShowPipCamera} />
      )}

      {/* Draggable and Collapsible Picture-in-Picture Webcam Stream Box */}
      <DraggableCameraPiP
        visible={showPipCamera}
        onToggleVisible={setShowPipCamera}
      />

      {/* Calibration Overlay */}
      {showCalibration && (
        <CalibrationScreen
          targetScreen={pendingTargetScreen?.screen}
          onComplete={() => {
            const reqProfile = getRequiredCalibrationProfile(pendingTargetScreen?.screen || 'menu');
            if (reqProfile !== 'none') {
              setCalibratedProfiles((prev) => ({ ...prev, [reqProfile]: true }));
            }
            setShowCalibration(false);
            if (pendingTargetScreen) {
              setCurrentScreen(pendingTargetScreen.screen);
              setPendingTargetScreen(null);
            }
          }}
          onSkip={() => {
            setShowCalibration(false);
            setPendingTargetScreen(null);
            setCurrentScreen('menu');
          }}
        />
      )}

      {/* Modals */}
      <CompanionSelectorModal
        isOpen={showCompanionSelector}
        onClose={() => setShowCompanionSelector(false)}
        progress={progress}
        onSelectCompanion={(charId) => updateProgress((prev) => ({ ...prev, selectedCharacter: charId }))}
        onUnlockCompanion={(charId, cost) =>
          updateProgress((prev) => ({
            ...prev,
            stars: prev.stars - cost,
            unlockedCharacters: [...prev.unlockedCharacters, charId],
          }))
        }
      />

      <WardrobeScreen
        isOpen={showWardrobe}
        onClose={() => setShowWardrobe(false)}
        progress={progress}
        onEquipItem={(item) =>
          updateProgress((prev) => ({
            ...prev,
            equippedWardrobe: { ...prev.equippedWardrobe, [item.category]: item.id },
          }))
        }
        onUnlockItem={(item) =>
          updateProgress((prev) => ({
            ...prev,
            stars: Math.max(0, prev.stars - (item.costStars || 0)),
            diamonds: Math.max(0, prev.diamonds - (item.costDiamonds || 0)),
            unlockedWardrobe: [...prev.unlockedWardrobe, item.id],
          }))
        }
        onOpenFashionAR={() => {
          setShowWardrobe(false);
          setCurrentScreen('dressing');
        }}
      />

      <ParentDashboardModal
        isOpen={showParentDashboard}
        onClose={() => setShowParentDashboard(false)}
        progress={progress}
      />

      <DailyMissionsModal
        isOpen={showDailyMissions}
        onClose={() => setShowDailyMissions(false)}
        progress={progress}
        onClaimMission={(missionId, rewardStars, rewardDiamonds) =>
          updateProgress((prev) => ({
            ...prev,
            stars: prev.stars + rewardStars,
            diamonds: prev.diamonds + rewardDiamonds,
            dailyMissions: prev.dailyMissions.map((m) =>
              m.id === missionId ? { ...m, isClaimed: true, isCompleted: true } : m
            ),
          }))
        }
      />

      <VoiceSettingsModal
        isOpen={showVoiceSettings}
        onClose={() => {
          voiceGuide.stop();
          recordedVoice.stopAll();
          audio.stopAllImmediate();
          setShowVoiceSettings(false);
        }}
      />

      <TVModeModal isOpen={showTVMode} onClose={() => setShowTVMode(false)} />

      {/* Main Screen Router */}
      <div className="flex-1 w-full h-full overflow-y-auto">
        {currentScreen === 'menu' && (
          <MainMenu
            progress={progress}
            onUpdateProgress={updateProgress}
            onSelectScreen={handleSelectScreen}
            isStreaming={isStreaming}
            gesture={gesture}
            trackingFeedback={trackingFeedback}
            soundEnabled={soundEnabled}
            onToggleSound={toggleSound}
            showPipCamera={showPipCamera}
            onTogglePipCamera={setShowPipCamera}
            onOpenCompanion={() => setShowCompanionSelector(true)}
            onOpenWardrobe={() => setShowWardrobe(true)}
            onOpenParentDashboard={() => setShowParentDashboard(true)}
            onOpenDailyMissions={() => setShowDailyMissions(true)}
            onOpenVoiceSettings={() => setShowVoiceSettings(true)}
            onOpenTVMode={() => setShowTVMode(true)}
          />
        )}

        {currentScreen === 'adventure' && (
          <div className="p-4 md:p-6 flex items-center justify-center min-h-full">
            <GameCanvas
              progress={progress}
              onUpdateProgress={updateProgress}
              gesture={gesture}
              world={selectedWorld}
              workoutMode={workoutMode}
              onBack={() => setCurrentScreen('menu')}
            />
          </div>
        )}

        {currentScreen === 'starcatcher' && (
          <div className="p-4 md:p-6 flex items-center justify-center min-h-full">
            <StarCatcherGame
              progress={progress}
              onUpdateProgress={updateProgress}
              gesture={gesture}
              onBack={() => setCurrentScreen('menu')}
            />
          </div>
        )}

        {currentScreen === 'mimic' && (
          <div className="p-4 md:p-6 flex items-center justify-center min-h-full">
            <PoseMimicGame
              progress={progress}
              onUpdateProgress={updateProgress}
              gesture={gesture}
              onBack={() => setCurrentScreen('menu')}
            />
          </div>
        )}

        {currentScreen === 'dance' && (
          <div className="p-4 md:p-6 flex items-center justify-center min-h-full">
            <DanceGame
              progress={progress}
              onUpdateProgress={updateProgress}
              gesture={gesture}
              onBack={() => setCurrentScreen('menu')}
            />
          </div>
        )}

        {currentScreen === 'petcare' && (
          <div className="p-4 md:p-6 flex items-center justify-center min-h-full">
            <PetCareGame
              progress={progress}
              onUpdateProgress={updateProgress}
              gesture={gesture}
              onBack={() => setCurrentScreen('menu')}
            />
          </div>
        )}

        {currentScreen === 'cameratest' && (
          <div className="p-4 landscape:p-2 md:p-6 flex items-center justify-center min-h-full">
            <MotionTestScreen
              onBack={() => setCurrentScreen('menu')}
            />
          </div>
        )}

        {currentScreen === 'parentplay' && (
          <div className="p-4 landscape:p-2 md:p-6 flex items-center justify-center min-h-full">
            <ParentPlayGame
              progress={progress}
              onUpdateProgress={updateProgress}
              gesture={gesture}
              onBack={() => setCurrentScreen('menu')}
            />
          </div>
        )}

        {currentScreen === 'fruitslash' && (
          <div className="p-4 landscape:p-2 md:p-6 flex items-center justify-center min-h-full">
            <FruitSlashGame
              progress={progress}
              onUpdateProgress={updateProgress}
              gesture={gesture}
              onBack={() => setCurrentScreen('menu')}
            />
          </div>
        )}

        {currentScreen === 'chickenblaster' && (
          <div className="p-4 landscape:p-2 md:p-6 flex items-center justify-center min-h-full">
            <ChickenBlasterGame
              progress={progress}
              onUpdateProgress={updateProgress}
              gesture={gesture}
              onBack={() => setCurrentScreen('menu')}
            />
          </div>
        )}

        {currentScreen === 'sweetzombie' && (
          <div className="p-4 landscape:p-2 md:p-6 flex items-center justify-center min-h-full">
            <SweetZombieGame
              progress={progress}
              onUpdateProgress={updateProgress}
              gesture={gesture}
              onBack={() => setCurrentScreen('menu')}
            />
          </div>
        )}

        {currentScreen === 'workout_session' && (
          <div className="p-4 landscape:p-2 md:p-6 flex items-center justify-center min-h-full">
            <RandomWorkoutGame
              progress={progress}
              onUpdateProgress={updateProgress}
              gesture={gesture}
              mode={workoutMode || '5min'}
              onBack={() => setCurrentScreen('menu')}
            />
          </div>
        )}

        {currentScreen === 'ludo' && (
          <div className="p-2 md:p-6 flex items-center justify-center min-h-full">
            <LudoGame
              progress={progress}
              onUpdateProgress={updateProgress}
              gesture={gesture}
              onBack={() => setCurrentScreen('menu')}
            />
          </div>
        )}

        {currentScreen === 'racing' && (
          <div className="w-full h-full min-h-full">
            <BaraSpeedRacingGame
              progress={progress}
              onUpdateProgress={updateProgress}
              gesture={gesture}
              onBack={() => setCurrentScreen('menu')}
            />
          </div>
        )}


        {(['ninja', 'goalkeeper', 'magicacademy'] as const).includes(currentScreen as any) && (
          <div className="p-3 landscape:p-2 md:p-6 flex items-center justify-center min-h-full">
            <CameraChallengeGame
              mode={currentScreen as 'ninja' | 'goalkeeper' | 'magicacademy'}
              progress={progress}
              onUpdateProgress={updateProgress}
              gesture={gesture}
              onBack={() => setCurrentScreen('menu')}
            />
          </div>
        )}

        {currentScreen === 'dressing' && (
          <div className="p-4 landscape:p-2 md:p-6 flex items-center justify-center min-h-full">
            <FashionGame
              progress={progress}
              onUpdateProgress={updateProgress}
              onBack={() => setCurrentScreen('menu')}
            />
          </div>
        )}
      </div>
    </div>
  );
}
