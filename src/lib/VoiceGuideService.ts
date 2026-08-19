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

  private initVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();

    // 1. Try to find exact selectedVoiceName from saved settings
    if (this.settings.selectedVoiceName) {
      const match = this.voices.find((v) => v.name === this.settings.selectedVoiceName);
      if (match) {
        this.selectedVoice = match;
        return;
      }
    }

    this.applyVoiceStyleConfig(this.settings.voiceStyle);
  }

  public applyVoiceStyleConfig(style: VoiceStyle) {
    const viVoices = this.voices.filter(
      (v) => v.lang.startsWith('vi') || v.lang.includes('VI') || v.lang.includes('VIE')
    );

    const isFemaleName = (name: string) => {
      const n = name.toLowerCase();
      return (
        n.includes('hoaimy') ||
        n.includes('linh') ||
        n.includes('mai') ||
        n.includes('chi') ||
        n.includes('lan') ||
        n.includes('huong') ||
        n.includes('thao') ||
        n.includes('female') ||
        n.includes('nữ') ||
        n.includes('zira') ||
        n.includes('samantha') ||
        n.includes('natural') ||
        n.includes('microsoft an') ||
        n === 'an' ||
        (n.includes('google') && n.includes('vi-vn') && !n.includes('male'))
      );
    };

    const isMaleName = (name: string) => {
      const n = name.toLowerCase();
      return (
        n.includes('nam') ||
        n.includes('minh') ||
        n.includes('male') ||
        n.includes('david') ||
        n.includes('george')
      );
    };

    const femaleViVoice = viVoices.find((v) => isFemaleName(v.name));
    const maleViVoice = viVoices.find((v) => isMaleName(v.name));
    const defaultViVoice = viVoices[0] || null;

    if (style === 'female_gentle') {
      this.settings.voiceStyle = 'female_gentle';
      this.settings.rate = 1.0;
      if (femaleViVoice) {
        this.selectedVoice = femaleViVoice;
        this.settings.pitch = 1.2;
      } else {
        this.selectedVoice = defaultViVoice || this.voices[0] || null;
        this.settings.pitch = 1.45; // Gentle pitch shift up for warm tone
      }
    } else if (style === 'male_warm') {
      this.settings.voiceStyle = 'male_warm';
      this.settings.rate = 0.95;
      this.selectedVoice = maleViVoice || defaultViVoice || this.voices[0] || null;
      this.settings.pitch = 0.75;
    } else if (style === 'baby_cute') {
      this.settings.voiceStyle = 'baby_cute';
      this.settings.rate = 1.15;
      this.selectedVoice = femaleViVoice || defaultViVoice || this.voices[0] || null;
      this.settings.pitch = 1.7;
    }

    if (this.selectedVoice) {
      this.settings.selectedVoiceName = this.selectedVoice.name;
    }
  }

  public getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
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
    let sampleText = 'Xin chào bé yêu! Chị Phương Nhã rất vui được cùng em phiêu lưu và vận động nhé!';
    if (style === 'male_warm') {
      sampleText = 'Chào bạn nhỏ dũng cảm! Hãy cùng chú vươn vai và bắt đầu nào!';
    } else if (style === 'baby_cute') {
      sampleText = 'Oa chào bạn nha! Mình cùng nhảy và bắt trái cây thật vui nà!';
    }
    this.speak(sampleText, 'high');
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

    // The bundled offline recordings are the female voice pack. Respect the
    // selected Male/Baby styles by using Web Speech for those styles instead
    // of silently playing the female recording.
    if (this.recordedVoicePlayer && this.settings.voiceStyle === 'female_gentle') {
      const manifestKey = this.findManifestKeyByText(text);
      if (manifestKey) {
        const mappedPriority: any =
          priority === 'high' ? 'instruction' :
          priority === 'low' ? 'praise' : 'event';
        this.recordedVoicePlayer.play(manifestKey, mappedPriority, callbacks);
        return;
      }
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
      if (this.recordedVoicePlayer && this.settings.voiceStyle === 'female_gentle') {
        const mappedPriority: any =
          priority === 'high' ? 'instruction' :
          priority === 'low' ? 'praise' : 'event';
        this.recordedVoicePlayer.play(key, mappedPriority, callbacks);
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
