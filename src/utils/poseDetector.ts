/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameGesture } from '../types';

export type TrackingMode = 'mediapipe' | 'pixel_motion' | 'keyboard_only';
export type PoseEngineStatus = 'idle' | 'loading' | 'running' | 'fallback_pixel_motion' | 'error';

export interface PoseLandmark {
  x: number; // 0.0 to 1.0 (mirrored for user-facing camera)
  y: number; // 0.0 to 1.0
  z?: number;
  visibility?: number;
  screenX?: number; // pixel in canvas
  screenY?: number;
}

export interface WristPosition {
  x: number; // 0.0 to 1.0 (mirrored)
  y: number; // 0.0 to 1.0
  screenX: number; // pixel X in canvas
  screenY: number; // pixel Y in canvas
  visible: boolean;
  visibility?: number;
  velocity: number; // % screen per sec
}

export interface PoseResult {
  status: PoseEngineStatus;
  landmarks: PoseLandmark[];
  leftWrist: WristPosition;
  rightWrist: WristPosition;
  gesture: GameGesture;
  rawGesture: GameGesture;
  bodyDetected: boolean;
  fullBodyDetected: boolean;
  confidence: number;
  fps: number;
  trackingFeedback: 'ok' | 'too_near' | 'too_far' | 'no_body' | 'no_legs' | 'not_centered';
  steeringAngleDeg: number;
  steeringNormalized: number;
}

type PoseListener = (result: PoseResult) => void;

// MediaPipe Landmark Index Constants
export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
};

// Skeleton Connections for Drawing
export const POSE_CONNECTIONS = [
  // Upper body
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER],
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW],
  [POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST],
  [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_ELBOW],
  [POSE_LANDMARKS.RIGHT_ELBOW, POSE_LANDMARKS.RIGHT_WRIST],
  // Hands
  [POSE_LANDMARKS.LEFT_WRIST, POSE_LANDMARKS.LEFT_INDEX],
  [POSE_LANDMARKS.LEFT_WRIST, POSE_LANDMARKS.LEFT_PINKY],
  [POSE_LANDMARKS.LEFT_WRIST, POSE_LANDMARKS.LEFT_THUMB],
  [POSE_LANDMARKS.RIGHT_WRIST, POSE_LANDMARKS.RIGHT_INDEX],
  [POSE_LANDMARKS.RIGHT_WRIST, POSE_LANDMARKS.RIGHT_PINKY],
  [POSE_LANDMARKS.RIGHT_WRIST, POSE_LANDMARKS.RIGHT_THUMB],
  // Torso
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP],
  [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_HIP],
  [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP],
  // Lower body
  [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE],
  [POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.LEFT_ANKLE],
  [POSE_LANDMARKS.LEFT_ANKLE, POSE_LANDMARKS.LEFT_HEEL],
  [POSE_LANDMARKS.LEFT_HEEL, POSE_LANDMARKS.LEFT_FOOT_INDEX],
  [POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_KNEE],
  [POSE_LANDMARKS.RIGHT_KNEE, POSE_LANDMARKS.RIGHT_ANKLE],
  [POSE_LANDMARKS.RIGHT_ANKLE, POSE_LANDMARKS.RIGHT_HEEL],
  [POSE_LANDMARKS.RIGHT_HEEL, POSE_LANDMARKS.RIGHT_FOOT_INDEX],
];

export class PoseDetectorManager {
  private static instance: PoseDetectorManager;
  private mode: TrackingMode = 'mediapipe';
  private isRunning: boolean = false;
  private status: PoseEngineStatus = 'idle';
  private isSkeletonVisible: boolean = true;

  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private canvasCtx: CanvasRenderingContext2D | null = null;

  // MediaPipe Instance
  private mediaPipePose: any = null;
  private isMediaPipeLoaded: boolean = false;
  private isMediaPipeLoading: boolean = false;
  private rafId: number | null = null;
  private isProcessingFrame: boolean = false;

  // Subscribers
  private listeners: Set<PoseListener> = new Set();

  // Smoothing & State Tracking
  private smoothedLandmarks: PoseLandmark[] = [];
  private prevLeftWrist: { x: number; y: number; time: number } | null = null;
  private prevRightWrist: { x: number; y: number; time: number } | null = null;
  private leftWristVelocity: number = 0;
  private rightWristVelocity: number = 0;

  // Baseline calibration for Jump & Duck
  private baselineShoulderY: number = 0.45;
  private baselineHipY: number = 0.65;
  private baselineInitialized: boolean = false;

  // Gesture State Machine
  private currentRawGesture: GameGesture = 'standing';
  private currentSmoothedGesture: GameGesture = 'standing';
  private gestureHoldFrames: number = 0;
  private gestureCandidate: GameGesture = 'standing';
  private lastGestureChangeTime: number = 0;
  private simulatedGesture: GameGesture = 'standing';

  // Pixel Motion Fallback
  private pixelMotionInterval: any = null;
  private prevPixelFrame: ImageData | null = null;

  // Performance metrics
  private frameCount: number = 0;
  private lastFpsCalcTime: number = performance.now();
  private currentFps: number = 0;

  public static getInstance(): PoseDetectorManager {
    if (!PoseDetectorManager.instance) {
      PoseDetectorManager.instance = new PoseDetectorManager();
    }
    return PoseDetectorManager.instance;
  }

  // --- Public API ---

  public getStatus(): PoseEngineStatus {
    return this.status;
  }

  public getFps(): number {
    return this.currentFps;
  }

  public setMode(mode: TrackingMode) {
    if (this.mode === mode) return;
    this.mode = mode;
    if (this.isRunning && this.videoElement && this.canvasElement) {
      this.restartTracking();
    }
  }

  public setSkeletonVisible(visible: boolean) {
    this.isSkeletonVisible = visible;
  }

  public setSimulatedGesture(g: GameGesture) {
    this.simulatedGesture = g;
    this.currentSmoothedGesture = g;
    this.currentRawGesture = g;
    this.notifyListeners({
      status: this.status,
      landmarks: this.smoothedLandmarks,
      leftWrist: { x: 0.3, y: 0.5, screenX: 200, screenY: 240, visible: true, velocity: 0 },
      rightWrist: { x: 0.7, y: 0.5, screenX: 440, screenY: 240, visible: true, velocity: 0 },
      gesture: g,
      rawGesture: g,
      bodyDetected: true,
      fullBodyDetected: true,
      confidence: 1.0,
      fps: 60,
      trackingFeedback: 'ok',
      steeringAngleDeg: 0,
      steeringNormalized: 0,
    });
  }

  public addListener(listener: PoseListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public start(video: HTMLVideoElement, canvas: HTMLCanvasElement, mode: TrackingMode = 'mediapipe') {
    this.videoElement = video;
    this.canvasElement = canvas;
    this.canvasCtx = canvas.getContext('2d', { willReadFrequently: true });
    this.mode = mode;
    this.isRunning = true;
    this.status = 'loading';

    this.restartTracking();
  }

  public stop() {
    this.isRunning = false;
    this.status = 'idle';
    this.stopMediaPipe();
    this.stopPixelMotion();
    this.prevLeftWrist = null;
    this.prevRightWrist = null;
    this.smoothedLandmarks = [];
    if (this.canvasCtx && this.canvasElement) {
      this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    }
  }

  private restartTracking() {
    this.stopMediaPipe();
    this.stopPixelMotion();

    if (!this.isRunning || !this.videoElement || !this.canvasElement) return;

    if (this.mode === 'mediapipe') {
      this.startMediaPipe();
    } else if (this.mode === 'pixel_motion') {
      this.startPixelMotion();
    }
  }

  // --- MediaPipe Pipeline ---

  private async startMediaPipe() {
    try {
      this.status = 'loading';
      if (!this.isMediaPipeLoaded) {
        await this.loadMediaPipeScripts();
      }

      if (!(window as any).Pose) {
        console.warn('MediaPipe Pose not found in window object, falling back to Pixel Motion');
        this.status = 'fallback_pixel_motion';
        this.mode = 'pixel_motion';
        this.startPixelMotion();
        return;
      }

      // Initialize Pose model
      if (!this.mediaPipePose) {
        this.mediaPipePose = new (window as any).Pose({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        });

        this.mediaPipePose.setOptions({
          modelComplexity: 1, // 1 is optimal balance of accuracy and latency
          smoothLandmarks: true,
          enableSegmentation: false,
          smoothSegmentation: false,
          minDetectionConfidence: 0.45,
          minTrackingConfidence: 0.45,
        });

        this.mediaPipePose.onResults((results: any) => {
          this.isProcessingFrame = false;
          this.handleMediaPipeResults(results);
        });
      }

      this.status = 'running';

      // Start custom RAF frame loop (more reliable and lighter than CameraUtils)
      const processFrame = async () => {
        if (!this.isRunning || this.mode !== 'mediapipe') return;

        const video = this.videoElement;
        if (video && video.readyState >= 2 && video.videoWidth > 0 && !video.paused) {
          if (!this.isProcessingFrame && this.mediaPipePose) {
            this.isProcessingFrame = true;
            try {
              await this.mediaPipePose.send({ image: video });
            } catch (err) {
              this.isProcessingFrame = false;
            }
          }
        }

        if (this.isRunning) {
          this.rafId = requestAnimationFrame(processFrame);
        }
      };

      this.rafId = requestAnimationFrame(processFrame);
    } catch (err) {
      console.error('Error initializing MediaPipe Pose:', err);
      this.status = 'fallback_pixel_motion';
      this.mode = 'pixel_motion';
      this.startPixelMotion();
    }
  }

  private stopMediaPipe() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.isProcessingFrame = false;
  }

  private async loadMediaPipeScripts(): Promise<void> {
    if (this.isMediaPipeLoaded) return;
    if (this.isMediaPipeLoading) {
      return new Promise((resolve, reject) => {
        const started = performance.now();
        const check = setInterval(() => {
          if (this.isMediaPipeLoaded) {
            clearInterval(check);
            resolve();
          } else if (!this.isMediaPipeLoading || performance.now() - started > 12000) {
            clearInterval(check);
            reject(new Error('MediaPipe load failed or timed out'));
          }
        }, 100);
      });
    }

    this.isMediaPipeLoading = true;

    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.crossOrigin = 'anonymous';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script ${src}`));
        document.head.appendChild(script);
      });
    };

    try {
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js');
      this.isMediaPipeLoaded = true;
      this.isMediaPipeLoading = false;
    } catch (e) {
      this.isMediaPipeLoading = false;
      throw e;
    }
  }

  // --- Landmark & Gesture Processing ---

  private handleMediaPipeResults(results: any) {
    if (!this.isRunning || this.mode !== 'mediapipe') return;

    // Update FPS
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsCalcTime >= 500) {
      this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsCalcTime));
      this.frameCount = 0;
      this.lastFpsCalcTime = now;
    }

    const canvas = this.canvasElement;
    const ctx = this.canvasCtx;
    const width = canvas ? canvas.width : 640;
    const height = canvas ? canvas.height : 480;

    if (ctx && canvas) {
      ctx.save();
      ctx.clearRect(0, 0, width, height);

      // Render camera image mirrored on canvas. Always restore the context even if
      // MediaPipe returns a frame without an image to avoid leaking save() states.
      if (results.image) {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(results.image, 0, 0, width, height);
      }
      ctx.restore();
    }

    const rawLandmarks = results.poseLandmarks;

    if (!rawLandmarks || rawLandmarks.length === 0) {
      // No body in frame
      this.smoothedLandmarks = [];
      this.prevLeftWrist = null;
      this.prevRightWrist = null;

      const emptyResult: PoseResult = {
        status: this.status,
        landmarks: [],
        leftWrist: { x: 0.5, y: 0.5, screenX: width / 2, screenY: height / 2, visible: false, velocity: 0 },
        rightWrist: { x: 0.5, y: 0.5, screenX: width / 2, screenY: height / 2, visible: false, velocity: 0 },
        gesture: 'standing',
        rawGesture: 'standing',
        bodyDetected: false,
        fullBodyDetected: false,
        confidence: 0,
        fps: this.currentFps,
        trackingFeedback: 'no_body',
        steeringAngleDeg: 0,
        steeringNormalized: 0,
      };
      this.notifyListeners(emptyResult);
      return;
    }

    // Process & Mirror Landmarks
    // In camera image, player's left wrist is MediaPipe index 15, right is index 16
    // When mirrored for mirror-like UI: x_mirrored = 1 - x
    const processedLandmarks: PoseLandmark[] = rawLandmarks.map((lm: any) => {
      const mirroredX = 1 - lm.x;
      return {
        x: Math.max(0, Math.min(1, mirroredX)),
        y: Math.max(0, Math.min(1, lm.y)),
        z: lm.z,
        visibility: lm.visibility !== undefined ? lm.visibility : 0.8,
        screenX: Math.round((1 - lm.x) * width),
        screenY: Math.round(lm.y * height),
      };
    });

    // Smooth landmarks with Exponential Moving Average
    if (this.smoothedLandmarks.length === processedLandmarks.length) {
      const alpha = 0.7; // Fast responsiveness, crisp response
      this.smoothedLandmarks = processedLandmarks.map((lm, idx) => {
        const prev = this.smoothedLandmarks[idx];
        const smX = prev.x + alpha * (lm.x - prev.x);
        const smY = prev.y + alpha * (lm.y - prev.y);
        return {
          ...lm,
          x: smX,
          y: smY,
          screenX: Math.round(smX * width),
          screenY: Math.round(smY * height),
        };
      });
    } else {
      this.smoothedLandmarks = processedLandmarks;
    }

    // Extract key points
    const leftWristLandmark = this.smoothedLandmarks[POSE_LANDMARKS.LEFT_WRIST];
    const rightWristLandmark = this.smoothedLandmarks[POSE_LANDMARKS.RIGHT_WRIST];
    const leftShoulder = this.smoothedLandmarks[POSE_LANDMARKS.LEFT_SHOULDER];
    const rightShoulder = this.smoothedLandmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
    const leftHip = this.smoothedLandmarks[POSE_LANDMARKS.LEFT_HIP];
    const rightHip = this.smoothedLandmarks[POSE_LANDMARKS.RIGHT_HIP];
    const leftAnkle = this.smoothedLandmarks[POSE_LANDMARKS.LEFT_ANKLE];
    const rightAnkle = this.smoothedLandmarks[POSE_LANDMARKS.RIGHT_ANKLE];
    const nose = this.smoothedLandmarks[POSE_LANDMARKS.NOSE];

    // Calculate Wrist Velocities
    const timeNow = Date.now();
    const isLeftWristVisible = (leftWristLandmark?.visibility || 0) > 0.4;
    const isRightWristVisible = (rightWristLandmark?.visibility || 0) > 0.4;

    if (this.prevLeftWrist && leftWristLandmark && isLeftWristVisible) {
      const dt = Math.max(0.01, (timeNow - this.prevLeftWrist.time) / 1000);
      const dx = leftWristLandmark.x - this.prevLeftWrist.x;
      const dy = leftWristLandmark.y - this.prevLeftWrist.y;
      this.leftWristVelocity = (Math.sqrt(dx * dx + dy * dy) * 100) / dt;
    } else {
      this.leftWristVelocity = 0;
    }
    if (leftWristLandmark && isLeftWristVisible) {
      this.prevLeftWrist = { x: leftWristLandmark.x, y: leftWristLandmark.y, time: timeNow };
    } else {
      this.prevLeftWrist = null;
    }

    if (this.prevRightWrist && rightWristLandmark && isRightWristVisible) {
      const dt = Math.max(0.01, (timeNow - this.prevRightWrist.time) / 1000);
      const dx = rightWristLandmark.x - this.prevRightWrist.x;
      const dy = rightWristLandmark.y - this.prevRightWrist.y;
      this.rightWristVelocity = (Math.sqrt(dx * dx + dy * dy) * 100) / dt;
    } else {
      this.rightWristVelocity = 0;
    }
    if (rightWristLandmark && isRightWristVisible) {
      this.prevRightWrist = { x: rightWristLandmark.x, y: rightWristLandmark.y, time: timeNow };
    } else {
      this.prevRightWrist = null;
    }

    const leftWrist: WristPosition = {
      x: leftWristLandmark ? leftWristLandmark.x : 0.3,
      y: leftWristLandmark ? leftWristLandmark.y : 0.5,
      screenX: leftWristLandmark ? (leftWristLandmark.screenX || width * 0.3) : width * 0.3,
      screenY: leftWristLandmark ? (leftWristLandmark.screenY || height * 0.5) : height * 0.5,
      visible: isLeftWristVisible,
      visibility: leftWristLandmark?.visibility,
      velocity: this.leftWristVelocity,
    };

    const rightWrist: WristPosition = {
      x: rightWristLandmark ? rightWristLandmark.x : 0.7,
      y: rightWristLandmark ? rightWristLandmark.y : 0.5,
      screenX: rightWristLandmark ? (rightWristLandmark.screenX || width * 0.7) : width * 0.7,
      screenY: rightWristLandmark ? (rightWristLandmark.screenY || height * 0.5) : height * 0.5,
      visible: isRightWristVisible,
      visibility: rightWristLandmark?.visibility,
      velocity: this.rightWristVelocity,
    };

    // Body Checks & Feedback
    const upperBodyVisible = (leftShoulder?.visibility || 0) > 0.4 && (rightShoulder?.visibility || 0) > 0.4;
    const leftAnkleInFrame = (leftAnkle?.visibility || 0) > 0.30 && (leftAnkle?.y ?? 1) < 0.97;
    const rightAnkleInFrame = (rightAnkle?.visibility || 0) > 0.30 && (rightAnkle?.y ?? 1) < 0.97;
    const lowerBodyVisible = leftAnkleInFrame && rightAnkleInFrame;
    const fullBodyDetected = upperBodyVisible && lowerBodyVisible;

    let trackingFeedback: PoseResult['trackingFeedback'] = 'ok';
    if (!upperBodyVisible) {
      trackingFeedback = 'no_body';
    } else {
      const shoulderWidth = Math.abs((rightShoulder?.x || 0.6) - (leftShoulder?.x || 0.4));
      if (shoulderWidth > 0.6) {
        trackingFeedback = 'too_near';
      } else if (shoulderWidth < 0.1) {
        trackingFeedback = 'too_far';
      } else if (!lowerBodyVisible) {
        trackingFeedback = 'no_legs';
      } else {
        const midX = ((leftShoulder?.x || 0.5) + (rightShoulder?.x || 0.5)) / 2;
        if (midX < 0.15 || midX > 0.85) {
          trackingFeedback = 'not_centered';
        } else {
          trackingFeedback = 'ok';
        }
      }
    }

    // Baseline adaptation for jump/duck
    if (leftShoulder && rightShoulder && leftHip && rightHip) {
      const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
      const avgHipY = (leftHip.y + rightHip.y) / 2;
      if (!this.baselineInitialized) {
        this.baselineShoulderY = avgShoulderY;
        this.baselineHipY = avgHipY;
        this.baselineInitialized = true;
      } else {
        if (this.currentSmoothedGesture === 'standing') {
          this.baselineShoulderY += (avgShoulderY - this.baselineShoulderY) * 0.02;
          this.baselineHipY += (avgHipY - this.baselineHipY) * 0.02;
        }
      }
    }

    // Recognize Gesture
    const rawGesture = this.classifyGesture(
      this.smoothedLandmarks,
      leftWrist,
      rightWrist,
      leftShoulder,
      rightShoulder,
      leftHip,
      rightHip,
      nose
    );

    this.currentRawGesture = rawGesture;

    // Gesture Debouncing
    if (rawGesture === this.gestureCandidate) {
      this.gestureHoldFrames++;
      const requiredFrames = rawGesture === 'jump' || rawGesture === 'duck' ? 2 : 3;
      if (this.gestureHoldFrames >= requiredFrames && this.currentSmoothedGesture !== rawGesture) {
        this.currentSmoothedGesture = rawGesture;
        this.lastGestureChangeTime = Date.now();
      }
    } else {
      this.gestureCandidate = rawGesture;
      this.gestureHoldFrames = 1;
    }

    // Steering calculation for Racing Game
    let steeringAngleDeg = 0;
    let steeringNormalized = 0;
    if (leftWrist.visible && rightWrist.visible) {
      const dy = rightWrist.y - leftWrist.y;
      const dx = rightWrist.x - leftWrist.x;
      if (Math.abs(dx) > 0.06) {
        const angleRad = Math.atan2(dy, Math.abs(dx));
        steeringAngleDeg = (-angleRad * 180) / Math.PI;
        const clampedAngle = Math.max(-45, Math.min(45, steeringAngleDeg));
        steeringNormalized = clampedAngle / 45;
      }
    }

    // Render Skeleton & Hands on canvas if enabled
    if (this.isSkeletonVisible && ctx) {
      this.drawSkeleton(ctx, this.smoothedLandmarks, width, height, leftWrist, rightWrist);
    }

    const conf = upperBodyVisible ? ((leftShoulder?.visibility || 0) + (rightShoulder?.visibility || 0)) / 2 : 0.2;

    const result: PoseResult = {
      status: this.status,
      landmarks: this.smoothedLandmarks,
      leftWrist,
      rightWrist,
      gesture: this.currentSmoothedGesture,
      rawGesture: this.currentRawGesture,
      bodyDetected: upperBodyVisible,
      fullBodyDetected,
      confidence: conf,
      fps: this.currentFps,
      trackingFeedback,
      steeringAngleDeg,
      steeringNormalized,
    };

    this.notifyListeners(result);
  }

  // --- Classification Logic ---

  private classifyGesture(
    landmarks: PoseLandmark[],
    leftWrist: WristPosition,
    rightWrist: WristPosition,
    leftShoulder?: PoseLandmark,
    rightShoulder?: PoseLandmark,
    leftHip?: PoseLandmark,
    rightHip?: PoseLandmark,
    nose?: PoseLandmark
  ): GameGesture {
    if (!leftShoulder || !rightShoulder) return 'standing';

    const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
    const avgHipY = leftHip && rightHip ? (leftHip.y + rightHip.y) / 2 : this.baselineHipY;

    // 1. Jump Detection
    if (avgShoulderY < this.baselineShoulderY - 0.075 || avgHipY < this.baselineHipY - 0.075) {
      return 'jump';
    }

    // 2. Duck / Crouch Detection
    if (avgShoulderY > this.baselineShoulderY + 0.09 || avgHipY > this.baselineHipY + 0.09) {
      return 'duck';
    }

    // 3. Hands Up Checks
    const leftUp = leftWrist.visible && leftWrist.y < leftShoulder.y - 0.08;
    const rightUp = rightWrist.visible && rightWrist.y < rightShoulder.y - 0.08;

    if (leftUp && rightUp) {
      return 'both_arms_up';
    }

    if (leftUp && !rightUp) {
      return 'left_arm_up';
    }
    if (rightUp && !leftUp) {
      return 'right_arm_up';
    }

    // 4. Hands Spread / Wings
    if (leftWrist.visible && rightWrist.visible) {
      const wristDistX = Math.abs(rightWrist.x - leftWrist.x);
      const leftNearShoulderHeight = Math.abs(leftWrist.y - leftShoulder.y) < 0.16;
      const rightNearShoulderHeight = Math.abs(rightWrist.y - rightShoulder.y) < 0.16;

      if (wristDistX > 0.52 && leftNearShoulderHeight && rightNearShoulderHeight) {
        return 'hands_spread';
      }

      // 5. Clap Detection
      const distWrists = Math.hypot(rightWrist.x - leftWrist.x, rightWrist.y - leftWrist.y);
      if (distWrists < 0.11 && leftWrist.y > leftShoulder.y - 0.05 && leftWrist.y < avgHipY) {
        return 'clap';
      }
    }

    // 6. Tilt / Lean Left or Right
    if (leftHip && rightHip) {
      const midShoulderX = (leftShoulder.x + rightShoulder.x) / 2;
      const midHipX = (leftHip.x + rightHip.x) / 2;
      const leanX = midShoulderX - midHipX;

      if (leanX < -0.065) {
        return 'tilt_left';
      }
      if (leanX > 0.065) {
        return 'tilt_right';
      }
    }

    return 'standing';
  }

  // --- Skeleton Drawing on Canvas ---

  private drawSkeleton(
    ctx: CanvasRenderingContext2D,
    landmarks: PoseLandmark[],
    width: number,
    height: number,
    leftWrist: WristPosition,
    rightWrist: WristPosition
  ) {
    if (!landmarks || landmarks.length < 17) return;

    ctx.save();

    // 1. Draw glowing bones
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const [startIdx, endIdx] of POSE_CONNECTIONS) {
      const p1 = landmarks[startIdx];
      const p2 = landmarks[endIdx];

      if (!p1 || !p2) continue;
      if ((p1.visibility || 0) < 0.35 || (p2.visibility || 0) < 0.35) continue;

      const x1 = p1.screenX ?? p1.x * width;
      const y1 = p1.screenY ?? p1.y * height;
      const x2 = p2.screenX ?? p2.x * width;
      const y2 = p2.screenY ?? p2.y * height;

      // Color coding
      let strokeColor = '#10B981'; // Emerald
      if (startIdx >= 11 && endIdx <= 16) {
        strokeColor = '#06B6D4'; // Cyan for arms
      } else if (startIdx >= 23 && endIdx <= 32) {
        strokeColor = '#8B5CF6'; // Purple for legs
      } else if (startIdx >= 11 && endIdx <= 24) {
        strokeColor = '#F59E0B'; // Amber for torso
      }

      ctx.strokeStyle = strokeColor;
      ctx.shadowColor = strokeColor;
      ctx.shadowBlur = 6;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // 2. Draw Joint Dots
    for (let i = 0; i < landmarks.length; i++) {
      const lm = landmarks[i];
      if (!lm || (lm.visibility || 0) < 0.35) continue;
      if (i > 0 && i < 11) continue; // Skip minor facial points

      const x = lm.screenX ?? lm.x * width;
      const y = lm.screenY ?? lm.y * height;

      ctx.beginPath();
      ctx.arc(x, y, i === 0 ? 8 : 5, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = '#10B981';
      ctx.shadowBlur = 4;
      ctx.fill();
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // 3. Highlight Left and Right Wrists / Hands with custom clear badges
    // Left Wrist: Blue / Cyan dot
    if (leftWrist.visible) {
      ctx.beginPath();
      ctx.arc(leftWrist.screenX, leftWrist.screenY, 16, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(59, 130, 246, 0.45)';
      ctx.fill();
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Center dot
      ctx.beginPath();
      ctx.arc(leftWrist.screenX, leftWrist.screenY, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#60A5FA';
      ctx.fill();

      // Hand Label
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 11px sans-serif';
      ctx.shadowBlur = 4;
      ctx.shadowColor = '#000000';
      ctx.fillText('✋ TAY TRÁI', leftWrist.screenX - 24, leftWrist.screenY - 20);
    }

    // Right Wrist: Pink / Rose dot
    if (rightWrist.visible) {
      ctx.beginPath();
      ctx.arc(rightWrist.screenX, rightWrist.screenY, 16, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(236, 72, 153, 0.45)';
      ctx.fill();
      ctx.strokeStyle = '#EC4899';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Center dot
      ctx.beginPath();
      ctx.arc(rightWrist.screenX, rightWrist.screenY, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#F472B6';
      ctx.fill();

      // Hand Label
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 11px sans-serif';
      ctx.shadowBlur = 4;
      ctx.shadowColor = '#000000';
      ctx.fillText('✋ TAY PHẢI', rightWrist.screenX - 24, rightWrist.screenY - 20);
    }

    ctx.restore();
  }

  // --- Pixel Motion Fallback ---

  private startPixelMotion() {
    this.stopPixelMotion();
    this.stopMediaPipe();
    this.mode = 'pixel_motion';

    const video = this.videoElement;
    const canvas = this.canvasElement;
    if (!video || !canvas) return;

    const sampleWidth = 80;
    const sampleHeight = 60;
    const offCanvas = document.createElement('canvas');
    offCanvas.width = sampleWidth;
    offCanvas.height = sampleHeight;
    const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
    if (!offCtx) return;

    this.pixelMotionInterval = setInterval(() => {
      if (!this.isRunning || this.mode !== 'pixel_motion') return;
      if (video.readyState < 2 || video.videoWidth === 0) return;

      offCtx.drawImage(video, 0, 0, sampleWidth, sampleHeight);
      const currentFrame = offCtx.getImageData(0, 0, sampleWidth, sampleHeight);

      if (this.prevPixelFrame) {
        let leftMotion = 0;
        let rightMotion = 0;
        let topMotion = 0;
        let bottomMotion = 0;
        let totalMotion = 0;

        const d1 = currentFrame.data;
        const d2 = this.prevPixelFrame.data;

        for (let i = 0; i < d1.length; i += 4) {
          const diff = Math.abs(d1[i] - d2[i]) + Math.abs(d1[i + 1] - d2[i + 1]) + Math.abs(d1[i + 2] - d2[i + 2]);
          if (diff > 45) {
            totalMotion++;
            const pixelIdx = i / 4;
            const px = pixelIdx % sampleWidth;
            const py = Math.floor(pixelIdx / sampleWidth);

            if (px < sampleWidth * 0.45) rightMotion++;
            else if (px > sampleWidth * 0.55) leftMotion++;

            if (py < sampleHeight * 0.4) topMotion++;
            else if (py > sampleHeight * 0.6) bottomMotion++;
          }
        }

        let detectedGesture: GameGesture = 'standing';
        if (topMotion > 120) {
          detectedGesture = 'both_arms_up';
        } else if (leftMotion > rightMotion * 1.6 && leftMotion > 60) {
          detectedGesture = 'left_arm_up';
        } else if (rightMotion > leftMotion * 1.6 && rightMotion > 60) {
          detectedGesture = 'right_arm_up';
        } else if (bottomMotion > 100) {
          detectedGesture = 'duck';
        }

        this.currentSmoothedGesture = detectedGesture;
        this.currentRawGesture = detectedGesture;

        this.notifyListeners({
          status: 'fallback_pixel_motion',
          landmarks: [],
          leftWrist: { x: 0.3, y: 0.5, screenX: canvas.width * 0.3, screenY: canvas.height * 0.5, visible: leftMotion > 30, velocity: leftMotion },
          rightWrist: { x: 0.7, y: 0.5, screenX: canvas.width * 0.7, screenY: canvas.height * 0.5, visible: rightMotion > 30, velocity: rightMotion },
          gesture: detectedGesture,
          rawGesture: detectedGesture,
          bodyDetected: totalMotion > 30,
          fullBodyDetected: false,
          confidence: Math.min(1.0, totalMotion / 300),
          fps: 20,
          trackingFeedback: 'ok',
          steeringAngleDeg: (rightMotion - leftMotion) * 0.3,
          steeringNormalized: Math.max(-1, Math.min(1, (rightMotion - leftMotion) / 100)),
        });
      }

      this.prevPixelFrame = currentFrame;
    }, 50);
  }

  private stopPixelMotion() {
    if (this.pixelMotionInterval) {
      clearInterval(this.pixelMotionInterval);
      this.pixelMotionInterval = null;
    }
    this.prevPixelFrame = null;
  }

  private notifyListeners(result: PoseResult) {
    this.listeners.forEach((fn) => {
      try {
        fn(result);
      } catch (e) {
        console.error('Pose listener error:', e);
      }
    });
  }

  /**
   * Helper to normalize pose/wrist coordinates into any target container width and height
   */
  public normalizeToScreen(x: number, y: number, targetWidth: number, targetHeight: number) {
    return {
      screenX: Math.round(Math.max(0, Math.min(1, x)) * targetWidth),
      screenY: Math.round(Math.max(0, Math.min(1, y)) * targetHeight),
    };
  }

  /**
   * Helper to calculate pose similarity (for PoseMimicGame)
   */
  public calculatePoseSimilarity(landmarks: PoseLandmark[], targetGesture: GameGesture): number {
    if (!landmarks || landmarks.length < 17) return 0;
    const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
    const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
    const leftWrist = landmarks[POSE_LANDMARKS.LEFT_WRIST];
    const rightWrist = landmarks[POSE_LANDMARKS.RIGHT_WRIST];
    if (!leftShoulder || !rightShoulder || !leftWrist || !rightWrist) return 0;

    switch (targetGesture) {
      case 'left_arm_up':
        if (leftWrist.y < leftShoulder.y - 0.12 && rightWrist.y > rightShoulder.y) return 100;
        if (leftWrist.y < leftShoulder.y) return 70;
        return 20;

      case 'right_arm_up':
        if (rightWrist.y < rightShoulder.y - 0.12 && leftWrist.y > leftShoulder.y) return 100;
        if (rightWrist.y < rightShoulder.y) return 70;
        return 20;

      case 'both_arms_up':
        if (leftWrist.y < leftShoulder.y - 0.1 && rightWrist.y < rightShoulder.y - 0.1) return 100;
        if (leftWrist.y < leftShoulder.y || rightWrist.y < rightShoulder.y) return 50;
        return 10;

      case 'hands_spread':
        const span = Math.abs(rightWrist.x - leftWrist.x);
        if (span > 0.55 && Math.abs(leftWrist.y - leftShoulder.y) < 0.15) return 100;
        if (span > 0.4) return 60;
        return 15;

      case 'duck':
        if (leftShoulder.y > this.baselineShoulderY + 0.08) return 100;
        return 10;

      case 'tilt_left':
        if (landmarks[POSE_LANDMARKS.NOSE]?.x < leftShoulder.x - 0.05) return 100;
        return 20;

      case 'tilt_right':
        if (landmarks[POSE_LANDMARKS.NOSE]?.x > rightShoulder.x + 0.05) return 100;
        return 20;

      default:
        return 50;
    }
  }
}

export const poseDetector = PoseDetectorManager.getInstance();
