import React from 'react';
import { ChevronLeft, Play, Camera, CheckCircle2, AlertTriangle } from 'lucide-react';
import { CarModelId, PlayerRaceProfile } from '../../types';
import { CAR_CATALOG } from '../../lib/racing/CarData';
import { DeviceClass } from '../../utils/graphicsQuality';

interface Props {
  profile: PlayerRaceProfile;
  p1CarId: CarModelId;
  p2CarId: CarModelId;
  onP1Car: (id: CarModelId) => void;
  onP2Car: (id: CarModelId) => void;
  p1Detected: boolean;
  p2Detected: boolean;
  poseFps: number;
  deviceClass: DeviceClass;
  onBack: () => void;
  onContinue: () => void;
  onSwitchToSolo: () => void;
}

export function DuoRaceSetup(props: Props) {
  const unlocked = CAR_CATALOG.filter((c) => props.profile.unlockedCars.includes(c.id));
  const selector = (player: 1 | 2, selected: CarModelId, onSelect: (id: CarModelId) => void) => (
    <div className={`rounded-3xl border p-3 ${player === 1 ? 'border-cyan-400/35 bg-cyan-950/25' : 'border-pink-400/35 bg-pink-950/20'}`}>
      <div className={`mb-2 text-xs font-black uppercase tracking-widest ${player === 1 ? 'text-cyan-300' : 'text-pink-300'}`}>P{player} · Chọn xe</div>
      <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
        {unlocked.map((car) => (
          <button key={car.id} onClick={() => onSelect(car.id)} className={`min-w-[145px] snap-start rounded-2xl border px-3 py-3 text-left transition ${selected === car.id ? (player === 1 ? 'border-cyan-300 bg-cyan-500/20' : 'border-pink-300 bg-pink-500/20') : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
            <div className="text-2xl">{car.category === 'motorcycle' ? '🏍️' : '🏎️'}</div>
            <div className="mt-1 text-xs font-black text-white line-clamp-2">{car.name}</div>
            <div className="mt-1 text-[9px] uppercase font-bold text-slate-400">{car.category}</div>
          </button>
        ))}
      </div>
    </div>
  );

  const lowDevice = props.deviceClass === 'phone' || props.deviceClass === 'tv';
  return (
    <div className="min-h-screen w-full overflow-y-auto bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 p-4 md:p-6 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between gap-3">
          <button onClick={props.onBack} className="flex items-center gap-1 rounded-2xl bg-white/10 px-3 py-2 text-xs font-black"><ChevronLeft className="w-4 h-4"/> Quay lại</button>
          <div className="text-center"><h2 className="text-xl md:text-3xl font-black">ĐUA 2 NGƯỜI · 1 CAMERA</h2><p className="text-[10px] md:text-xs font-bold text-slate-400">P1 bên trái · P2 bên phải · chỉ cần nửa người trên + 2 tay</p></div>
          <div className="w-20" />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className={`rounded-2xl border p-3 text-center ${props.p1Detected ? 'border-emerald-400 bg-emerald-500/10' : 'border-amber-400/40 bg-amber-500/10'}`}>
            <div className="text-2xl">🧒</div><div className="text-sm font-black text-cyan-300">P1 · BÊN TRÁI</div><div className="mt-1 text-xs font-bold">{props.p1Detected ? '✓ Đã nhận đầu + vai + 2 tay' : 'Đang tìm P1...'}</div>
          </div>
          <div className={`rounded-2xl border p-3 text-center ${props.p2Detected ? 'border-emerald-400 bg-emerald-500/10' : 'border-amber-400/40 bg-amber-500/10'}`}>
            <div className="text-2xl">🧑</div><div className="text-sm font-black text-pink-300">P2 · BÊN PHẢI</div><div className="mt-1 text-xs font-bold">{props.p2Detected ? '✓ Đã nhận đầu + vai + 2 tay' : 'Đang tìm P2...'}</div>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400"><Camera className="w-3.5 h-3.5"/> Pose 2P: {props.poseFps || 0} FPS · game render chạy độc lập</div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {selector(1, props.p1CarId, props.onP1Car)}
          {selector(2, props.p2CarId, props.onP2Car)}
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
          {[['👐','Lái','Nghiêng 2 tay'],['🙌','Nitro','Hai tay lên'],['🪽','Khiên','Dang hai tay'],['🙇','Phanh','Cúi/hạ vai']].map(([i,t,d]) => <div key={t} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center"><div className="text-2xl">{i}</div><div className="text-xs font-black">{t}</div><div className="text-[10px] text-slate-400">{d}</div></div>)}
        </div>

        {lowDevice && <div className="mt-4 flex gap-2 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-3 text-xs text-amber-100"><AlertTriangle className="w-5 h-5 shrink-0"/><span>Thiết bị {props.deviceClass === 'tv' ? 'Android TV/Mi Box' : 'điện thoại'} sẽ tự giảm DPR, shadow, particle và pose inference khi chơi 2 người. FBX nặng dùng fallback nhẹ để giữ FPS.</span></div>}

        {(!props.p1Detected || !props.p2Detected) && (
          <div className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-3 text-xs font-bold text-amber-100">
            Camera chưa nhận đủ 2 người. Vẫn có thể vào đua: người chưa được nhận sẽ dùng auto-throttle + phím dự phòng, và tự chuyển lại cử chỉ ngay khi MediaPipe nhận được.
            <div className="mt-2 text-[10px] text-amber-200/80">P1: A/D lái · S phanh · Shift trái/Space Nitro · P2: ←/→ lái · ↓ phanh · Shift phải/Enter/Numpad0 Nitro</div>
          </div>
        )}
        <button onClick={props.onContinue} className="mt-5 w-full rounded-2xl py-4 font-black flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-400 via-violet-500 to-pink-500 text-white shadow-xl active:scale-[0.99]">
          <Play className="w-5 h-5 fill-current"/> {props.p1Detected && props.p2Detected ? 'TIẾP TỤC CHỌN ĐƯỜNG ĐUA' : 'TIẾP TỤC · CÓ FALLBACK'}
        </button>
        {(!props.p1Detected || !props.p2Detected) && (
          <button onClick={props.onSwitchToSolo} className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 py-3 text-xs font-black text-slate-200 hover:bg-white/10">
            Muốn chơi nhẹ hơn? Chuyển sang 1 người
          </button>
        )}
      </div>
    </div>
  );
}
