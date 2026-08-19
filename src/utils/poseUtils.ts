/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WristPosition } from './poseDetector';

export interface MappedAimCoordinate {
  rawX: number; // 0..1 normalized wrist x
  rawY: number; // 0..1 normalized wrist y
  gameX: number; // 0..100 percentage in game screen
  gameY: number; // 0..100 percentage in game screen
  visible: boolean;
  confidence: number;
}

export interface MapWristOptions {
  minX?: number; // min percentage clamp (default 5)
  maxX?: number; // max percentage clamp (default 95)
  minY?: number; // min percentage clamp (default 5)
  maxY?: number; // max percentage clamp (default 95)
  confidenceThreshold?: number; // min visibility required (default 0.45)
}

/**
 * Standardized coordinate mapping helper for MediaPipe wrists across all motion games.
 * MediaPipe wrist coords in poseDetector:
 * - x: 0.0 (left of mirrored screen) to 1.0 (right of mirrored screen)
 * - y: 0.0 (top of screen) to 1.0 (bottom of screen)
 */
export function mapWristToGame(
  wrist: WristPosition | null | undefined,
  options: MapWristOptions = {}
): MappedAimCoordinate {
  const {
    minX = 5,
    maxX = 95,
    minY = 5,
    maxY = 95,
    confidenceThreshold = 0.45,
  } = options;

  if (!wrist) {
    return { rawX: 0.5, rawY: 0.5, gameX: 50, gameY: 50, visible: false, confidence: 0 };
  }

  const isVis = wrist.visible !== false;
  const conf = typeof wrist.visibility === 'number' ? wrist.visibility : isVis ? 0.8 : 0;

  if (!isVis || conf < confidenceThreshold) {
    return {
      rawX: typeof wrist.x === 'number' ? wrist.x : 0.5,
      rawY: typeof wrist.y === 'number' ? wrist.y : 0.5,
      gameX: 50,
      gameY: 50,
      visible: false,
      confidence: conf,
    };
  }

  const rawX = Math.max(0, Math.min(1, wrist.x));
  const rawY = Math.max(0, Math.min(1, wrist.y));

  const gameX = Math.max(minX, Math.min(maxX, rawX * 100));
  const gameY = Math.max(minY, Math.min(maxY, rawY * 100));

  return {
    rawX,
    rawY,
    gameX,
    gameY,
    visible: true,
    confidence: conf,
  };
}
