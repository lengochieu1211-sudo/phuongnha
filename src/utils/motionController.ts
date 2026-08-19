/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameGesture, CameraCalibration } from '../types';

export interface Keypoint {
  x: number;
  y: number;
  score?: number;
}

export interface BodyPose {
  keypoints: { [key: string]: Keypoint };
  score: number;
}

export class MotionController {
  private mode: 'mediapipe' | 'pixel_motion' | 'keyboard_only' = 'mediapipe';
  private currentGesture: GameGesture = 'standing';
  private rawGesture: GameGesture = 'standing';
  private lastGestureTime: number = 0;
  private jumpCooldown: number = 0;

  // Calibration baseline
  private baselineY: number = 200; // Shoulder baseline Y
  private shoulderWidth: number = 80;
  private isCalibrated: boolean = false;

  // Debouncing buffer
  private gestureBuffer: GameGesture[] = [];
  private bufferSize: number = 4;

  public setMode(mode: 'mediapipe' | 'pixel_motion' | 'keyboard_only') {
    this.mode = mode;
  }

  public getMode() {
    return this.mode;
  }

  public calibrateBaseline(pose: BodyPose): boolean {
    const ls = pose.keypoints['left_shoulder'];
    const rs = pose.keypoints['right_shoulder'];

    if (ls && rs && ls.score! > 0.4 && rs.score! > 0.4) {
      this.baselineY = (ls.y + rs.y) / 2;
      this.shoulderWidth = Math.abs(rs.x - ls.x);
      this.isCalibrated = true;
      return true;
    }
    return false;
  }

  public isUserCalibrated(): boolean {
    return this.isCalibrated;
  }

  public processPoseKeypoints(pose: BodyPose): GameGesture {
    // If running in keyboard test mode or pixel fallback when MediaPipe inactive
    if (this.mode === 'keyboard_only') {
      return this.currentGesture;
    }

    const kp = pose.keypoints;
    const ls = kp['left_shoulder'];
    const rs = kp['right_shoulder'];
    const lw = kp['left_wrist'];
    const rw = kp['right_wrist'];
    const lh = kp['left_hip'];
    const rh = kp['right_hip'];
    const nose = kp['nose'];

    let detected: GameGesture = 'standing';

    // Verify keypoint confidence
    const upperBodyVisible = ls && rs && ls.score! > 0.35 && rs.score! > 0.35;

    if (upperBodyVisible) {
      const currentShoulderY = (ls.y + rs.y) / 2;
      const shoulderCenter = (ls.x + rs.x) / 2;

      // 1. Jump detection (shoulder Y significantly higher than baseline)
      if (this.baselineY - currentShoulderY > 25 && Date.now() - this.jumpCooldown > 500) {
        detected = 'jump';
        this.jumpCooldown = Date.now();
      }
      // 2. Duck detection (shoulder Y significantly lower than baseline)
      else if (currentShoulderY - this.baselineY > 30) {
        detected = 'duck';
      }
      // 3. Both arms up
      else if (lw && rw && lw.y < ls.y - 30 && rw.y < rs.y - 30) {
        detected = 'both_arms_up';
      }
      // 4. Left arm up
      else if (lw && lw.y < ls.y - 30) {
        detected = 'left_arm_up';
      }
      // 5. Right arm up
      else if (rw && rw.y < rs.y - 30) {
        detected = 'right_arm_up';
      }
      // 6. Arms spread wide
      else if (lw && rw && Math.abs(lw.x - rw.x) > this.shoulderWidth * 2.2) {
        detected = 'hands_spread';
      }
      // 7. Clap (Wrists very close together)
      else if (lw && rw && Math.abs(lw.x - rw.x) < 20 && Math.abs(lw.y - rw.y) < 20) {
        detected = 'clap';
      }
      // 8. Hands on head
      else if (lw && rw && nose && Math.abs(lw.y - nose.y) < 25 && Math.abs(rw.y - nose.y) < 25) {
        detected = 'hands_head';
      }
      // 9. Lean left / Tilt left
      else if (shoulderCenter < 240) {
        detected = 'tilt_left';
      }
      // 10. Lean right / Tilt right
      else if (shoulderCenter > 400) {
        detected = 'tilt_right';
      }
    }

    // Apply smoothing and debounce
    return this.smoothGesture(detected);
  }

  public processPixelMotion(opticalDelta: {
    total: number;
    top: number;
    bottom: number;
    left: number;
    right: number;
  }): GameGesture {
    // Only use pixel motion if mode is pixel_motion or fallback
    if (this.mode !== 'pixel_motion') return this.currentGesture;

    let detected: GameGesture = 'standing';

    if (opticalDelta.top > 160 && opticalDelta.left > 70 && opticalDelta.right > 70) {
      detected = 'both_arms_up';
    } else if (opticalDelta.top > 100 && opticalDelta.left > 80) {
      detected = 'left_arm_up';
    } else if (opticalDelta.top > 100 && opticalDelta.right > 80) {
      detected = 'right_arm_up';
    } else if (opticalDelta.bottom > 140 && opticalDelta.top < 40) {
      detected = 'duck';
    } else if (opticalDelta.left > opticalDelta.right + 90) {
      detected = 'tilt_left';
    } else if (opticalDelta.right > opticalDelta.left + 90) {
      detected = 'tilt_right';
    } else if (opticalDelta.total > 320 && opticalDelta.top > 130) {
      detected = 'jump';
    }

    return this.smoothGesture(detected);
  }

  public forceSetKeyboardGesture(gesture: GameGesture) {
    this.currentGesture = gesture;
  }

  public updateRawGesture(raw: GameGesture): GameGesture {
    return this.smoothGesture(raw);
  }

  private smoothGesture(raw: GameGesture): GameGesture {
    this.gestureBuffer.push(raw);
    if (this.gestureBuffer.length > this.bufferSize) {
      this.gestureBuffer.shift();
    }

    // Count majority vote in buffer
    const counts: { [key: string]: number } = {};
    for (const g of this.gestureBuffer) {
      counts[g] = (counts[g] || 0) + 1;
    }

    let maxGesture: GameGesture = 'standing';
    let maxCount = 0;
    for (const [g, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        maxGesture = g as GameGesture;
      }
    }

    // Debounce state transitions (must hold majority for at least 2 frames)
    if (maxCount >= 2 && maxGesture !== this.currentGesture) {
      const now = Date.now();
      if (now - this.lastGestureTime > 150) {
        this.currentGesture = maxGesture;
        this.lastGestureTime = now;
      }
    }

    return this.currentGesture;
  }
}

export const motionController = new MotionController();
