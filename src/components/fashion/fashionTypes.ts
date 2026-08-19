/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CategoryType } from '../../types';

export type FashionQualityMode = 'auto' | 'low' | 'medium' | 'high';

export interface FashionBodyAnchors {
  headCenter: { x: number; y: number; confidence: number };
  headWidth: number;
  foreheadCenter: { x: number; y: number; confidence: number };
  eyeCenter: { x: number; y: number; confidence: number };
  eyeWidth: number;
  mouthCenter: { x: number; y: number; confidence: number };
  faceCenter: { x: number; y: number; confidence: number };
  faceWidth: number;
  faceHeight: number;
  faceRotation: number;
  
  shoulderCenter: { x: number; y: number; confidence: number };
  shoulderWidth: number;
  
  torsoCenter: { x: number; y: number; confidence: number };
  torsoHeight: number;
  torsoRotation: number; // in degrees
  
  hipCenter: { x: number; y: number; confidence: number };
  hipWidth: number;
  
  leftKnee: { x: number; y: number; confidence: number };
  rightKnee: { x: number; y: number; confidence: number };
  
  leftAnkle: { x: number; y: number; confidence: number };
  rightAnkle: { x: number; y: number; confidence: number };
  
  leftWrist: { x: number; y: number; confidence: number };
  rightWrist: { x: number; y: number; confidence: number };
}

export interface FashionPoseDefinition {
  id: string;
  name: string;
  description: string;
  emoji: string;
  requiredGesture: string;
  guideVoice: string;
}

export interface FashionThemeDefinition {
  id: string;
  name: string;
  emoji: string;
  gradient: string;
  textColor: string;
  poseIds: string[];
}
