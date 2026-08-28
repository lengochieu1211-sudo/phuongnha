import React from 'react';
import { ChevronLeft, Play, Camera, AlertTriangle, Keyboard, Gamepad2 } from 'lucide-react';
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
      <div className="garage-car-strip flex gap-2 overflow-x-auto pb-2 snap-x overscroll-x-contain">
        {unlocked.map((car) => (
          <button
            key={car.id}
            onClick={() => onSelect(car.id)}
            className={`min-w-[145px] snap-start rounded-2xl border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/80 ${selected === car.id ? (player === 1 ? 'border-cyan-300 bg-cyan-500/20' : 'border-pink-300 bg-pink-500/20') : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
          >
            <div className="text-2xl">{car.category === 'motorcycle' ? '🏍️' : '🏎️'}</div>
            <div className="mt-1 text-xs font-black text-white line-clamp-2">{car.name}</div>
            <div className="mt-1 text-[9px] uppercase font-bold text-slate-400">{car.category}</div>
          </button>
        ))}
      </div>
      <p className="mt-1 text-[9px] font-bold text-slate-500">P1 và P2 có thể chọn cùng một xe / cùng một FBX.</p>
    </div>
  );

  const lowDevice = props.deviceClass === 'phone' || props.deviceClass === 'tv';
  const bothDetected = props.p1Detected && props.p2Detected;
  return (
    <div className="min-h-screen w-full overflow-y-auto bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 p-3 sm:p-4 md:p-6 text-white">
      <div className="mx-auto max-w-5xl pb-5">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <button onClick={props.onBack} className="flex items-center gap-1 rounded-2xl bg-white/10 px-3 py-2 text-xs font-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/80"><ChevronLeft className="w-4 h-4"/> Quay lại</button>
          <div className="min-w-0 text-center"><h2 className="text-lg sm:text-xl md:text-3xl font-black">ĐUA 2 NGƯỜI · 1 CAMERA</h2><p className="text-[9px] sm:text-[10px] md:text-xs font-bold text-slate-400">P1 bên trái · P2 bên phải · camera là tùy chọn, không phải khóa vào game</p></div>
          <div className="hidden sm:block w-20" />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className={`rounded-2xl border p-3 text-center ${props.p1Detected ? 'border-emerald-400 bg-emerald-500/10' : 'border-amber-400/40 bg-amber-500/10'}`}>
            <div className="text-2xl">🧒</div><div className="text-sm font-black text-cyan-300">P1 · BÊN TRÁI</div><div className="mt-1 text-[10px] sm:text-xs font-bold">{props.p1Detected ? '✓ Camera đã nhận P1' : 'Camera chưa nhận · dùng fallback'}</div>
          </div>
          <div className={`rounded-2xl border p-3 text-center ${props.p2Detected ? 'border-emerald-400 bg-emerald-500/10' : 'border-amber-400/40 bg-amber-500/10'}`}>
            <div className="text-2xl">🧑</div><div className="text-sm font-black text-pink-300">P2 · BÊN PHẢI</div><div className="mt-1 text-[10px] sm:text-xs font-bold">{props.p2Detected ? '✓ Camera đã nhận P2' : 'Camera chưa nhận · dùng fallback'}</div>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400"><Camera className="w-3.5 h-3.5"/> Pose 2P: {props.poseFps || 0} FPS · game render chạy độc lập</div>

        {!bothDetected && (
          <div className="mt-3 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-3 text-[11px] font-bold leading-relaxed text-emerald-100">
            Không cần chờ MediaPipe. Bạn vẫn có thể vào đua ngay. Người nào chưa được camera nhận sẽ tự dùng điều khiển tay/phím riêng; khi camera nhận lại, gesture của đúng người đó sẽ tự tiếp quản.
          </div>
        )}

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {selector(1, props.p1CarId, props.onP1Car)}
          {selector(2, props.p2CarId, props.onP2Car)}
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
          {[['👐','Lái','Nghiêng 2 tay'],['🙌','Nitro','Hai tay lên'],['🪽','Khiên','Dang hai tay'],['🙇','Phanh','Cúi/hạ vai']].map(([i,t,d]) => <div key={t} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center"><div className="text-2xl">{i}</div><div className="text-xs font-black">{t}</div><div className="text-[10px] text-slate-400">{d}</div></div>)}
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-3 text-[10px] font-bold text-cyan-100">
            <div className="mb-1 flex items-center gap-2 text-xs font-black"><Keyboard className="h-4 w-4"/> P1 fallback</div>
            A / D lái · S phanh · E Nitro · Q Khiên
          </div>
          <div className="rounded-2xl border border-pink-400/20 bg-pink-500/10 p-3 text-[10px] font-bold text-pink-100">
            <div className="mb-1 flex items-center gap-2 text-xs font-black"><Gamepad2 className="h-4 w-4"/> P2 fallback</div>
            ← / → lái · ↓ phanh · Enter Nitro · / Khiên
          </div>
        </div>
        <p className="mt-2 text-center text-[9px] font-bold text-slate-500">Điện thoại/TV: khi camera mất một người, game tự hiện cụm nút cảm ứng cho đúng người đó.</p>

        {lowDevice && <div className="mt-4 flex gap-2 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-3 text-xs text-amber-100"><AlertTriangle className="w-5 h-5 shrink-0"/><span>Thiết bị {props.deviceClass === 'tv' ? 'Android TV/Mi Box' : 'điện thoại'} tự giảm DPR, shadow, particle và pose inference khi chơi 2 người. FBX nặng dùng fallback nhẹ để giữ FPS.</span></div>}

        <button onClick={props.onContinue} className="mt-5 w-full rounded-2xl bg-gradient-to-r from-cyan-400 via-violet-500 to-pink-500 py-4 font-black text-white shadow-xl flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/90">
          <Play className="w-5 h-5 fill-current"/> TIẾP TỤC CHỌN ĐƯỜNG ĐUA
        </button>
        {!bothDetected && (
          <button onClick={props.onSwitchToSolo} className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 py-3 text-xs font-black text-slate-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/80">
            Chỉ muốn chơi 1 người? Chuyển sang 1 người
          </button>
        )}
      </div>
    </div>
  );
}
