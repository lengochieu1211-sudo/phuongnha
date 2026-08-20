import React from 'react';
import { X, Sparkles, Shield, Zap, Gauge, Hand } from 'lucide-react';

interface Props { onClose: () => void; compact?: boolean; }

const gestures = [
  { icon: '👐', title: 'Cầm vô-lăng', text: 'Đưa 2 tay trước ngực. Nghiêng đường nối hai tay để rẽ trái / phải.', tone: 'cyan' },
  { icon: '🙌', title: 'Nitro', text: 'Giơ cả hai tay cao hơn vai để kích hoạt Nitro khi bình còn năng lượng.', tone: 'amber' },
  { icon: '🪽', title: 'Khiên', text: 'Dang hai tay ngang vai để bật khiên bảo vệ ngắn. Có thời gian hồi để tránh kích hoạt liên tục.', tone: 'violet' },
  { icon: '🙇', title: 'Phanh', text: 'Hạ thấp vai / cúi người rõ ràng để phanh. Auto-ga vẫn giữ cho bé dễ chơi.', tone: 'rose' },
];

export function RaceGestureGuide({ onClose, compact = false }: Props) {
  return (
    <div className="absolute inset-0 z-[70] flex items-center justify-center bg-slate-950/82 p-3 backdrop-blur-md pointer-events-auto">
      <div className="w-full max-w-3xl rounded-3xl border border-cyan-400/35 bg-gradient-to-b from-slate-900 to-indigo-950 p-4 md:p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-cyan-300 text-xs font-black uppercase tracking-widest"><Sparkles className="w-4 h-4"/> Hướng dẫn cử chỉ camera</div>
            <h3 className="mt-1 text-xl md:text-2xl font-black text-white">1 camera · 1 hoặc 2 người</h3>
            <p className="mt-1 text-xs md:text-sm text-slate-300">2 người: <b className="text-cyan-300">P1 đứng bên trái</b>, <b className="text-pink-300">P2 đứng bên phải</b> trong hình camera. Đứng tách nhau để hệ thống không nhận nhầm.</p>
          </div>
          <button onClick={onClose} className="rounded-full bg-white/10 p-2 hover:bg-white/20"><X className="w-5 h-5"/></button>
        </div>
        <div className={`mt-4 grid ${compact ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'} gap-2 md:gap-3`}>
          {gestures.map((g) => (
            <div key={g.title} className="rounded-2xl border border-white/10 bg-white/[0.06] p-3 text-center">
              <div className="text-3xl">{g.icon}</div>
              <div className="mt-1 text-sm font-black text-white">{g.title}</div>
              <p className="mt-1 text-[10px] md:text-xs leading-relaxed text-slate-300">{g.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-2xl border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-[11px] md:text-xs font-bold text-amber-100">
          Mẹo: không cần thấy chân. Chỉ cần đầu + vai + khuỷu + hai cổ tay. Nếu một người mất khỏi khung hình, hệ thống giữ ID ngắn hạn rồi tự giảm tốc xe của người đó; tuyệt đối không đổi sang người còn lại.
        </div>
      </div>
    </div>
  );
}
