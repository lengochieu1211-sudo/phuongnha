/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { GameGesture } from '../types';
import { poseDetector, PoseResult, WristPosition, PoseLandmark, TrackingMode, PoseEngineStatus } from '../utils/poseDetector';

export interface CameraPoseContextValue {
  // Camera & Stream State
  isStreaming: boolean;
  isCameraReady: boolean;
  cameraError: string | null;
  poseStatus: PoseEngineStatus;
  videoElement: HTMLVideoElement | null;
  canvasElement: HTMLCanvasElement | null;
  startCamera: () => Promise<boolean>;
  stopCamera: () => void;
  toggleCamera: () => Promise<boolean>;

  // Tracking Mode & Config
  trackingMode: TrackingMode;
  setTrackingMode: (mode: TrackingMode) => void;
  isSkeletonVisible: boolean;
  setIsSkeletonVisible: (visible: boolean) => void;
  isPiPVisible: boolean;
  setIsPiPVisible: (visible: boolean) => void;

  // Pose Data (Throttled for UI, ~10 FPS)
  landmarks: PoseLandmark[];
  leftWrist: WristPosition;
  rightWrist: WristPosition;
  gesture: GameGesture;
  rawGesture: GameGesture;
  bodyDetected: boolean;
  fullBodyDetected: boolean;
  poseConfidence: number;
  poseFps: number;
  trackingFeedback: 'ok' | 'too_near' | 'too_far' | 'no_body' | 'no_legs' | 'not_centered';
  steeringAngleDeg: number;
  steeringNormalized: number;

  // Real-time zero-re-render getter for 60 FPS gameplay loops
  getLatestPose: () => PoseResult;
  latestPoseRef: React.RefObject<PoseResult>;

  // Manual gesture trigger for testing / keyboard mode
  setSimulatedGesture: (gesture: GameGesture) => void;
}

const CameraPoseContext = createContext<CameraPoseContextValue | null>(null);

export function CameraPoseProvider({ children }: { children: ReactNode }) {
  const masterVideoRef = useRef<HTMLVideoElement | null>(null);
  const masterCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [isCameraReady, setIsCameraReady] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [poseStatus, setPoseStatus] = useState<PoseEngineStatus>('idle');

  const [trackingMode, setTrackingModeState] = useState<TrackingMode>('mediapipe');
  const [isSkeletonVisible, setIsSkeletonVisible] = useState<boolean>(true);
  const [isPiPVisible, setIsPiPVisible] = useState<boolean>(true);

  const [landmarks, setLandmarks] = useState<PoseLandmark[]>([]);
  const [leftWrist, setLeftWrist] = useState<WristPosition>({ x: 0.5, y: 0.5, screenX: 320, screenY: 240, visible: false, velocity: 0 });
  const [rightWrist, setRightWrist] = useState<WristPosition>({ x: 0.5, y: 0.5, screenX: 320, screenY: 240, visible: false, velocity: 0 });
  const [gesture, setGesture] = useState<GameGesture>('standing');
  const [rawGesture, setRawGesture] = useState<GameGesture>('standing');
  const [bodyDetected, setBodyDetected] = useState<boolean>(false);
  const [fullBodyDetected, setFullBodyDetected] = useState<boolean>(false);
  const [poseConfidence, setPoseConfidence] = useState<number>(0);
  const [poseFps, setPoseFps] = useState<number>(0);
  const [trackingFeedback, setTrackingFeedback] = useState<'ok' | 'too_near' | 'too_far' | 'no_body' | 'no_legs' | 'not_centered'>('no_body');
  const [steeringAngleDeg, setSteeringAngleDeg] = useState<number>(0);
  const [steeringNormalized, setSteeringNormalized] = useState<number>(0);

  // Set tracking mode on detector
  const setTrackingMode = useCallback((mode: TrackingMode) => {
    setTrackingModeState(mode);
    poseDetector.setMode(mode);
  }, []);

  // Start camera stream safely
  const startCamera = useCallback(async (): Promise<boolean> => {
    try {
      setCameraError(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Trình duyệt không hỗ trợ MediaDevices.');
      }

      // Reuse an already-live camera stream. Screen/calibration transitions should not
      // repeatedly release and reacquire the camera because that creates a visible freeze
      // and can make motion games briefly start without control on Android browsers.
      const existingStream = streamRef.current;
      const existingVideoTrack = existingStream?.getVideoTracks()[0];
      if (existingStream && existingVideoTrack?.readyState === 'live') {
        const video = masterVideoRef.current;
        const canvas = masterCanvasRef.current;
        if (video && canvas) {
          if (video.srcObject !== existingStream) video.srcObject = existingStream;
          if (video.paused) {
            try { await video.play(); } catch (e) { console.warn('Video resume error:', e); }
          }
          setIsStreaming(true);
          setIsCameraReady(true);
          poseDetector.start(video, canvas, trackingMode);
          return true;
        }
      }

      // Clean up a stale stream before requesting a new one.
      if (existingStream) {
        existingStream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
          frameRate: { ideal: 30, max: 60 },
        },
        audio: false,
      });

      streamRef.current = stream;

      const video = masterVideoRef.current;
      const canvas = masterCanvasRef.current;

      if (video && canvas) {
        video.srcObject = stream;
        video.playsInline = true;
        video.muted = true;

        await new Promise<void>((resolve) => {
          if (video.readyState >= 2) {
            resolve();
          } else {
            video.onloadedmetadata = () => resolve();
          }
        });

        try {
          await video.play();
        } catch (e) {
          console.warn('Video play error:', e);
        }

        setIsStreaming(true);
        setIsCameraReady(true);
        setPoseStatus('loading');

        // Start pose detector on master video & canvas
        poseDetector.start(video, canvas, trackingMode);

        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Camera access error:', err);
      let errMsg = err.message || 'Không thể truy cập Camera';
      if (
        err.name === 'NotAllowedError' ||
        err.name === 'PermissionDeniedError' ||
        err.message?.includes('Permission denied') ||
        err.message?.includes('permission')
      ) {
        errMsg = 'Quyền truy cập Camera bị từ chối (Permission denied). Vui lòng nhấn nút cấp quyền lại hoặc chuyển sang chế độ Bàn Phím/Cảm ứng!';
      }
      setCameraError(errMsg);
      setIsStreaming(false);
      setIsCameraReady(false);
      setPoseStatus('error');
      return false;
    }
  }, [trackingMode]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    poseDetector.stop();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (masterVideoRef.current) {
      try {
        masterVideoRef.current.pause();
      } catch (e) {}
      masterVideoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setIsCameraReady(false);
    setPoseStatus('idle');
    setBodyDetected(false);
    setFullBodyDetected(false);
    setLeftWrist({ x: 0.5, y: 0.5, screenX: 320, screenY: 240, visible: false, velocity: 0 });
    setRightWrist({ x: 0.5, y: 0.5, screenX: 320, screenY: 240, visible: false, velocity: 0 });
    setGesture('standing');
  }, []);

  const toggleCamera = useCallback(async (): Promise<boolean> => {
    if (isStreaming) {
      stopCamera();
      return false;
    } else {
      return await startCamera();
    }
  }, [isStreaming, startCamera, stopCamera]);

  // Real-time zero-re-render ref for 60 FPS gameplay loops
  const latestPoseRef = useRef<PoseResult>({
    status: 'idle',
    landmarks: [],
    leftWrist: { x: 0.5, y: 0.5, screenX: 320, screenY: 240, visible: false, velocity: 0 },
    rightWrist: { x: 0.5, y: 0.5, screenX: 320, screenY: 240, visible: false, velocity: 0 },
    gesture: 'standing',
    rawGesture: 'standing',
    bodyDetected: false,
    fullBodyDetected: false,
    confidence: 0,
    fps: 0,
    trackingFeedback: 'no_body',
    steeringAngleDeg: 0,
    steeringNormalized: 0,
  });

  const getLatestPose = useCallback(() => {
    return latestPoseRef.current;
  }, []);

  // Subscribe to pose detector results with throttled React state updates (approx 10 FPS for UI components)
  useEffect(() => {
    let lastStateUpdate = 0;

    const unsubscribe = poseDetector.addListener((result: PoseResult) => {
      latestPoseRef.current = result;

      const now = performance.now();
      // Throttle React state updates to ~10 FPS (every 100ms) unless gesture or status changes
      if (
        now - lastStateUpdate > 100 ||
        result.gesture !== gesture ||
        result.status !== poseStatus
      ) {
        lastStateUpdate = now;
        setPoseStatus(result.status);
        setLandmarks(result.landmarks || []);
        setLeftWrist(result.leftWrist);
        setRightWrist(result.rightWrist);
        setGesture(result.gesture);
        setRawGesture(result.rawGesture);
        setBodyDetected(result.bodyDetected);
        setFullBodyDetected(result.fullBodyDetected);
        setPoseConfidence(result.confidence);
        setPoseFps(result.fps);
        setTrackingFeedback(result.trackingFeedback);
        setSteeringAngleDeg(result.steeringAngleDeg);
        setSteeringNormalized(result.steeringNormalized);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [gesture, poseStatus]);

  // Update detector skeleton visibility
  useEffect(() => {
    poseDetector.setSkeletonVisible(isSkeletonVisible);
  }, [isSkeletonVisible]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const setSimulatedGesture = useCallback((g: GameGesture) => {
    poseDetector.setSimulatedGesture(g);
  }, []);

  return (
    <CameraPoseContext.Provider
      value={{
        isStreaming,
        isCameraReady,
        cameraError,
        poseStatus,
        videoElement: masterVideoRef.current,
        canvasElement: masterCanvasRef.current,
        startCamera,
        stopCamera,
        toggleCamera,
        trackingMode,
        setTrackingMode,
        isSkeletonVisible,
        setIsSkeletonVisible,
        isPiPVisible,
        setIsPiPVisible,
        landmarks,
        leftWrist,
        rightWrist,
        gesture,
        rawGesture,
        bodyDetected,
        fullBodyDetected,
        poseConfidence,
        poseFps,
        trackingFeedback,
        steeringAngleDeg,
        steeringNormalized,
        getLatestPose,
        latestPoseRef,
        setSimulatedGesture,
      }}
    >
      {/* Permanent, master video and canvas elements mounted in DOM */}
      <div
        id="master-camera-pose-container"
        className="fixed pointer-events-none opacity-0 select-none z-[-999]"
        style={{ left: '-9999px', top: '-9999px', width: '640px', height: '480px' }}
        aria-hidden="true"
      >
        <video
          ref={masterVideoRef}
          width={640}
          height={480}
          playsInline
          muted
          autoPlay
        />
        <canvas
          ref={masterCanvasRef}
          width={640}
          height={480}
        />
      </div>

      {children}
    </CameraPoseContext.Provider>
  );
}

export function useCameraPose(): CameraPoseContextValue {
  const context = useContext(CameraPoseContext);
  if (!context) {
    throw new Error('useCameraPose must be used within a CameraPoseProvider');
  }
  return context;
}
