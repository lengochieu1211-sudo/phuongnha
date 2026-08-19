/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VOICE_LINES } from './voiceLines.vi';
import { VOICE_MANIFEST } from './voiceManifest';
import { audio } from './AudioEngine';

export type VoiceStyle = 'female_gentle' | 'male_warm' | 'baby_cute';

export interface VoiceGuideSettings {
  enabled: boolean;
  voiceStyle: VoiceStyle;
  volume: number; // 0.0 to 1.0
  rate: number; // 0.8 to 1.4
  pitch: number; // 0.6 to 1.8
  selectedVoiceName?: string;
}

type Priority = 'high' | 'medium' | 'low';

interface VoiceItem {
  id: string;
  text: string;
  priority: Priority;
  onStart?: () => void;
  onEnd?: () => void;
}

const STORAGE_KEY = 'phuong_nha_voice_settings';

class VoiceGuideService {
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private queue: VoiceItem[] = [];
  private isSpeaking: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private recordedVoicePlayer: any = null;

  public registerRecordedVoicePlayer(player: any) {
    this.recordedVoicePlayer = player;
  }

  private findManifestKeyByText(text: string): string | null {
    if (!text) return null;
    const cleanText = text.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, '');
    for (const [category, subCat] of Object.entries(VOICE_MANIFEST)) {
      for (const [subKey, entry] of Object.entries(subCat)) {
        const cleanEntryText = entry.text.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, '');
        if (cleanEntryText === cleanText) {
          return `${category}.${subKey}`;
        }
      }
    }
    return null;
  }

  private settings: VoiceGuideSettings = {
    enabled: true,
    voiceStyle: 'female_gentle', // Default sweet female voice for kids
    volume: 1.0,
    rate: 1.02,
    pitch: 1.25,
  };

  private lastPraiseTime: number = 0;
  private praiseCooldownMs: number = 3500;

  private speakingListeners: Set<(isSpeaking: boolean, text: string) => void> = new Set();
  private settingsListeners: Set<(settings: VoiceGuideSettings) => void> = new Set();

  constructor() {
    this.loadPersistedSettings();

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.initVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private loadPersistedSettings() {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.settings = { ...this.settings, ...parsed };
      }
    } catch (e) {
      // ignore
    }
  }

  private saveSettings() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch (e) {
      // ignore
    }
  }

  private voiceFingerprint(v: SpeechSynthesisVoice): string {
    return `${v.name} ${(v as any).voiceURI || ''} ${v.lang}`.toLowerCase();
  }

  private isLikelyFemaleVoice(v: SpeechSynthesisVoice): boolean {
    const n = this.voiceFingerprint(v);
    // Android Google Vietnamese natural voices: vic / vid / vif are female variants.
    // Also cover common Windows/Apple Vietnamese female names.
    return (
      /vi-vn-x-vi[cdf]/.test(n) ||
      n.includes('tiếng việt 1') || n.includes('tiếng việt 2') || n.includes('tiếng việt 4') ||
      n.includes('hoaimy') || n.includes('hoai my') || n.includes('linh') ||
      n.includes('female') || n.includes('nữ') || n.includes('nu voice')
    );
  }

  private isLikelyMaleVoice(v: SpeechSynthesisVoice): boolean {
    const n = this.voiceFingerprint(v);
    return (
      /vi-vn-x-(vie|gft)/.test(n) ||
      n.includes('tiếng việt 3') || n.includes('tiếng việt 5') ||
      n.includes('namminh') || n.includes('nam minh') || n.includes('microsoft an') ||
      n.includes('male') || n.includes('giọng nam')
    );
  }

  private voiceMatchesStyle(v: SpeechSynthesisVoice, style: VoiceStyle): boolean {
    if (style === 'male_warm') return this.isLikelyMaleVoice(v);
    if (style === 'female_gentle' || style === 'baby_cute') return this.isLikelyFemaleVoice(v);
    return true;
  }

  private initVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();

    // Do not blindly restore a stale male voice while the saved style is female.
    if (this.settings.selectedVoiceName) {
      const match = this.voices.find((v) => v.name === this.settings.selectedVoiceName);
      if (match && this.voiceMatchesStyle(match, this.settings.voiceStyle)) {
        this.selectedVoice = match;
        return;
      }
    }

    this.applyVoiceStyleConfig(this.settings.voiceStyle);
  }

  public applyVoiceStyleConfig(style: VoiceStyle) {
    // Refresh because Chrome/Android populates speechSynthesis voices asynchronously.
    if (this.synth) this.voices = this.synth.getVoices();
    const viVoices = this.voices.filter((v) => v.lang.toLowerCase().startsWith('vi'));
    const femaleViVoice = this.getNaturalFemaleVoice();
    const maleViVoice = viVoices.find((v) => this.isLikelyMaleVoice(v));
    const neutralViVoice = viVoices.find((v) => !this.isLikelyMaleVoice(v)) || viVoices[0] || null;

    this.settings.voiceStyle = style;
    if (style === 'female_gentle') {
      this.settings.rate = 0.98;
      this.settings.pitch = femaleViVoice ? 1.08 : 1.45;
      this.selectedVoice = femaleViVoice || neutralViVoice || null;
    } else if (style === 'male_warm') {
      this.settings.rate = 0.94;
      this.settings.pitch = 0.82;
      this.selectedVoice = maleViVoice || viVoices[0] || null;
    } else {
      this.settings.rate = 1.12;
      this.settings.pitch = femaleViVoice ? 1.35 : 1.72;
      this.selectedVoice = femaleViVoice || neutralViVoice || null;
    }

    // Clear stale stored names if no matching Vietnamese voice exists.
    this.settings.selectedVoiceName = this.selectedVoice?.name;
  }

  public getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  public getFemaleVoiceStatus() {
    if (this.synth) this.voices = this.synth.getVoices();
    const female = this.getNaturalFemaleVoice();
    return {
      naturalFemaleAvailable: Boolean(female),
      naturalFemaleName: female?.name || '',
      offlinePackAvailable: Boolean(this.recordedVoicePlayer),
      activeSource:
        this.settings.voiceStyle !== 'female_gentle' ? 'system' :
        female ? 'natural-system-female' :
        this.recordedVoicePlayer ? 'offline-fallback' : 'unavailable',
    } as const;
  }

  private getNaturalFemaleVoice(): SpeechSynthesisVoice | null {
    if (this.synth) this.voices = this.synth.getVoices();
    const candidates = this.voices.filter((v) => v.lang.toLowerCase().startsWith('vi') && this.isLikelyFemaleVoice(v));
    if (!candidates.length) return null;

    // Prefer higher-quality/natural Vietnamese voices when the browser exposes several.
    // Keep this deterministic so Android does not randomly switch speakers between sessions.
    const score = (v: SpeechSynthesisVoice) => {
      const n = this.voiceFingerprint(v);
      let s = 0;
      if (n.includes('natural')) s += 80;
      if (n.includes('network')) s += 35;
      if (n.includes('google tiếng việt 1') || n.includes('vi-vn-x-vic')) s += 30;
      if (n.includes('google tiếng việt 2') || n.includes('vi-vn-x-vid')) s += 26;
      if (n.includes('google tiếng việt 4') || n.includes('vi-vn-x-vif')) s += 24;
      if (n.includes('hoaimy') || n.includes('hoai my')) s += 32;
      if (n.includes('linh')) s += 18;
      if (v.localService) s += 8; // useful when the device has downloaded the voice for offline use
      return s;
    };
    return [...candidates].sort((a, b) => score(b) - score(a))[0] || null;
  }

  public setVoiceStyle(style: VoiceStyle) {
    this.applyVoiceStyleConfig(style);
    this.saveSettings();
    this.notifySettingsChanged();
  }

  public setEnabled(enabled: boolean) {
    this.settings.enabled = enabled;
    if (!enabled) {
      this.stop();
    }
    this.saveSettings();
    this.notifySettingsChanged();
  }

  public toggleEnabled(): boolean {
    const next = !this.settings.enabled;
    this.setEnabled(next);
    return next;
  }

  public setSettings(newSettings: Partial<VoiceGuideSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    if (newSettings.voiceStyle) {
      this.applyVoiceStyleConfig(newSettings.voiceStyle);
    }
    if (newSettings.selectedVoiceName) {
      const match = this.voices.find((v) => v.name === newSettings.selectedVoiceName);
      if (match) this.selectedVoice = match;
    }
    this.saveSettings();
    this.notifySettingsChanged();
  }

  public getSettings(): VoiceGuideSettings {
    return { ...this.settings };
  }

  public subscribeSettings(listener: (settings: VoiceGuideSettings) => void): () => void {
    this.settingsListeners.add(listener);
    return () => this.settingsListeners.delete(listener);
  }

  private notifySettingsChanged() {
    this.settingsListeners.forEach((fn) => fn({ ...this.settings }));
  }

  public previewVoiceStyle(style: VoiceStyle) {
    this.applyVoiceStyleConfig(style);
    this.stop();
    // Prefer a real/natural Vietnamese female system voice when the device
    // exposes one. The bundled offline pack is retained as a fallback for
    // devices that only expose a male/neutral Vietnamese voice.
    if (style === 'female_gentle') {
      const naturalFemale = this.getNaturalFemaleVoice();
      if (naturalFemale) {
        this.selectedVoice = naturalFemale;
        this.speakSynthesized('Xin chào Phương Nhã! Mình cùng bắt đầu cuộc phiêu lưu nhé!', 'high');
        return;
      }
      if (this.recordedVoicePlayer) {
        this.playKey('common.welcome', 'high');
        return;
      }
    }
    let sampleText = 'Xin chào bé yêu! Chị Phương Nhã rất vui được cùng em phiêu lưu và vận động nhé!';
    if (style === 'male_warm') {
      sampleText = 'Chào bạn nhỏ dũng cảm! Hãy cùng chú vươn vai và bắt đầu nào!';
    } else if (style === 'baby_cute') {
      sampleText = 'Oa chào bạn nha! Mình cùng nhảy và bắt trái cây thật vui nà!';
    }
    this.speakSynthesized(sampleText, 'high');
  }

  public subscribeSpeakingState(listener: (isSpeaking: boolean, text: string) => void): () => void {
    this.speakingListeners.add(listener);
    return () => this.speakingListeners.delete(listener);
  }

  private notifySpeakingState(isSpeaking: boolean, text: string = '') {
    this.speakingListeners.forEach((fn) => fn(isSpeaking, text));
  }

  public speak(
    text: string,
    priority: Priority = 'medium',
    callbacks?: { onStart?: () => void; onEnd?: () => void }
  ) {
    if (!this.settings.enabled || !text) return;

    if (this.settings.voiceStyle === 'female_gentle') {
      // First choice: a verified Vietnamese female system voice. These voices
      // are usually much more natural than the small bundled fallback clips.
      const naturalFemale = this.getNaturalFemaleVoice();
      if (naturalFemale) {
        this.selectedVoice = naturalFemale;
        this.speakSynthesized(text, priority, callbacks);
        return;
      }

      // Second choice: bundled offline pack. It guarantees that a device which
      // only has a Vietnamese male voice never changes speaker unexpectedly.
      if (this.recordedVoicePlayer) {
        const manifestKey = this.findManifestKeyByText(text);
        if (manifestKey) {
          const mappedPriority: any =
            priority === 'high' ? 'instruction' :
            priority === 'low' ? 'praise' : 'event';
          this.recordedVoicePlayer.play(manifestKey, mappedPriority, callbacks);
          return;
        }
      }

      console.warn('[VoiceGuide] No verified female Vietnamese source for:', text);
      callbacks?.onEnd?.();
      return;
    }

    this.speakSynthesized(text, priority, callbacks);
  }

  public playKey(
    key: string,
    priority: Priority = 'medium',
    callbacks?: { onStart?: () => void; onEnd?: () => void }
  ) {
    if (!this.settings.enabled || !key) return;

    const [category, subKey] = key.split('.');
    const entry = VOICE_MANIFEST[category]?.[subKey];

    if (entry) {
      if (this.settings.voiceStyle === 'female_gentle') {
        const naturalFemale = this.getNaturalFemaleVoice();
        if (naturalFemale) {
          this.selectedVoice = naturalFemale;
          this.speakSynthesized(entry.text, priority, callbacks);
        } else if (this.recordedVoicePlayer) {
          const mappedPriority: any =
            priority === 'high' ? 'instruction' :
            priority === 'low' ? 'praise' : 'event';
          this.recordedVoicePlayer.play(key, mappedPriority, callbacks);
        } else {
          console.warn(`[VoiceGuide] Female voice unavailable for key: ${key}`);
          callbacks?.onEnd?.();
        }
      } else {
        this.speakSynthesized(entry.text, priority, callbacks);
      }
    } else {
      console.warn(`[VoiceGuide] Key not found in manifest: ${key}`);
      // Fallback if the user passed text instead of a manifest key
      if (key.includes(' ') || !key.includes('.')) {
        this.speak(key, priority, callbacks);
      }
    }
  }

  public speakSynthesized(
    text: string,
    priority: Priority = 'medium',
    callbacks?: { onStart?: () => void; onEnd?: () => void }
  ) {
    if (!this.settings.enabled || !text || !this.synth) return;

    if (priority === 'low') {
      const now = Date.now();
      if (now - this.lastPraiseTime < this.praiseCooldownMs) {
        return;
      }
      this.lastPraiseTime = now;
    }

    const item: VoiceItem = {
      id: `${Date.now()}_${Math.random()}`,
      text,
      priority,
      onStart: callbacks?.onStart,
      onEnd: callbacks?.onEnd,
    };

    if (priority === 'high') {
      this.stop();
      this.queue = [item];
      this.processQueue();
    } else {
      if (this.queue.length >= 3) {
        this.queue.splice(1, 1);
      }
      this.queue.push(item);
      if (!this.isSpeaking) {
        this.processQueue();
      }
    }
  }

  private processQueue() {
    if (!this.synth || this.queue.length === 0 || this.isSpeaking) return;

    const item = this.queue.shift();
    if (!item) return;

    this.isSpeaking = true;
    this.notifySpeakingState(true, item.text);

    audio.duckMusic(true);

    // Android may publish voices after app startup; refresh before every queued utterance.
    if (!this.selectedVoice || !this.voiceMatchesStyle(this.selectedVoice, this.settings.voiceStyle)) {
      this.applyVoiceStyleConfig(this.settings.voiceStyle);
    }

    const utterance = new SpeechSynthesisUtterance(item.text);
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }
    utterance.lang = this.selectedVoice?.lang || 'vi-VN';
    utterance.rate = this.settings.rate;
    utterance.pitch = this.settings.pitch;
    utterance.volume = this.settings.volume;

    utterance.onstart = () => {
      item.onStart?.();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      this.notifySpeakingState(false, '');
      item.onEnd?.();
      audio.duckMusic(false);

      setTimeout(() => {
        this.processQueue();
      }, 200);
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      this.notifySpeakingState(false, '');
      audio.duckMusic(false);
      this.processQueue();
    };

    this.currentUtterance = utterance;
    try {
      this.synth.speak(utterance);
    } catch (err) {
      this.isSpeaking = false;
      audio.duckMusic(false);
      this.notifySpeakingState(false, '');
    }
  }

  public stop() {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {
        // ignore
      }
    }
    this.queue = [];
    this.isSpeaking = false;
    this.currentUtterance = null;
    audio.duckMusic(false);
    this.notifySpeakingState(false, '');
  }

  public praiseRandom() {
    const lines = VOICE_LINES.praise;
    const line = lines[Math.floor(Math.random() * lines.length)];
    this.speak(line, 'low');
  }

  public encourageRandom() {
    const lines = VOICE_LINES.encouragement;
    const line = lines[Math.floor(Math.random() * lines.length)];
    this.speak(line, 'medium');
  }

  public speakGestureInstruction(gestureKey: keyof typeof VOICE_LINES.gestures) {
    const text = VOICE_LINES.gestures[gestureKey];
    if (text) this.speak(text, 'high');
  }

  public speakCameraGuidance(guidanceKey: keyof typeof VOICE_LINES.camera) {
    const text = VOICE_LINES.camera[guidanceKey];
    if (text) this.speak(text, 'high');
  }
}

export const voiceGuide = new VoiceGuideService();
