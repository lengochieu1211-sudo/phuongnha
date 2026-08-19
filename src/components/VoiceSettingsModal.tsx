/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Volume2, VolumeX, Mic, Sparkles, Play, Check, Heart, User, Smile, Sliders, Info } from 'lucide-react';
import { voiceGuide, VoiceStyle, VoiceGuideSettings } from '../lib/VoiceGuideService';
import { audio } from '../lib/AudioEngine';

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VoiceSettingsModal({ isOpen, onClose }: VoiceSettingsModalProps) {
  const [settings, setSettings] = useState<VoiceGuideSettings>(() => voiceGuide.getSettings());
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [systemVoices, setSystemVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const unsub = voiceGuide.subscribeSettings((newSettings) => {
      setSettings(newSettings);
    });
    setSystemVoices(voiceGuide.getVoices());
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const handleToggleEnabled = () => {
    audio.playMenuClick();
    voiceGuide.setEnabled(!settings.enabled);
  };

  const handleSelectStyle = (style: VoiceStyle) => {
    audio.playMenuClick();
    voiceGuide.setVoiceStyle(style);
    voiceGuide.previewVoiceStyle(style);
  };

  const handleTestVoice = (style: VoiceStyle) => {
    audio.playMenuClick();
    setIsPlayingPreview(true);
    voiceGuide.previewVoiceStyle(style);
    setTimeout(() => setIsPlayingPreview(false), 2800);
  };

  const handlePitchChange = (pitch: number) => {
    voiceGuide.setSettings({ pitch });
  };

  const handleRateChange = (rate: number) => {
    voiceGuide.setSettings({ rate });
  };

  const handleVoiceChange = (voiceName: string) => {
    voiceGuide.setSettings({ selectedVoiceName: voiceName });
  };

  const handleTestCurrentCustom = () => {
    audio.playMenuClick();
    if (settings.voiceStyle === 'female_gentle') {
      voiceGuide.playKey('common.welcome', 'high');
    } else {
      voiceGuide.speak('Xin chào các bạn nhỏ, đây là giọng đọc với cao độ và tốc độ bạn đã chọn!', 'high');
    }
  };

  const voiceOptions: {
    id: VoiceStyle;
    name: string;
    title: string;
    description: string;
    pitchDesc: string;
    emoji: string;
    badge?: string;
    icon: any;
    color: string;
  }[] = [
    {
      id: 'female_gentle',
      name: 'Chị Phương Nhã',
      title: 'Giọng Nữ Dịu Dàng',
      description: 'Giọng nữ tiếng Việt đã đóng sẵn trong game: 343 câu MP3 offline, phát giống nhau trên điện thoại, PC và TV.',
      pitchDesc: 'MP3 OFFLINE • Không phụ thuộc giọng hệ thống',
      emoji: '👩‍🏫',
      badge: 'Thu Sẵn • Mặc Định',
      icon: Heart,
      color: 'border-pink-300 bg-pink-50/70 text-pink-700',
    },
    {
      id: 'male_warm',
      name: 'Chú Siêu Nhân',
      title: 'Giọng Nam Trầm Ấm',
      description: 'Trầm ấm, dõng dạc, mạnh mẽ, khích lệ tinh thần dũng cảm vượt mọi thử thách.',
      pitchDesc: 'Cao độ mặc định 0.75x (Nam trầm ấm)',
      emoji: '🦸‍♂️',
      badge: 'Mạnh Mẽ',
      icon: User,
      color: 'border-blue-300 bg-blue-50/70 text-blue-700',
    },
    {
      id: 'baby_cute',
      name: 'Bé Bo Nhí Nhảnh',
      title: 'Giọng Em Bé Dễ Thương',
      description: 'Cao vui tươi, lí lắc, nhí nhảnh và siêu dễ thương như bạn đồng hành cùng tuổi.',
      pitchDesc: 'Cao độ mặc định 1.70x (Em bé vui tươi)',
      emoji: '👶',
      badge: 'Vui Nhộn',
      icon: Smile,
      color: 'border-amber-300 bg-amber-50/70 text-amber-700',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        id="voice-settings-modal"
        className="relative w-full max-w-xl bg-[#FFFDF9] rounded-3xl border-4 border-pink-300 shadow-2xl p-6 md:p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto font-sans text-slate-800"
        style={{
          backgroundImage:
            'radial-gradient(circle at 10% 20%, rgba(255, 182, 193, 0.25) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(255, 235, 180, 0.3) 0%, transparent 40%)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2.5 bg-white text-slate-500 hover:text-slate-800 rounded-full border-2 border-pink-200 shadow-sm transition hover:scale-105"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-pink-100 text-pink-700 px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-wider mb-2 border border-pink-300">
            <Mic className="w-4 h-4 text-pink-600 animate-pulse" />
            Tùy Chọn Giọng Nói Hướng Dẫn
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800">
            Giọng Lồng Tiếng & Cổ Vũ
          </h2>
          <p className="text-xs text-slate-500 font-bold mt-1 max-w-md mx-auto">
            Lựa chọn 3 phong cách giọng đọc rõ rệt hoặc tự kéo chỉnh độ cao thanh âm theo ý muốn
          </p>
        </div>

        {/* 1. Master Toggle: ON / OFF Voice */}
        <div className="bg-white p-4.5 rounded-2xl border-2 border-pink-100 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-xs ${
                settings.enabled ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
              }`}
            >
              {settings.enabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </div>
            <div>
              <h4 className="font-black text-sm text-slate-800">Giọng nói cổ vũ & hướng dẫn</h4>
              <p className="text-xs text-slate-400 font-medium">
                {settings.enabled ? 'Đang bật (Phát âm thanh hướng dẫn)' : 'Đang tắt (Hoàn toàn yên lặng)'}
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleEnabled}
            className={`px-5 py-2.5 rounded-full font-black text-xs transition shadow-md active:scale-95 ${
              settings.enabled
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : 'bg-slate-300 hover:bg-slate-400 text-slate-700'
            }`}
          >
            {settings.enabled ? 'ĐANG BẬT ✓' : 'ĐÃ TẮT ✕'}
          </button>
        </div>

        {/* 2. Voice Style Selector */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
              Chọn 1 Trong 3 Giọng Đọc
            </span>
            <span className="text-[11px] font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-md border border-pink-100">
              3 Tông Giọng Khác Biệt
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {voiceOptions.map((opt) => {
              const isSelected = settings.voiceStyle === opt.id;

              return (
                <div
                  key={opt.id}
                  onClick={() => handleSelectStyle(opt.id)}
                  className={`relative p-4 rounded-2xl border-3 transition cursor-pointer flex items-start gap-4 ${
                    isSelected
                      ? `${opt.color} border-pink-500 shadow-md ring-2 ring-pink-400/50 scale-[1.01]`
                      : 'bg-white border-slate-100 hover:border-pink-200 text-slate-700 hover:bg-pink-50/30'
                  }`}
                >
                  {/* Emoji Avatar */}
                  <div className="w-14 h-14 rounded-2xl bg-white border-2 border-slate-100 shadow-xs flex items-center justify-center text-3xl shrink-0">
                    {opt.emoji}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-black text-sm text-slate-800">{opt.name}</h4>
                      <span className="text-xs text-pink-600 font-bold">({opt.title})</span>
                      {opt.badge && (
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            isSelected ? 'bg-pink-500 text-white' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                      {opt.description}
                    </p>
                    <div className="text-[11px] font-mono text-pink-500/90 font-bold mt-1">
                      {opt.pitchDesc}
                    </div>

                    {/* Preview Button */}
                    <div className="mt-2.5 flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTestVoice(opt.id);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-pink-100 text-pink-600 rounded-full text-[11px] font-extrabold border border-pink-200 shadow-2xs transition active:scale-95"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Nghe thử giọng này</span>
                      </button>
                    </div>
                  </div>

                  {/* Radio Indicator */}
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 transition ${
                      isSelected
                        ? 'border-pink-500 bg-pink-500 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Explanation & Advanced Pitch / Rate Sliders */}
        <div className="bg-white/90 rounded-2xl border-2 border-pink-100 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-pink-500" />
              <span className="text-xs font-black text-slate-700">Tùy Chỉnh Cao Độ & Tốc Độ Âm Thanh</span>
            </div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-black text-pink-600 hover:underline"
            >
              {showAdvanced ? 'Thu gọn ▲' : 'Mở rộng ▼'}
            </button>
          </div>

          {/* Quick Notice */}
          <div className="flex items-start gap-2 bg-amber-50/80 border border-amber-200/80 rounded-xl p-2.5 text-[11px] text-amber-900 leading-snug">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              {settings.voiceStyle === 'female_gentle' ? (
                <><strong>Giọng Nữ Thu Sẵn:</strong> game ưu tiên 343 câu MP3 tiếng Việt đóng sẵn, nên điện thoại/PC/TV không còn phụ thuộc giọng nam mặc định của Chrome cho các câu đã ánh xạ.</>
              ) : (
                <><strong>Giọng hệ thống:</strong> {settings.selectedVoiceName || 'Tự động tiếng Việt trên thiết bị'}. Hai kiểu Nam/Em bé vẫn dùng Web Speech của thiết bị.</>
              )}
            </div>
          </div>

          {showAdvanced && (
            <div className="flex flex-col gap-4 pt-2 border-t border-slate-100">
              {/* Pitch Slider */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Cao độ giọng (Pitch):</span>
                  <span className="font-mono text-pink-600">{settings.pitch.toFixed(2)}x {settings.pitch > 1.4 ? '(Tông Nữ / Bé)' : settings.pitch < 0.85 ? '(Tông Nam Trầm)' : '(Tông Trung)'}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.05"
                  value={settings.pitch}
                  onChange={(e) => handlePitchChange(parseFloat(e.target.value))}
                  className="w-full accent-pink-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>Trầm Nam (0.5x)</span>
                  <span>Tự Nhiên (1.0x)</span>
                  <span>Nữ Cao (1.6x)</span>
                  <span>Em Bé (2.0x)</span>
                </div>
              </div>

              {/* Rate Slider */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Tốc độ đọc (Speed):</span>
                  <span className="font-mono text-pink-600">{settings.rate.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="1.4"
                  step="0.05"
                  value={settings.rate}
                  onChange={(e) => handleRateChange(parseFloat(e.target.value))}
                  className="w-full accent-pink-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>Chậm rãi (0.7x)</span>
                  <span>Chuẩn (1.0x)</span>
                  <span>Nhanh nhẹn (1.4x)</span>
                </div>
              </div>

              {/* Voice Engine Select */}
              {systemVoices.length > 0 && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">Giọng đọc cài đặt trên máy:</label>
                  <select
                    value={settings.selectedVoiceName || ''}
                    onChange={(e) => handleVoiceChange(e.target.value)}
                    className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800"
                  >
                    {systemVoices.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={handleTestCurrentCustom}
                className="py-2 px-4 rounded-xl bg-pink-100 hover:bg-pink-200 text-pink-700 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Nghe thử với thông số hiện tại</span>
              </button>
            </div>
          )}
        </div>

        {/* 4. Footer Action */}
        <div className="pt-2 flex justify-end gap-3 border-t border-pink-100">
          <button
            onClick={onClose}
            className="w-full py-3 bg-pink-500 hover:bg-pink-600 text-white font-black rounded-2xl text-xs shadow-md transition transform hover:scale-[1.01] active:scale-95"
          >
            HOÀN TẤT & LƯU CÀI ĐẶT
          </button>
        </div>
      </div>
    </div>
  );
}
