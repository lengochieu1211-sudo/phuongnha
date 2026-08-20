/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { Camera, Check, AlertCircle, Sparkles } from 'lucide-react';
import { useCameraPose } from '../../providers/CameraPoseContext';
import { audio } from '../../lib/AudioEngine';
import { voiceGuide } from '../../lib/VoiceGuideService';

interface FashionCalibrationProps {
  onCalibrationSuccess: (fullBody: boolean) => void;
  onSkip: () => void;
}

export default function FashionCalibration({
  onCalibrationSuccess,
  onSkip
}: FashionCalibrationProps) {
  const { landmarks, isStreaming, bodyDetected } = useCameraPose();
  
  const [checklist, setChecklist] = useState({
    face: false,
    leftShoulder: false,
    rightShoulder: false,
    leftElbow: false,
    rightElbow: false,
    leftWrist: false,
    rightWrist: false,
    leftHip: false,
    rightHip: false,
    leftKnee: false,
    rightKnee: false,
    leftAnkle: false,
    rightAnkle: false,
  });

  const [stabilityProgress, setStabilityProgress] = useState(0); // 0 to 100%
  const [fullBodyReady, setFullBodyReady] = useState(false);
  const [upperBodyReady, setUpperBodyReady] = useState(false);
  const [anyBodyDetected, setAnyBodyDetected] = useState(false);
  
  const stabilityStartRef = useRef<number | null>(null);
  const lastCheckSuccessRef = useRef<boolean>(false);
  const voiceTriggeredRef = useRef<boolean>(false);

  const onCalibrationSuccessRef = useRef(onCalibrationSuccess);
  useEffect(() => {
    onCalibrationSuccessRef.current = onCalibrationSuccess;
  }, [onCalibrationSuccess]);

  useEffect(() => {
    // Speak stepping back guideline on load
    if (!voiceTriggeredRef.current) {
      voiceTriggeredRef.current = true;
      audio.playCollect();
      setTimeout(() => {
        voiceGuide.speak('Chỉ cần thấy rõ mặt, vai, khuỷu tay và hai cổ tay là có thể thử đồ nửa người. Nếu thấy thêm chân, gương sẽ tự mở chế độ toàn thân nhé!', 'high');
      }, 500);
    }
  }, []);

  useEffect(() => {
    if (!landmarks || landmarks.length === 0) {
      if (checklist.face || checklist.leftShoulder || checklist.rightShoulder || checklist.leftHip || checklist.rightHip || checklist.leftKnee || checklist.rightKnee || checklist.leftAnkle || checklist.rightAnkle) {
        setChecklist({
          face: false,
          leftShoulder: false,
          rightShoulder: false,
          leftElbow: false,
          rightElbow: false,
          leftWrist: false,
          rightWrist: false,
          leftHip: false,
          rightHip: false,
          leftKnee: false,
          rightKnee: false,
          leftAnkle: false,
          rightAnkle: false,
        });
      }
      if (stabilityProgress !== 0) {
        setStabilityProgress(0);
      }
      stabilityStartRef.current = null;
      lastCheckSuccessRef.current = false;
      if (anyBodyDetected !== false) {
        setAnyBodyDetected(false);
      }
      if (fullBodyReady !== false) {
        setFullBodyReady(false);
      }
      if (upperBodyReady !== false) {
        setUpperBodyReady(false);
      }
      return;
    }

    if (anyBodyDetected !== true) {
      setAnyBodyDetected(true);
    }

    const getVis = (index: number) => {
      const lm = landmarks[index];
      return lm && lm.visibility !== undefined ? lm.visibility >= 0.5 : false;
    };

    const faceVis = [0,1,2,3,4,5,6,7,8,9,10].filter(getVis).length >= 7;
    const lsVis = getVis(11);
    const rsVis = getVis(12);
    const leVis = getVis(13);
    const reVis = getVis(14);
    const lwVis = getVis(15);
    const rwVis = getVis(16);
    const lhVis = getVis(23);
    const rhVis = getVis(24);
    const lkVis = getVis(25);
    const rkVis = getVis(26);
    const laVis = getVis(27);
    const raVis = getVis(28);

    const checklistChanged = 
      checklist.face !== faceVis ||
      checklist.leftShoulder !== lsVis ||
      checklist.rightShoulder !== rsVis ||
      checklist.leftElbow !== leVis ||
      checklist.rightElbow !== reVis ||
      checklist.leftWrist !== lwVis ||
      checklist.rightWrist !== rwVis ||
      checklist.leftHip !== lhVis ||
      checklist.rightHip !== rhVis ||
      checklist.leftKnee !== lkVis ||
      checklist.rightKnee !== rkVis ||
      checklist.leftAnkle !== laVis ||
      checklist.rightAnkle !== raVis;

    if (checklistChanged) {
      setChecklist({
        face: faceVis,
        leftShoulder: lsVis,
        rightShoulder: rsVis,
        leftElbow: leVis,
        rightElbow: reVis,
        leftWrist: lwVis,
        rightWrist: rwVis,
        leftHip: lhVis,
        rightHip: rhVis,
        leftKnee: lkVis,
        rightKnee: rkVis,
        leftAnkle: laVis,
        rightAnkle: raVis,
      });
    }

    // Adaptive fashion calibration:
    // Upper body is sufficient for hair/face/shirt/gloves/necklace/backpack.
    // Full body simply unlocks lower-body fitting such as shoes.
    const isUpperBodyValid = faceVis && lsVis && rsVis && leVis && reVis && lwVis && rwVis;
    const isFullBodyValid = isUpperBodyValid && lhVis && rhVis && lkVis && rkVis && laVis && raVis;

    if (upperBodyReady !== isUpperBodyValid) {
      setUpperBodyReady(isUpperBodyValid);
    }
    if (fullBodyReady !== isFullBodyValid) {
      setFullBodyReady(isFullBodyValid);
    }

    const now = performance.now();

    if (isUpperBodyValid) {
      if (!stabilityStartRef.current) {
        stabilityStartRef.current = now;
        audio.playCombo();
      }

      const elapsed = now - stabilityStartRef.current;
      const duration = 1200;
      const percentage = Math.min(100, Math.floor((elapsed / duration) * 100));
      if (stabilityProgress !== percentage) {
        setStabilityProgress(percentage);
      }

      if (elapsed >= duration && !lastCheckSuccessRef.current) {
        lastCheckSuccessRef.current = true;
        audio.playSuccess();

        voiceGuide.speak(
          isFullBodyValid
            ? 'Toàn thân đã sẵn sàng!'
            : 'Nửa người trên và hai tay đã sẵn sàng!',
          'high'
        );

        setTimeout(() => {
          onCalibrationSuccessRef.current(isFullBodyValid);
        }, 350);
      }
    } else {
      stabilityStartRef.current = null;
      if (stabilityProgress !== 0) {
        setStabilityProgress(0);
      }
      lastCheckSuccessRef.current = false;
    }
  }, [landmarks]);

  return (
    <div id="fashion-calibration-container" className="flex flex-col items-center justify-center p-6 bg-white/95 backdrop-blur-md rounded-3xl border-4 border-purple-200 shadow-2xl max-w-xl w-full mx-auto relative select-none">
      <div className="absolute -top-6 bg-purple-600 text-white px-5 py-1.5 rounded-full text-xs font-black shadow-lg flex items-center gap-1">
        <Camera className="w-4 h-4 animate-pulse" />
        QUÉT XƯƠNG CHI TIẾT 33 ĐIỂM
      </div>

      <div className="text-center mt-4">
        <h3 className="text-xl md:text-2xl font-black text-purple-800">Căn Chỉnh Gương Phép Thuật</h3>
        <p className="text-xs text-slate-500 font-bold mt-1 max-w-md mx-auto leading-relaxed">
          Không ép khoảng cách cố định. Chỉ cần camera thấy rõ mặt, vai, khuỷu tay và hai cổ tay là chơi được. Hông, gối và bàn chân là phần nâng cao để thử đồ toàn thân.
        </p>
      </div>

      <div className={`mt-4 w-full rounded-2xl border px-3 py-2 text-xs font-black text-center ${
        fullBodyReady
          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
          : upperBodyReady
          ? 'bg-cyan-50 border-cyan-200 text-cyan-700'
          : 'bg-amber-50 border-amber-200 text-amber-700'
      }`}>
        {fullBodyReady
          ? '✅ TOÀN THÂN — thử được cả trang phục và giày'
          : upperBodyReady
          ? '✅ NỬA NGƯỜI + 2 TAY — đủ để thử tóc, kính, áo và phụ kiện'
          : '📷 Đưa mặt, vai, khuỷu tay và hai tay vào khung'}
      </div>

      {/* Checklist items list */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full my-4 p-4 bg-purple-50/50 rounded-2xl border border-purple-100">
        <CheckItem label="Mặt (mắt/mũi/tai/miệng)" checked={checklist.face} />
        <CheckItem label="Vai trái" checked={checklist.leftShoulder} />
        <CheckItem label="Vai phải" checked={checklist.rightShoulder} />
        <CheckItem label="Khuỷu tay trái" checked={checklist.leftElbow} />
        <CheckItem label="Khuỷu tay phải" checked={checklist.rightElbow} />
        <CheckItem label="Cổ tay trái" checked={checklist.leftWrist} />
        <CheckItem label="Cổ tay phải" checked={checklist.rightWrist} />
        <CheckItem label="Hông trái" checked={checklist.leftHip} />
        <CheckItem label="Hông phải" checked={checklist.rightHip} />
        <CheckItem label="Đầu gối trái" checked={checklist.leftKnee} />
        <CheckItem label="Đầu gối phải" checked={checklist.rightKnee} />
        <CheckItem label="Bàn chân trái" checked={checklist.leftAnkle} />
        <CheckItem label="Bàn chân phải" checked={checklist.rightAnkle} />
      </div>

      {/* Stability bar or guidance */}
      <div className="w-full flex flex-col gap-2">
        {upperBodyReady ? (
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-black text-emerald-600 flex items-center gap-1.5 animate-bounce">
              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
              {fullBodyReady ? 'Giữ tư thế toàn thân!' : 'Giữ nửa người trên và hai tay!'}
            </span>
            <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all duration-75"
                style={{ width: `${stabilityProgress}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-slate-400">{stabilityProgress}% Hoàn thành...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-amber-600 bg-amber-50/60 p-3.5 rounded-xl border border-amber-100">
            <AlertCircle className="w-5 h-5 flex-shrink-0 animate-pulse" />
            <span className="text-xs font-bold leading-relaxed">
              {!anyBodyDetected
                ? 'Đang tìm người trước camera...'
                : 'Không cần thấy chân: hãy đưa rõ mặt, hai vai, khuỷu tay và hai cổ tay vào khung.'}
            </span>
          </div>
        )}
      </div>

      {/* Action bar */}
      <div className="flex gap-3 mt-6 w-full pt-4 border-t border-slate-100">
        <button
          onClick={() => onCalibrationSuccess(false)}
          className="flex-1 py-2.5 rounded-full font-bold bg-amber-500 hover:bg-amber-600 text-white text-xs shadow-md transition"
        >
          Thử đồ nửa người (Không thấy chân) 🧍
        </button>
        <button
          onClick={onSkip}
          className="px-5 py-2.5 rounded-full font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs transition"
        >
          Bỏ qua
        </button>
      </div>
    </div>
  );
}

function CheckItem({ label, checked }: { label: string; checked: boolean }) {
  return (
    <div className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
      checked 
        ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
        : 'bg-white border-slate-200 text-slate-400'
    }`}>
      <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
        checked 
          ? 'bg-emerald-500 border-emerald-600 text-white' 
          : 'bg-slate-50 border-slate-300 text-transparent'
      }`}>
        <Check className="w-3 h-3 stroke-[3px]" />
      </div>
      <span className="text-[10px] font-extrabold tracking-tight truncate">{label}</span>
    </div>
  );
}
