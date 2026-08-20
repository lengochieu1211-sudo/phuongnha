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
} from '../../types';
import { CAR_CATALOG, calculateUpgradedStats, loadRaceProfile } from './CarData';
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
  localWinner?: 1 | 2;
}

export type RaceStatePhase = 'countdown' | 'racing' | 'finished' | 'paused';

export interface LocalRaceOptions {
  playerCount?: 1 | 2;
  secondCarModelId?: CarModelId;
}

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
  public localPlayerCount: 1 | 2 = 1;
  public secondCarModelId: CarModelId | null = null;

  private voiceCallback?: (lineKey: string, text?: string) => void;

  constructor(
    trackId: RacingTrackId,
    carModelId: CarModelId,
    mode: RaceMode,
    settings: RaceSettings,
    onVoice?: (lineKey: string, text?: string) => void,
    localOptions: LocalRaceOptions = {},
  ) {
    this.trackId = trackId;
    this.carModelId = carModelId;
    this.mode = mode;
    this.settings = settings;
    this.voiceCallback = onVoice;
    this.localPlayerCount = localOptions.playerCount === 2 ? 2 : 1;
    this.secondCarModelId = this.localPlayerCount === 2 ? (localOptions.secondCarModelId || carModelId) : null;

    const trackConfig = TRACK_CATALOG.find((t) => t.id === trackId) || TRACK_CATALOG[0];
    this.totalLaps = trackConfig.lapsCount;
    this.trackLengthMeters = trackConfig.lengthMeters;

    const carConfig = CAR_CATALOG.find((c) => c.id === carModelId) || CAR_CATALOG[0];
    const profile = loadRaceProfile();
    const stats = calculateUpgradedStats(carConfig, profile.carUpgrades[carModelId]);

    this.physics = new VehiclePhysicsEngine(stats);
    this.waypoints = generateTrackWaypoints(trackId);

    // Initialize AI Opponents
    const aiCount = mode === 'time_attack' ? 0 : (this.localPlayerCount === 2 ? 2 : 3);
    this.physics.initAIRacers(aiCount, trackConfig.difficulty);
    if (this.localPlayerCount === 2 && this.secondCarModelId) {
      const secondCar = CAR_CATALOG.find((c) => c.id === this.secondCarModelId) || carConfig;
      const secondStats = calculateUpgradedStats(secondCar, profile.carUpgrades[this.secondCarModelId]);
      this.physics.initLocalSecondPlayer(this.secondCarModelId, secondStats);
    }

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
  public secondInputThrottle: boolean = true;
  public secondInputBrake: boolean = false;
  public secondInputSteer: number = 0;
  public secondInputNitro: boolean = false;

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

  public activatePlayerShield(durationSec: number = 5) {
    this.physics.activateShield(durationSec);
  }

  public setSecondPlayerSteeringInput(steer: number) {
    this.secondInputSteer = Math.max(-1, Math.min(1, steer));
  }

  public setSecondPlayerBrakeInput(brake: boolean) {
    this.secondInputBrake = brake;
  }

  public triggerSecondPlayerNitro() {
    this.secondInputNitro = true;
  }

  public activateSecondPlayerShield(durationSec: number = 5) {
    this.physics.activateSecondShield(durationSec);
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
    if (this.phase === 'racing' && this.localPlayerCount === 2) {
      this.physics.updateLocalSecondPlayer(
        delta,
        this.settings.autoThrottle ? true : this.secondInputThrottle,
        this.secondInputBrake,
        this.secondInputSteer,
        this.secondInputNitro,
        this.trackLengthMeters,
        this.totalLaps,
      );
    }
    this.inputNitro = false;
    this.secondInputNitro = false;
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
    const p2 = this.physics.getLocalSecondPlayer();
    if (this.localPlayerCount === 2 && !this.isFinished && p2 && p2.progress >= this.totalLaps) {
      this.finishRace(now, 2);
    }
  }

  private updateItems(delta: number) {
    const playerProg = this.physics.player.progress % 1.0;
    const playerPt = getInterpolatedTrackPoint(this.waypoints, playerProg);
    const playerX = playerPt.pos.x + playerPt.normal.x * this.physics.player.lateralOffset;
    const playerZ = playerPt.pos.z + playerPt.normal.z * this.physics.player.lateralOffset;
    const p2 = this.physics.getLocalSecondPlayer();
    let p2X = Number.POSITIVE_INFINITY;
    let p2Z = Number.POSITIVE_INFINITY;
    if (p2) {
      const p2Pt = getInterpolatedTrackPoint(this.waypoints, p2.progress % 1.0);
      p2X = p2Pt.pos.x + p2Pt.normal.x * p2.lateralOffset;
      p2Z = p2Pt.pos.z + p2Pt.normal.z * p2.lateralOffset;
    }

    this.items.forEach((item) => {
      if (!item.active) {
        item.respawnTimer = (item.respawnTimer || 0) - delta;
        if (item.respawnTimer <= 0) {
          item.active = true;
        }
        return;
      }

      const distP1 = Math.hypot(playerX - item.x, playerZ - item.z);
      const distP2 = Math.hypot(p2X - item.x, p2Z - item.z);
      const collector: 1 | 2 | 0 = distP1 < 4.2 ? 1 : (p2 && distP2 < 4.2 ? 2 : 0);
      if (collector) {
        item.active = false;
        item.respawnTimer = 6.0;
        raceAudio.playItemCollected();

        if (item.type === 'nitro') {
          collector === 1 ? this.physics.addNitro(40) : this.physics.addSecondNitro(40);
          this.voiceCallback?.('nitroReady', `P${collector} hồi Nitro!`);
        } else if (item.type === 'shield') {
          collector === 1 ? this.physics.activateShield(8) : this.physics.activateSecondShield(8);
          this.voiceCallback?.('itemShield', `Khiên bảo vệ P${collector}!`);
        } else if (item.type === 'rainbow' || item.type === 'star') {
          collector === 1 ? this.physics.addNitro(60) : this.physics.addSecondNitro(60);
          this.voiceCallback?.('itemStar', `P${collector} nhận tăng tốc thần kỳ!`);
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
        this.finishRace(now, 1);
      }
    }
  }

  private finishRace(now: number, localWinner: 1 | 2 = 1) {
    this.phase = 'finished';
    this.isFinished = true;
    raceAudio.stopEngine();

    const p2 = this.physics.getLocalSecondPlayer();
    const rank = localWinner === 2 && p2 ? p2.rank : this.physics.player.rank;
    const isFirst = rank === 1;

    let starsEarned = isFirst ? 20 : rank === 2 ? 14 : rank === 3 ? 10 : 6;
    let diamondsEarned = isFirst ? 5 : rank === 2 ? 3 : 1;

    // Bonus for drift score
    if (this.physics.player.driftScore > 2000) {
      starsEarned += 5;
    }

    // RaceEngine only calculates the result. Persistence is owned by the React screen so
    // one finish event cannot write the racing profile twice.
    const profile = loadRaceProfile();
    const oldBest = profile.bestLapTimes[this.trackId] || 0;
    const isNewRecord = this.bestLapTimeMs > 0 && (oldBest === 0 || this.bestLapTimeMs < oldBest);

    // Build an accurate ranking table. In local 2P, P1 and P2 are separate human entries
    // instead of incorrectly duplicating the winner's rank under the generic "Bạn" row.
    const winnerRank = rank;
    const estimateTime = (racerRank: number, isLocalWinner: boolean) => {
      if (isLocalWinner) return this.totalElapsedTimeMs;
      const rankGap = racerRank - winnerRank;
      if (rankGap === 0) return this.totalElapsedTimeMs + 900;
      const offset = Math.abs(rankGap) * (1800 + Math.random() * 800);
      return Math.max(0, this.totalElapsedTimeMs + Math.sign(rankGap) * offset);
    };
    const racers = [
      {
        name: this.localPlayerCount === 2 ? 'P1' : 'Bạn',
        timeMs: estimateTime(this.physics.player.rank, this.localPlayerCount === 1 || localWinner === 1),
        rank: this.physics.player.rank,
        isPlayer: true,
      },
      ...this.physics.aiRacers.map((ai) => ({
        name: ai.isLocalPlayer ? 'P2' : ai.name,
        timeMs: estimateTime(ai.rank, !!ai.isLocalPlayer && localWinner === 2),
        rank: ai.rank,
        isPlayer: !!ai.isLocalPlayer,
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
      localWinner: this.localPlayerCount === 2 ? localWinner : undefined,
    };

    if (isFirst) {
      this.voiceCallback?.('firstPlace', this.localPlayerCount === 2 ? `Tuyệt vời! P${localWinner} về đích đầu tiên!` : 'Tuyệt vời! Bạn đã xuất sắc về nhất cuộc đua!');
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
