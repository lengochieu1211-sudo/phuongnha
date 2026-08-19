/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CarModelId,
  RacingTrackId,
  RaceMode,
  RaceSettings,
  RaceItemPickup,
  PlayerRaceProfile,
} from '../../types';
import { CAR_CATALOG, calculateUpgradedStats, loadRaceProfile, saveRaceProfile } from './CarData';
import { TRACK_CATALOG, generateTrackWaypoints, Waypoint3D, getInterpolatedTrackPoint } from './TrackData';
import { VehiclePhysicsEngine } from './VehiclePhysics';
import { raceAudio } from './RaceAudio';

export interface RaceResult {
  rank: number;
  totalTimeMs: number;
  bestLapTimeMs: number;
  totalDriftScore: number;
  starsEarned: number;
  diamondsEarned: number;
  isNewRecord: boolean;
  racersFinished: { name: string; timeMs: number; rank: number; isPlayer: boolean }[];
}

export type RaceStatePhase = 'countdown' | 'racing' | 'finished' | 'paused';

export class RaceEngine {
  private countdownTimer: ReturnType<typeof setInterval> | null = null;
  public trackId: RacingTrackId;
  public carModelId: CarModelId;
  public mode: RaceMode;
  public settings: RaceSettings;
  public waypoints: Waypoint3D[];
  public physics: VehiclePhysicsEngine;
  public phase: RaceStatePhase = 'countdown';
  public countdownNumber: number = 3;
  public totalLaps: number;
  public trackLengthMeters: number;

  public raceStartTime: number = 0;
  public totalElapsedTimeMs: number = 0;
  public currentLapStartTime: number = 0;
  public currentLapTimeMs: number = 0;
  public lapTimes: number[] = [];
  public bestLapTimeMs: number = 0;

  public items: RaceItemPickup[] = [];
  public lastCheckpointPassed: number = -1;
  public raceResult: RaceResult | null = null;
  public isFinished: boolean = false;

  private voiceCallback?: (lineKey: string, text?: string) => void;

  constructor(
    trackId: RacingTrackId,
    carModelId: CarModelId,
    mode: RaceMode,
    settings: RaceSettings,
    onVoice?: (lineKey: string, text?: string) => void
  ) {
    this.trackId = trackId;
    this.carModelId = carModelId;
    this.mode = mode;
    this.settings = settings;
    this.voiceCallback = onVoice;

    const trackConfig = TRACK_CATALOG.find((t) => t.id === trackId) || TRACK_CATALOG[0];
    this.totalLaps = trackConfig.lapsCount;
    this.trackLengthMeters = trackConfig.lengthMeters;

    const carConfig = CAR_CATALOG.find((c) => c.id === carModelId) || CAR_CATALOG[0];
    const profile = loadRaceProfile();
    const stats = calculateUpgradedStats(carConfig, profile.carUpgrades[carModelId]);

    this.physics = new VehiclePhysicsEngine(stats);
    this.waypoints = generateTrackWaypoints(trackId);

    // Initialize AI Opponents
    const aiCount = mode === 'time_attack' ? 0 : 3;
    this.physics.initAIRacers(aiCount, trackConfig.difficulty);

    // Initialize Track Items (Nitro canisters, Magic Shields, Rainbow boosters)
    this.initItems();
  }

  private initItems() {
    this.items = [];
    const itemTypes: RaceItemPickup['type'][] = ['nitro', 'shield', 'rainbow', 'star'];
    for (let i = 0; i < 8; i++) {
      const prog = (i + 0.5) / 8;
      const pt = getInterpolatedTrackPoint(this.waypoints, prog);
      const laneOffset = (i % 2 === 0 ? -3.5 : 3.5);
      this.items.push({
        id: i,
        type: itemTypes[i % itemTypes.length],
        x: pt.pos.x + pt.normal.x * laneOffset,
        y: pt.pos.y + 1.2,
        z: pt.pos.z + pt.normal.z * laneOffset,
        active: true,
        respawnTimer: 0,
      });
    }
  }

  public startCountdown(onGo: () => void) {
    this.phase = 'countdown';
    this.countdownNumber = 3;
    raceAudio.playCountdownTone(false);
    this.voiceCallback?.('countdown3', 'Ba...');

    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.countdownTimer = setInterval(() => {
      this.countdownNumber--;
      if (this.countdownNumber === 2) {
        raceAudio.playCountdownTone(false);
        this.voiceCallback?.('countdown2', 'Hai...');
      } else if (this.countdownNumber === 1) {
        raceAudio.playCountdownTone(false);
        this.voiceCallback?.('countdown1', 'Một...');
      } else if (this.countdownNumber === 0) {
        raceAudio.playCountdownTone(true);
        raceAudio.startEngine();
        this.voiceCallback?.('go', 'Xuất phát!');
        this.phase = 'racing';
        this.raceStartTime = performance.now();
        this.currentLapStartTime = this.raceStartTime;
        if (this.countdownTimer) {
          clearInterval(this.countdownTimer);
          this.countdownTimer = null;
        }
        onGo();
      }
    }, 1000);
  }

  public inputThrottle: boolean = false;
  public inputBrake: boolean = false;
  public inputSteer: number = 0;
  public inputHandbrake: boolean = false;
  public inputNitro: boolean = false;

  public setSteeringInput(steer: number) {
    this.inputSteer = steer;
  }

  public setThrottleInput(throttle: number | boolean) {
    this.inputThrottle = typeof throttle === 'number' ? throttle > 0.1 : throttle;
  }

  public setBrakeInput(brake: boolean) {
    this.inputBrake = brake;
  }

  public triggerNitro() {
    this.inputNitro = true;
  }

  public step(delta: number) {
    this.update(
      delta,
      this.inputThrottle,
      this.inputBrake,
      this.inputSteer,
      this.inputHandbrake,
      this.inputNitro
    );
    this.inputNitro = false;
  }

  public update(
    delta: number,
    throttle: boolean,
    brake: boolean,
    steer: number,
    handbrake: boolean,
    nitro: boolean
  ) {
    if (this.phase !== 'racing') return;

    const now = performance.now();
    this.totalElapsedTimeMs = now - this.raceStartTime;
    this.currentLapTimeMs = now - this.currentLapStartTime;

    // Apply auto throttle in kids mode
    const effectiveThrottle = this.settings.autoThrottle ? true : throttle;

    // Physics step
    this.physics.update(
      delta,
      effectiveThrottle,
      brake,
      steer,
      handbrake,
      nitro,
      this.trackLengthMeters,
      this.totalLaps
    );

    // Dynamic Engine audio update
    const speedRatio = this.physics.player.speedKmh / this.physics.player.maxSpeedKmh;
    raceAudio.updateEnginePitch(speedRatio, effectiveThrottle, this.physics.player.isNitroActive);
    raceAudio.setDriftSound(this.physics.player.isDrifting, this.physics.player.driftMultiplier * 0.4);

    // Item Pickups collision check
    this.updateItems(delta);

    // Lap progress & Checkpoint check
    this.checkLapCompletion(now);
  }

  private updateItems(delta: number) {
    const playerProg = this.physics.player.progress % 1.0;
    const playerPt = getInterpolatedTrackPoint(this.waypoints, playerProg);
    const playerX = playerPt.pos.x + playerPt.normal.x * this.physics.player.lateralOffset;
    const playerZ = playerPt.pos.z + playerPt.normal.z * this.physics.player.lateralOffset;

    this.items.forEach((item) => {
      if (!item.active) {
        item.respawnTimer = (item.respawnTimer || 0) - delta;
        if (item.respawnTimer <= 0) {
          item.active = true;
        }
        return;
      }

      const dist = Math.hypot(playerX - item.x, playerZ - item.z);
      if (dist < 4.2) {
        item.active = false;
        item.respawnTimer = 6.0; // 6s respawn
        raceAudio.playItemCollected();

        if (item.type === 'nitro') {
          this.physics.addNitro(40);
          this.voiceCallback?.('nitroReady', 'Nitro hồi phục!');
        } else if (item.type === 'shield') {
          this.physics.activateShield(8);
          this.voiceCallback?.('itemShield', 'Khiên phép thuật bảo vệ!');
        } else if (item.type === 'rainbow' || item.type === 'star') {
          this.physics.addNitro(60);
          this.voiceCallback?.('itemStar', 'Ngôi sao tăng tốc thần kỳ!');
        }
      }
    });
  }

  private checkLapCompletion(now: number) {
    const currentTotalLap = Math.floor(this.physics.player.progress);
    const lapIdx = this.lapTimes.length;

    if (currentTotalLap > lapIdx && lapIdx < this.totalLaps) {
      // Completed a lap!
      const lapTime = now - this.currentLapStartTime;
      this.lapTimes.push(lapTime);
      this.currentLapStartTime = now;

      if (this.bestLapTimeMs === 0 || lapTime < this.bestLapTimeMs) {
        this.bestLapTimeMs = lapTime;
      }

      raceAudio.playCheckpoint();

      if (this.lapTimes.length === this.totalLaps - 1) {
        // Final lap warning
        raceAudio.playFinalLapWarning();
        this.voiceCallback?.('finalLap', 'Vòng cuối cùng rồi! Cố lên bạn ơi!');
      }

      if (this.lapTimes.length >= this.totalLaps) {
        this.finishRace(now);
      }
    }
  }

  private finishRace(now: number) {
    this.phase = 'finished';
    this.isFinished = true;
    raceAudio.stopEngine();

    const rank = this.physics.player.rank;
    const isFirst = rank === 1;

    let starsEarned = isFirst ? 20 : rank === 2 ? 14 : rank === 3 ? 10 : 6;
    let diamondsEarned = isFirst ? 5 : rank === 2 ? 3 : 1;

    // Bonus for drift score
    if (this.physics.player.driftScore > 2000) {
      starsEarned += 5;
    }

    // Save record to profile
    const profile = loadRaceProfile();
    const oldBest = profile.bestLapTimes[this.trackId] || 0;
    const isNewRecord = oldBest === 0 || this.bestLapTimeMs < oldBest;

    if (isNewRecord) {
      profile.bestLapTimes[this.trackId] = this.bestLapTimeMs;
    }
    if (isFirst) {
      profile.racesWon = (profile.racesWon || 0) + 1;
    }
    profile.totalDriftScore = (profile.totalDriftScore || 0) + this.physics.player.driftScore;
    saveRaceProfile(profile);

    // AI finishers
    const racers = [
      {
        name: 'Bạn',
        timeMs: this.totalElapsedTimeMs,
        rank: rank,
        isPlayer: true,
      },
      ...this.physics.aiRacers.map((ai) => ({
        name: ai.name,
        timeMs: this.totalElapsedTimeMs + (ai.rank - rank) * (1800 + Math.random() * 800),
        rank: ai.rank,
        isPlayer: false,
      })),
    ].sort((a, b) => a.rank - b.rank);

    this.raceResult = {
      rank,
      totalTimeMs: this.totalElapsedTimeMs,
      bestLapTimeMs: this.bestLapTimeMs,
      totalDriftScore: this.physics.player.driftScore,
      starsEarned,
      diamondsEarned,
      isNewRecord,
      racersFinished: racers,
    };

    if (isFirst) {
      this.voiceCallback?.('firstPlace', 'Tuyệt vời! Bạn đã xuất sắc về nhất cuộc đua!');
    } else {
      this.voiceCallback?.('finishGood', 'Bạn lái xe rất cừ! Hãy thử thêm lần nữa nhé!');
    }
  }

  public destroy() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    raceAudio.stopAll();
  }
}
