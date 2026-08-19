/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WristPosition, PoseLandmark } from '../../utils/poseDetector';

export interface SteeringCalibrationData {
  neutralAngleDeg: number;
  leftMaxAngleDeg: number;
  rightMaxAngleDeg: number;
  deadZoneDeg: number;
}

export interface SteeringState {
  steerValue: number; // Continuous -1.0 (hard left) to +1.0 (hard right)
  rawSteerValue: number; // Continuous un-smoothed value
  steeringAngleDeg: number; // Smoothed angle in degrees (-75 to +75)
  rawAngleDeg: number; // Instantaneous angle in degrees
  neutralAngleDeg: number; // Calibrated center
  effectiveAngleDeg: number; // Angle relative to neutral and deadzone
  isHoldingWheel: boolean; // True only when BOTH wrists are visible
  nitroTriggered: boolean; // One-shot trigger
  brakeTriggered: boolean; // Continuous or one-shot
  handsConfidence: number; // 0 to 1
  leftWristPos?: { x: number; y: number };
  rightWristPos?: { x: number; y: number };
}

export class MotionSteeringEngine {
  private smoothedSteer: number = 0;
  private smoothedAngle: number = 0;

  // Calibration parameters
  private neutralAngleDeg: number = 0;
  private leftMaxAngleDeg: number = -35.0;
  private rightMaxAngleDeg: number = 35.0;
  private deadZoneDeg: number = 6.0;
  private maxSteerAngleDeg: number = 35.0;
  private smoothingFactor: number = 0.35; // Fast, responsive yet jitter-free

  // Gesture state tracking for rising-edge Nitro & Brake
  private lastNitroTime: number = 0;
  private lastBrakeTime: number = 0;
  private wasHandsHigh: boolean = false;
  private wasHandsLow: boolean = false;

  constructor(deadZoneDeg = 4.0, maxSteerAngle = 35.0) {
    this.deadZoneDeg = deadZoneDeg;
    this.maxSteerAngleDeg = maxSteerAngle;
  }

  public setCalibration(calib: Partial<SteeringCalibrationData>) {
    if (calib.neutralAngleDeg !== undefined) this.neutralAngleDeg = calib.neutralAngleDeg;
    if (calib.leftMaxAngleDeg !== undefined) this.leftMaxAngleDeg = calib.leftMaxAngleDeg;
    if (calib.rightMaxAngleDeg !== undefined) this.rightMaxAngleDeg = calib.rightMaxAngleDeg;
    if (calib.deadZoneDeg !== undefined) this.deadZoneDeg = calib.deadZoneDeg;
  }

  public setSensitivity(sensitivity: 'low' | 'normal' | 'high') {
    switch (sensitivity) {
      case 'low':
        this.maxSteerAngleDeg = 45.0;
        this.smoothingFactor = 0.25;
        break;
      case 'normal':
        this.maxSteerAngleDeg = 35.0;
        this.smoothingFactor = 0.38;
        break;
      case 'high':
        this.maxSteerAngleDeg = 24.0;
        this.smoothingFactor = 0.55;
        break;
    }
  }

  /**
   * Process real-time MediaPipe left and right wrist positions
   */
  public processPose(
    leftWrist?: WristPosition,
    rightWrist?: WristPosition,
    landmarks?: PoseLandmark[]
  ): SteeringState {
    let rawAngleDeg = 0;
    let isHolding = false;
    let confidence = 0;
    let nitro = false;
    let brake = false;
    let leftPos: { x: number; y: number } | undefined;
    let rightPos: { x: number; y: number } | undefined;

    const now = Date.now();

    // Check if both wrists are visible
    const hasWrists =
      leftWrist &&
      rightWrist &&
      leftWrist.visible &&
      rightWrist.visible &&
      typeof leftWrist.x === 'number' &&
      typeof rightWrist.x === 'number';

    if (hasWrists) {
      isHolding = true;
      confidence = 0.95;
      leftPos = { x: leftWrist.x, y: leftWrist.y };
      rightPos = { x: rightWrist.x, y: rightWrist.y };

      // In mirrored camera space:
      // leftWrist is on user's left side (lower x, ~0.3)
      // rightWrist is on user's right side (higher x, ~0.7)
      // dx = rightWrist.x - leftWrist.x (> 0)
      // dy = rightWrist.y - leftWrist.y
      //
      // If user turns LEFT (like driving):
      // Left hand drops (leftWrist.y increases), Right hand rises (rightWrist.y decreases)
      // dy = rightWrist.y - leftWrist.y < 0
      // atan2(dy, dx) is negative! => negative angle => steer left (-1 to 0)
      //
      // If user turns RIGHT:
      // Left hand rises (leftWrist.y decreases), Right hand drops (rightWrist.y increases)
      // dy = rightWrist.y - leftWrist.y > 0
      // atan2(dy, dx) is positive! => positive angle => steer right (0 to +1)
      const dy = rightWrist.y - leftWrist.y;
      const dx = rightWrist.x - leftWrist.x;

      if (Math.abs(dx) > 0.05) {
        const angleRad = Math.atan2(dy, dx);
        rawAngleDeg = (angleRad * 180) / Math.PI;
      }

      // Check Nitro: Both hands raised high above chest (avgY < 0.28)
      // Uses edge trigger to avoid spam
      const avgY = (leftWrist.y + rightWrist.y) * 0.5;
      const isHandsHigh = avgY < 0.28;
      if (isHandsHigh && !this.wasHandsHigh && now - this.lastNitroTime > 2000) {
        nitro = true;
        this.lastNitroTime = now;
      }
      this.wasHandsHigh = isHandsHigh;

      // Check Brake: Both hands lowered below hips (avgY > 0.78)
      const isHandsLow = avgY > 0.78;
      if (isHandsLow && !this.wasHandsLow && now - this.lastBrakeTime > 1200) {
        brake = true;
        this.lastBrakeTime = now;
      }
      this.wasHandsLow = isHandsLow;
    } else if (landmarks && landmarks.length >= 17) {
      // Fallback: Check raw MediaPipe landmark points 15 and 16
      const lw = landmarks[15];
      const rw = landmarks[16];
      if (lw && rw && (lw.visibility || 0) > 0.45 && (rw.visibility || 0) > 0.45) {
        isHolding = true;
        confidence = 0.8;
        leftPos = { x: 1 - lw.x, y: lw.y };
        rightPos = { x: 1 - rw.x, y: rw.y };

        const dy = rw.y - lw.y;
        const dx = (1 - rw.x) - (1 - lw.x);
        if (Math.abs(dx) > 0.05) {
          rawAngleDeg = (Math.atan2(dy, Math.abs(dx)) * 180) / Math.PI;
        }
      }
    }

    if (!isHolding) {
      // Hands lost or not detected: Return smoothly to center 0 with gentle decay (no sudden jerk)
      this.smoothedAngle += (0 - this.smoothedAngle) * 0.08;
      this.smoothedSteer += (0 - this.smoothedSteer) * 0.08;

      if (Math.abs(this.smoothedSteer) < 0.005) this.smoothedSteer = 0;
      if (Math.abs(this.smoothedAngle) < 0.1) this.smoothedAngle = 0;

      return {
        steerValue: this.smoothedSteer,
        rawSteerValue: 0,
        steeringAngleDeg: this.smoothedAngle,
        rawAngleDeg: 0,
        neutralAngleDeg: this.neutralAngleDeg,
        effectiveAngleDeg: 0,
        isHoldingWheel: false,
        nitroTriggered: false,
        brakeTriggered: false,
        handsConfidence: 0,
        leftWristPos: undefined,
        rightWristPos: undefined,
      };
    }

    // 1. Subtract Calibrated Neutral Center
    const deltaAngle = rawAngleDeg - this.neutralAngleDeg;

    // 2. Apply Deadzone
    let effectiveAngle = deltaAngle;
    if (Math.abs(effectiveAngle) < this.deadZoneDeg) {
      effectiveAngle = 0;
    } else {
      effectiveAngle =
        Math.sign(effectiveAngle) * (Math.abs(effectiveAngle) - this.deadZoneDeg);
    }

    // 3. Map angle to continuous [-1.0, +1.0] steering value
    let rawSteer = 0;
    if (effectiveAngle < 0) {
      // Turning Left
      const maxLeft = Math.max(12, Math.abs(this.leftMaxAngleDeg - this.neutralAngleDeg) - this.deadZoneDeg);
      rawSteer = Math.max(-1.0, effectiveAngle / maxLeft);
    } else if (effectiveAngle > 0) {
      // Turning Right
      const maxRight = Math.max(12, (this.rightMaxAngleDeg - this.neutralAngleDeg) - this.deadZoneDeg);
      rawSteer = Math.min(1.0, effectiveAngle / maxRight);
    }

    // 4. Smooth with Exponential Moving Average (EMA)
    this.smoothedSteer += (rawSteer - this.smoothedSteer) * this.smoothingFactor;
    this.smoothedAngle += (rawAngleDeg - this.smoothedAngle) * this.smoothingFactor;

    // Final continuous clamp
    const finalSteer = Math.max(-1.0, Math.min(1.0, this.smoothedSteer));
    const finalAngle = Math.max(-75, Math.min(75, this.smoothedAngle));

    return {
      steerValue: finalSteer,
      rawSteerValue: rawSteer,
      steeringAngleDeg: finalAngle,
      rawAngleDeg: rawAngleDeg,
      neutralAngleDeg: this.neutralAngleDeg,
      effectiveAngleDeg: effectiveAngle,
      isHoldingWheel: true,
      nitroTriggered: nitro,
      brakeTriggered: brake,
      handsConfidence: confidence,
      leftWristPos: leftPos,
      rightWristPos: rightPos,
    };
  }

  public reset() {
    this.smoothedSteer = 0;
    this.smoothedAngle = 0;
    this.wasHandsHigh = false;
    this.wasHandsLow = false;
  }
}
