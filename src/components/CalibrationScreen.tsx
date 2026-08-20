/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Camera, CheckCircle2, Sparkles, ArrowLeft, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';
import { GameGesture } from '../types';
import { audio } from '../lib/AudioEngine';
import { voiceGuide } from '../lib/VoiceGuideService';
import { poseDetector, POSE_LANDMARKS } from '../utils/poseDetector';
import { useCameraPose } from '../providers/CameraPoseContext';
import { drawImageContain } from '../utils/cameraFrame';

interface CalibrationScreenProps {
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  isStreaming?: boolean;
  gesture?: GameGesture;
  onComplete?: () => void;
  onSkip?: () => void;
  onCalibrationComplete?: () => void;
  onBack?: () => void;
  targetScreen?: string;
}

export default function CalibrationScreen({
  videoRef,
  canvasRef: propsCanvasRef,
  isStreaming: propsIsStreaming = true,
  gesture = 'standing',
  onComplete,
  onSkip,
  onCalibrationComplete,
  onBack,
  targetScreen,
}: CalibrationScreenProps) {
  const {
    isStreaming,
    cameraError,
    canvasElement,
    startCamera,
    trackingMode,
    setTrackingMode,
  } = useCameraPose();

  const localCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const countdownIntervalRef = useRef<any | null>(null);
  const lastPassTimeRef = useRef<number | null>(null);

  const handleDone = () => {
    if (onComplete) onComplete();
    if (onCalibrationComplete) onCalibrationComplete();
  };

  const handleCancel = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (onSkip) onSkip();
    if (onBack) onBack();
  };

  const [holdingSeconds, setHoldingSeconds] = useState<number>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCalibrated, setIsCalibrated] = useState<boolean>(false);

  const holdingSecondsRef = useRef<number>(0);
  const isCalibratedRef = useRef<boolean>(false);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  // Mirror master canvas to local canvas
  useEffect(() => {
    let animId: number;
    const renderLoop = () => {
      if (isStreaming && localCanvasRef.current && canvasElement) {
        const destCtx = localCanvasRef.current.getContext('2d');
        if (destCtx && canvasElement.width > 0 && canvasElement.height > 0) {
          drawImageContain(
            destCtx,
            canvasElement,
            localCanvasRef.current.width,
            localCanvasRef.current.height,
            false,
          );
        }
      }
      animId = requestAnimationFrame(renderLoop);
    };
    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [isStreaming, canvasElement]);

  // Profile classification
  // V5.14: phone-friendly capability profiles.
  // All gesture games below work from head/shoulders/two hands; feet are optional.
  const isFullBodyRequired = false;
  const isRacingRequired = ['racing'].includes(targetScreen || '');
  const isUpperBodyRequired = [
    'mimic',
    'adventure',
    'workout',
    'randomworkout',
    'workout_session',
    'ninja',
    'goalkeeper',
    'magicacademy',
    'dance',
    'parentplay',
    'ludo',
  ].includes(targetScreen || '');
  const isWristOnlyRequired = ['fruitslash', 'chickenblaster', 'sweetzombie', 'starcatcher'].includes(targetScreen || '');

  // Body position checklist state
  const [checks, setChecks] = useState({
    head: false,
    shoulders: false,
    hips: false,
    feet: false,
  });

  // Speak greeting guide on mount
  useEffect(() => {
    if ((targetScreen || '') === 'ludo') {
      voiceGuide.speak('Cờ Cá Ngựa dùng cử chỉ để tung xúc xắc. Bé hãy để camera thấy rõ đầu, hai vai và hai tay nhé!', 'high');
    } else if (isRacingRequired) {
      voiceGuide.speak('Bé hãy để camera thấy rõ nửa người trên và đưa hai tay ra trước như đang cầm vô lăng nhé!', 'high');
    } else if (isUpperBodyRequired) {
      voiceGuide.speak('Bé chỉ cần để camera thấy rõ nửa người trên và cả hai tay. Không bắt buộc phải thấy bàn chân nhé!', 'high');
    } else if (isFullBodyRequired) {
      voiceGuide.speak('Bé hãy lùi ra xa camera để hiển thị đầy đủ cơ thể từ đầu đến chân nhé!', 'high');
    } else {
      voiceGuide.speak('Bé hãy đứng trước camera và đưa tay vào khung hình nhé!', 'high');
    }
  }, [targetScreen, isFullBodyRequired, isUpperBodyRequired, isRacingRequired]);

  const startCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    setCountdown(3);
    audio.playPowerup();

    let count = 3;
    countdownIntervalRef.current = setInterval(() => {
      count -= 1;
      setCountdown(count);

      if (count <= 0) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        audio.playCollect();
        handleDone();
      } else {
        audio.playPowerup();
      }
    }, 1000);
  };

  // Listen to real Pose Landmarker tracking data
  useEffect(() => {
    if (isCalibrated) return;

    const unsub = poseDetector.addListener((res) => {
      const landmarks = res.landmarks;
      if (!landmarks || landmarks.length === 0) {
        setChecks({ head: false, shoulders: false, hips: false, feet: false });
        holdingSecondsRef.current = 0;
        setHoldingSeconds(0);
        lastPassTimeRef.current = null;
        return;
      }

      const nose = landmarks[POSE_LANDMARKS.NOSE];
      const lShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
      const rShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
      const lHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
      const rHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
      const lAnkle = landmarks[POSE_LANDMARKS.LEFT_ANKLE];
      const rAnkle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE];
      const lWrist = landmarks[POSE_LANDMARKS.LEFT_WRIST];
      const rWrist = landmarks[POSE_LANDMARKS.RIGHT_WRIST];

      const headOk = Boolean(nose && (nose.visibility ?? 1) > 0.35);
      const lShoulderOk = Boolean(lShoulder && (lShoulder.visibility ?? 1) > 0.35);
      const rShoulderOk = Boolean(rShoulder && (rShoulder.visibility ?? 1) > 0.35);
      const bothShouldersOk = lShoulderOk && rShoulderOk;

      const lHipOk = Boolean(lHip && (lHip.visibility ?? 1) > 0.35);
      const rHipOk = Boolean(rHip && (rHip.visibility ?? 1) > 0.35);
      const bothHipsOk = lHipOk && rHipOk;

      const lAnkleOk = Boolean(lAnkle && (lAnkle.visibility ?? 1) > 0.25 && lAnkle.y < 0.965);
      const rAnkleOk = Boolean(rAnkle && (rAnkle.visibility ?? 1) > 0.25 && rAnkle.y < 0.965);
      const bothFeetOk = lAnkleOk && rAnkleOk;

      const lWristOk = Boolean(lWrist && (lWrist.visibility ?? 1) > 0.35);
      const rWristOk = Boolean(rWrist && (rWrist.visibility ?? 1) > 0.35);
      const bothWristsOk = lWristOk && rWristOk;
      const wristOk = lWristOk || rWristOk;

      // Update UI checklists dynamically.
      // For upper-body/racing profiles the last two rows represent HANDS and
      // torso readiness instead of hips/feet.
      setChecks({
        head: headOk,
        shoulders: isFullBodyRequired || isRacingRequired || isUpperBodyRequired
          ? bothShouldersOk
          : (lShoulderOk || rShoulderOk),
        hips: isRacingRequired || isUpperBodyRequired
          ? bothWristsOk
          : (isFullBodyRequired ? bothHipsOk : wristOk),
        feet: isRacingRequired || isUpperBodyRequired
          ? (headOk && bothShouldersOk && bothWristsOk)
          : (isFullBodyRequired ? bothFeetOk : wristOk),
      });

      // Strict check criteria based on target game requirement.
      let pass = false;
      if (isFullBodyRequired) {
        pass = headOk && bothShouldersOk && bothHipsOk && bothFeetOk;
      } else if (isRacingRequired || isUpperBodyRequired) {
        // New default for motion games: head + two shoulders + TWO visible hands.
        pass = headOk && bothShouldersOk && bothWristsOk;
      } else if (isWristOnlyRequired) {
        pass = headOk && (lShoulderOk || rShoulderOk) && wristOk;
      } else {
        pass = headOk && bothShouldersOk && wristOk;
      }

      if (pass) {
        const now = performance.now();
        if (lastPassTimeRef.current === null) {
          lastPassTimeRef.current = now;
        } else {
          const deltaSec = (now - lastPassTimeRef.current) / 1000;
          lastPassTimeRef.current = now;
          const next = Math.min(2.0, holdingSecondsRef.current + deltaSec);
          holdingSecondsRef.current = next;
          setHoldingSeconds(next);

          if (next >= 2.0 && !isCalibratedRef.current) {
            isCalibratedRef.current = true;
            setIsCalibrated(true);
            audio.playSuccess();
            voiceGuide.speak('Thành công rồi! Chuẩn bị bắt đầu nào!', 'high');
            startCountdown();
          }
        }
      } else {
        lastPassTimeRef.current = null;
        holdingSecondsRef.current = 0;
        setHoldingSeconds(0);
      }
    });

    return () => {
      unsub();
    };
  }, [isCalibrated, isFullBodyRequired, isRacingRequired, isUpperBodyRequired, isWristOnlyRequired]);

  const reCalibrate = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    isCalibratedRef.current = false;
    holdingSecondsRef.current = 0;
    setIsCalibrated(false);
    setHoldingSeconds(0);
    setCountdown(null);
  };

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-black/65 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6">
      <div
        id="calibration-container"
        className="flex flex-col gap-4 sm:gap-6 w-full max-w-4xl p-4 sm:p-6 md:p-8 bg-[#FFFAF0] rounded-3xl border-4 border-emerald-300 shadow-2xl font-sans text-slate-800"
        style={{
          backgroundImage:
            'radial-gradient(circle at 10% 20%, rgba(255, 182, 193, 0.3) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(173, 216, 230, 0.3) 0%, transparent 40%)',
        }}
      >
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-emerald-200 pb-4">
        <button
          onClick={handleCancel}
          className="flex items-center gap-2 px-4 py-2 rounded-full font-bold bg-white text-emerald-700 border-2 border-emerald-200 hover:bg-emerald-50 transition shadow-sm text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </button>

        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-black text-emerald-700 flex items-center justify-center gap-2">
            <Camera className="w-7 h-7 text-emerald-500" />
            Sẵn Sàng Phiêu Lưu!
          </h2>
          <p className="text-xs text-slate-500 font-bold mt-0.5">
            Giữ đúng tỷ lệ camera • thấy rõ đầu, vai và hai tay khoảng 2 giây là chơi được!
          </p>
        </div>

        <button
          onClick={reCalibrate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Đo Lại
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left 7 cols: Video Stage with Silhouette Overlay */}
        <div className="md:col-span-7 flex flex-col items-center gap-3">
          <div className="relative aspect-[4/3] w-full rounded-3xl overflow-hidden border-4 border-emerald-400 bg-slate-900 shadow-2xl flex items-center justify-center">
            {isStreaming ? (
              <>
                <canvas ref={localCanvasRef} width={640} height={480} className="w-full h-full object-contain bg-black" />

                {/* Framing guide follows the capability required by the game.
                    It is only a guide; the camera image itself is never stretched/cropped. */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  {isUpperBodyRequired || isRacingRequired || isWristOnlyRequired ? (
                    <svg viewBox="0 0 200 220" className="h-4/5 opacity-40 stroke-emerald-300 stroke-2 fill-none animate-pulse">
                      <circle cx="100" cy="46" r="27" strokeDasharray="4 4" />
                      <path d="M48,105 L152,105 M100,75 L100,188" strokeDasharray="4 4" />
                      <path d="M48,105 L24,165 M152,105 L176,165" strokeDasharray="4 4" />
                      <circle cx="22" cy="170" r="10" strokeDasharray="4 4" />
                      <circle cx="178" cy="170" r="10" strokeDasharray="4 4" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 200 300" className="h-5/6 opacity-40 stroke-emerald-300 stroke-2 fill-none animate-pulse">
                      <circle cx="100" cy="50" r="28" strokeDasharray="4 4" />
                      <path d="M50,110 L150,110 M100,78 L100,190" strokeDasharray="4 4" />
                      <path d="M70,190 L60,280 M130,190 L140,280" strokeDasharray="4 4" />
                    </svg>
                  )}
                </div>

                {/* Hold Timer Progress Bar */}
                {!isCalibrated && (
                  <div className="absolute bottom-4 left-6 right-6 bg-black/60 backdrop-blur-md p-3 rounded-2xl flex flex-col gap-1.5 border border-white/20">
                    <div className="flex justify-between items-center text-xs font-bold text-white">
                      <span>🧍 Đang căn chỉnh tư thế...</span>
                      <span>{Math.round((holdingSeconds / 2) * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-400 h-full transition-all duration-300"
                        style={{ width: `${(holdingSeconds / 2) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Big Countdown Overlay */}
                {countdown !== null && countdown > 0 && (
                  <div className="absolute inset-0 bg-emerald-600/80 backdrop-blur-md flex flex-col items-center justify-center text-white z-20">
                    <span className="text-8xl font-black animate-ping">{countdown}</span>
                    <p className="text-xl font-bold mt-4">BẮT ĐẦU PHIÊU LƯU!</p>
                  </div>
                )}
              </>
            ) : (
              <div className="p-8 text-center text-white max-w-md flex flex-col items-center">
                <Camera className="w-12 h-12 mx-auto text-rose-400 mb-3 animate-bounce" />
                <p className="font-extrabold text-base text-rose-300 leading-snug">Không mở được Camera của bé</p>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  {cameraError || 'Trình duyệt hoặc khung hiển thị (iFrame) đang chặn quyền truy cập Camera.'}
                </p>
                <p className="text-[11px] text-pink-300 mt-1 font-bold">
                  💡 Cách sửa: Nhấn nút "Mở trong Tab Mới" để cấp quyền và chơi mượt nhất!
                </p>

                <div className="mt-5 flex flex-wrap gap-2 justify-center">
                  <a
                    href={window.location.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-full shadow-md transition flex items-center gap-1"
                  >
                    🌐 Mở trong Tab Mới
                  </a>
                  <button
                    onClick={() => startCamera()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-full shadow-md transition"
                  >
                    🔄 Thử lại
                  </button>
                  <button
                    onClick={() => {
                      setTrackingMode('keyboard_only');
                      handleCancel();
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 text-xs font-bold rounded-full shadow-md transition"
                  >
                    ⌨️ Chơi bằng Bàn phím
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 5 cols: Body Parts Verification Checklist */}
        <div className="md:col-span-5 flex flex-col gap-4 bg-white p-6 rounded-3xl border-4 border-emerald-200 shadow-md">
          <h3 className="font-black text-lg text-emerald-800 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Kiểm Tra Vị Trí Bé
          </h3>

          <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-[11px] font-black text-cyan-800">
            {isRacingRequired || isUpperBodyRequired
              ? '📷 CHẾ ĐỘ: NỬA NGƯỜI TRÊN + 2 TAY'
              : isWristOnlyRequired
              ? '📷 CHẾ ĐỘ: TAY / CỔ TAY'
              : '📷 CHẾ ĐỘ: TOÀN THÂN'}
          </div>

          <div className="flex flex-col gap-3">
            <div className={`flex items-center justify-between p-3 rounded-2xl border ${checks.head ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
              <span className="font-bold text-sm text-slate-700 flex items-center gap-2">
                🗣️ Đầu & Khuôn Mặt
              </span>
              {checks.head ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-100" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-400" />
              )}
            </div>

            <div className={`flex items-center justify-between p-3 rounded-2xl border ${checks.shoulders ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
              <span className="font-bold text-sm text-slate-700 flex items-center gap-2">
                🦾 Hai Vai & Cánh Tay
              </span>
              {checks.shoulders ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-100" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-400" />
              )}
            </div>

            <div className={`flex items-center justify-between p-3 rounded-2xl border ${checks.hips ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
              <span className="font-bold text-sm text-slate-700 flex items-center gap-2">
                {isUpperBodyRequired || isRacingRequired ? '👐 Hai Tay' : '🦵 Hông & Đầu Gối'}
              </span>
              {checks.hips ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-100" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-400" />
              )}
            </div>

            <div className={`flex items-center justify-between p-3 rounded-2xl border ${checks.feet ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
              <span className="font-bold text-sm text-slate-700 flex items-center gap-2">
                {isUpperBodyRequired || isRacingRequired ? '✅ Nửa Người Trên Sẵn Sàng' : '👟 Bàn Chân'}
              </span>
              {checks.feet ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-100" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-400" />
              )}
            </div>
          </div>

          {isCalibrated && (
            <div className="mt-2 p-3 bg-emerald-100 border-2 border-emerald-300 rounded-2xl text-center">
              <Sparkles className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
              <p className="font-black text-xs text-emerald-800">Căn chỉnh hoàn hảo!</p>
              <p className="text-[10px] text-emerald-700 font-bold">Chuẩn bị xuất phát nào!</p>
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
