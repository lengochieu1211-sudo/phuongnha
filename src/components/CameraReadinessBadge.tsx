import React from 'react';
import { useCameraPose } from '../providers/CameraPoseContext';

const labels: Record<string,string> = {
  ok: 'Sẵn sàng',
  too_near: 'Lùi ra xa một chút',
  too_far: 'Lại gần camera',
  no_body: 'Đứng vào khung hình',
  no_legs: 'Chưa thấy chân',
  not_centered: 'Đứng vào giữa khung',
};

export default function CameraReadinessBadge({compact=false}:{compact?:boolean}){
  const {
    isStreaming,
    bodyDetected,
    fullBodyDetected,
    leftWrist,
    rightWrist,
    poseConfidence,
    poseFps,
    trackingFeedback,
  } = useCameraPose();

  const upperBodyReady = isStreaming && bodyDetected && leftWrist.visible && rightWrist.visible;
  const ready = fullBodyDetected || upperBodyReady;

  const readinessText = fullBodyDetected
    ? 'Toàn thân sẵn sàng'
    : upperBodyReady
    ? 'Nửa người + 2 tay sẵn sàng'
    : isStreaming
    ? (labels[trackingFeedback] || 'Đang nhận diện')
    : 'Camera chưa bật';

  return (
    <div className={`pointer-events-none rounded-full border backdrop-blur-md shadow-lg flex items-center gap-2 ${
      compact?'px-2 py-1 text-[10px]':'px-3 py-1.5 text-xs'
    } ${
      ready
        ? 'bg-emerald-950/80 border-emerald-400 text-emerald-100'
        : 'bg-slate-950/80 border-amber-400 text-amber-100'
    }`}>
      <span className={`w-2 h-2 rounded-full ${ready?'bg-emerald-400 animate-pulse':'bg-amber-400'}`}/>
      <b>{readinessText}</b>
      {isStreaming && <span className="opacity-70">{Math.round(poseConfidence*100)}% · {Math.round(poseFps)}fps</span>}
    </div>
  );
}
