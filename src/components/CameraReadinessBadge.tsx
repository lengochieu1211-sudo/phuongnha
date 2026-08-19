import React from 'react';
import { useCameraPose } from '../providers/CameraPoseContext';

const labels: Record<string,string> = { ok:'Sẵn sàng', too_near:'Lùi ra xa một chút', too_far:'Lại gần camera', no_body:'Đứng vào khung hình', no_legs:'Camera cần thấy chân', not_centered:'Đứng vào giữa khung' };
export default function CameraReadinessBadge({compact=false}:{compact?:boolean}){
 const {isStreaming, bodyDetected, poseConfidence, poseFps, trackingFeedback}=useCameraPose();
 const ok=isStreaming && bodyDetected && trackingFeedback==='ok';
 return <div className={`pointer-events-none rounded-full border backdrop-blur-md shadow-lg flex items-center gap-2 ${compact?'px-2 py-1 text-[10px]':'px-3 py-1.5 text-xs'} ${ok?'bg-emerald-950/80 border-emerald-400 text-emerald-100':'bg-slate-950/80 border-amber-400 text-amber-100'}`}>
   <span className={`w-2 h-2 rounded-full ${ok?'bg-emerald-400 animate-pulse':'bg-amber-400'}`}/>
   <b>{isStreaming ? (labels[trackingFeedback] || 'Đang nhận diện') : 'Camera chưa bật'}</b>
   {isStreaming && <span className="opacity-70">{Math.round(poseConfidence*100)}% · {Math.round(poseFps)}fps</span>}
 </div>;
}
