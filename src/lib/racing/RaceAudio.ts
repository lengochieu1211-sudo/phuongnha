/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { audio } from '../AudioEngine';

export class RaceAudioEngine {
  private ctx: AudioContext | null = null;
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;

  private nitroOsc: OscillatorNode | null = null;
  private nitroGain: GainNode | null = null;

  private driftGain: GainNode | null = null;
  private driftNoiseNode: AudioBufferSourceNode | null = null;

  private isMuted: boolean = false;
  private isEngineRunning: boolean = false;

  constructor() {
    // Lazy init on first user interaction
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public init() {
    this.initCtx();
  }

  public setMute(muted: boolean) {
    this.setMuted(muted);
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setValueAtTime(muted ? 0 : 0.15, this.ctx.currentTime);
    }
  }

  public playMenuClick() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch (e) {}
  }

  /**
   * Continuous dynamic engine RPM sound
   */
  public startEngine() {
    if (this.isEngineRunning) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      this.isEngineRunning = true;

      // Dual oscillator engine model (rumble + harmonics)
      this.engineOsc1 = this.ctx.createOscillator();
      this.engineOsc2 = this.ctx.createOscillator();
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineGain = this.ctx.createGain();

      this.engineOsc1.type = 'sawtooth';
      this.engineOsc2.type = 'triangle';

      this.engineOsc1.frequency.setValueAtTime(55, this.ctx.currentTime); // Base idle ~55Hz
      this.engineOsc2.frequency.setValueAtTime(110, this.ctx.currentTime);

      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(350, this.ctx.currentTime);

      this.engineGain.gain.setValueAtTime(this.isMuted ? 0 : 0.12, this.ctx.currentTime);

      this.engineOsc1.connect(this.engineFilter);
      this.engineOsc2.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc1.start();
      this.engineOsc2.start();
    } catch (e) {
      // Safe fail
    }
  }

  public updateEnginePitch(speedRatio: number, throttle: boolean, isNitro: boolean) {
    if (!this.ctx || !this.isEngineRunning || !this.engineOsc1 || !this.engineOsc2 || !this.engineFilter) return;

    const clampedRatio = Math.max(0, Math.min(1.4, speedRatio));
    // Base frequency ramps from 55Hz (idle) to 320Hz at top speed
    const baseFreq = 55 + clampedRatio * 220 + (throttle ? 25 : 0) + (isNitro ? 50 : 0);
    const harmonicFreq = baseFreq * 1.5;
    const filterFreq = 300 + clampedRatio * 1200 + (isNitro ? 800 : 0);

    const now = this.ctx.currentTime;
    this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.05);
    this.engineOsc2.frequency.setTargetAtTime(harmonicFreq, now, 0.05);
    this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.08);
  }

  public stopEngine() {
    if (!this.isEngineRunning) return;
    this.isEngineRunning = false;
    try {
      if (this.engineOsc1) {
        this.engineOsc1.stop();
        this.engineOsc1.disconnect();
        this.engineOsc1 = null;
      }
      if (this.engineOsc2) {
        this.engineOsc2.stop();
        this.engineOsc2.disconnect();
        this.engineOsc2 = null;
      }
      if (this.engineGain) {
        this.engineGain.disconnect();
        this.engineGain = null;
      }
    } catch (e) {}
  }

  /**
   * Rev engine once (in Garage or start line)
   */
  public playRevEngine() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, this.ctx.currentTime);

      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(60, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.35);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.9);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.9);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(now + 0.95);
    } catch (e) {}
  }

  /**
   * Drift tire screech sound
   */
  public setDriftSound(active: boolean, intensity: number = 0.5) {
    if (!this.ctx || this.isMuted) return;

    if (active) {
      if (!this.driftGain) {
        try {
          const osc = this.ctx.createOscillator();
          const filter = this.ctx.createBiquadFilter();
          this.driftGain = this.ctx.createGain();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(650, this.ctx.currentTime);
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(900, this.ctx.currentTime);
          filter.Q.setValueAtTime(3.0, this.ctx.currentTime);

          this.driftGain.gain.setValueAtTime(0.08 * intensity, this.ctx.currentTime);

          osc.connect(filter);
          filter.connect(this.driftGain);
          this.driftGain.connect(this.ctx.destination);
          osc.start();
          this.nitroOsc = osc; // reuse ref
        } catch (e) {}
      } else {
        this.driftGain.gain.setTargetAtTime(0.1 * intensity, this.ctx.currentTime, 0.05);
      }
    } else {
      if (this.driftGain) {
        this.driftGain.gain.setTargetAtTime(0.001, this.ctx.currentTime, 0.08);
      }
    }
  }

  /**
   * Nitro booster ignite roar
   */
  public playNitroIgnite() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      // Low boom
      const boom = this.ctx.createOscillator();
      const boomGain = this.ctx.createGain();
      boom.type = 'sine';
      boom.frequency.setValueAtTime(140, now);
      boom.frequency.exponentialRampToValueAtTime(40, now + 0.4);
      boomGain.gain.setValueAtTime(0.3, now);
      boomGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      boom.connect(boomGain);
      boomGain.connect(this.ctx.destination);
      boom.start();
      boom.stop(now + 0.45);

      // High jet rush
      const jet = this.ctx.createOscillator();
      const jetGain = this.ctx.createGain();
      jet.type = 'triangle';
      jet.frequency.setValueAtTime(350, now);
      jet.frequency.exponentialRampToValueAtTime(800, now + 0.3);
      jetGain.gain.setValueAtTime(0.18, now);
      jetGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      jet.connect(jetGain);
      jetGain.connect(this.ctx.destination);
      jet.start();
      jet.stop(now + 0.65);
    } catch (e) {}
  }

  /**
   * Checkpoint chime
   */
  public playCheckpoint() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;

    const freqs = [659.25, 880, 1318.5]; // E5, A5, E6
    freqs.forEach((f, i) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.35);
      }, i * 70);
    });
  }

  /**
   * Countdown tone (3, 2, 1, GO)
   */
  public playCountdownTone(isGo: boolean = false) {
    this.initCtx();
    if (this.isMuted) return;

    if (isGo) {
      audio.playFeedbackBeep('success');
    } else {
      audio.playFeedbackBeep('info');
    }
  }

  /**
   * Soft bounce / collision bump
   */
  public playSoftBump() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    } catch (e) {}
  }

  /**
   * Item box collected chime
   */
  public playItemCollected() {
    this.initCtx();
    if (this.isMuted) return;
    audio.playStarCollectSound();
  }

  /**
   * Final Lap Siren / Fanfare
   */
  public playFinalLapWarning() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;

    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((f, idx) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.4);
      }, idx * 100);
    });
  }
}

export const raceAudio = new RaceAudioEngine();
