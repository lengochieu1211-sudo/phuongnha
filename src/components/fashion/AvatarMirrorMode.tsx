
/**
 * Lightweight Avatar 3D-style mirror mode.
 * Uses pose landmarks to drive a stylized original avatar without relying on the user's real body as the mannequin.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Monitor, Smartphone, Tv, Wand2, X } from 'lucide-react';
import { CategoryType } from '../../types';
import { useCameraPose } from '../../providers/CameraPoseContext';
import { FashionBodyAnchorEngine } from './FashionBodyAnchorEngine';
import RealisticWardrobeOverlay from './RealisticWardrobeOverlay';
import { WARDROBE_ITEMS } from '../../utils/characterRenderer';
import { detectGraphicsProfile } from '../../utils/graphicsQuality';
import StaticFbxAvatar from './StaticFbxAvatar';

type AvatarTheme = 'princess' | 'capy' | 'bunny' | 'cyber' | 'human_static' | 'child_girl_static' | 'capybara_fbx';
type PerfMode = 'auto' | 'phone' | 'tv' | 'pc';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  equippedIds: Partial<Record<CategoryType, string>>;
}

const clamp = (v:number, a:number, b:number) => Math.min(b, Math.max(a, v));
const avatars: { id: AvatarTheme; name: string; emoji: string; desc: string }[] = [
  { id: 'princess', name: 'Bé Gái 3D', emoji: '👧', desc: 'Dịu dàng, váy áo và tóc dễ phối' },
  { id: 'capy', name: 'Capy Bạn Đồng Hành', emoji: '🦫', desc: 'Capybara đáng yêu, thân tròn' },
  { id: 'bunny', name: 'Thỏ Ma Thuật', emoji: '🐰', desc: 'Thỏ fantasy, tai dài và má hồng' },
  { id: 'cyber', name: 'Robo Cyber', emoji: '🤖', desc: 'Nhân vật robot phong cách tương lai' },
  { id: 'human_static', name: 'Người Mẫu 3D Thật', emoji: '🧍', desc: 'FBX thật ng1 • xoay theo thân, chưa có xương rig' },
  { id: 'child_girl_static', name: 'Bé Gái FBX Thật', emoji: '👧', desc: 'Child+girl • 49 material • chưa rig • texture ngoài chưa kèm' },
  { id: 'capybara_fbx', name: 'Capybara Lowpoly FBX', emoji: '🦫', desc: 'Capybara lowpoly vui nhộn • dùng thêm trong đua xe' },
];

function getPreviewColor(itemId?: string, fallback = '#d946ef') {
  if (!itemId) return fallback;
  return WARDROBE_ITEMS.find(i => i.id === itemId)?.previewColor || fallback;
}

export default function AvatarMirrorMode({ isOpen, onClose, equippedIds }: Props) {
  const { getLatestPose } = useCameraPose();
  const graphicsProfile = useRef(detectGraphicsProfile()).current;
  const anchorEngine = useRef(new FashionBodyAnchorEngine()).current;
  const [perfMode, setPerfMode] = useState<PerfMode>('auto');
  const [avatar, setAvatar] = useState<AvatarTheme>('princess');
  const [anchors, setAnchors] = useState<any>(null);
  const rafRef = useRef<number | null>(null);
  const lastTick = useRef(0);

  const effectiveMode: PerfMode = useMemo(() => {
    if (perfMode !== 'auto') return perfMode;
    if (graphicsProfile.quality === 'lite') return 'phone';
    if (typeof window !== 'undefined' && window.innerWidth >= 1200) return 'pc';
    return 'tv';
  }, [perfMode, graphicsProfile.quality]);

  useEffect(() => {
    if (!isOpen) return;
    const targetFps = effectiveMode === 'phone' ? 26 : effectiveMode === 'tv' ? 36 : 48;
    const minFrame = 1000 / targetFps;
    anchorEngine.reset?.();
    const tick = (ts: number) => {
      rafRef.current = requestAnimationFrame(tick);
      if (ts - lastTick.current < minFrame) return;
      lastTick.current = ts;
      const pose = getLatestPose?.();
      if (!pose?.landmarks?.length) return;
      try {
        const next = anchorEngine.update?.(pose.landmarks) ?? null;
        if (next) setAnchors(next);
      } catch {
        // no-op
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [isOpen, effectiveMode, getLatestPose, anchorEngine]);

  if (!isOpen) return null;

  const isStaticFbx = avatar === 'human_static' || avatar === 'child_girl_static' || avatar === 'capybara_fbx';
  const torsoYaw = clamp((anchors?.torsoYaw || 0), -0.9, 0.9);
  const bodyWidth = clamp(anchors?.shoulderWidth ? anchors.shoulderWidth * 220 : 110, 90, 170);
  const bodyHeight = clamp(anchors?.torsoHeight ? anchors.torsoHeight * 310 : 180, 150, 255);
  const costumeColor = getPreviewColor(equippedIds.shirt, avatar === 'cyber' ? '#22d3ee' : '#ec4899');
  const skinA = avatar === 'capy' ? '#9a6c43' : avatar === 'cyber' ? '#94a3b8' : '#f4c5a1';
  const skinB = avatar === 'capy' ? '#7b5436' : avatar === 'cyber' ? '#64748b' : '#e8ab83';

  const seg = (a:any, b:any, len:number, base:{x:number;y:number}, scale = 1) => {
    const conf = Math.min(a?.confidence ?? 0, b?.confidence ?? 0);
    const dx = conf > 0.2 ? (b.x - a.x) : 0;
    const dy = conf > 0.2 ? (b.y - a.y) : 0.4;
    const ang = Math.atan2(dy, dx || 0.0001);
    return {
      x2: base.x + Math.cos(ang) * len * scale,
      y2: base.y + Math.sin(ang) * len * scale,
      angle: ang,
      confidence: conf,
    };
  };

  const rig = (() => {
    const c = { x: 160, y: 210 };
    const shoulderSpread = avatar === 'capy' ? 44 : 58;
    const hipSpread = avatar === 'capy' ? 34 : 40;
    const shoulderY = 170;
    const hipY = 280;
    const upperArm = avatar === 'capy' ? 52 : 66;
    const lowerArm = avatar === 'capy' ? 44 : 58;
    const upperLeg = avatar === 'capy' ? 52 : 70;
    const lowerLeg = avatar === 'capy' ? 44 : 64;

    const ls = { x: c.x - shoulderSpread, y: shoulderY };
    const rs = { x: c.x + shoulderSpread, y: shoulderY };
    const lh = { x: c.x - hipSpread, y: hipY };
    const rh = { x: c.x + hipSpread, y: hipY };

    const le1 = seg(anchors?.leftShoulder, anchors?.leftElbow, upperArm, ls);
    const le = { x: le1.x2, y: le1.y2 };
    const lw1 = seg(anchors?.leftElbow, anchors?.leftWrist, lowerArm, le);
    const lw = { x: lw1.x2, y: lw1.y2 };

    const re1 = seg(anchors?.rightShoulder, anchors?.rightElbow, upperArm, rs);
    const re = { x: re1.x2, y: re1.y2 };
    const rw1 = seg(anchors?.rightElbow, anchors?.rightWrist, lowerArm, re);
    const rw = { x: rw1.x2, y: rw1.y2 };

    const lk1 = seg(anchors?.leftHip, anchors?.leftKnee, upperLeg, lh);
    const lk = { x: lk1.x2, y: lk1.y2 };
    const la1 = seg(anchors?.leftKnee, anchors?.leftAnkle, lowerLeg, lk);
    const la = { x: la1.x2, y: la1.y2 };

    const rk1 = seg(anchors?.rightHip, anchors?.rightKnee, upperLeg, rh);
    const rk = { x: rk1.x2, y: rk1.y2 };
    const ra1 = seg(anchors?.rightKnee, anchors?.rightAnkle, lowerLeg, rk);
    const ra = { x: ra1.x2, y: ra1.y2 };

    return { c, ls, rs, lh, rh, le, lw, re, rw, lk, la, rk, ra, shoulderY, hipY };
  })();

  const overlayStyle = (cx:number, cy:number, w:number, h:number, z=5, rotate=0, scaleX=1) => ({
    position: 'absolute' as const,
    left: `${cx * 100}%`,
    top: `${cy * 100}%`,
    width: `${w * 100}%`,
    height: `${h * 100}%`,
    transform: `translate(-50%, -50%) rotate(${rotate}rad) scaleX(${scaleX})`,
    transformOrigin: 'center center',
    zIndex: z,
    pointerEvents: 'none' as const,
  });

  return (
    <div className="fixed inset-0 z-[110] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3">
      <div className="w-full max-w-6xl max-h-[94dvh] overflow-hidden rounded-[2rem] border border-violet-300/30 bg-[#0d1020] text-white shadow-2xl flex flex-col">
        <div className="px-4 py-3 border-b border-violet-400/15 flex items-center justify-between bg-gradient-to-r from-violet-950/90 via-fuchsia-950/80 to-cyan-950/70">
          <div>
            <div className="text-xs font-black tracking-[0.18em] text-cyan-300">MAGIC MIRROR • AVATAR 3D MODE</div>
            <h2 className="text-lg md:text-2xl font-black flex items-center gap-2"><Bot className="w-5 h-5 text-cyan-300" /> Nhân Vật 3D Điều Khiển Bằng Cử Chỉ</h2>
            <p className="text-[11px] md:text-xs text-violet-200">Không dùng người thật làm ma-nơ-canh; nhân vật ảo thay đồ và bắt chước chuyển động tay chân của bé.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10" aria-label="Đóng">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
          <div className="lg:col-span-8 p-3 md:p-4">
            <div className="relative h-full min-h-[440px] rounded-[1.7rem] overflow-hidden border border-violet-400/20 bg-[radial-gradient(circle_at_top,#312e81_0%,#111827_52%,#030712_100%)]">
              <div className="absolute inset-x-0 bottom-8 h-12 mx-10 rounded-[100%] bg-black/35 blur-xl" />
              <div className="absolute inset-x-6 top-4 flex items-center justify-between text-[10px] md:text-xs font-black">
                <span className="rounded-full bg-black/30 px-3 py-1 border border-white/10">Chế độ: {effectiveMode === 'phone' ? '📱 Điện thoại' : effectiveMode === 'tv' ? '📺 TV / Tablet' : '🖥️ PC đẹp'}</span>
                <span className="rounded-full bg-black/30 px-3 py-1 border border-white/10">Pose: {anchors ? 'Đã nhận diện' : 'Đưa người vào khung'}</span>
              </div>

              <div className="absolute inset-0">
                {isStaticFbx && (
                  <StaticFbxAvatar
                    yaw={torsoYaw}
                    roll={(anchors?.torsoRotation || 0) * (Math.PI / 180)}
                    quality={effectiveMode}
                    file={
                      avatar === 'child_girl_static'
                        ? 'assets/avatars/child-girl-static.fbx'
                        : avatar === 'capybara_fbx'
                          ? 'assets/avatars/capybara-lowpoly.fbx'
                          : 'assets/avatars/ng1-human-static.fbx'
                    }
                    title={
                      avatar === 'child_girl_static'
                        ? 'BÉ GÁI 3D THẬT'
                        : avatar === 'capybara_fbx'
                          ? 'CAPYBARA LOWPOLY VUI NHỘN'
                          : 'NGƯỜI MẪU 3D THẬT'
                    }
                    description={
                      avatar === 'child_girl_static'
                        ? 'Child+girl FBX • màu vật liệu fallback • chưa có xương rig'
                        : avatar === 'capybara_fbx'
                          ? 'Capybara lowpoly • tăng scale để thấy rõ • phong cách hài hước'
                          : 'ng1 FBX • xoay/nghiêng theo thân người'
                    }
                    targetHeight={avatar === 'capybara_fbx' ? 2.55 : 2.05}
                    cameraPreset={avatar === 'capybara_fbx' ? 'compact' : 'human'}
                  />
                )}

                {/* accessory overlays behind body */}
                {!isStaticFbx && equippedIds.wings && (
                  <div style={overlayStyle(0.5, 0.48, 0.42, 0.36, 2, 0, 1 + Math.abs(torsoYaw) * 0.14)}>
                    <RealisticWardrobeOverlay itemId={equippedIds.wings} category="wings" />
                  </div>
                )}
                {!isStaticFbx && equippedIds.backpack && (
                  <div style={overlayStyle(0.5, 0.50, 0.23, 0.28, 3)}>
                    <RealisticWardrobeOverlay itemId={equippedIds.backpack} category="backpack" />
                  </div>
                )}

                {!isStaticFbx && (
                <svg viewBox="0 0 320 520" className="absolute inset-0 w-full h-full">
                  <defs>
                    <linearGradient id="avatarCostume" x1="0" x2="1">
                      <stop offset="0%" stopColor={costumeColor} />
                      <stop offset="100%" stopColor={avatar === 'cyber' ? '#0ea5e9' : '#f472b6'} />
                    </linearGradient>
                    <linearGradient id="skinGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor={skinA} />
                      <stop offset="100%" stopColor={skinB} />
                    </linearGradient>
                    <filter id="softShadow"><feDropShadow dx="0" dy="6" stdDeviation="8" floodOpacity=".35"/></filter>
                  </defs>

                  <g filter="url(#softShadow)">
                    {/* body */}
                    <g transform={`translate(${160} ${0}) scale(${1 - Math.abs(torsoYaw)*0.08} 1)`}>
                      {avatar === 'capy' ? (
                        <>
                          <ellipse cx="0" cy="110" rx="62" ry="72" fill="#a77a50"/>
                          <ellipse cx="0" cy="109" rx="48" ry="57" fill="#b8895a"/>
                          <ellipse cx="0" cy="244" rx="78" ry="104" fill="#9a6c43"/>
                          <ellipse cx="0" cy="250" rx="54" ry="74" fill="url(#avatarCostume)" fillOpacity=".82"/>
                          <circle cx="-20" cy="90" r="5.5" fill="#111827"/>
                          <circle cx="20" cy="90" r="5.5" fill="#111827"/>
                          <ellipse cx="0" cy="106" rx="18" ry="13" fill="#7a5336"/>
                          <ellipse cx="0" cy="112" rx="13" ry="7" fill="#111827" opacity=".75"/>
                          <circle cx="-42" cy="45" r="10" fill="#8b5e3c"/>
                          <circle cx="42" cy="45" r="10" fill="#8b5e3c"/>
                        </>
                      ) : avatar === 'bunny' ? (
                        <>
                          <ellipse cx="0" cy="92" rx="52" ry="58" fill="url(#skinGrad)"/>
                          <ellipse cx="-22" cy="24" rx="16" ry="56" fill="#f8fafc"/>
                          <ellipse cx="22" cy="24" rx="16" ry="56" fill="#f8fafc"/>
                          <ellipse cx="-22" cy="24" rx="9" ry="42" fill="#f9a8d4"/>
                          <ellipse cx="22" cy="24" rx="9" ry="42" fill="#f9a8d4"/>
                          <path d="M-56 182 Q0 145 56 182 L68 302 Q0 348 -68 302Z" fill="url(#avatarCostume)"/>
                          <circle cx="-17" cy="86" r="5" fill="#111827"/><circle cx="17" cy="86" r="5" fill="#111827"/>
                          <ellipse cx="0" cy="103" rx="10" ry="8" fill="#fb7185"/>
                        </>
                      ) : avatar === 'cyber' ? (
                        <>
                          <circle cx="0" cy="96" r="50" fill="#1e293b"/>
                          <rect x="-55" y="155" width="110" height="152" rx="34" fill="url(#avatarCostume)"/>
                          <rect x="-45" y="166" width="90" height="42" rx="18" fill="#0f172a" opacity=".55"/>
                          <circle cx="-18" cy="94" r="7" fill="#22d3ee"/><circle cx="18" cy="94" r="7" fill="#22d3ee"/>
                          <rect x="-12" y="108" width="24" height="8" rx="4" fill="#38bdf8"/>
                          <path d="M-36 56 L36 56 L20 28 L-20 28Z" fill="#334155"/>
                        </>
                      ) : (
                        <>
                          <circle cx="0" cy="96" r="52" fill="url(#skinGrad)"/>
                          <path d="M-60 180 Q0 142 60 180 L70 306 Q0 352 -70 306Z" fill="url(#avatarCostume)"/>
                          <path d="M-51 176 Q0 154 51 176 L44 238 Q0 258 -44 238Z" fill="#fff" fillOpacity=".18"/>
                          <circle cx="-18" cy="93" r="5.2" fill="#111827"/><circle cx="18" cy="93" r="5.2" fill="#111827"/>
                          <path d="M-12 115 Q0 124 12 115" stroke="#d946ef" strokeWidth="4" strokeLinecap="round" fill="none"/>
                        </>
                      )}
                    </g>

                    {/* limbs */}
                    <g stroke="url(#skinGrad)" strokeLinecap="round" strokeLinejoin="round" fill="none">
                      <path d={`M ${rig.ls.x} ${rig.ls.y} L ${rig.le.x} ${rig.le.y}`} strokeWidth={avatar === 'cyber' ? 16 : 18} />
                      <path d={`M ${rig.le.x} ${rig.le.y} L ${rig.lw.x} ${rig.lw.y}`} strokeWidth={avatar === 'cyber' ? 14 : 16} />
                      <path d={`M ${rig.rs.x} ${rig.rs.y} L ${rig.re.x} ${rig.re.y}`} strokeWidth={avatar === 'cyber' ? 16 : 18} />
                      <path d={`M ${rig.re.x} ${rig.re.y} L ${rig.rw.x} ${rig.rw.y}`} strokeWidth={avatar === 'cyber' ? 14 : 16} />
                      <path d={`M ${rig.lh.x} ${rig.lh.y} L ${rig.lk.x} ${rig.lk.y}`} strokeWidth={avatar === 'cyber' ? 18 : 22} />
                      <path d={`M ${rig.lk.x} ${rig.lk.y} L ${rig.la.x} ${rig.la.y}`} strokeWidth={avatar === 'cyber' ? 16 : 20} />
                      <path d={`M ${rig.rh.x} ${rig.rh.y} L ${rig.rk.x} ${rig.rk.y}`} strokeWidth={avatar === 'cyber' ? 18 : 22} />
                      <path d={`M ${rig.rk.x} ${rig.rk.y} L ${rig.ra.x} ${rig.ra.y}`} strokeWidth={avatar === 'cyber' ? 16 : 20} />
                    </g>
                  </g>
                </svg>
                )}

                {/* accessory overlays in front */}
                {!isStaticFbx && equippedIds.hair && (
                  <div style={overlayStyle(0.5, 0.18, 0.25, 0.25, 8, anchors?.faceRotation || 0, 1 - Math.abs(torsoYaw)*0.1)}>
                    <RealisticWardrobeOverlay itemId={equippedIds.hair} category="hair" />
                  </div>
                )}
                {!isStaticFbx && equippedIds.headaccessory && (
                  <div style={overlayStyle(0.5, 0.15, 0.20, 0.12, 9, anchors?.faceRotation || 0)}>
                    <RealisticWardrobeOverlay itemId={equippedIds.headaccessory} category="headaccessory" />
                  </div>
                )}
                {!isStaticFbx && equippedIds.hat && (
                  <div style={overlayStyle(0.5, 0.14, 0.22, 0.15, 10, anchors?.faceRotation || 0)}>
                    <RealisticWardrobeOverlay itemId={equippedIds.hat} category="hat" />
                  </div>
                )}
                {!isStaticFbx && equippedIds.glasses && !equippedIds.mask && (
                  <div style={overlayStyle(0.5, 0.185, 0.16, 0.08, 11, anchors?.faceRotation || 0)}>
                    <RealisticWardrobeOverlay itemId={equippedIds.glasses} category="glasses" />
                  </div>
                )}
                {!isStaticFbx && equippedIds.mask && (
                  <div style={overlayStyle(0.5, 0.205, 0.18, 0.10, 12, anchors?.faceRotation || 0)}>
                    <RealisticWardrobeOverlay itemId={equippedIds.mask} category="mask" />
                  </div>
                )}
                {!isStaticFbx && equippedIds.necklace && (
                  <div style={overlayStyle(0.5, 0.31, 0.13, 0.08, 9)}>
                    <RealisticWardrobeOverlay itemId={equippedIds.necklace} category="necklace" />
                  </div>
                )}
                {!isStaticFbx && equippedIds.gloves && (
                  <>
                    <div style={overlayStyle(rig.lw.x / 320, rig.lw.y / 520, 0.09, 0.09, 10)}>
                      <RealisticWardrobeOverlay itemId={equippedIds.gloves} category="gloves" side="left" />
                    </div>
                    <div style={overlayStyle(rig.rw.x / 320, rig.rw.y / 520, 0.09, 0.09, 10)}>
                      <RealisticWardrobeOverlay itemId={equippedIds.gloves} category="gloves" side="right" />
                    </div>
                  </>
                )}
                {!isStaticFbx && equippedIds.shoes && (
                  <>
                    <div style={overlayStyle(rig.la.x / 320, rig.la.y / 520 + 0.015, 0.11, 0.08, 10)}>
                      <RealisticWardrobeOverlay itemId={equippedIds.shoes} category="shoes" side="left" />
                    </div>
                    <div style={overlayStyle(rig.ra.x / 320, rig.ra.y / 520 + 0.015, 0.11, 0.08, 10)}>
                      <RealisticWardrobeOverlay itemId={equippedIds.shoes} category="shoes" side="right" />
                    </div>
                  </>
                )}

                <div className="absolute bottom-4 inset-x-4 flex flex-wrap gap-2 items-center justify-center text-[10px] md:text-xs font-bold">
                  <span className="rounded-full bg-black/30 px-3 py-1 border border-white/10">Quần áo tự thay theo tủ đồ hiện tại</span>
                  <span className="rounded-full bg-black/30 px-3 py-1 border border-white/10">Tay/chân avatar chạy theo cử chỉ người</span>
                  <span className="rounded-full bg-black/30 px-3 py-1 border border-white/10">Xoay thân theo hướng vai trái/phải</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 border-l border-violet-400/15 bg-slate-950/60 p-4 overflow-y-auto">
            <div className="space-y-4">
              <section className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-3">
                <h3 className="font-black text-sm flex items-center gap-2"><Wand2 className="w-4 h-4 text-cyan-300" /> Tùy chọn nhân vật ảo</h3>
                <p className="text-xs text-cyan-100/80 mt-1">Chọn một avatar gốc của app. Nhân vật sẽ thay đồ và bắt chước chuyển động của bé mà không dùng cơ thể người làm ma-nơ-canh.</p>
              </section>

              <section className="grid grid-cols-2 gap-2">
                {avatars.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setAvatar(v.id)}
                    className={`rounded-2xl p-3 text-left border transition ${avatar === v.id ? 'border-fuchsia-400 bg-fuchsia-500/20 shadow-lg' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                  >
                    <div className="text-2xl">{v.emoji}</div>
                    <div className="font-black text-sm mt-2">{v.name}</div>
                    <div className="text-[11px] text-slate-300 mt-1">{v.desc}</div>
                  </button>
                ))}
              </section>

              <section className="rounded-2xl border border-white/10 p-3 bg-white/5">
                <h3 className="font-black text-sm mb-2">Hiệu năng / đồ họa</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id:'auto', label:'✨ Tự động', icon:<Wand2 className="w-4 h-4" /> },
                    { id:'phone', label:'📱 Điện thoại', icon:<Smartphone className="w-4 h-4" /> },
                    { id:'tv', label:'📺 TV', icon:<Tv className="w-4 h-4" /> },
                    { id:'pc', label:'🖥️ PC', icon:<Monitor className="w-4 h-4" /> },
                  ].map(m => (
                    <button key={m.id} onClick={() => setPerfMode(m.id as PerfMode)} className={`rounded-xl px-3 py-2 border text-xs font-black flex items-center gap-2 ${perfMode === m.id ? 'bg-violet-500/25 border-violet-300 text-white' : 'bg-slate-900/50 border-white/10 text-slate-300'}`}>
                      {m.icon} {m.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Điện thoại giảm tần số cập nhật và hiệu ứng. TV cân bằng giữa mượt và rõ. PC chạy cảnh avatar mượt và chi tiết hơn.
                </p>
              </section>

              <section className="rounded-2xl border border-white/10 p-3 bg-white/5">
                <h3 className="font-black text-sm mb-2">Đồ đang mặc trên avatar</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {([
                    ['Tóc', equippedIds.hair],
                    ['Mũ', equippedIds.hat || equippedIds.crown],
                    ['Kính', equippedIds.glasses],
                    ['Mặt nạ', equippedIds.mask],
                    ['Áo', equippedIds.shirt],
                    ['Giày', equippedIds.shoes],
                    ['Găng', equippedIds.gloves],
                    ['Balô', equippedIds.backpack],
                  ] as const).map(([label, id]) => (
                    <div key={label} className="rounded-xl bg-black/25 border border-white/10 px-3 py-2">
                      <div className="text-[10px] text-slate-400">{label}</div>
                      <div className="font-black truncate">{id ? (WARDROBE_ITEMS.find(i => i.id === id)?.name || 'Đã trang bị') : 'Chưa có'}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-3">
                <h3 className="font-black text-sm text-amber-100">Ghi chú kỹ thuật</h3>
                <ul className="list-disc pl-5 mt-1 text-[11px] text-amber-50/85 space-y-1">
                  <li>Avatar hiện là nhân vật gốc dạng pseudo-3D / 2.5D để chạy mượt trên web.</li>
                  <li>Khi người giơ tay, cúi người hoặc xoay thân, avatar retarget chuyển động xương tương ứng.</li>
                  <li>Bước nâng tiếp theo có thể thêm model GLB rigged thật cho PC mà vẫn giữ mobile nhẹ.</li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
