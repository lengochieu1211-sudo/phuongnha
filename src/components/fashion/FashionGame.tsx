/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useManagedTimeout } from '../../hooks/useManagedTimeout';
import { 
  Sparkles, Shirt, Camera, Award, ArrowLeft, RefreshCw, 
  Trash2, Play, Sliders, Check, Lock, Star, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { PlayerProgress, CategoryType, WardrobeItem } from '../../types';
import { WARDROBE_ITEMS } from '../../utils/characterRenderer';
import { audio } from '../../lib/AudioEngine';
import { voiceGuide } from '../../lib/VoiceGuideService';
import { useCameraPose } from '../../providers/CameraPoseContext';
import { FashionBodyAnchorEngine } from './FashionBodyAnchorEngine';
import FashionCalibration from './FashionCalibration';
import FashionShowMode from './FashionShowMode';
import { FashionQualityMode } from './fashionTypes';
import RealisticWardrobeOverlay from './RealisticWardrobeOverlay';
import FittedSleeveOverlay from './FittedSleeveOverlay';
import CameraReadinessBadge from '../CameraReadinessBadge';
import AvatarMirrorMode from './AvatarMirrorMode';
import { detectGraphicsProfile } from '../../utils/graphicsQuality';
import { drawImageContain, NormalizedContentRect, mapPointToContent } from '../../utils/cameraFrame';

interface FashionGameProps {
  progress: PlayerProgress;
  onUpdateProgress: (updater: (p: PlayerProgress) => PlayerProgress) => void;
  onBack: () => void;
}

const CATEGORIES: { id: CategoryType; label: string; icon: string }[] = [
  { id: 'hair', label: 'Tóc', icon: '💇‍♀️' },
  { id: 'hat', label: 'Nón / Mũ', icon: '👒' },
  { id: 'headaccessory', label: 'Phụ kiện đầu', icon: '🐱' },
  { id: 'glasses', label: 'Kính mắt', icon: '👓' },
  { id: 'mask', label: 'Mặt nạ', icon: '🥷' },
  { id: 'necklace', label: 'Dây chuyền', icon: '💎' },
  { id: 'shirt', label: 'Trang phục', icon: '👕' },
  { id: 'gloves', label: 'Găng tay', icon: '🧤' },
  { id: 'shoes', label: 'Giày dép', icon: '👟' },
  { id: 'wings', label: 'Cánh', icon: '🪽' },
  { id: 'backpack', label: 'Balô', icon: '🎒' },
 ];

const OUTFIT_PRESETS: {name:string; icon:string; items: Partial<Record<CategoryType,string>>}[] = [
  { name:'Công Chúa', icon:'👸', items:{ hair:'hair_long_brown', crown:'crown_gold', necklace:'necklace_crystal', shirt:'shirt_dress', wings:'wings_butterfly' } },
  { name:'Cyber', icon:'🤖', items:{ hair:'hair_bob_black', mask:'mask_cyber', gloves:'gloves_cyber', shirt:'shirt_robot' } },
  { name:'Ninja', icon:'🥷', items:{ mask:'mask_hero', gloves:'gloves_sport', shirt:'shirt_karate' } },
  { name:'Mèo Hồng', icon:'🐱', items:{ hair:'hair_ponytail_pink', headaccessory:'head_cat_ears', necklace:'necklace_heart' } },
];

export default function FashionGame({
  progress,
  onUpdateProgress,
  onBack
}: FashionGameProps) {
  const scheduleTimeout = useManagedTimeout();
  // Navigation / Game States
  const [gameState, setGameState] = useState<'calibration' | 'dressing' | 'show'>('calibration');
  const [activeCategory, setActiveCategory] = useState<CategoryType>('hat');
  const [showAvatarMirror, setShowAvatarMirror] = useState<boolean>(false);
  const [qualityMode] = useState<FashionQualityMode>('auto');
  const graphicsProfile = useRef(detectGraphicsProfile()).current;
  const [showSkeletonDebug, setShowSkeletonDebug] = useState(false);
  const [showPhotoFlash, setShowPhotoFlash] = useState(false);
  const [countdownNum, setCountdownNum] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const lastFeedbackTextRef = useRef<string>('');

  // Local Try-on Equipments (Syncs to equipped wardrobe on Save)
  const [equippedIds, setEquippedIds] = useState<{ [key in CategoryType]?: string }>(() => {
    return { ...progress.equippedWardrobe };
  });

  // Track preview photo state
  const [lastPhoto, setLastPhoto] = useState<boolean>(false);

  // References for Imperative 60 FPS Styling Transforms (Bypassing React state)
  const hairRef = useRef<HTMLDivElement | null>(null);
  const headAccessoryRef = useRef<HTMLDivElement | null>(null);
  const maskRef = useRef<HTMLDivElement | null>(null);
  const necklaceRef = useRef<HTMLDivElement | null>(null);
  const glovesLeftRef = useRef<HTMLDivElement | null>(null);
  const glovesRightRef = useRef<HTMLDivElement | null>(null);
  const hatRef = useRef<HTMLDivElement | null>(null);
  const glassesRef = useRef<HTMLDivElement | null>(null);
  const shirtRef = useRef<HTMLDivElement | null>(null);
  const sleeveLeftUpperRef = useRef<HTMLDivElement | null>(null);
  const sleeveRightUpperRef = useRef<HTMLDivElement | null>(null);
  const sleeveLeftForeRef = useRef<HTMLDivElement | null>(null);
  const sleeveRightForeRef = useRef<HTMLDivElement | null>(null);
  const shoesLeftRef = useRef<HTMLDivElement | null>(null);
  const shoesRightRef = useRef<HTMLDivElement | null>(null);
  const wingsRef = useRef<HTMLDivElement | null>(null);
  const backpackRef = useRef<HTMLDivElement | null>(null);
  const debugSkeletonRef = useRef<HTMLCanvasElement | null>(null);

  // References for camera canvas
  const cameraCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraContentRectRef = useRef<NormalizedContentRect>({ x: 0, y: 0, width: 1, height: 1 });

  // Engines
  const anchorEngineRef = useRef<FashionBodyAnchorEngine>(new FashionBodyAnchorEngine());
  const { getLatestPose, isStreaming, setIsPiPVisible, videoElement } = useCameraPose();

  // Load Voice triggers in Vietnamese
  const speakVoice = (text: string) => {
    voiceGuide.speak(text, 'medium');
  };

  // Hide global Camera Pip on load, since camera is full screen
  useEffect(() => {
    setIsPiPVisible(false);
    speakVoice("Chào mừng đến với Gương Phép Thuật!");

    return () => {
      setIsPiPVisible(true);
    };
  }, []);

  // Update engine quality parameter
  useEffect(() => {
    const resolved = qualityMode === 'auto'
      ? (graphicsProfile.quality === 'high' ? 'high' : graphicsProfile.quality === 'balanced' ? 'medium' : 'low')
      : qualityMode;
    anchorEngineRef.current.setQualityMode(resolved);
  }, [qualityMode, graphicsProfile.quality]);

  // Imperative 60 FPS Render Loop
  useEffect(() => {
    let active = true;
    let lastRigUpdate = 0;
    const rigTargetFps = graphicsProfile.deviceClass === 'phone'
      ? 30
      : graphicsProfile.deviceClass === 'tv' || graphicsProfile.deviceClass === 'tablet'
        ? 40
        : graphicsProfile.quality === 'high' ? 60 : 48;
    const rigIntervalMs = 1000 / rigTargetFps;

    const renderLoop = () => {
      if (!active) return;

      // Draw camera preview onto cameraCanvas at 60 FPS
      if (videoElement && cameraCanvasRef.current) {
        const camCanvas = cameraCanvasRef.current;
        const ctx = camCanvas.getContext('2d');
        if (ctx) {
          // Preserve the REAL camera aspect ratio. The returned content rectangle
          // is also used below to map pose anchors into the letterboxed stage.
          cameraContentRectRef.current = drawImageContain(
            ctx,
            videoElement,
            camCanvas.width,
            camCanvas.height,
            true,
          );
        }
      }

      const now = performance.now();
      if (now - lastRigUpdate < rigIntervalMs) {
        requestAnimationFrame(renderLoop);
        return;
      }
      lastRigUpdate = now;

      const latest = getLatestPose();
      const anchors = anchorEngineRef.current.update(latest.landmarks, true); // true for mirrored camera

      if (anchors && latest.bodyDetected && gameState === 'dressing') {
        // Adjust guidance feedback text
        const upperBodyReady = latest.bodyDetected && latest.leftWrist.visible && latest.rightWrist.visible;
        const newFeedback = latest.fullBodyDetected
          ? 'Toàn thân rõ nét! Có thể thử cả trang phục và giày dép ✨'
          : upperBodyReady
          ? 'Chế độ nửa người trên + 2 tay: tóc, kính, áo và phụ kiện vẫn bám chính xác 👐'
          : 'Đưa đầu, vai và cả hai tay vào khung camera nhé 📷';
        if (lastFeedbackTextRef.current !== newFeedback) {
          lastFeedbackTextRef.current = newFeedback;
          setFeedbackText(newFeedback);
        }

        // Helper to update DOM transform
        const updateDom = (ref: React.RefObject<HTMLDivElement | null>, pos: { x: number; y: number; confidence: number }, widthNormalized: number, heightNormalized?: number, rotation = 0, yOffset = 0, yaw = 0) => {
          const el = ref.current;
          if (!el) return;

          if (pos.confidence >= 0.45) {
            const contentRect = cameraContentRectRef.current;
            const mapped = mapPointToContent(pos.x, pos.y + yOffset, contentRect);
            el.style.display = 'flex';
            el.style.left = `${mapped.x * 100}%`;
            el.style.top = `${mapped.y * 100}%`;
            // Scale garments inside the actual visible camera content, not the full
            // letterboxed stage, so overlays stay aligned without distorting the video.
            const widthPct = Math.max(3, Math.min(95, widthNormalized * contentRect.width * 100));
            el.style.width = `${widthPct}%`;
            if (heightNormalized !== undefined) {
              const heightPct = Math.max(3, Math.min(95, heightNormalized * contentRect.height * 100));
              el.style.height = `${heightPct}%`;
            }
            
            // Build transform string
            let transform = 'translate(-50%, -50%) perspective(760px)';
            if (yaw !== 0) {
              transform += ` rotateY(${Math.max(-60, Math.min(60, yaw))}deg)`;
            }
            if (rotation !== 0) {
              transform += ` rotateZ(${rotation}deg)`;
            }
            el.style.transformOrigin = '50% 50%';
            el.style.transformStyle = 'preserve-3d';
            el.style.transform = transform;
            el.style.opacity = '1';
          } else {
            // Fade out item when joint tracking is lost
            el.style.opacity = '0';
            el.style.display = 'none';
          }
        };

        const updateSegment = (
          ref: React.RefObject<HTMLDivElement | null>,
          a: {x:number;y:number;confidence:number},
          b: {x:number;y:number;confidence:number},
          thickness: number,
          yaw = 0,
        ) => {
          const el = ref.current;
          if (!el) return;
          const confidence = Math.min(a.confidence, b.confidence);
          if (confidence < 0.45) {
            el.style.display = 'none';
            el.style.opacity = '0';
            return;
          }
          const contentRect = cameraContentRectRef.current;
          const ma = mapPointToContent(a.x, a.y, contentRect);
          const mb = mapPointToContent(b.x, b.y, contentRect);
          const dx = mb.x - ma.x;
          const dy = mb.y - ma.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          el.style.display = 'flex';
          el.style.opacity = '1';
          el.style.left = `${((ma.x + mb.x) * 0.5) * 100}%`;
          el.style.top = `${((ma.y + mb.y) * 0.5) * 100}%`;
          el.style.width = `${Math.max(4, Math.min(55, len * 112))}%`;
          el.style.height = `${Math.max(2.8, Math.min(18, thickness * contentRect.height * 100))}%`;
          const depthScale = Math.max(0.86, 1 - Math.min(55, Math.abs(yaw)) / 420);
          el.style.transformOrigin = '50% 50%';
          el.style.transformStyle = 'preserve-3d';
          el.style.transform = `translate(-50%, -50%) perspective(760px) rotateY(${yaw * 0.28}deg) rotateZ(${angle}deg) scaleY(${depthScale})`;
        };

        // Precision face fitting: each accessory has its own facial anchor.
        // Do not stack incompatible head/face pieces on top of eyes/nose.
        const hasHat = Boolean(equippedIds.hat || equippedIds.crown);
        const hasMask = Boolean(equippedIds.mask);
        const hasWings = Boolean(equippedIds.wings);
        updateDom(hairRef, anchors.headCenter, anchors.headWidth * 1.48, anchors.faceHeight * 1.42, anchors.faceRotation, anchors.faceHeight * 0.03, anchors.torsoYaw * 0.55);
        updateDom(hatRef, anchors.foreheadCenter, anchors.headWidth * 1.32, anchors.faceHeight * 0.66, anchors.faceRotation, -anchors.faceHeight * 0.24, anchors.torsoYaw * 0.55);
        if (!hasHat) updateDom(headAccessoryRef, anchors.foreheadCenter, anchors.headWidth * 1.22, anchors.faceHeight * 0.58, anchors.faceRotation, -anchors.faceHeight * 0.19, anchors.torsoYaw * 0.55);
        else if (headAccessoryRef.current) headAccessoryRef.current.style.display = 'none';
        if (!hasMask) updateDom(glassesRef, anchors.eyeCenter, anchors.eyeWidth * 1.42, anchors.faceHeight * 0.25, anchors.faceRotation, 0, anchors.torsoYaw * 0.55);
        else if (glassesRef.current) glassesRef.current.style.display = 'none';
        updateDom(maskRef, anchors.faceCenter, anchors.faceWidth * 0.94, anchors.faceHeight * 0.70, anchors.faceRotation, anchors.faceHeight * 0.12, anchors.torsoYaw * 0.55);

        // Clothing scales from BOTH shoulders and hips instead of one fixed body width.
        // This makes the garment expand/contract with a real child's silhouette.
        const reliableHipWidth = anchors.hipCenter.confidence >= 0.45 ? anchors.hipWidth : anchors.shoulderWidth * 0.72;
        const fittedBodyWidth = Math.max(anchors.shoulderWidth * 1.54, reliableHipWidth * 1.32);
        const torsoH = Math.max(anchors.torsoHeight * 1.48, fittedBodyWidth * 1.05);
        const yawCompression = Math.max(0.72, 1 - Math.abs(anchors.torsoYaw) / 185);
        const displayedBodyWidth = fittedBodyWidth * yawCompression;
        updateDom(shirtRef, anchors.torsoCenter, displayedBodyWidth, torsoH, anchors.torsoRotation, 0.015, anchors.torsoYaw);
        if (shirtRef.current) {
          shirtRef.current.style.transformOrigin = anchors.torsoYaw > 8 ? '62% 50%' : anchors.torsoYaw < -8 ? '38% 50%' : '50% 50%';
          shirtRef.current.style.zIndex = '5';
        }
        updateDom(necklaceRef, anchors.shoulderCenter, anchors.shoulderWidth * 0.82, anchors.torsoHeight * 0.62, anchors.torsoRotation, 0.11, anchors.torsoYaw);

        // Body-contour crop: shoulder and hip widths define a live trapezoid so
        // the garment hugs the torso instead of remaining a fixed rectangle.
        if (shirtRef.current) {
          const shoulderRatio = Math.max(0.42, Math.min(0.98, anchors.shoulderWidth / Math.max(0.001, displayedBodyWidth)));
          const hipRatio = Math.max(0.36, Math.min(0.94, reliableHipWidth / Math.max(0.001, displayedBodyWidth)));
          const topInset = (1 - shoulderRatio) * 50;
          const bottomInset = (1 - hipRatio) * 50;
          shirtRef.current.style.clipPath = `polygon(${topInset}% 1%, ${100-topInset}% 1%, ${100-bottomInset}% 99%, ${bottomInset}% 99%)`;
        }

        // Pose-rigged sleeves: each arm is split shoulder->elbow and elbow->wrist.
        // This is the key difference from the old flat shirt overlay.
        const sleeveThickness = Math.max(0.032, Math.min(0.095, anchors.shoulderWidth * 0.18));
        if (equippedIds.shirt) {
          updateSegment(sleeveLeftUpperRef, anchors.leftShoulder, anchors.leftElbow, sleeveThickness, anchors.torsoYaw);
          updateSegment(sleeveRightUpperRef, anchors.rightShoulder, anchors.rightElbow, sleeveThickness, anchors.torsoYaw);
          updateSegment(sleeveLeftForeRef, anchors.leftElbow, anchors.leftWrist, sleeveThickness * 0.88, anchors.torsoYaw);
          updateSegment(sleeveRightForeRef, anchors.rightElbow, anchors.rightWrist, sleeveThickness * 0.88, anchors.torsoYaw);

          // Body-depth ordering: when the child turns, the arm closer to the camera
          // renders in front of the torso while the far arm slips behind it.
          const leftNear = anchors.torsoYaw < -7;
          const rightNear = anchors.torsoYaw > 7;
          const applyDepth = (refs: React.RefObject<HTMLDivElement | null>[], near: boolean) => {
            refs.forEach((r) => {
              if (!r.current) return;
              r.current.style.zIndex = near ? '8' : '3';
              r.current.style.filter = near ? 'brightness(1.04)' : 'brightness(.91)';
            });
          };
          applyDepth([sleeveLeftUpperRef, sleeveLeftForeRef], leftNear || (!leftNear && !rightNear));
          applyDepth([sleeveRightUpperRef, sleeveRightForeRef], rightNear || (!leftNear && !rightNear));
        } else {
          [sleeveLeftUpperRef, sleeveRightUpperRef, sleeveLeftForeRef, sleeveRightForeRef].forEach((r) => {
            if (r.current) r.current.style.display = 'none';
          });
        }

        // Gloves independently follow each wrist.
        const gloveWidth = Math.max(anchors.headWidth * 0.42, anchors.hipWidth * 0.24, 0.045);
        updateDom(glovesLeftRef, anchors.leftWrist, gloveWidth, gloveWidth * 1.15, 0, 0);
        updateDom(glovesRightRef, anchors.rightWrist, gloveWidth, gloveWidth * 1.15, 0, 0);

        // Shoes overlays (Independent left/right shoes on ankles)
        updateDom(shoesLeftRef, anchors.leftAnkle, Math.max(anchors.hipWidth * 0.42, 0.075), undefined, 0, 0.02);
        updateDom(shoesRightRef, anchors.rightAnkle, Math.max(anchors.hipWidth * 0.42, 0.075), undefined, 0, 0.02);

        // 5. Wings overlay (Behind Torso Center, slightly scaled up)
        updateDom(wingsRef, anchors.torsoCenter, anchors.shoulderWidth * 2.85, anchors.torsoHeight * 1.5, anchors.torsoRotation, -0.05, anchors.torsoYaw);

        // 6. Backpack overlay (Center of shoulders)
        if (!hasWings) updateDom(backpackRef, anchors.shoulderCenter, anchors.shoulderWidth * 1.15, anchors.torsoHeight * 0.9, anchors.torsoRotation, 0.1, anchors.torsoYaw);
        else if (backpackRef.current) backpackRef.current.style.display = 'none';

        // Draw debug skeleton if active
        if (showSkeletonDebug && debugSkeletonRef.current) {
          const debugCanvas = debugSkeletonRef.current;
          const ctx = debugCanvas.getContext('2d');
          if (ctx) {
            const cw = debugCanvas.width;
            const ch = debugCanvas.height;
            const contentRect = cameraContentRectRef.current;
            ctx.clearRect(0, 0, cw, ch);
            ctx.strokeStyle = '#22d3ee';
            ctx.lineWidth = 2.2;
            ctx.fillStyle = '#f43f5e';

            const mapLm = (lm: {x:number;y:number}) => ({
              x: (contentRect.x + lm.x * contentRect.width) * cw,
              y: (contentRect.y + lm.y * contentRect.height) * ch,
            });

            const connections = [
              [1,2],[2,3],[4,5],[5,6],[3,7],[6,8],[9,10],
              [11,12],[11,13],[13,15],[15,17],[17,19],[19,21],[15,19],
              [12,14],[14,16],[16,18],[18,20],[20,22],[16,20],
              [11,23],[12,24],[23,24],[23,25],[25,27],[27,29],[29,31],[27,31],
              [24,26],[26,28],[28,30],[30,32],[28,32],
            ];
            for (const [a,b] of connections) {
              const p1=latest.landmarks[a], p2=latest.landmarks[b];
              if ((p1?.visibility ?? 0) > 0.35 && (p2?.visibility ?? 0) > 0.35) {
                const a2 = mapLm(p1);
                const b2 = mapLm(p2);
                ctx.beginPath();
                ctx.moveTo(a2.x, a2.y);
                ctx.lineTo(b2.x, b2.y);
                ctx.stroke();
              }
            }
            latest.landmarks.forEach((lm, idx) => {
              if ((lm.visibility ?? 0) > 0.35) {
                const m = mapLm(lm);
                ctx.beginPath(); ctx.arc(m.x, m.y, idx <= 10 ? 4 : 5, 0, 2 * Math.PI); ctx.fill();
              }
            });
            // Dedicated face anchors make it obvious where glasses/mask/hat are attached.
            ctx.fillStyle='#fde047';
            [anchors.foreheadCenter, anchors.eyeCenter, anchors.faceCenter, anchors.mouthCenter].forEach((pt)=>{ctx.beginPath();ctx.arc(pt.x*640,pt.y*480,5,0,Math.PI*2);ctx.fill();});
          }
        }
      } else {
        // Lost body tracking or calibration -> hide overlays
        const hide = (ref: React.RefObject<HTMLDivElement | null>) => {
          if (ref.current) ref.current.style.display = 'none';
        };
        hide(hairRef);
        hide(hatRef);
        hide(headAccessoryRef);
        hide(glassesRef);
        hide(maskRef);
        hide(necklaceRef);
        hide(shirtRef);
        hide(glovesLeftRef);
        hide(glovesRightRef);
        hide(shoesLeftRef);
        hide(shoesRightRef);
        hide(wingsRef);
        hide(backpackRef);

        if (gameState === 'dressing') {
          const newFeedback = 'Đang chờ bé đứng trước camera... 👀';
          if (lastFeedbackTextRef.current !== newFeedback) {
            lastFeedbackTextRef.current = newFeedback;
            setFeedbackText(newFeedback);
          }
        }
      }

      requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      active = false;
    };
  }, [getLatestPose, gameState, showSkeletonDebug, isStreaming]);

  // Handle local item selection (with locked item design)
  const handleItemSelect = (item: WardrobeItem) => {
    const isUnlocked = progress.unlockedWardrobe.includes(item.id) || item.costStars === 0;
    
    if (isUnlocked) {
      // Toggle clothing
      audio.playCollect();
      setEquippedIds((prev) => {
        const next = { ...prev };
        if (next[item.category] === item.id) {
          delete next[item.category];
        } else {
          // Conflict groups keep the face/head/back clean instead of piling SVGs.
          if (item.category === 'hat' || item.category === 'crown') {
            delete next.hat; delete next.crown; delete next.headaccessory;
          }
          if (item.category === 'headaccessory') {
            delete next.hat; delete next.crown;
          }
          if (item.category === 'mask') delete next.glasses;
          if (item.category === 'glasses') delete next.mask;
          if (item.category === 'wings') delete next.backpack;
          if (item.category === 'backpack') delete next.wings;
          next[item.category] = item.id;
        }
        return next;
      });
    } else {
      // Locked item preview only (Does NOT purchase automatically, conforms to Section 30)
      audio.playMenuClick();
      setEquippedIds((prev) => ({
        ...prev,
        [item.category]: item.id
      }));
    }
  };

  // Buy item cleanly inside game view
  const handlePurchaseItem = (item: WardrobeItem) => {
    if (progress.stars >= item.costStars && progress.diamonds >= item.costDiamonds) {
      audio.playSuccess();
      onUpdateProgress((prev) => ({
        ...prev,
        stars: prev.stars - item.costStars,
        diamonds: prev.diamonds - item.costDiamonds,
        unlockedWardrobe: [...prev.unlockedWardrobe, item.id]
      }));
      speakVoice('Đã mở khóa một trang phục mới!');
    } else {
      audio.playFail();
    }
  };

  const handleSaveOutfit = () => {
    audio.playPowerup();
    onUpdateProgress((prev) => ({
      ...prev,
      equippedWardrobe: { ...equippedIds }
    }));
    speakVoice("Đã lưu bộ trang phục cá tính của bé!");
  };

  const applyOutfitPreset = (preset: typeof OUTFIT_PRESETS[number]) => {
    const allowed: { [key in CategoryType]?: string } = {};
    Object.entries(preset.items).forEach(([category, itemId]) => {
      if (!itemId) return;
      const item = WARDROBE_ITEMS.find((x) => x.id === itemId);
      if (!item) return;
      const unlocked = item.costStars === 0 || progress.unlockedWardrobe.includes(item.id);
      if (unlocked) allowed[category as CategoryType] = itemId;
    });
    setEquippedIds((prev) => ({ ...prev, ...allowed }));
    audio.playPowerup();
    const skipped = Object.keys(preset.items).length - Object.keys(allowed).length;
    speakVoice(skipped > 0 ? `Đã mặc các món đã mở khóa trong bộ ${preset.name}.` : `Đã mặc bộ ${preset.name}!`);
  };

  const handleRandomize = () => {
    audio.playDiceRoll();
    const randomized: { [key in CategoryType]?: string } = {};

    CATEGORIES.forEach((cat) => {
      const catItems = WARDROBE_ITEMS.filter(item => item.category === cat.id);
      if (catItems.length > 0) {
        // Select any unlocked item or default
        const unlockedOnly = catItems.filter(item => progress.unlockedWardrobe.includes(item.id) || item.costStars === 0);
        if (unlockedOnly.length === 0) return;
        const randomItem = unlockedOnly[Math.floor(Math.random() * unlockedOnly.length)];
        randomized[cat.id] = randomItem.id;
      }
    });

    setEquippedIds(randomized);
    speakVoice("Phối đồ bất ngờ thành công!");
  };

  const handleClearOutfit = () => {
    audio.playFail();
    setEquippedIds({});
    speakVoice("Đã cất hết quần áo!");
  };

  // Photo mode local countdown
  const handleTakePhoto = () => {
    audio.playPowerup();
    speakVoice("Ba, hai, một... tạo dáng!");
    setCountdownNum(3);

    const interval = setInterval(() => {
      setCountdownNum((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(interval);
          // Snap!
          audio.playDiceRoll();
          setShowPhotoFlash(true);
          scheduleTimeout(() => setShowPhotoFlash(false), 150);
          setLastPhoto(true);
          return null;
        }
        audio.playMenuClick();
        return prev - 1;
      });
    }, 850);
  };

  const currentOutfitEmojis = Object.values(equippedIds)
    .map(id => WARDROBE_ITEMS.find(item => item.id === id)?.icon || '')
    .filter(Boolean);

  const activeCategoryItems = WARDROBE_ITEMS.filter(item => item.category === activeCategory);

  return (
    <div 
      id="fashion-mirror-game" 
      className="w-full flex flex-col bg-[#0f0e17] text-[#fffffe] rounded-3xl border-4 border-purple-500/30 shadow-2xl overflow-hidden relative"
      style={{ minHeight: '85vh' }}
    >
      {/* 1. CALIBRATION MODE */}
      {gameState === 'calibration' && (
        <div className="absolute inset-0 bg-slate-950/90 flex items-center justify-center p-4 z-50">
          <FashionCalibration
            onCalibrationSuccess={(fullBody) => {
              setGameState('dressing');
              speakVoice(fullBody ? "Mở khóa chế độ toàn thân!" : "Mở khóa chế độ nửa người!");
            }}
            onSkip={() => setGameState('dressing')}
          />
        </div>
      )}

      {/* 2. FASHION SHOW MODE */}
      {gameState === 'show' && (
        <div className="absolute inset-0 bg-slate-900 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <FashionShowMode
            progress={progress}
            onUpdateProgress={onUpdateProgress}
            activeOutfitEmojis={currentOutfitEmojis}
            equippedIds={equippedIds}
            onBack={() => setGameState('dressing')}
            onFinished={() => {
              setGameState('dressing');
            }}
          />
        </div>
      )}

      {/* Photo Flash Overlay */}
      {showPhotoFlash && (
        <div className="absolute inset-0 bg-white z-50 pointer-events-none transition-all duration-100" />
      )}

      {/* Top Header Panel - Respecting HUD parameters */}
      <div className="p-3 sm:p-4 bg-[#16161a] border-b border-purple-900/30 grid grid-cols-[auto_1fr_auto] items-center gap-2 z-30">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full font-bold bg-purple-950 text-purple-300 border border-purple-800/40 hover:bg-purple-900 transition text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </button>

        <div className="text-center min-w-0">
          <h1 className="text-base sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-300 to-cyan-300 flex items-center justify-center gap-1">
            🪞 GƯƠNG PHÉP THUẬT AR
          </h1>
          <p className="text-[10px] text-purple-300 font-bold tracking-tight">Fashion Show – Thử đồ thông minh</p>
        </div>

        <div className="flex items-center justify-end gap-2">
          <div className="hidden sm:flex items-center gap-2 bg-purple-950/80 px-3.5 py-1 rounded-full border border-purple-800 font-black text-[10px]">
            <span className="text-amber-400 flex items-center gap-0.5">★ {progress.stars}</span>
            <span className="text-cyan-400">💎 {progress.diamonds}</span>
          </div>
          <button
            onClick={() => setShowAvatarMirror(true)}
            className="hidden md:block px-3 py-1.5 rounded-full border border-cyan-300/30 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-100 font-black text-[10px] sm:text-xs shadow-lg"
          >
            🤖 Avatar 3D
          </button>
        </div>
      </div>

      {/* Main AR Display Area - LANDSCAPE GRID */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 relative overflow-hidden">
        
        {/* Left Grid: CAMERA AR PREVIEW CANVAS */}
        <div className="lg:col-span-8 bg-slate-950 flex items-center justify-center relative aspect-[4/3] w-full lg:max-w-none mx-auto overflow-hidden shadow-2xl">
          
          {/* Real-time Camera Stream Canvas */}
          <canvas
            ref={cameraCanvasRef}
            width={graphicsProfile.quality === 'lite' ? 480 : graphicsProfile.quality === 'high' ? 960 : 640}
            height={graphicsProfile.quality === 'lite' ? 360 : graphicsProfile.quality === 'high' ? 720 : 480}
            className="absolute inset-0 w-full h-full object-contain bg-black z-0"
          />

          {/* CAMERA STAGE OVERLAYS (IMPERATIVE DOM REFS) */}
          <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
            
            {/* Hair sits behind the face and follows measured head width. */}
            <div ref={hairRef} className="absolute pointer-events-none select-none items-center justify-center text-center transition-all duration-75" style={{ display: 'none', zIndex: 2, filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.45))' }}>
              <RealisticWardrobeOverlay itemId={equippedIds.hair} category="hair" />
            </div>

            {/* Ear/horn/bow layer */}
            <div ref={headAccessoryRef} className="absolute pointer-events-none select-none items-center justify-center text-center transition-all duration-75" style={{ display: 'none' }}>
              <RealisticWardrobeOverlay itemId={equippedIds.headaccessory || equippedIds.bow} category={equippedIds.headaccessory ? 'headaccessory' : 'bow'} />
            </div>

            {/* Hat overlay container */}
            <div 
              ref={hatRef} 
              className="absolute pointer-events-none select-none items-center justify-center text-center transition-all duration-75"
              style={{ display: 'none', filter: 'drop-shadow(0 10px 16px rgba(0,0,0,0.5))' }}
            >
              <RealisticWardrobeOverlay itemId={equippedIds.hat || equippedIds.crown} category={equippedIds.crown ? 'crown' : 'hat'} />
            </div>

            {/* Glasses overlay */}
            <div 
              ref={glassesRef} 
              className="absolute pointer-events-none select-none items-center justify-center text-center transition-all duration-75"
              style={{ display: 'none', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))' }}
            >
              <RealisticWardrobeOverlay itemId={equippedIds.glasses} category="glasses" />
            </div>

            {/* Face mask overlay */}
            <div ref={maskRef} className="absolute pointer-events-none select-none items-center justify-center text-center transition-all duration-75" style={{ display: 'none', filter: 'drop-shadow(0 3px 7px rgba(0,0,0,0.4))' }}>
              <RealisticWardrobeOverlay itemId={equippedIds.mask} category="mask" />
            </div>

            {/* Necklace follows the neckline/upper torso. */}
            <div ref={necklaceRef} className="absolute pointer-events-none select-none items-center justify-center text-center transition-all duration-75" style={{ display: 'none' }}>
              <RealisticWardrobeOverlay itemId={equippedIds.necklace} category="necklace" />
            </div>

            {/* Pose-rigged sleeves move with shoulder / elbow / wrist joints */}
            <div ref={sleeveLeftUpperRef} className="absolute pointer-events-none select-none items-center justify-center transition-all duration-75" style={{ display: 'none', zIndex: 4 }}>
              <FittedSleeveOverlay itemId={equippedIds.shirt} segment="upper" />
            </div>
            <div ref={sleeveRightUpperRef} className="absolute pointer-events-none select-none items-center justify-center transition-all duration-75" style={{ display: 'none', zIndex: 4 }}>
              <FittedSleeveOverlay itemId={equippedIds.shirt} segment="upper" />
            </div>
            <div ref={sleeveLeftForeRef} className="absolute pointer-events-none select-none items-center justify-center transition-all duration-75" style={{ display: 'none', zIndex: 4 }}>
              <FittedSleeveOverlay itemId={equippedIds.shirt} segment="forearm" />
            </div>
            <div ref={sleeveRightForeRef} className="absolute pointer-events-none select-none items-center justify-center transition-all duration-75" style={{ display: 'none', zIndex: 4 }}>
              <FittedSleeveOverlay itemId={equippedIds.shirt} segment="forearm" />
            </div>

            {/* Shirt overlay */}
            <div 
              ref={shirtRef} 
              className="absolute pointer-events-none select-none items-center justify-center text-center transition-all duration-75"
              style={{ display: 'none', zIndex: 4, filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.4))' }}
            >
              <RealisticWardrobeOverlay itemId={equippedIds.shirt} category="shirt" />
            </div>

            {/* Independent gloves follow each wrist */}
            <div ref={glovesLeftRef} className="absolute pointer-events-none select-none items-center justify-center transition-all duration-75" style={{ display: 'none' }}>
              <RealisticWardrobeOverlay itemId={equippedIds.gloves} category="gloves" side="left" />
            </div>
            <div ref={glovesRightRef} className="absolute pointer-events-none select-none items-center justify-center transition-all duration-75" style={{ display: 'none' }}>
              <RealisticWardrobeOverlay itemId={equippedIds.gloves} category="gloves" side="right" />
            </div>

            {/* Left Shoe */}
            <div 
              ref={shoesLeftRef} 
              className="absolute pointer-events-none select-none items-center justify-center text-center transition-all duration-75"
              style={{ display: 'none', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}
            >
              <RealisticWardrobeOverlay itemId={equippedIds.shoes} category="shoes" side="left" />
            </div>

            {/* Right Shoe */}
            <div 
              ref={shoesRightRef} 
              className="absolute pointer-events-none select-none items-center justify-center text-center transition-all duration-75"
              style={{ display: 'none', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}
            >
              <RealisticWardrobeOverlay itemId={equippedIds.shoes} category="shoes" side="right" />
            </div>

            {/* Wings overlay */}
            <div 
              ref={wingsRef} 
              className="absolute pointer-events-none select-none items-center justify-center text-center transition-all duration-75"
              style={{ display: 'none', zIndex: 1, filter: 'drop-shadow(0 10px 16px rgba(0,0,0,0.4))' }}
            >
              <RealisticWardrobeOverlay itemId={equippedIds.wings} category="wings" />
            </div>

            {/* Backpack overlay */}
            <div 
              ref={backpackRef} 
              className="absolute pointer-events-none select-none items-center justify-center text-center transition-all duration-75"
              style={{ display: 'none', zIndex: 1, filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.4))' }}
            >
              <RealisticWardrobeOverlay itemId={equippedIds.backpack} category="backpack" />
            </div>
          </div>

          {/* Canvas for Skeleton Debug */}
          {showSkeletonDebug && (
            <canvas 
              ref={debugSkeletonRef}
              width={640}
              height={480}
              className="absolute inset-0 w-full h-full object-contain z-20 pointer-events-none opacity-60"
            />
          )}

          {/* Photo Countdown Indicator */}
          {countdownNum !== null && (
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-20">
              <span className="text-8xl font-black text-red-500 animate-ping absolute">{countdownNum}</span>
              <span className="text-7xl font-black text-white relative">{countdownNum}</span>
            </div>
          )}

          <div className="absolute top-3 right-3 z-30"><CameraReadinessBadge compact /></div>

          {/* Feedback Guidance Subtitle (Section 80) */}
          {feedbackText && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-black/75 px-4 py-2 rounded-full border border-purple-500/20 text-xs font-bold text-purple-300 max-w-sm text-center leading-relaxed backdrop-blur-md">
              {feedbackText}
            </div>
          )}

          {/* Quality, Camera Mode Float HUD Bar */}
          <div className="absolute bottom-4 left-4 flex gap-2 z-20">
            <button
              onClick={() => setShowSkeletonDebug(prev => !prev)}
              className={`p-2.5 rounded-xl border font-bold text-[10px] transition ${
                showSkeletonDebug 
                  ? 'bg-purple-600 border-purple-500 text-white' 
                  : 'bg-black/60 border-purple-900/30 text-purple-300 hover:bg-black/80'
              }`}
            >
              Xương {showSkeletonDebug ? 'Bật' : 'Tắt'} 🦴
            </button>
            <button
              onClick={() => setGameState('calibration')}
              className="p-2.5 rounded-xl border bg-black/60 border-purple-900/30 text-purple-300 hover:bg-black/80 font-bold text-[10px] transition"
            >
              Quét Thân Người 👤
            </button>
          </div>

          <div className="absolute bottom-4 right-4 flex gap-2 z-20">
            <button
              onClick={handleTakePhoto}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition"
            >
              <Camera className="w-4 h-4" /> Chụp 📸
            </button>
          </div>

          {/* Fallback Camera message if not active */}
          {!isStreaming && (
            <div className="text-center p-8 relative z-0">
              <RefreshCw className="w-12 h-12 text-purple-500/30 mx-auto mb-3 animate-spin" />
              <p className="text-sm font-black text-purple-300">Đang đồng bộ hóa Gương Phép Thuật...</p>
              <p className="text-[10px] text-slate-500 mt-1">Vui lòng đảm bảo camera thiết bị đang hoạt động bình thường.</p>
            </div>
          )}
        </div>

        {/* Right Grid: CONTROLS & WARDROBE CHOICE */}
        <div className="lg:col-span-4 bg-[#121214] border-t lg:border-t-0 lg:border-l border-purple-900/30 p-3 sm:p-4 flex flex-col gap-3 z-30 overflow-y-auto max-h-[48vh] lg:max-h-none">
          
          {/* Main Action Hub */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => setGameState('show')}
              disabled={Object.keys(equippedIds).length === 0}
              className="py-3 bg-gradient-to-r from-purple-500 to-indigo-600 disabled:from-slate-800 disabled:to-slate-800 hover:opacity-90 text-white font-black text-xs rounded-2xl shadow-lg flex items-center justify-center gap-1.5 transition"
            >
              <Play className="w-4 h-4 fill-white" />
              BẮT ĐẦU SHOW 🪄
            </button>
            <button
              onClick={handleSaveOutfit}
              className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl shadow-lg flex items-center justify-center gap-1.5 transition"
            >
              <Check className="w-4 h-4" />
              LƯU BỘ ĐỒ
            </button>
          </div>

          {/* Quick random & clear */}
          <div className="grid grid-cols-2 gap-2 text-[10px] font-black">
            <button
              onClick={handleRandomize}
              className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700/50 flex items-center justify-center gap-1 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Phối Ngẫu Nhiên
            </button>
            <button
              onClick={handleClearOutfit}
              className="py-2 bg-red-950/45 hover:bg-red-950 text-red-300 rounded-xl border border-red-900/30 flex items-center justify-center gap-1 transition"
            >
              <Trash2 className="w-3.5 h-3.5" /> Cất Toàn Bộ
            </button>
          </div>

          {/* Outfit presets: separate from categories so mobile scrolling is predictable. */}
          <div className="rounded-2xl border border-fuchsia-900/30 bg-fuchsia-950/15 p-2.5">
            <div className="text-[10px] font-black text-fuchsia-200 mb-2 flex items-center justify-between gap-2">
              <span>✨ ĐỔI NHANH CẢ BỘ</span>
              <span className="text-[9px] text-slate-500 font-bold">Vuốt ngang</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory">
              {OUTFIT_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyOutfitPreset(preset)}
                  className="shrink-0 snap-start rounded-xl border border-fuchsia-700/50 bg-fuchsia-950/40 hover:bg-fuchsia-900/50 px-3 py-2 text-[10px] font-black text-fuchsia-100 min-h-10"
                >
                  {preset.icon} {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Categories: independent sticky strip. */}
          <div className="sticky top-0 z-10 -mx-1 px-1 py-1 bg-[#121214]/95 backdrop-blur">
            <div className="flex gap-1.5 overflow-x-auto pb-1 snap-x">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`shrink-0 snap-start flex items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-black transition min-h-10 ${
                    activeCategory === cat.id
                      ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-300/30'
                      : 'bg-purple-950/50 text-purple-300 hover:bg-purple-900/40'
                  }`}
                >
                  <span className="text-base leading-none">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Đang chọn</p>
              <p className="text-xs font-black text-purple-200 truncate">
                {CATEGORIES.find((cat) => cat.id === activeCategory)?.icon} {CATEGORIES.find((cat) => cat.id === activeCategory)?.label}
              </p>
            </div>
            <button
              onClick={() => setShowAvatarMirror(true)}
              className="md:hidden shrink-0 px-3 py-2 rounded-xl border border-cyan-300/30 bg-cyan-500/15 text-cyan-100 font-black text-[10px]"
            >
              🤖 Avatar 3D
            </button>
          </div>

          {/* Active Category Item Card grid */}
          <div className="flex-1 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-2 gap-2">
            {activeCategoryItems.map((item) => {
              const isUnlocked = progress.unlockedWardrobe.includes(item.id) || item.costStars === 0;
              const isEquipped = equippedIds[item.category] === item.id;
              const canAfford = progress.stars >= item.costStars && progress.diamonds >= item.costDiamonds;

              return (
                <div
                  key={item.id}
                  onClick={() => handleItemSelect(item)}
                  className={`p-2.5 min-h-[104px] rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden select-none ${
                    isEquipped
                      ? 'bg-purple-950/70 border-purple-500 shadow-md transform scale-102'
                      : 'bg-[#18181b] border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  {/* Status indicators */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-2xl sm:text-3xl">{item.icon}</span>
                    {isEquipped && (
                      <span className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center text-[10px]">
                        ✓
                      </span>
                    )}
                    {!isUnlocked && (
                      <span className="text-[10px] text-amber-400 bg-amber-950/30 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 font-bold">
                        <Lock className="w-2.5 h-2.5" /> Khóa
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-[10px] font-extrabold text-white truncate">{item.name}</h4>
                    {item.badge && (
                      <span className="text-[8px] font-black text-pink-400 uppercase tracking-widest mt-0.5 block">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  {/* Pricing and unlock details */}
                  {!isUnlocked && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800 flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[8px] font-bold text-slate-400">
                        <span className="flex items-center gap-0.5">⭐ {item.costStars}</span>
                        <span>💎 {item.costDiamonds}</span>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Avoid selecting item again
                          handlePurchaseItem(item);
                        }}
                        disabled={!canAfford}
                        className={`w-full py-1 rounded-lg text-[8px] font-black uppercase tracking-wider text-center transition ${
                          canAfford 
                            ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        MỞ KHÓA
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Local Photo Capture Album section */}
          {lastPhoto && (
            <div className="bg-gradient-to-r from-emerald-950/50 to-teal-950/50 p-3 rounded-2xl border border-emerald-500/20 relative animate-pulse flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                <div className="text-[10px]">
                  <p className="font-black text-emerald-300">ẢNH CHỤP THÀNH CÔNG! 📸</p>
                  <p className="text-slate-400 font-bold">Lưu giữ khoảnh khắc đáng yêu của bé</p>
                </div>
              </div>
              <button
                onClick={() => setLastPhoto(false)}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[8px] font-black rounded-lg transition"
              >
                Đóng
              </button>
            </div>
          )}

        </div>
      <AvatarMirrorMode
        isOpen={showAvatarMirror}
        onClose={() => setShowAvatarMirror(false)}
        equippedIds={equippedIds}
      />

      </div>
    </div>
  );
}
