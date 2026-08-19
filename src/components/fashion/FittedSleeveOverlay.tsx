/**
 * Pose-rigged sleeve segment for Fashion AR.
 * The container is positioned/rotated from shoulder->elbow or elbow->wrist.
 */
import React, { useId } from 'react';
import { WARDROBE_ITEMS } from '../../utils/characterRenderer';

interface Props {
  itemId?: string;
  segment?: 'upper' | 'forearm';
}

export default function FittedSleeveOverlay({ itemId, segment = 'upper' }: Props) {
  const uid = useId().replace(/:/g, '');
  if (!itemId) return null;
  const item = WARDROBE_ITEMS.find((x) => x.id === itemId);
  if (!item) return null;
  const color = item.previewColor || '#ec4899';
  const cuff = segment === 'forearm';

  return (
    <svg viewBox="0 0 220 76" preserveAspectRatio="none" className="w-full h-full overflow-visible" aria-hidden>
      <defs>
        <linearGradient id={`sl-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity=".56" />
          <stop offset="18%" stopColor={color} stopOpacity=".98" />
          <stop offset="72%" stopColor={color} stopOpacity=".88" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity=".28" />
        </linearGradient>
        <filter id={`sd-${uid}`} x="-20%" y="-60%" width="140%" height="220%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000" floodOpacity=".32" />
        </filter>
      </defs>
      <g filter={`url(#sd-${uid})`}>
        <path
          d={cuff ? 'M12 13 Q8 38 13 63 Q105 68 208 56 Q214 38 207 20 Q108 9 12 13Z' : 'M12 10 Q7 38 13 66 Q104 72 208 55 Q214 38 206 21 Q108 5 12 10Z'}
          fill={`url(#sl-${uid})`}
          stroke="#fff"
          strokeOpacity=".44"
          strokeWidth="2.5"
        />
        <path d="M23 21 Q108 12 197 24" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="5" strokeLinecap="round" />
        <path d="M30 54 Q112 61 194 50" fill="none" stroke="#0f172a" strokeOpacity=".14" strokeWidth="3" strokeLinecap="round" />
        {cuff && <path d="M190 17 Q207 38 190 59" fill="none" stroke="#fff" strokeOpacity=".65" strokeWidth="7" />}
      </g>
    </svg>
  );
}
