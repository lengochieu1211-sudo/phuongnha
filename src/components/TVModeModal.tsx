import React, { useEffect, useRef, useState } from 'react';
import { Cast, Copy, Maximize, Monitor, Smartphone, Tv, X } from 'lucide-react';

interface Props { isOpen:boolean; onClose:()=>void; }

export default function TVModeModal({isOpen,onClose}:Props){
  const [copied,setCopied]=useState(false);
  const [wakeLock,setWakeLock]=useState<any>(null);
  const copiedTimerRef = useRef<number | null>(null);
  const tvUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?tv=1` : '';
  useEffect(()=>()=>{ try{ wakeLock?.release?.(); }catch{} if(copiedTimerRef.current!==null) window.clearTimeout(copiedTimerRef.current); },[wakeLock]);
  if(!isOpen) return null;
  const fullscreen=async()=>{ try{ await document.documentElement.requestFullscreen?.(); }catch{} try{ if('wakeLock' in navigator){ const l=await (navigator as any).wakeLock.request('screen'); setWakeLock(l); }}catch{} };
  const copy=async()=>{ try{ await navigator.clipboard.writeText(tvUrl); setCopied(true); if(copiedTimerRef.current!==null) window.clearTimeout(copiedTimerRef.current); copiedTimerRef.current=window.setTimeout(()=>{ copiedTimerRef.current=null; setCopied(false); },1500);}catch{} };
  return <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3" role="dialog" aria-modal="true">
    <div className="w-full max-w-3xl max-h-[92dvh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-sky-100">
      <div className="sticky top-0 z-10 flex items-center justify-between p-4 md:p-5 bg-white/95 backdrop-blur border-b rounded-t-3xl">
        <div><h2 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2"><Tv className="text-sky-600"/> Chế độ TV / Mi Box</h2><p className="text-xs md:text-sm text-slate-500 font-semibold">Webcam USB trực tiếp hoặc Cast từ điện thoại</p></div>
        <button onClick={onClose} className="p-2 rounded-full bg-slate-100 hover:bg-slate-200" aria-label="Đóng"><X/></button>
      </div>
      <div className="p-4 md:p-6 space-y-4">
        <section className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4">
          <div className="flex gap-3"><Smartphone className="shrink-0 text-emerald-700"/><div><h3 className="font-black text-emerald-950">Dễ dùng nhất: điện thoại chạy game, Cast lên Mi Box</h3><p className="text-sm text-emerald-900 mt-1">Mở game trên điện thoại rồi phản chiếu/Cast lên TV. Đặt điện thoại dưới hoặc cạnh TV. Đua 1P/2P chỉ cần thấy đầu + vai + hai tay; không cần lùi cho thấy chân. Với 2P, P1 đứng bên trái và P2 bên phải, tách nhau một chút.</p></div></div>
          <button onClick={fullscreen} className="mt-3 w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center gap-2"><Maximize size={18}/> Toàn màn hình + giữ màn hình sáng</button>
        </section>
        <section className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
          <div className="flex gap-3"><Monitor className="shrink-0 text-sky-700"/><div className="min-w-0"><h3 className="font-black text-sky-950">Mở trực tiếp trên Mi Box</h3><p className="text-sm text-sky-900 mt-1">Dùng trình duyệt trên Mi Box mở địa chỉ dưới đây. Chế độ <b>?tv=1</b> tự phóng giao diện cho khoảng cách xem TV. Game camera trực tiếp cần webcam USB mà trình duyệt Android TV nhận được qua getUserMedia(). Đua 2 người dùng cùng một webcam: P1 trái, P2 phải; hệ thống tự giảm pose FPS, DPR, shadow và FBX nặng.</p><div className="mt-2 flex gap-2"><code className="min-w-0 flex-1 text-xs bg-white border rounded-lg px-2 py-2 truncate">{tvUrl}</code><button onClick={copy} className="px-3 rounded-lg bg-sky-600 text-white"><Copy size={17}/></button></div>{copied&&<p className="text-xs font-bold text-emerald-700 mt-1">Đã sao chép địa chỉ.</p>}</div></div>
        </section>
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-black flex items-center gap-2"><Cast size={18}/> Lưu ý về ghép điện thoại → TV riêng biệt</p><p className="mt-1">Bản này không giả lập kết nối điều khiển qua Internet. Để điện thoại chỉ gửi pose còn Mi Box tự render 3D cần một kênh signaling/relay (ví dụ Firebase/WebRTC server). Khi chưa cấu hình backend, Cast/mirroring là chế độ ổn định và miễn phí nhất.</p>
        </section>
        <section className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-950">
          <p className="font-black">Cấu hình Android TV khuyến nghị</p>
          <p className="mt-1">1 người: RAM 2 GB vẫn có thể chạy Balanced. 2 người + 1 webcam: nên RAM 4 GB trở lên, WebGL2, trình duyệt Chromium mới và webcam 720p/30fps. Mi Box yếu sẽ dùng xe fallback nhẹ, tắt shadow và hạ độ phân giải render tự động.</p>
        </section>
        <div className="grid sm:grid-cols-3 gap-2 text-center text-xs font-bold text-slate-600"><div className="rounded-xl bg-slate-50 p-3">📷 Camera khoảng 1.5–3 m</div><div className="rounded-xl bg-slate-50 p-3">🙌 Chỉ cần đầu + vai + 2 tay</div><div className="rounded-xl bg-slate-50 p-3">📺 2P ưu tiên màn hình ngang</div></div>
      </div>
    </div>
  </div>
}
