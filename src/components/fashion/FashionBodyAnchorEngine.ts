/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PoseLandmark } from '../../utils/poseDetector';
import { FashionBodyAnchors } from './fashionTypes';

export class FashionBodyAnchorEngine {
  private previousAnchors: FashionBodyAnchors | null = null;
  private smoothFactor = 0.25; // EMA alpha value (higher = faster response, lower = more smooth/delayed)

  public reset(): void {
    this.previousAnchors = null;
  }

  /**
   * Set the responsiveness vs smoothness of the dressing engine
   */
  public setQualityMode(mode: 'low' | 'medium' | 'high' | 'auto'): void {
    if (mode === 'low') {
      this.smoothFactor = 0.4; // Faster, less filter calculations
    } else if (mode === 'medium') {
      this.smoothFactor = 0.25;
    } else {
      this.smoothFactor = 0.18; // Super smooth, high quality filtering
    }
  }

  /**
   * Smooths and maps Raw Landmarks to Responsive Body Anchors
   */
  public update(landmarks: PoseLandmark[], isMirrored = true): FashionBodyAnchors | null {
    if (!landmarks || landmarks.length === 0) {
      return null;
    }

    const getLm = (index: number) => {
      const lm = landmarks[index];
      if (!lm) return { x: 0.5, y: 0.5, confidence: 0 };
      
      // DO NOT mirror X again, as poseDetector has already mirrored landmarks
      const x = lm.x;
      return {
        x,
        y: lm.y,
        confidence: lm.visibility !== undefined ? lm.visibility : 0.8
      };
    };

    // Extract landmarks safely
    const nose = getLm(0);
    const leftEar = getLm(7);
    const rightEar = getLm(8);
    const leftShoulder = getLm(11);
    const rightShoulder = getLm(12);
    const leftWrist = getLm(15);
    const rightWrist = getLm(16);
    const leftHip = getLm(23);
    const rightHip = getLm(24);
    const leftKnee = getLm(25);
    const rightKnee = getLm(26);
    const leftAnkle = getLm(27);
    const rightAnkle = getLm(28);

    // 1. Calculate Head & Face anchors
    const headCenter = {
      x: nose.x,
      y: nose.y,
      confidence: nose.confidence
    };
    
    // Head width estimated from shoulder width or ear distance
    let shoulderDist = Math.abs(leftShoulder.x - rightShoulder.x);
    if (shoulderDist === 0) shoulderDist = 0.2;
    
    let headWidth = shoulderDist * 0.45; // default fallback ratio
    if (leftEar.confidence > 0.4 && rightEar.confidence > 0.4) {
      headWidth = Math.abs(leftEar.x - rightEar.x) * 1.55;
    }

    // 2. Shoulder & Torso anchors
    const shoulderCenter = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2,
      confidence: Math.min(leftShoulder.confidence, rightShoulder.confidence)
    };
    
    const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);

    // Hip Center
    const hipCenter = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2,
      confidence: Math.min(leftHip.confidence, rightHip.confidence)
    };
    const hipWidth = Math.abs(leftHip.x - rightHip.x);

    // Torso calculations
    const torsoCenter = {
      x: (shoulderCenter.x + hipCenter.x) / 2,
      y: (shoulderCenter.y + hipCenter.y) / 2,
      confidence: Math.min(shoulderCenter.confidence, hipCenter.confidence)
    };

    const torsoHeight = Math.abs(hipCenter.y - shoulderCenter.y);

    // Compute rotation (angle of shoulders relative to horizontal plane)
    let torsoRotation = 0;
    if (leftShoulder.confidence > 0.4 && rightShoulder.confidence > 0.4) {
      // Sort shoulders by screen X coordinate to find left-to-right visual slope
      const screenLeftShoulder = leftShoulder.x < rightShoulder.x ? leftShoulder : rightShoulder;
      const screenRightShoulder = leftShoulder.x < rightShoulder.x ? rightShoulder : leftShoulder;
      
      const dx = screenRightShoulder.x - screenLeftShoulder.x;
      const dy = screenRightShoulder.y - screenLeftShoulder.y;
      torsoRotation = Math.atan2(dy, dx) * (180 / Math.PI);
      
      // Keep it within a natural range (-45 to 45 degrees) to avoid crazy spinning on lost tracking
      if (torsoRotation > 45) torsoRotation = 45;
      if (torsoRotation < -45) torsoRotation = -45;
    }

    // Create current raw anchors
    const rawAnchors: FashionBodyAnchors = {
      headCenter,
      headWidth,
      shoulderCenter,
      shoulderWidth,
      torsoCenter,
      torsoHeight,
      torsoRotation,
      hipCenter,
      hipWidth,
      leftKnee,
      rightKnee,
      leftAnkle,
      rightAnkle,
      leftWrist,
      rightWrist
    };

    // Apply EMA (Exponential Moving Average) smoothing
    if (!this.previousAnchors) {
      this.previousAnchors = rawAnchors;
      return rawAnchors;
    }

    const smoothVal = (prev: number, curr: number, factor: number) => {
      return prev + (curr - prev) * factor;
    };

    const smoothPoint = (prev: { x: number; y: number; confidence: number }, curr: { x: number; y: number; confidence: number }, factor: number) => {
      return {
        x: smoothVal(prev.x, curr.x, factor),
        y: smoothVal(prev.y, curr.y, factor),
        confidence: curr.confidence // confidence can react immediately
      };
    };

    const prev = this.previousAnchors;
    const factor = this.smoothFactor;

    const smoothedAnchors: FashionBodyAnchors = {
      headCenter: smoothPoint(prev.headCenter, rawAnchors.headCenter, factor),
      headWidth: smoothVal(prev.headWidth, rawAnchors.headWidth, factor),
      
      shoulderCenter: smoothPoint(prev.shoulderCenter, rawAnchors.shoulderCenter, factor),
      shoulderWidth: smoothVal(prev.shoulderWidth, rawAnchors.shoulderWidth, factor),
      
      torsoCenter: smoothPoint(prev.torsoCenter, rawAnchors.torsoCenter, factor),
      torsoHeight: smoothVal(prev.torsoHeight, rawAnchors.torsoHeight, factor),
      torsoRotation: smoothVal(prev.torsoRotation, rawAnchors.torsoRotation, factor),
      
      hipCenter: smoothPoint(prev.hipCenter, rawAnchors.hipCenter, factor),
      hipWidth: smoothVal(prev.hipWidth, rawAnchors.hipWidth, factor),
      
      leftKnee: smoothPoint(prev.leftKnee, rawAnchors.leftKnee, factor),
      rightKnee: smoothPoint(prev.rightKnee, rawAnchors.rightKnee, factor),
      
      leftAnkle: smoothPoint(prev.leftAnkle, rawAnchors.leftAnkle, factor),
      rightAnkle: smoothPoint(prev.rightAnkle, rawAnchors.rightAnkle, factor),
      
      leftWrist: smoothPoint(prev.leftWrist, rawAnchors.leftWrist, factor),
      rightWrist: smoothPoint(prev.rightWrist, rawAnchors.rightWrist, factor)
    };

    this.previousAnchors = smoothedAnchors;
    return smoothedAnchors;
  }
}
