/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { RaceSettings } from '../../types';
import { MotionSteeringEngine, SteeringState } from '../../lib/racing/MotionSteeringEngine';
import { WristPosition, PoseLandmark, poseDetector } from '../../utils/poseDetector';
import {
  ChevronLeft,
  CheckCircle2,
  Sparkles,
  Lock,
} from 'lucide-react';

interface MotionSteeringCalibrationProps {
  settings: RaceSettings;
  onUpdateSettings: (newSettings: Partial<RaceSettings>) => void;
  onBack: () => void;
  onDone: () => void;
  lastWristData?: { leftWrist?: WristPosition; rightWrist?: WristPosition; landmarks?: PoseLandmark[] };
}

export const MotionSteeringCalibration: React.FC<MotionSteeringCalibrationProps> = ({
  settings,
  onUpdateSettings,
  onBack,
  onDone,
  lastWristData,
}) => {
  const [steeringEngine] = useState(() => new MotionSteeringEngine());
  const [steeringState, setSteeringState] = useState<SteeringState>({
    steerValue: 0,
    steeringAngleDeg: 0,
    isHoldingWheel: false,
    nitroTriggered: false,
    brakeTriggered: false,
    handsConfidence: 0,
    rawSteerValue: 0,
    rawAngleDeg: 0,
    neutralAngleDeg: 0,
    effectiveAngleDeg: 0,
  });

  const [testedStraight, setTestedStraight] = useState(false);
  const [testedLeft, setTestedLeft] = useState(false);
  const [testedRight, setTestedRight] = useState(false);

  useEffect(() => {
    steeringEngine.setSensitivity(settings.steeringSensitivity);
  }, [settings.steeringSensitivity]);

  // Subscribe directly to poseDetector to ensure live calibration even if lastWristData isn't updated
  useEffect(() => {
    const unsub = poseDetector.addListener((res) => {
      const leftW = res.leftWrist;
      const rightW = res.rightWrist;
      const landmarks = res.landmarks;
      const steeringRes = steeringEngine.processPose(leftW, rightW, landmarks);
      setSteeringState(steeringRes);

      if (steeringRes.isHoldingWheel) {
        if (Math.abs(steeringRes.steeringAngleDeg) < 10) setTestedStraight(true);
        if (steeringRes.steeringAngleDeg < -15) setTestedLeft(true);
        if (steeringRes.steeringAngleDeg > 15) setTestedRight(true);
      }
    });

    return () => {
      unsub();
    };
  }, [steeringEngine]);

  useEffect(() => {
    if (!lastWristData) return;
    const res = steeringEngine.processPose(
      lastWristData.leftWrist,
      lastWristData.rightWrist,
      lastWristData.landmarks
    );
    setSteeringState(res);

    if (res.isHoldingWheel) {
      if (Math.abs(res.steeringAngleDeg) < 10) setTestedStraight(true);
      if (res.steeringAngleDeg < -15) setTestedLeft(true);
      if (res.steeringAngleDeg > 15) setTestedRight(true);
    }
  }, [lastWristData]);

  const allPassed = testedStraight && testedLeft && testedRight;

  return (
    <div
      id="motion-steering-calibration-screen"
      className="w-full h-full min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 select-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center gap-2"
        >
          <ChevronLeft className="w-5 h-5 text-cyan-400" />
          <span>Quay lại</span>
        </button>

        <h1 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-amber-400">
          CÂN CHỈNH VÔ LĂNG CAMERA
        </h1>

        <div className="w-20" />
      </div>

      {/* Center Demonstration & Live Virtual Wheel */}
      <div className="flex flex-col items-center justify-center max-w-2xl mx-auto text-center gap-6 my-auto">
        <div className="bg-slate-900/80 border border-cyan-500/40 rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-4 w-full">
          {/* Animated Guide Instruction */}
          <div className="text-base md:text-lg font-bold text-cyan-300">
            {steeringState.isHoldingWheel
              ? '✨ Đã nhận diện hai tay! Hãy thử nghiêng sang trái và sang phải nhé!'
              : '👋 Đưa hai tay ra trước camera như đang cầm vô lăng xe đua nào!'}
          </div>

          {/* Virtual Steering Wheel in Real-Time */}
          <div className="relative w-44 h-44 rounded-full border-8 border-cyan-400/80 bg-slate-950/60 flex items-center justify-center shadow-2xl transition-transform duration-75 my-2">
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ transform: `rotate(${steeringState.steeringAngleDeg}deg)` }}
            >
              <div className="w-16 h-16 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center text-2xl">
                🦫
              </div>
              <div className="absolute left-3 right-3 h-3.5 bg-cyan-400 rounded-full" />
              <div className="absolute top-1/2 bottom-3 w-3.5 bg-cyan-400 rounded-full" />
            </div>
          </div>

          <div className="text-sm font-mono font-bold text-slate-300">
            Góc nghiêng: <span className="text-cyan-400 font-black">{Math.round(steeringState.steeringAngleDeg)}°</span>
          </div>

          {/* Checklist of Test Movements */}
          <div className="grid grid-cols-3 gap-3 w-full mt-2">
            <div
              className={`p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${
                testedStraight
                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400'
              }`}
            >
              <CheckCircle2 className={`w-5 h-5 ${testedStraight ? 'text-emerald-400' : 'text-slate-600'}`} />
              <span className="text-xs font-bold">1. Thẳng tay</span>
            </div>

            <div
              className={`p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${
                testedLeft
                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400'
              }`}
            >
              <CheckCircle2 className={`w-5 h-5 ${testedLeft ? 'text-emerald-400' : 'text-slate-600'}`} />
              <span className="text-xs font-bold">2. Rẽ Trái</span>
            </div>

            <div
              className={`p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${
                testedRight
                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400'
              }`}
            >
              <CheckCircle2 className={`w-5 h-5 ${testedRight ? 'text-emerald-400' : 'text-slate-600'}`} />
              <span className="text-xs font-bold">3. Rẽ Phải</span>
            </div>
          </div>
        </div>

        {/* Sensitivity & Controls Configuration */}
        <div className="flex flex-wrap items-center justify-center gap-4 bg-slate-900/60 p-4 rounded-3xl border border-slate-800 w-full">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300">Độ nhạy vô lăng:</span>
            <div className="flex gap-1">
              {(['low', 'normal', 'high'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => onUpdateSettings({ steeringSensitivity: lvl })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    settings.steeringSensitivity === lvl
                      ? 'bg-cyan-500 text-slate-950 shadow-md'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {lvl === 'low' ? 'Thấp' : lvl === 'normal' ? 'Vừa' : 'Cao'}
                </button>
              ))}
            </div>
          </div>

          {/* Auto-Throttle toggle for younger children */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300">Tự động đạp ga (cho bé):</span>
            <button
              onClick={() => onUpdateSettings({ autoThrottle: !settings.autoThrottle })}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                settings.autoThrottle ? 'bg-emerald-500 text-slate-950 shadow-md' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {settings.autoThrottle ? 'BẬT' : 'TẮT'}
            </button>
          </div>
        </div>
      </div>

      {/* Done button */}
      <div className="flex flex-col items-center justify-center max-w-md mx-auto w-full gap-2">
        {!allPassed && (
          <span className="text-xs font-bold text-amber-400 animate-pulse flex items-center gap-1">
            <Lock className="w-3.5 h-3.5" />
            Hãy nghiêng vô lăng thử đủ 3 bước (Thẳng, Trái, Phải) để mở khóa nút!
          </span>
        )}
        <button
          onClick={onDone}
          disabled={!allPassed}
          className={`w-full py-4 rounded-2xl font-black text-lg shadow-xl flex items-center justify-center gap-2 transition-all ${
            allPassed
              ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-cyan-950/50 cursor-pointer active:scale-95'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
          }`}
        >
          <Sparkles className="w-5 h-5 fill-current" />
          <span>HOÀN TẤT & SẴN SÀNG ĐUA</span>
        </button>
      </div>
    </div>
  );
};
