/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameScreen =
  | 'menu'
  | 'adventure'
  | 'ludo'
  | 'racing'
  | 'garage'
  | 'racing_calibration'
  | 'starcatcher'
  | 'mimic'
  | 'dance'
  | 'petcare'
  | 'fruitslash'
  | 'chickenblaster'
  | 'sweetzombie'
  | 'randomworkout'
  | 'workout_session'
  | 'wardrobe'
  | 'companions'
  | 'achievements'
  | 'settings'
  | 'cameratest'
  | 'calibration'
  | 'workout'
  | 'parentplay'
  | 'dressing'
  | 'ninja'
  | 'goalkeeper'
  | 'magicacademy'
  | 'parentdashboard';

export type LudoColor = 'red' | 'blue' | 'yellow' | 'green' | 'purple';

export type PieceLocation = 'yard' | 'track' | 'home_stretch' | 'finished';

export interface LudoPiece {
  id: number; // 0, 1, 2, 3
  playerId: number; // 0..3
  state: PieceLocation;
  trackIndex: number; // 0..51
  stepCount: number; // 0..51 steps walked from player's start tile
  homeIndex: number; // 1..6 for home column
}

export interface LudoPlayer {
  id: number;
  name: string;
  mascot: CharacterId;
  color: LudoColor;
  isAI: boolean;
  aiDifficulty: 'easy' | 'normal' | 'hard';
  startTrackIndex: number; // e.g. 0, 13, 26, 39
  entryTrackIndex: number; // 51, 12, 25, 38
  pieces: LudoPiece[];
  finishedCount: number;
  rank?: number; // 1, 2, 3, 4
}

export interface LudoRules {
  gameMode: 'quick' | 'classic' | 'magic';
  piecesPerPlayer: number; // 2, 3, or 4
  spawnRules: 'six_only' | 'one_or_six';
  rollSixBonus: boolean;
  allowCapture: boolean;
  exactFinish: boolean;
  magicTiles: boolean;
  moveSpeed: 'normal' | 'fast';
  turnTimeLimit: number; // 0 (unlimited), 15, 30
  autoMoveSingle: boolean;
  enableCameraClap: boolean;
}

export type MagicTileType = 'rainbow' | 'star' | 'gift' | 'snail' | 'cloud';

export interface MagicTile {
  trackIndex: number;
  type: MagicTileType;
  label: string;
  icon: string;
}

export interface LudoGameState {
  players: LudoPlayer[];
  currentTurnIndex: number;
  diceValue: number | null;
  hasRolled: boolean;
  isRolling: boolean;
  validPiecesToMove: number[]; // piece IDs of current player
  selectedPieceId: number | null;
  previewSteps: number[]; // array of track indices for movement preview
  isMoving: boolean;
  consecutiveSixes: number;
  winnerOrder: number[]; // player IDs in order of finishing
  isGameOver: boolean;
  magicTiles: MagicTile[];
  rules: LudoRules;
  lastActionMessage?: string;
  historyLog: string[];
}

export type GameDifficulty = 'easy' | 'normal' | 'fast';

export type CharacterId = 'bara' | 'may' | 'bong' | 'miu' | 'lumi' | 'cinnamoroll' | 'kuromi' | 'capy_tie' | 'po';

export type AnimState =
  | 'idle'
  | 'walk'
  | 'run'
  | 'jump'
  | 'duck'
  | 'move_left'
  | 'move_right'
  | 'wave_left'
  | 'wave_right'
  | 'both_hands_up'
  | 'dance'
  | 'happy'
  | 'victory'
  | 'sad'
  | 'petting'
  | 'eating'
  | 'sleeping'
  | 'talking';


export type CategoryType =
  | 'bow'
  | 'glasses'
  | 'hat'
  | 'crown'
  | 'hair'
  | 'mask'
  | 'necklace'
  | 'gloves'
  | 'headaccessory'
  | 'backpack'
  | 'shirt'
  | 'shoes'
  | 'wings';

export interface WardrobeItem {
  id: string;
  name: string;
  category: CategoryType;
  costStars: number;
  costDiamonds: number;
  previewColor: string;
  icon: string;
  badge?: string;
}

export interface CharacterConfig {
  id: CharacterId;
  name: string;
  species: string;
  description: string;
  avatarColor: string;
  unlockStars: number;
  isUnlockedByDefault?: boolean;
  specialAbility: string;
}

export interface PetState {
  type: CharacterId;
  name: string;
  hunger: number; // 0-100
  happiness: number; // 0-100
  cleanliness: number; // 0-100
  energy: number; // 0-100
  favoriteToy: string;
  level: number;
}

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  targetCount: number;
  currentCount: number;
  isCompleted: boolean;
  isClaimed?: boolean;
  rewardStars: number;
  rewardDiamonds: number;
}

export interface ParentStats {
  todayPlayMinutes: number;
  stagesCompleted: number;
  workoutSessions: number;
  starsEarnedToday: number;
  lastPlayedDate: string;
  favoriteMode: string;
}

export interface PlayerProgress {
  charName: string;
  selectedCharacter: CharacterId;
  unlockedCharacters: CharacterId[];
  equippedWardrobe: { [key in CategoryType]?: string };
  unlockedWardrobe: string[];
  stars: number;
  diamonds: number;
  unlockedSkins: string[]; // skin IDs
  unlockedAccessories: string[]; // accessory IDs
  activeSkin: string;
  activeAccessory: string;
  unlockedWorlds: string[]; // world IDs
  highScores: { [key: string]: number };
  pets: { [key in CharacterId]?: PetState };
  activePetId: CharacterId;
  achievements: string[]; // achievement IDs
  dailyMissions: DailyMission[];
  lastMissionDate: string;
  parentStats: ParentStats;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  rewardStars: number;
  rewardDiamonds: number;
  conditionText: string;
  isUnlocked: boolean;
  iconName: string;
}

export interface SkinItem {
  id: string;
  name: string;
  type: 'skin' | 'accessory';
  cost: number;
  color: string;
  badge: string;
  previewSvg: string;
}

export type GameGesture =
  | 'standing'
  | 'left_arm_up'
  | 'right_arm_up'
  | 'both_arms_up'
  | 'jump'
  | 'duck'
  | 'tilt_left'
  | 'tilt_right'
  | 'hands_spread'
  | 'wave_left'
  | 'wave_right'
  | 'clap'
  | 'hands_head'
  | 'rainbow_skill';

export interface CameraCalibration {
  trackingMode: 'mediapipe' | 'pixel_motion' | 'keyboard_only';
  sensitivity: number; // 1-10
  mirror: boolean;
  baselineY?: number;
  shoulderWidth?: number;
  isCalibrated: boolean;
}

export interface WorldConfig {
  id: string;
  name: string;
  description: string;
  themeColor: string;
  textColor: string;
  bgGradient: string;
  accentColor: string;
  minStarsToUnlock: number;
  speed: number;
  bgElement: string;
}

// -------------------------------------------------------------
// BARA SPEED RACING TYPES
// -------------------------------------------------------------
export type CarModelId =
  | 'ap_r1'
  | 'ap_gt'
  | 'ap_x'
  | 'ap_hyper'
  | 'ap_e'
  | 'bara_gt'
  | 'may_cloud_gt'
  | 'bong_rabbit_r'
  | 'lumi_hyper'
  | 'yellow_exotic_v12'
  | 'ford_gt_stripes'
  | 'amg_gt3_monster'
  | 'solus_hyper_proto'
  | 'miata_roadster'
  | 'nissan_370z_tuner'
  | 'canis_mesa_3d'
  | 'v12_sv_3d'
  | 'roadster_883_3d'
  | 'vespa_studio_3d';

export type CarCategory =
  | 'city'
  | 'sport'
  | 'supercar'
  | 'hypercar'
  | 'muscle'
  | 'jdm'
  | 'euro_sport'
  | 'suv_perf'
  | 'electric'
  | 'mascot_special'
  | 'motorcycle';

export interface CarStats {
  topSpeed: number; // 0-100 base score
  acceleration: number; // 0-100 base score
  handling: number; // 0-100 base score
  drift: number; // 0-100 base score
  nitro: number; // 0-100 base score
  braking: number; // 0-100 base score
}

export interface CarUpgrades {
  engine: number; // level 1-5
  acceleration: number; // level 1-5
  handling: number; // level 1-5
  nitro: number; // level 1-5
  brakes: number; // level 1-5
}

export interface CarCustomization {
  paintColor: string; // hex
  paintFinish: 'glossy' | 'metallic' | 'matte' | 'rainbow' | 'galaxy';
  wheelStyle: 'sport' | 'star' | 'aero' | 'gold_chrome';
  wheelColor: string;
  spoilerStyle: 'stock' | 'sport_wing' | 'gt_wing' | 'neon_wing';
  neonUnderglow: 'none' | 'cyan' | 'purple' | 'pink' | 'lime' | 'gold' | 'rainbow';
  windowTint: 'clear' | 'smoke' | 'dark' | 'chameleon';
  decal: 'none' | 'stripes' | 'cloud' | 'stars' | 'fire' | 'lightning';
}

export interface CarConfig {
  id: CarModelId;
  name: string;
  subTitle: string;
  category: CarCategory;
  description: string;
  baseStats: CarStats;
  unlockCostStars: number;
  unlockCostDiamonds: number;
  isUnlockedByDefault?: boolean;
  defaultColor: string;
  mascotOwner?: CharacterId;
  specialAura?: string;
}

export type RacingTrackId =
  | 'neon_city'
  | 'coastal_highway'
  | 'mountain_pass'
  | 'candy_city'
  | 'sky_road'
  | 'space_race';

export interface RacingTrackConfig {
  id: RacingTrackId;
  name: string;
  subtitle: string;
  description: string;
  difficulty: 'easy' | 'normal' | 'hard';
  lapsCount: number;
  lengthMeters: number;
  themeColor: string;
  accentColor: string;
  bgGradient: string;
  unlockStars: number;
  environmentType: 'city_night' | 'sunset_coast' | 'mountain' | 'candy' | 'sky_clouds' | 'cosmic_space';
  icon: string;
}

export type RaceMode =
  | 'quick_race'
  | 'career'
  | 'time_attack'
  | 'checkpoint_frenzy'
  | 'drift_challenge'
  | 'pass_and_play';

export type CameraViewMode = 'chase' | 'close_chase' | 'hood' | 'cockpit' | 'cinematic';

export interface RaceSettings {
  controlMode: 'camera_motion' | 'touch_wheel' | 'touch_pedals' | 'tilt_device' | 'keyboard';
  autoSteerAssist: boolean;
  autoThrottle: boolean; // Auto gas for kids
  steeringSensitivity: 'low' | 'normal' | 'high';
  deadZoneAngle: number; // degrees
  cameraShake: 'none' | 'light' | 'normal';
  reducedMotion: boolean; // Motion sickness safety
  cameraView: CameraViewMode;
  quality: 'auto' | 'low' | 'medium' | 'high';
  soundVolume: number;
  engineVolume: number;
}

export interface RaceItemPickup {
  id: number;
  type: 'nitro' | 'shield' | 'rainbow' | 'star';
  x: number;
  y: number;
  z: number;
  active: boolean;
  respawnTimer?: number;
}

export interface PlayerRaceProfile {
  unlockedCars: CarModelId[];
  selectedCarId: CarModelId;
  carCustomizations: { [key in CarModelId]?: CarCustomization };
  carUpgrades: { [key in CarModelId]?: CarUpgrades };
  unlockedTracks: RacingTrackId[];
  bestLapTimes: { [key in RacingTrackId]?: number };
  careerProgress: number; // 0 to 10
  totalDriftScore: number;
  totalNitroUsed: number;
  racesWon: number;
}


