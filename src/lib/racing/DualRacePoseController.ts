/**
 * One-camera / two-player pose controller for local split-screen racing.
 *
 * Why two cropped Pose instances instead of pretending the legacy MediaPipe Pose API
 * supports multi-person detection: the app currently uses @mediapipe/pose (single pose).
 * P1 is required to stand on the LEFT of the mirrored camera preview and P2 on the RIGHT.
 * We crop the raw camera into right/left sensor halves respectively, which gives stable
 * identities without swapping players when both are visible.
 */
import { GameGesture } from '../../types';
import { PoseLandmark, POSE_LANDMARKS, WristPosition } from '../../utils/poseDetector';
import { detectDeviceClass } from '../../utils/graphicsQuality';

export interface DualRacePosePlayer {
  id: 1 | 2;
  bodyDetected: boolean;
  confidence: number;
  landmarks: PoseLandmark[];
  leftWrist: WristPosition;
  rightWrist: WristPosition;
  steeringAngleDeg: number;
  steeringNormalized: number;
  gesture: GameGesture;
}

export interface DualRacePoseFrame {
  timestamp: number;
  fps: number;
  players: [DualRacePosePlayer, DualRacePosePlayer];
}

type Listener = (frame: DualRacePoseFrame) => void;

type PlayerSmoothingState = {
  landmarks: PoseLandmark[];
  baselineShoulderY: number;
  baselineReady: boolean;
  lastGesture: GameGesture;
  gestureCandidate: GameGesture;
  hold: number;
};

const emptyWrist = (): WristPosition => ({
  x: 0.5, y: 0.5, screenX: 0, screenY: 0, visible: false, velocity: 0,
});

function emptyPlayer(id: 1 | 2): DualRacePosePlayer {
  return {
    id,
    bodyDetected: false,
    confidence: 0,
    landmarks: [],
    leftWrist: emptyWrist(),
    rightWrist: emptyWrist(),
    steeringAngleDeg: 0,
    steeringNormalized: 0,
    gesture: 'standing',
  };
}

class DualRacePoseController {
  private listeners = new Set<Listener>();
  private running = false;
  private video: HTMLVideoElement | null = null;
  private poseP1: any = null;
  private poseP2: any = null;
  private canvasP1 = document.createElement('canvas');
  private canvasP2 = document.createElement('canvas');
  private raf: number | null = null;
  private processing = false;
  private lastInference = 0;
  private latestRaw: [any[] | null, any[] | null] = [null, null];
  private fps = 0;
  private fpsFrames = 0;
  private fpsStarted = performance.now();
  private lastPlayers: [DualRacePosePlayer, DualRacePosePlayer] = [emptyPlayer(1), emptyPlayer(2)];
  private lastSeenAt: [number, number] = [0, 0];
  private fallbackKeys = new Set<string>();
  private keyboardListenersAttached = false;
  private state: [PlayerSmoothingState, PlayerSmoothingState] = [
    { landmarks: [], baselineShoulderY: 0.44, baselineReady: false, lastGesture: 'standing', gestureCandidate: 'standing', hold: 0 },
    { landmarks: [], baselineShoulderY: 0.44, baselineReady: false, lastGesture: 'standing', gestureCandidate: 'standing', hold: 0 },
  ];

  private handleKeyDown = (event: KeyboardEvent) => {
    this.fallbackKeys.add(event.code);
  };

  private handleKeyUp = (event: KeyboardEvent) => {
    this.fallbackKeys.delete(event.code);
  };

  private attachKeyboardFallback() {
    if (this.keyboardListenersAttached || typeof window === 'undefined') return;
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.keyboardListenersAttached = true;
  }

  private detachKeyboardFallback() {
    if (!this.keyboardListenersAttached || typeof window === 'undefined') return;
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.keyboardListenersAttached = false;
    this.fallbackKeys.clear();
  }

  private fallbackPlayer(id: 1 | 2): DualRacePosePlayer {
    // Duo Setup still reports real camera detection. During an active race, a
    // camera/CDN/WASM failure must never hard-brake the local racer indefinitely.
    const inRace = typeof document !== 'undefined' && !!document.getElementById('in-race-viewport');
    if (!inRace) return emptyPlayer(id);

    const keys = this.fallbackKeys;
    const left = id === 1 ? keys.has('KeyA') : keys.has('ArrowLeft');
    const right = id === 1 ? keys.has('KeyD') : keys.has('ArrowRight');
    const brake = id === 1 ? keys.has('KeyS') : keys.has('ArrowDown');
    const nitro = id === 1
      ? (keys.has('ShiftLeft') || keys.has('Space'))
      : (keys.has('ShiftRight') || keys.has('Enter') || keys.has('Numpad0'));
    const steer = Math.max(-1, Math.min(1, (left ? -1 : 0) + (right ? 1 : 0)));

    return {
      ...emptyPlayer(id),
      bodyDetected: true,
      confidence: 0,
      steeringAngleDeg: steer * 35,
      steeringNormalized: steer,
      gesture: nitro ? 'both_arms_up' : brake ? 'duck' : 'standing',
    };
  }

  private emitFallbackHeartbeat() {
    this.emit([this.fallbackPlayer(1), this.fallbackPlayer(2)]);
  }

  addListener(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async start(video: HTMLVideoElement): Promise<boolean> {
    this.video = video;
    // Reuse the two light Pose instances between Duo Setup -> Track Select -> Race.
    // Recreating WASM/model state during 3-2-1 caused a visible hitch on TV boxes.
    if (this.poseP1 && this.poseP2) {
      this.attachKeyboardFallback();
      this.running = true;
      this.lastInference = 0;
      if (this.raf === null) this.loop();
      return true;
    }

    this.stop();
    this.video = video;
    this.running = true;
    this.attachKeyboardFallback();
    try {
      await this.ensurePoseScript();
      if (!this.running || !(window as any).Pose) return false;
      this.poseP1 = this.createPose(0);
      this.poseP2 = this.createPose(1);
      this.loop();
      return true;
    } catch (err) {
      console.warn('Dual race pose unavailable; keyboard fallback remains active:', err);
      this.running = true;
      this.poseP1 = null;
      this.poseP2 = null;
      this.loop();
      return true;
    }
  }

  pause() {
    this.running = false;
    if (this.raf !== null) cancelAnimationFrame(this.raf);
    this.raf = null;
    // Keep model/WASM allocations warm; no camera frames are submitted while paused.
  }

  stop() {
    this.running = false;
    this.processing = false;
    if (this.raf !== null) cancelAnimationFrame(this.raf);
    this.raf = null;
    const p1 = this.poseP1;
    const p2 = this.poseP2;
    this.poseP1 = null;
    this.poseP2 = null;
    this.video = null;
    // close() releases WASM/model memory; ignore completion because the UI must remain responsive.
    try { p1?.close?.(); } catch {}
    try { p2?.close?.(); } catch {}
    this.latestRaw = [null, null];
    this.lastPlayers = [emptyPlayer(1), emptyPlayer(2)];
    this.detachKeyboardFallback();
    this.lastSeenAt = [0, 0];
    this.state.forEach((s) => {
      s.landmarks = [];
      s.baselineReady = false;
      s.lastGesture = 'standing';
      s.gestureCandidate = 'standing';
      s.hold = 0;
    });
  }

  private createPose(index: 0 | 1) {
    const pose = new (window as any).Pose({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });
    pose.setOptions({
      // Dual mode intentionally uses the lightest model. Rendering remains 30–60 FPS while
      // pose inference runs independently at a device-aware 8–18 FPS.
      modelComplexity: 0,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.42,
      minTrackingConfidence: 0.42,
    });
    pose.onResults((results: any) => {
      this.latestRaw[index] = results?.poseLandmarks || null;
    });
    return pose;
  }

  private async ensurePoseScript() {
    if ((window as any).Pose) return;
    const src = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js';
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      const started = performance.now();
      while (!(window as any).Pose && performance.now() - started < 12000) {
        await new Promise((r) => setTimeout(r, 80));
      }
      if (!(window as any).Pose) throw new Error('MediaPipe Pose script timeout');
      return;
    }
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.crossOrigin = 'anonymous';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Không tải được MediaPipe Pose'));
      document.head.appendChild(script);
    });
  }

  private loop = () => {
    if (!this.running) return;
    const device = detectDeviceClass();
    const targetFps = device === 'desktop' ? 18 : device === 'tv' ? 12 : device === 'tablet' ? 12 : 9;
    const interval = 1000 / targetFps;
    const now = performance.now();
    if (!this.processing && now - this.lastInference >= interval) {
      this.lastInference = now;
      if (!this.poseP1 || !this.poseP2) this.emitFallbackHeartbeat();
      else void this.processFrame();
    }
    this.raf = requestAnimationFrame(this.loop);
  };

  private async processFrame() {
    const video = this.video;
    if (!this.running) return;
    if (!video || video.readyState < 2 || video.videoWidth <= 0 || video.videoHeight <= 0 || !this.poseP1 || !this.poseP2) {
      this.emitFallbackHeartbeat();
      return;
    }
    this.processing = true;
    try {
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      const cropW = Math.floor(vw / 2);
      const device = detectDeviceClass();
      const targetH = device === 'desktop' ? 480 : device === 'tv' ? 360 : 320;
      const targetW = Math.max(160, Math.round(targetH * (cropW / vh)));
      for (const c of [this.canvasP1, this.canvasP2]) {
        if (c.width !== targetW) c.width = targetW;
        if (c.height !== targetH) c.height = targetH;
      }
      const c1 = this.canvasP1.getContext('2d', { willReadFrequently: false });
      const c2 = this.canvasP2.getContext('2d', { willReadFrequently: false });
      if (!c1 || !c2) return;

      // Mirrored preview: screen-left P1 is sensor-right half; screen-right P2 is sensor-left.
      c1.drawImage(video, vw - cropW, 0, cropW, vh, 0, 0, targetW, targetH);
      c2.drawImage(video, 0, 0, cropW, vh, 0, 0, targetW, targetH);
      this.latestRaw = [null, null];
      await Promise.all([
        this.poseP1.send({ image: this.canvasP1 }),
        this.poseP2.send({ image: this.canvasP2 }),
      ]);
      if (!this.running) return;

      const p1 = this.toPlayer(1, this.latestRaw[0], vw - cropW, cropW, vw, vh, 0);
      const p2 = this.toPlayer(2, this.latestRaw[1], 0, cropW, vw, vh, 1);
      this.fpsFrames++;
      const t = performance.now();
      if (t - this.fpsStarted >= 1000) {
        this.fps = Math.round((this.fpsFrames * 1000) / (t - this.fpsStarted));
        this.fpsFrames = 0;
        this.fpsStarted = t;
      }
      this.emit([p1, p2]);
    } catch (err) {
      console.warn('Dual pose frame skipped:', err);
    } finally {
      this.processing = false;
    }
  }

  private toPlayer(
    id: 1 | 2,
    raw: any[] | null,
    cropX: number,
    cropW: number,
    sourceW: number,
    sourceH: number,
    stateIndex: 0 | 1,
  ): DualRacePosePlayer {
    if (!raw?.length) {
      const last = this.lastPlayers[stateIndex];
      // Keep the same ID/pose briefly through a hand crossing or one missed detector frame.
      // After the grace window the player is marked missing instead of being replaced by the other crop.
      if (last.bodyDetected && performance.now() - this.lastSeenAt[stateIndex] < 550) {
        return { ...last, steeringNormalized: last.steeringNormalized * 0.92, steeringAngleDeg: last.steeringAngleDeg * 0.92 };
      }
      return this.fallbackPlayer(id);
    }
    const mapped: PoseLandmark[] = raw.map((lm: any) => {
      const globalRawX = (cropX + lm.x * cropW) / sourceW;
      const mirrorX = Math.max(0, Math.min(1, 1 - globalRawX));
      const y = Math.max(0, Math.min(1, lm.y));
      return {
        x: mirrorX,
        y,
        z: lm.z,
        visibility: lm.visibility ?? 0.8,
        screenX: mirrorX * sourceW,
        screenY: y * sourceH,
      };
    });
    const state = this.state[stateIndex];
    if (state.landmarks.length === mapped.length) {
      const alpha = 0.62;
      state.landmarks = mapped.map((lm, i) => {
        const prev = state.landmarks[i];
        return { ...lm, x: prev.x + (lm.x - prev.x) * alpha, y: prev.y + (lm.y - prev.y) * alpha };
      });
    } else {
      state.landmarks = mapped;
    }
    const lms = state.landmarks;
    const ls = lms[POSE_LANDMARKS.LEFT_SHOULDER];
    const rs = lms[POSE_LANDMARKS.RIGHT_SHOULDER];
    const lw = lms[POSE_LANDMARKS.LEFT_WRIST];
    const rw = lms[POSE_LANDMARKS.RIGHT_WRIST];
    const lh = lms[POSE_LANDMARKS.LEFT_HIP];
    const rh = lms[POSE_LANDMARKS.RIGHT_HIP];
    const shouldersVisible = (ls?.visibility || 0) > 0.38 && (rs?.visibility || 0) > 0.38;
    const leftVisible = (lw?.visibility || 0) > 0.36;
    const rightVisible = (rw?.visibility || 0) > 0.36;
    const leftWrist: WristPosition = lw ? { x: lw.x, y: lw.y, screenX: lw.x * sourceW, screenY: lw.y * sourceH, visible: leftVisible, visibility: lw.visibility, velocity: 0 } : emptyWrist();
    const rightWrist: WristPosition = rw ? { x: rw.x, y: rw.y, screenX: rw.x * sourceW, screenY: rw.y * sourceH, visible: rightVisible, visibility: rw.visibility, velocity: 0 } : emptyWrist();

    let steeringAngleDeg = 0;
    let steeringNormalized = 0;
    if (leftVisible && rightVisible) {
      const dy = rightWrist.y - leftWrist.y;
      const dx = Math.max(0.04, Math.abs(rightWrist.x - leftWrist.x));
      steeringAngleDeg = -(Math.atan2(dy, dx) * 180) / Math.PI;
      steeringNormalized = Math.max(-1, Math.min(1, steeringAngleDeg / 42));
    }

    let rawGesture: GameGesture = 'standing';
    if (shouldersVisible) {
      const avgShoulderY = (ls.y + rs.y) / 2;
      if (!state.baselineReady) {
        state.baselineShoulderY = avgShoulderY;
        state.baselineReady = true;
      } else if (state.lastGesture === 'standing') {
        state.baselineShoulderY += (avgShoulderY - state.baselineShoulderY) * 0.018;
      }
      const bothUp = leftVisible && rightVisible && lw.y < ls.y - 0.08 && rw.y < rs.y - 0.08;
      const spread = leftVisible && rightVisible && Math.abs(rw.x - lw.x) > 0.24 && Math.abs(lw.y - ls.y) < 0.18 && Math.abs(rw.y - rs.y) < 0.18;
      const clap = leftVisible && rightVisible && Math.hypot(rw.x - lw.x, rw.y - lw.y) < 0.07;
      if (bothUp) rawGesture = 'both_arms_up';
      else if (spread) rawGesture = 'hands_spread';
      else if (clap) rawGesture = 'clap';
      else if (avgShoulderY > state.baselineShoulderY + 0.095) rawGesture = 'duck';
      else if (lh && rh) {
        const lean = ((ls.x + rs.x) / 2) - ((lh.x + rh.x) / 2);
        if (lean < -0.055) rawGesture = 'tilt_left';
        else if (lean > 0.055) rawGesture = 'tilt_right';
      }
    }

    if (rawGesture === state.gestureCandidate) state.hold += 1;
    else { state.gestureCandidate = rawGesture; state.hold = 1; }
    if (state.hold >= 2) state.lastGesture = rawGesture;

    const player: DualRacePosePlayer = {
      id,
      bodyDetected: shouldersVisible && leftVisible && rightVisible,
      confidence: shouldersVisible ? ((ls.visibility || 0) + (rs.visibility || 0)) / 2 : 0,
      landmarks: lms,
      leftWrist,
      rightWrist,
      steeringAngleDeg,
      steeringNormalized,
      gesture: state.lastGesture,
    };
    if (player.bodyDetected) {
      this.lastPlayers[stateIndex] = player;
      this.lastSeenAt[stateIndex] = performance.now();
    }
    return player;
  }

  private emit(players: [DualRacePosePlayer, DualRacePosePlayer]) {
    const frame: DualRacePoseFrame = { timestamp: performance.now(), fps: this.fps, players };
    for (const listener of this.listeners) listener(frame);
  }
}

export const dualRacePoseController = new DualRacePoseController();
