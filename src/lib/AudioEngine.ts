/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private musicInterval: any = null;
  private currentSource: OscillatorNode | null = null;
  private currentGain: GainNode | null = null;
  private isMutedSound: boolean = false;
  private isMutedMusic: boolean = false;
  private isDucked: boolean = false;
  private musicGainVal: number = 0.04;
  private sfxGainVal: number = 1.0;
  private melodyIndex = 0;
  private pendingTimers = new Set<ReturnType<typeof setTimeout>>();

  constructor() {
    // Audio Context is initialized lazily upon first user interaction
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuteSound(muted: boolean) {
    this.isMutedSound = muted;
    this.initCtx();
  }

  setMuteMusic(muted: boolean) {
    this.isMutedMusic = muted;
    this.initCtx();
    if (muted) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
  }

  /**
   * Duck background music when Voice Guide is speaking
   */
  duckMusic(duck: boolean) {
    this.isDucked = duck;
  }

  getMutedStates() {
    return {
      sound: this.isMutedSound,
      music: this.isMutedMusic,
    };
  }

  private schedule(fn: () => void, delayMs: number) {
    const id = setTimeout(() => {
      this.pendingTimers.delete(id);
      fn();
    }, delayMs);
    this.pendingTimers.add(id);
    return id;
  }

  private clearScheduledSounds() {
    this.pendingTimers.forEach((id) => clearTimeout(id));
    this.pendingTimers.clear();
  }

  // Play a simple procedural tone with full control
  playTone(freq: number, type: OscillatorType, duration: number, gainStart: number, sweepFreq?: number) {
    if (this.isMutedSound) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      if (sweepFreq) {
        osc.frequency.exponentialRampToValueAtTime(sweepFreq, this.ctx.currentTime + duration);
      }

      const finalGain = gainStart * this.sfxGainVal;
      gainNode.gain.setValueAtTime(finalGain, this.ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Procedural sound fail', e);
    }
  }

  // Sound Effects

  playJump() {
    // Quick rising frequency sweep
    this.playTone(250, 'triangle', 0.2, 0.3, 600);
  }

  playPop() {
    // Fun pop sound effect
    this.playTone(550, 'sine', 0.08, 0.25, 900);
  }

  playMenuClick() {
    this.playTone(600, 'sine', 0.06, 0.15, 800);
  }

  playCollect() {
    // Sweet high pitch ring (arpeggio-like)
    this.playTone(880, 'sine', 0.12, 0.25, 1200);
    this.schedule(() => {
      this.playTone(1320, 'sine', 0.15, 0.2, 1760);
    }, 60);
  }

  playDiamond() {
    this.playTone(1046, 'sine', 0.08, 0.3, 2093);
    this.schedule(() => {
      this.playTone(1568, 'sine', 0.1, 0.25, 3136);
    }, 50);
  }

  playDuck() {
    // Slide down sound
    this.playTone(400, 'triangle', 0.25, 0.2, 180);
  }

  playSuccess() {
    // Beautiful major chord arpeggio
    const chord = [261.63, 329.63, 392.00, 523.25]; // C major
    chord.forEach((freq, idx) => {
      this.schedule(() => {
        this.playTone(freq, 'sine', 0.25, 0.2, freq * 1.5);
      }, idx * 100);
    });
  }

  playCombo() {
    this.playTone(523.25, 'sine', 0.15, 0.25, 659.25);
    this.schedule(() => {
      this.playTone(783.99, 'sine', 0.2, 0.3, 1046.5);
    }, 80);
  }

  playFail() {
    // Gentle sad slide down
    this.playTone(220, 'sawtooth', 0.4, 0.15, 110);
  }

  playPetCareAction() {
    // Soft bubbling sound
    this.playTone(600, 'sine', 0.1, 0.2, 800);
    this.schedule(() => {
      this.playTone(700, 'sine', 0.1, 0.15, 900);
    }, 40);
  }

  playPowerup() {
    this.playTone(440, 'triangle', 0.3, 0.2, 880);
    this.schedule(() => {
      this.playTone(660, 'sine', 0.4, 0.25, 1320);
    }, 100);
  }

  playGameStart() {
    this.playRoundStartJingle();
  }

  /**
   * Round Start Jingle - A cheerful, ascending 4-note celebratory chime
   */
  playRoundStartJingle() {
    if (this.isMutedSound) return;
    const notes = [
      { freq: 523.25, type: 'triangle' as OscillatorType, duration: 0.15, gain: 0.25, sweep: 659.25 },
      { freq: 659.25, type: 'triangle' as OscillatorType, duration: 0.15, gain: 0.25, sweep: 783.99 },
      { freq: 783.99, type: 'sine' as OscillatorType, duration: 0.2, gain: 0.3, sweep: 1046.5 },
      { freq: 1046.5, type: 'sine' as OscillatorType, duration: 0.35, gain: 0.35, sweep: 1318.5 },
    ];
    notes.forEach((note, idx) => {
      this.schedule(() => {
        this.playTone(note.freq, note.type, note.duration, note.gain, note.sweep);
      }, idx * 90);
    });
  }

  /**
   * Star Collect Sound - High-pitched sparkling chime for collecting stars
   */
  playStarCollectSound() {
    if (this.isMutedSound) return;
    this.playTone(1046.5, 'sine', 0.1, 0.3, 1318.5);
    this.schedule(() => {
      this.playTone(1318.5, 'sine', 0.12, 0.35, 1567.98);
    }, 50);
    this.schedule(() => {
      this.playTone(1567.98, 'sine', 0.18, 0.3, 2093.0);
    }, 100);
  }

  /**
   * Race Start Jingle - Countdown build-up (3-2-1) followed by energetic GO flourish
   */
  playRaceStartJingle() {
    if (this.isMutedSound) return;
    // 3 - 2 - 1 countdown beeps
    const countBeeps = [440, 440, 440];
    countBeeps.forEach((freq, idx) => {
      this.schedule(() => {
        this.playTone(freq, 'triangle', 0.12, 0.25, freq * 1.05);
      }, idx * 250);
    });
    // GO flourish!
    this.schedule(() => {
      const goNotes = [523.25, 659.25, 783.99, 1046.5];
      goNotes.forEach((f, i) => {
        this.schedule(() => {
          this.playTone(f, 'sawtooth', 0.2, 0.35, f * 1.3);
        }, i * 40);
      });
    }, 750);
  }

  /**
   * Race Win Jingle - Triumphant brassy victory fanfare when winning a race
   */
  playRaceWinJingle() {
    if (this.isMutedSound) return;
    const fanfare = [
      { freq: 523.25, delay: 0, duration: 0.18, type: 'sawtooth' as OscillatorType, sweep: 659.25 },
      { freq: 659.25, delay: 120, duration: 0.18, type: 'sawtooth' as OscillatorType, sweep: 783.99 },
      { freq: 783.99, delay: 240, duration: 0.2, type: 'sawtooth' as OscillatorType, sweep: 1046.5 },
      { freq: 1046.5, delay: 380, duration: 0.45, type: 'sine' as OscillatorType, sweep: 1318.5 },
      { freq: 1318.5, delay: 500, duration: 0.6, type: 'sine' as OscillatorType, sweep: 1567.98 },
    ];
    fanfare.forEach((n) => {
      this.schedule(() => {
        this.playTone(n.freq, n.type, n.duration, 0.35, n.sweep);
      }, n.delay);
    });
  }

  /**
   * Feedback Beep - Responsive feedback for UI & gesture events
   */
  playFeedbackBeep(type: 'success' | 'warning' | 'info' = 'info') {
    if (this.isMutedSound) return;
    if (type === 'success') {
      this.playTone(880, 'sine', 0.08, 0.25, 1174.66);
      this.schedule(() => {
        this.playTone(1318.5, 'sine', 0.12, 0.3, 1760);
      }, 60);
    } else if (type === 'warning') {
      this.playTone(350, 'sawtooth', 0.12, 0.2, 280);
      this.schedule(() => {
        this.playTone(280, 'sawtooth', 0.15, 0.25, 220);
      }, 70);
    } else {
      // info
      this.playTone(880, 'sine', 0.06, 0.2, 1046.5);
    }
  }

  playVictory() {
    const victoryChord = [523.25, 659.25, 783.99, 1046.5];
    victoryChord.forEach((freq, idx) => {
      this.schedule(() => {
        this.playTone(freq, 'sine', 0.3, 0.3, freq * 1.2);
      }, idx * 120);
    });
  }

  // Fruit Slash SFX
  playSlash() {
    // Swoosh sound
    this.playTone(800, 'sawtooth', 0.1, 0.25, 200);
  }

  playFruitJuice() {
    // Juicy splash
    this.playTone(600, 'sine', 0.12, 0.3, 900);
    this.schedule(() => {
      this.playTone(400, 'triangle', 0.15, 0.2, 700);
    }, 40);
  }

  playInkSplat() {
    // Gloomy cartoon splat
    this.playTone(250, 'square', 0.3, 0.2, 100);
  }

  playRainbowSlash() {
    // Chime glissando
    const freqs = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    freqs.forEach((f, i) => {
      this.schedule(() => {
        this.playTone(f, 'sine', 0.2, 0.25, f * 1.2);
      }, i * 40);
    });
  }

  // Chicken Blaster SFX
  playLockBeep() {
    // Quick soft target beep
    this.playTone(800, 'sine', 0.05, 0.15);
  }

  playLockAcquired() {
    // Lock-on acquired chime
    this.playTone(1050, 'sine', 0.08, 0.25, 1400);
  }

  playBubbleShoot() {
    // Pop/Pew bubble
    this.playTone(480, 'sine', 0.12, 0.25, 960);
  }

  playBubbleCapture() {
    // Magic capture chime
    this.playTone(700, 'triangle', 0.18, 0.25, 1100);
    this.schedule(() => {
      this.playTone(1050, 'sine', 0.22, 0.3, 1400);
    }, 60);
  }

  playChickenCluck() {
    // Gentle cute cluck
    this.playTone(380, 'sine', 0.08, 0.2, 450);
    this.schedule(() => {
      this.playTone(320, 'sine', 0.08, 0.2, 400);
    }, 70);
  }

  playEggSplat() {
    // Soft egg splat
    this.playTone(300, 'triangle', 0.15, 0.2, 150);
  }

  // Sweet Zombie SFX
  playMagicLight() {
    // Sparkling bell
    this.playTone(1200, 'sine', 0.2, 0.25, 1800);
  }

  playMonsterCheer() {
    // Happy wake up chime
    this.playTone(440, 'triangle', 0.12, 0.2, 660);
    this.schedule(() => {
      this.playTone(660, 'triangle', 0.15, 0.25, 880);
    }, 80);
    this.schedule(() => {
      this.playTone(880, 'sine', 0.2, 0.3, 1320);
    }, 160);
  }

  playShield() {
    // Resonant hum
    this.playTone(350, 'sine', 0.4, 0.3, 500);
  }

  playSlowMotion() {
    // Time slowdown warble
    this.playTone(600, 'sine', 0.5, 0.2, 200);
  }

  // Ludo / Magic Horse Race Board Game SFX
  playDiceRoll() {
    if (this.isMutedSound) return;
    // Rhythmic rolling clatter
    const times = [0, 50, 110, 180, 260, 360, 480];
    times.forEach((t, i) => {
      this.schedule(() => {
        const f = 400 + Math.random() * 250;
        this.playTone(f, 'triangle', 0.04, 0.15 + (i / times.length) * 0.15);
      }, t);
    });
  }

  playPieceHop() {
    // Cute bounce boing sound
    this.playTone(480, 'sine', 0.08, 0.2, 680);
  }

  playPieceSpawn() {
    // Sparkling emergence chime
    this.playTone(523.25, 'triangle', 0.1, 0.2, 784);
    this.schedule(() => {
      this.playTone(1046.5, 'sine', 0.15, 0.25, 1318.5);
    }, 80);
  }

  playPieceCapture() {
    // Fun pop and bounce
    this.playTone(280, 'triangle', 0.12, 0.3, 140);
    this.schedule(() => {
      this.playTone(650, 'sine', 0.15, 0.25, 900);
    }, 100);
  }

  playHomeCheer() {
    // Victory fanfare for arriving at home
    this.playTone(523.25, 'triangle', 0.12, 0.25);
    this.schedule(() => this.playTone(659.25, 'triangle', 0.12, 0.25), 100);
    this.schedule(() => this.playTone(783.99, 'triangle', 0.15, 0.3), 200);
    this.schedule(() => this.playTone(1046.5, 'sine', 0.3, 0.35), 320);
  }

  playMagicTileTrigger() {
    // Rainbow / star sparkle
    this.playTone(880, 'sine', 0.1, 0.25, 1200);
    this.schedule(() => {
      this.playTone(1320, 'sine', 0.15, 0.3, 1760);
    }, 80);
  }

  playUndo() {
    this.playTone(440, 'sine', 0.1, 0.2, 330);
  }

  // Procedural background music (gentle pentatonic loops)
  startMusic() {
    if (this.isMutedMusic) return;
    this.initCtx();
    if (this.musicInterval) return;

    // Pentatonic scale (C4, D4, E4, G4, A4, C5, D5, E5)
    const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
    const sequence = [
      0, 2, 4, 3, 5, 4, 2, 3,
      1, 3, 5, 4, 6, 5, 3, 4,
      0, 4, 2, 5, 3, 6, 4, 7,
      5, 3, 4, 2, 3, 1, 2, 0
    ];

    let step = 0;
    this.musicInterval = setInterval(() => {
      if (this.isMutedMusic) return;
      if (!this.ctx) return;

      try {
        const freqIdx = sequence[step % sequence.length];
        const freq = scale[freqIdx];

        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        const currentMusicGain = this.isDucked ? 0.015 : this.musicGainVal;
        gainNode.gain.setValueAtTime(currentMusicGain, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.7);

        step++;
      } catch (e) {
        // Safe fail
      }
    }, 450); // Play a note every 450ms (lively but gentle tempo)
  }

  stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  // Immediate lifecycle stop used when leaving a game/screen.
  // Suspending the shared context also silences any short procedural SFX whose
  // setTimeout callbacks were already queued; the next user interaction resumes it.
  stopAllImmediate() {
    this.stopMusic();
    this.clearScheduledSounds();
    this.isDucked = false;
    if (this.ctx && this.ctx.state === 'running') {
      void this.ctx.suspend().catch(() => undefined);
    }
  }
}

export const audio = new AudioEngine();
export default audio;
