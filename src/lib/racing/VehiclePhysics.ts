/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CarStats } from '../../types';

export interface VehicleState {
  speedKmh: number;
  maxSpeedKmh: number;
  accelerationRate: number;
  progress: number; // 0.0 to lapsCount
  lateralOffset: number; // meters from centerline (-10 to +10)
  steerInput: number; // -1 to 1
  steerAngleRad: number; // visual wheel angle
  isDrifting: boolean;
  driftAngleRad: number;
  driftScore: number;
  driftMultiplier: number;
  nitroMeter: number; // 0 to 100
  isNitroActive: boolean;
  isShieldActive: boolean;
  shieldDuration: number;
  bounceOffset: { x: number; y: number };
  rank: number;
  lap: number;
  currentLapProgress: number; // 0 to 1
  damage: number; // 0 pristine -> 100 heavily damaged
  collisionPulse: number; // increments once for each resolved impact
  lastCollisionSeverity: number; // 0..1, consumed by the renderer
  lastCollisionKind: 'ai' | 'barrier' | 'none';
  lastCollisionSide: number; // -1 left, +1 right, 0 centered
}

export interface AIRacerState {
  id: string;
  name: string;
  carModelId: string;
  color: string;
  progress: number;
  lateralOffset: number;
  speedKmh: number;
  maxSpeedKmh: number;
  targetLateralOffset: number;
  steerAngleRad: number;
  isNitroActive: boolean;
  rank: number;
  lap: number;
}

export class VehiclePhysicsEngine {
  public player: VehicleState;
  public aiRacers: AIRacerState[] = [];

  private roadHalfWidth: number = 11.5;
  private collisionCooldownSec: number = 0;

  constructor(stats: CarStats) {
    const topKmh = 140 + stats.topSpeed * 1.2;
    this.player = {
      speedKmh: 0,
      maxSpeedKmh: topKmh,
      accelerationRate: 35 + stats.acceleration * 0.45,
      progress: 0,
      lateralOffset: 0,
      steerInput: 0,
      steerAngleRad: 0,
      isDrifting: false,
      driftAngleRad: 0,
      driftScore: 0,
      driftMultiplier: 1,
      nitroMeter: 100,
      isNitroActive: false,
      isShieldActive: false,
      shieldDuration: 0,
      bounceOffset: { x: 0, y: 0 },
      rank: 1,
      lap: 1,
      currentLapProgress: 0,
      damage: 0,
      collisionPulse: 0,
      lastCollisionSeverity: 0,
      lastCollisionKind: 'none',
      lastCollisionSide: 0,
    };
  }

  public initAIRacers(count: number = 3, playerDifficulty: 'easy' | 'normal' | 'hard') {
    const names = ['Mây Siêu Tốc', 'Bông Đua Trắng', 'Lumi Ánh Sáng', 'Tí Hon Tia Chớp', 'Cyber Racer'];
    const carModels = ['may_cloud_gt', 'bong_rabbit_r', 'lumi_hyper', 'ap_r1', 'ap_gt'];
    const colors = ['#38bdf8', '#f472b6', '#c084fc', '#ef4444', '#0ea5e9'];

    const speedMod = playerDifficulty === 'easy' ? 0.88 : playerDifficulty === 'normal' ? 0.96 : 1.04;

    this.aiRacers = [];
    for (let i = 0; i < count; i++) {
      this.aiRacers.push({
        id: `ai_${i}`,
        name: names[i % names.length],
        carModelId: carModels[i % carModels.length],
        color: colors[i % colors.length],
        progress: 0.005 + i * 0.008, // Start slightly ahead on grid
        lateralOffset: (i % 2 === 0 ? -4 : 4) + (Math.random() - 0.5) * 2,
        speedKmh: 0,
        maxSpeedKmh: this.player.maxSpeedKmh * speedMod * (0.95 + Math.random() * 0.08),
        targetLateralOffset: (Math.random() - 0.5) * 10,
        steerAngleRad: 0,
        isNitroActive: false,
        rank: i + 2,
        lap: 1,
      });
    }
  }

  public update(
    delta: number,
    throttle: boolean,
    brake: boolean,
    steer: number,
    handbrake: boolean,
    nitroRequested: boolean,
    trackLengthMeters: number,
    totalLaps: number
  ) {
    const dt = Math.min(delta, 0.05);
    this.collisionCooldownSec = Math.max(0, this.collisionCooldownSec - dt);

    // 1. Nitro Logic
    if (nitroRequested && this.player.nitroMeter > 5 && !this.player.isNitroActive) {
      this.player.isNitroActive = true;
    }

    if (this.player.isNitroActive) {
      this.player.nitroMeter -= 28 * dt;
      if (this.player.nitroMeter <= 0) {
        this.player.nitroMeter = 0;
        this.player.isNitroActive = false;
      }
    } else {
      // Slow passive nitro recharge + bonus from drifting
      const rechargeRate = this.player.isDrifting ? 18 : 6;
      this.player.nitroMeter = Math.min(100, this.player.nitroMeter + rechargeRate * dt);
    }

    // 2. Acceleration / Speed Physics
    const nitroBoostSpeed = this.player.isNitroActive ? 55 : 0;
    const currentMaxSpeed = this.player.maxSpeedKmh + nitroBoostSpeed;

    if (throttle) {
      const accel = this.player.accelerationRate * (this.player.isNitroActive ? 1.9 : 1.0);
      this.player.speedKmh += accel * dt;
      if (this.player.speedKmh > currentMaxSpeed) {
        this.player.speedKmh = currentMaxSpeed;
      }
    } else if (brake) {
      this.player.speedKmh -= 90 * dt;
      if (this.player.speedKmh < 0) this.player.speedKmh = 0;
    } else {
      // Natural rolling friction
      this.player.speedKmh -= 18 * dt;
      if (this.player.speedKmh < 0) this.player.speedKmh = 0;
    }

    // 3. Steering & Drift Mechanics
    this.player.steerInput = steer;
    const speedRatio = Math.min(1.0, this.player.speedKmh / 50);
    const targetWheelAngle = steer * 0.45;
    this.player.steerAngleRad += (targetWheelAngle - this.player.steerAngleRad) * 0.25;

    // Drift activation (turning hard at speed or holding handbrake)
    const isHardTurning = Math.abs(steer) > 0.45 && this.player.speedKmh > 65;
    this.player.isDrifting = (isHardTurning || handbrake) && this.player.speedKmh > 40;

    if (this.player.isDrifting) {
      this.player.driftAngleRad +=
        (-Math.sign(steer) * 0.35 - this.player.driftAngleRad) * 0.18;
      // Accumulate drift score
      const driftPoints = Math.round(this.player.speedKmh * 0.6 * dt * 10);
      this.player.driftScore += driftPoints;
      this.player.driftMultiplier = Math.min(
        4,
        1 + Math.floor(this.player.driftScore / 800)
      );
    } else {
      this.player.driftAngleRad += (0 - this.player.driftAngleRad) * 0.2;
    }

    // 4. Lateral position on track
    const lateralSpeed = steer * (this.player.speedKmh * 0.08) * speedRatio;
    this.player.lateralOffset += lateralSpeed * dt;

    // Road barrier arcade collision. Bounding/lane math is intentionally cheap so it
    // remains safe on phones and Android TV; the visual particles live in Race3DCanvas.
    if (Math.abs(this.player.lateralOffset) > this.roadHalfWidth) {
      const side = Math.sign(this.player.lateralOffset) || 1;
      const impactSpeed = Math.min(1, this.player.speedKmh / Math.max(80, this.player.maxSpeedKmh));
      this.player.lateralOffset = side * this.roadHalfWidth;
      this.player.bounceOffset.x = -side * (0.45 + impactSpeed * 0.45);
      this.registerCollision('barrier', Math.max(0.22, impactSpeed * 0.72), side);
    } else {
      this.player.bounceOffset.x += (0 - this.player.bounceOffset.x) * 0.2;
    }

    // 5. Track Progress (Spline Distance)
    const metersPerSec = (this.player.speedKmh * 1000) / 3600;
    const progressDelta = (metersPerSec * dt) / trackLengthMeters;
    this.player.progress += progressDelta;

    this.player.currentLapProgress = this.player.progress % 1.0;
    this.player.lap = Math.min(totalLaps, Math.floor(this.player.progress) + 1);

    // 6. Shield Timer
    if (this.player.isShieldActive) {
      this.player.shieldDuration -= dt;
      if (this.player.shieldDuration <= 0) {
        this.player.isShieldActive = false;
      }
    }

    // 7. Update AI Opponents (with Rubber-Banding)
    this.updateAIRacers(dt, trackLengthMeters, totalLaps);

    // 8. Lightweight player <-> AI arcade collisions.
    this.resolveAICollisions(trackLengthMeters);

    // 9. Calculate Race Rankings
    this.calculateRankings();
  }

  private updateAIRacers(dt: number, trackLengthMeters: number, totalLaps: number) {
    const playerProg = this.player.progress;

    this.aiRacers.forEach((ai) => {
      // Dynamic rubber banding: Keep excitement high without making it frustrating
      const distToPlayer = ai.progress - playerProg;
      let targetSpeed = ai.maxSpeedKmh;

      if (distToPlayer > 0.08) {
        // AI is too far ahead -> gentle throttle down
        targetSpeed *= 0.88;
      } else if (distToPlayer < -0.12) {
        // AI is too far behind -> modest catch-up
        targetSpeed *= 1.12;
      }

      if (ai.speedKmh < targetSpeed) {
        ai.speedKmh += 30 * dt;
      } else {
        ai.speedKmh -= 15 * dt;
      }

      // Smooth wander on track lanes
      if (Math.random() < 0.02) {
        ai.targetLateralOffset = (Math.random() - 0.5) * 14;
      }
      ai.lateralOffset +=
        (ai.targetLateralOffset - ai.lateralOffset) * 0.08 * dt * 10;
      ai.steerAngleRad =
        (ai.targetLateralOffset - ai.lateralOffset) * 0.03;

      const aiMps = (ai.speedKmh * 1000) / 3600;
      ai.progress += (aiMps * dt) / trackLengthMeters;
      ai.lap = Math.min(totalLaps, Math.floor(ai.progress) + 1);
    });
  }


  private registerCollision(kind: 'ai' | 'barrier', severity: number, side: number) {
    if (this.collisionCooldownSec > 0) return;

    const clampedSeverity = Math.max(0.12, Math.min(1, severity));
    const shieldFactor = this.player.isShieldActive ? 0.18 : 1;
    const speedLoss = this.player.isShieldActive ? 0.035 : 0.055 + clampedSeverity * 0.12;

    this.player.speedKmh *= Math.max(0.68, 1 - speedLoss);
    this.player.damage = Math.min(100, this.player.damage + clampedSeverity * 13 * shieldFactor);
    this.player.collisionPulse += 1;
    this.player.lastCollisionSeverity = clampedSeverity;
    this.player.lastCollisionKind = kind;
    this.player.lastCollisionSide = Math.sign(side);
    this.collisionCooldownSec = kind === 'ai' ? 0.48 : 0.34;
  }

  private resolveAICollisions(trackLengthMeters: number) {
    if (this.collisionCooldownSec > 0 || this.player.speedKmh < 6) return;

    for (const ai of this.aiRacers) {
      const longitudinalMeters = Math.abs(ai.progress - this.player.progress) * trackLengthMeters;
      const lateralMeters = Math.abs(ai.lateralOffset - this.player.lateralOffset);

      // Cheap swept-lane proxy rather than mesh-to-mesh physics. It is stable even when
      // the visible vehicle is a large imported FBX or a procedural fallback.
      if (longitudinalMeters > 4.4 || lateralMeters > 2.7) continue;

      const relativeSpeed = Math.abs(this.player.speedKmh - ai.speedKmh);
      const closingSeverity = Math.min(1, (relativeSpeed + this.player.speedKmh * 0.18) / 120);
      const severity = Math.max(0.28, closingSeverity);
      const side = ai.lateralOffset >= this.player.lateralOffset ? -1 : 1;

      this.player.lateralOffset += side * (0.45 + severity * 0.75);
      ai.lateralOffset -= side * (0.35 + severity * 0.45);
      ai.targetLateralOffset = Math.max(-9, Math.min(9, ai.targetLateralOffset - side * 1.8));
      ai.speedKmh *= 0.94;
      this.player.bounceOffset.x = side * (0.45 + severity * 0.5);
      this.registerCollision('ai', severity, side);
      break;
    }
  }

  private calculateRankings() {
    const all = [
      { id: 'player', progress: this.player.progress },
      ...this.aiRacers.map((a) => ({ id: a.id, progress: a.progress })),
    ];

    all.sort((a, b) => b.progress - a.progress);

    all.forEach((item, index) => {
      const rank = index + 1;
      if (item.id === 'player') {
        this.player.rank = rank;
      } else {
        const found = this.aiRacers.find((a) => a.id === item.id);
        if (found) found.rank = rank;
      }
    });
  }

  public activateShield(durationSec: number = 8) {
    this.player.isShieldActive = true;
    this.player.shieldDuration = durationSec;
  }

  public addNitro(amount: number = 35) {
    this.player.nitroMeter = Math.min(100, this.player.nitroMeter + amount);
  }
}
