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
      if (!lm) return { x: 0.5, y: 0.5, z: 0, confidence: 0 };
      
      // DO NOT mirror X again, as poseDetector has already mirrored landmarks
      const x = lm.x;
      return {
        x,
        y: lm.y,
        z: typeof lm.z === 'number' ? lm.z : 0,
        confidence: lm.visibility !== undefined ? lm.visibility : 0.8
      };
    };

    // Extract landmarks safely
    const nose = getLm(0);
    const leftEyeInner = getLm(1);
    const leftEye = getLm(2);
    const leftEyeOuter = getLm(3);
    const rightEyeInner = getLm(4);
    const rightEye = getLm(5);
    const rightEyeOuter = getLm(6);
    const leftEar = getLm(7);
    const rightEar = getLm(8);
    const mouthLeft = getLm(9);
    const mouthRight = getLm(10);
    const leftShoulder = getLm(11);
    const rightShoulder = getLm(12);
    const leftElbow = getLm(13);
    const rightElbow = getLm(14);
    const leftWrist = getLm(15);
    const rightWrist = getLm(16);
    const leftHip = getLm(23);
    const rightHip = getLm(24);
    const leftKnee = getLm(25);
    const rightKnee = getLm(26);
    const leftAnkle = getLm(27);
    const rightAnkle = getLm(28);

    // 1. High-precision head/face anchors from the facial points that already
    // exist in MediaPipe Pose. Using nose as the single anchor caused hats,
    // glasses and masks to collapse onto the same place when the head tilted.
    let shoulderDist = Math.abs(leftShoulder.x - rightShoulder.x);
    if (shoulderDist === 0) shoulderDist = 0.2;

    const eyeCandidates = [leftEyeInner, leftEye, leftEyeOuter, rightEyeInner, rightEye, rightEyeOuter]
      .filter((p) => p.confidence > 0.35);
    const avgPoint = (pts: { x:number; y:number; confidence:number }[], fallback: {x:number;y:number;confidence:number}) => {
      if (!pts.length) return fallback;
      return {
        x: pts.reduce((a,p)=>a+p.x,0)/pts.length,
        y: pts.reduce((a,p)=>a+p.y,0)/pts.length,
        confidence: Math.min(...pts.map(p=>p.confidence)),
      };
    };
    const eyeCenter = avgPoint(eyeCandidates, { x:nose.x, y:nose.y - shoulderDist*0.08, confidence:nose.confidence });
    const mouthCenter = avgPoint([mouthLeft, mouthRight].filter(p=>p.confidence>0.35), { x:nose.x, y:nose.y + shoulderDist*0.09, confidence:nose.confidence });

    const eyeOuterLeft = leftEyeOuter.confidence > 0.35 ? leftEyeOuter : leftEye;
    const eyeOuterRight = rightEyeOuter.confidence > 0.35 ? rightEyeOuter : rightEye;
    let eyeWidth = Math.abs(eyeOuterLeft.x - eyeOuterRight.x);
    if (eyeWidth < 0.025) eyeWidth = shoulderDist * 0.19;

    let faceWidth = eyeWidth * 2.15;
    if (leftEar.confidence > 0.4 && rightEar.confidence > 0.4) {
      faceWidth = Math.abs(leftEar.x - rightEar.x) * 1.08;
    }
    faceWidth = Math.max(shoulderDist * 0.32, Math.min(shoulderDist * 0.72, faceWidth));
    const headWidth = faceWidth * 1.16;

    const eyeMouthDistance = Math.abs(mouthCenter.y - eyeCenter.y);
    const faceHeight = Math.max(faceWidth * 1.12, eyeMouthDistance * 2.65);
    const foreheadCenter = {
      x: eyeCenter.x,
      y: eyeCenter.y - Math.max(faceHeight * 0.27, eyeMouthDistance * 0.9),
      confidence: eyeCenter.confidence,
    };
    const faceCenter = {
      x: (eyeCenter.x + mouthCenter.x) / 2,
      y: eyeCenter.y + faceHeight * 0.16,
      confidence: Math.min(eyeCenter.confidence, mouthCenter.confidence, nose.confidence),
    };
    const headCenter = {
      x: (foreheadCenter.x + mouthCenter.x) / 2,
      y: (foreheadCenter.y + mouthCenter.y) / 2,
      confidence: Math.min(foreheadCenter.confidence, mouthCenter.confidence),
    };

    let faceRotation = 0;
    if (eyeOuterLeft.confidence > 0.35 && eyeOuterRight.confidence > 0.35) {
      const a = eyeOuterLeft.x < eyeOuterRight.x ? eyeOuterLeft : eyeOuterRight;
      const b = eyeOuterLeft.x < eyeOuterRight.x ? eyeOuterRight : eyeOuterLeft;
      faceRotation = Math.atan2(b.y-a.y, b.x-a.x) * (180/Math.PI);
      faceRotation = Math.max(-35, Math.min(35, faceRotation));
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

    // Estimate body yaw from shoulder depth and face/torso offset.
    // MediaPipe Z is relative depth; combining it with the 2D shoulder span
    // is much more stable than using only width shrinkage.
    const shoulderDepth = (leftShoulder.z || 0) - (rightShoulder.z || 0);
    const safeShoulderWidth = Math.max(0.06, shoulderWidth);
    let torsoYaw = Math.atan2(shoulderDepth, safeShoulderWidth) * (180 / Math.PI);
    const faceSideBias = ((nose.x - shoulderCenter.x) / safeShoulderWidth) * 26;
    torsoYaw += faceSideBias;
    torsoYaw = Math.max(-58, Math.min(58, torsoYaw));
    const torsoFacing: 'front' | 'left' | 'right' =
      torsoYaw > 12 ? 'right' : torsoYaw < -12 ? 'left' : 'front';

    const segment = (
      a: {x:number;y:number;confidence:number},
      b: {x:number;y:number;confidence:number},
    ) => {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      return {
        length: Math.sqrt(dx * dx + dy * dy),
        rotation: Math.atan2(dy, dx) * (180 / Math.PI),
      };
    };
    const leftUpperArm = segment(leftShoulder, leftElbow);
    const rightUpperArm = segment(rightShoulder, rightElbow);
    const leftForearm = segment(leftElbow, leftWrist);
    const rightForearm = segment(rightElbow, rightWrist);

    // Create current raw anchors
    const rawAnchors: FashionBodyAnchors = {
      headCenter,
      headWidth,
      foreheadCenter,
      eyeCenter,
      eyeWidth,
      mouthCenter,
      faceCenter,
      faceWidth,
      faceHeight,
      faceRotation,
      shoulderCenter,
      shoulderWidth,
      leftShoulder,
      rightShoulder,
      leftElbow,
      rightElbow,
      torsoCenter,
      torsoHeight,
      torsoRotation,
      torsoYaw,
      torsoFacing,
      leftUpperArmRotation: leftUpperArm.rotation,
      rightUpperArmRotation: rightUpperArm.rotation,
      leftForearmRotation: leftForearm.rotation,
      rightForearmRotation: rightForearm.rotation,
      leftUpperArmLength: leftUpperArm.length,
      rightUpperArmLength: rightUpperArm.length,
      leftForearmLength: leftForearm.length,
      rightForearmLength: rightForearm.length,
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
      foreheadCenter: smoothPoint(prev.foreheadCenter, rawAnchors.foreheadCenter, factor),
      eyeCenter: smoothPoint(prev.eyeCenter, rawAnchors.eyeCenter, factor),
      eyeWidth: smoothVal(prev.eyeWidth, rawAnchors.eyeWidth, factor),
      mouthCenter: smoothPoint(prev.mouthCenter, rawAnchors.mouthCenter, factor),
      faceCenter: smoothPoint(prev.faceCenter, rawAnchors.faceCenter, factor),
      faceWidth: smoothVal(prev.faceWidth, rawAnchors.faceWidth, factor),
      faceHeight: smoothVal(prev.faceHeight, rawAnchors.faceHeight, factor),
      faceRotation: smoothVal(prev.faceRotation, rawAnchors.faceRotation, factor),
      
      shoulderCenter: smoothPoint(prev.shoulderCenter, rawAnchors.shoulderCenter, factor),
      shoulderWidth: smoothVal(prev.shoulderWidth, rawAnchors.shoulderWidth, factor),
      leftShoulder: smoothPoint(prev.leftShoulder, rawAnchors.leftShoulder, factor),
      rightShoulder: smoothPoint(prev.rightShoulder, rawAnchors.rightShoulder, factor),
      leftElbow: smoothPoint(prev.leftElbow, rawAnchors.leftElbow, factor),
      rightElbow: smoothPoint(prev.rightElbow, rawAnchors.rightElbow, factor),

      torsoCenter: smoothPoint(prev.torsoCenter, rawAnchors.torsoCenter, factor),
      torsoHeight: smoothVal(prev.torsoHeight, rawAnchors.torsoHeight, factor),
      torsoRotation: smoothVal(prev.torsoRotation, rawAnchors.torsoRotation, factor),
      torsoYaw: smoothVal(prev.torsoYaw, rawAnchors.torsoYaw, factor),
      torsoFacing: rawAnchors.torsoFacing,
      leftUpperArmRotation: smoothVal(prev.leftUpperArmRotation, rawAnchors.leftUpperArmRotation, factor),
      rightUpperArmRotation: smoothVal(prev.rightUpperArmRotation, rawAnchors.rightUpperArmRotation, factor),
      leftForearmRotation: smoothVal(prev.leftForearmRotation, rawAnchors.leftForearmRotation, factor),
      rightForearmRotation: smoothVal(prev.rightForearmRotation, rawAnchors.rightForearmRotation, factor),
      leftUpperArmLength: smoothVal(prev.leftUpperArmLength, rawAnchors.leftUpperArmLength, factor),
      rightUpperArmLength: smoothVal(prev.rightUpperArmLength, rawAnchors.rightUpperArmLength, factor),
      leftForearmLength: smoothVal(prev.leftForearmLength, rawAnchors.leftForearmLength, factor),
      rightForearmLength: smoothVal(prev.rightForearmLength, rawAnchors.rightForearmLength, factor),

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
