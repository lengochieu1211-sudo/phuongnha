/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VOICE_MANIFEST, VoiceManifestEntry } from './voiceManifest';
import { voiceGuide } from './VoiceGuideService';
import { audio } from './AudioEngine';

export type VoicePriority = 'critical' | 'instruction' | 'event' | 'praise' | 'ambient';

export const PRIORITY_LEVELS: Record<VoicePriority, number> = {
  critical: 100,
  instruction: 80,
  event: 60,
  praise: 40,
  ambient: 20,
};

class RecordedVoiceService {
  private enabled: boolean = true;
  private volume: number = 0.9;
  private audioCache: Record<string, HTMLAudioElement> = {};
  private activeAudio: { audio: HTMLAudioElement; priority: number; key: string } | null = null;
  private lastPlayTime: Record<string, number> = {};
  private preloadedCategories: Set<string> = new Set();

  private resolveAssetPath(path: string): string {
    const base = ((import.meta as any).env?.BASE_URL || '/');
    const cleanBase = base.endsWith('/') ? base : `${base}/`;
    return path.startsWith('/') ? `${cleanBase}${path.slice(1)}` : `${cleanBase}${path}`;
  }

  constructor() {
    // AI Studio exports may contain placeholder .mp3 files that are not valid MPEG audio.
    // Start in TTS-only mode and enable/preload the recorded pack only after integrity validation.
    this.enabled = false;
    void this.initializeRecordedPack();
  }

  private async initializeRecordedPack() {
    try {
      const base = ((import.meta as any).env?.BASE_URL || '/');
      const res = await fetch(`${base}audio/voice/voice-pack-status.json`, { cache: 'no-store' });
      const status = res.ok ? await res.json() : null;
      if (status?.recordedPackAvailable === true) {
        this.enabled = true;
        this.preload('common');
        this.preload('camera');
        voiceGuide.registerRecordedVoicePlayer(this);
      } else {
        this.enabled = false;
        console.info('[Voice] Offline synthetic female fallback is unavailable; using configured Web Speech TTS when appropriate.');
      }
    } catch {
      this.enabled = false;
      console.info('[Voice] Offline fallback status unavailable; using configured Web Speech TTS when appropriate.');
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.stop();
    }
  }

  public setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.activeAudio) {
      this.activeAudio.audio.volume = this.volume;
    }
  }

  /**
   * Preload voice files for a specific category to improve latency on demand
   */
  public preload(category: string) {
    if (this.preloadedCategories.has(category)) return;
    const cat = VOICE_MANIFEST[category];
    if (!cat) return;

    Object.entries(cat).forEach(([subKey, entry]) => {
      const fullKey = `${category}.${subKey}`;
      if (!this.audioCache[fullKey]) {
        const audioObj = new Audio(this.resolveAssetPath(entry.path));
        audioObj.preload = 'auto';
        this.audioCache[fullKey] = audioObj;
      }
    });
    this.preloadedCategories.add(category);
  }

  /**
   * Play a bundled offline voice line with priority-based preemption
   */
  public play(key: string, priority: VoicePriority = 'event', callbacks?: { onStart?: () => void; onEnd?: () => void }) {
    if (!this.enabled) return;

    const [category, subKey] = key.split('.');
    const entry = VOICE_MANIFEST[category]?.[subKey];
    if (!entry) {
      console.warn(`[Voice] Key not found in manifest: ${key}`);
      return;
    }

    const requestedPriorityVal = PRIORITY_LEVELS[priority];
    const now = Date.now();

    // 1. Cooldown check
    const cooldown = entry.cooldownMs ?? 5000;
    const lastPlayed = this.lastPlayTime[key] ?? 0;
    if (now - lastPlayed < cooldown && priority !== 'critical') {
      return; // Skip playing if in cooldown
    }

    // 2. Preemption / Priority check
    if (this.activeAudio) {
      if (requestedPriorityVal >= this.activeAudio.priority) {
        // Stop current lower or equal priority sound
        this.stopCurrent();
      } else {
        // Reject since active sound has higher priority
        return;
      }
    }

    this.lastPlayTime[key] = now;

    // Use cached HTML5 Audio or create new one
    let audioObj = this.audioCache[key];
    if (!audioObj) {
      audioObj = new Audio(this.resolveAssetPath(entry.path));
      this.audioCache[key] = audioObj;
    }

    // Duck the background music
    audio.duckMusic(true);

    // Attempt to play the offline file
    let playPromise: Promise<void> | undefined;
    audioObj.volume = this.volume;

    // Remove old listeners to prevent leak
    audioObj.onended = null;
    audioObj.onerror = null;

    audioObj.onended = () => {
      audio.duckMusic(false);
      this.activeAudio = null;
      callbacks?.onEnd?.();
    };

    let fallbackTriggered = false;

    audioObj.onerror = () => {
      if (fallbackTriggered) return;
      fallbackTriggered = true;
      // The bundled female pack must stay female. If one file cannot be played,
      // stop this sentence instead of falling back to an unpredictable device TTS voice.
      console.warn(`[Voice] Offline female file failed for ${key}; sentence skipped.`);
      audio.duckMusic(false);
      this.activeAudio = null;
      callbacks?.onEnd?.();
    };

    try {
      playPromise = audioObj.play();
    } catch (err) {
      audioObj.onerror(new Event('error'));
      return;
    }

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.activeAudio = { audio: audioObj, priority: requestedPriorityVal, key };
          callbacks?.onStart?.();
        })
        .catch((_err) => {
          // Promise rejected (e.g., user gesture restriction or file not found)
          // Do not switch female mode to an unknown system voice on playback failure
          if (audioObj.onerror) {
            audioObj.onerror(new Event('error'));
          }
        });
    }
  }

  private stopCurrent() {
    if (this.activeAudio) {
      try {
        this.activeAudio.audio.pause();
        this.activeAudio.audio.currentTime = 0;
      } catch (e) {
        // ignore
      }
      this.activeAudio = null;
    }
    // Also stop standard TTS to prevent overlapping voices
    voiceGuide.stop();
  }

  public stop() {
    this.stopCurrent();
    audio.duckMusic(false);
  }

  public stopAll() {
    this.stop();
  }
}

export const recordedVoice = new RecordedVoiceService();
