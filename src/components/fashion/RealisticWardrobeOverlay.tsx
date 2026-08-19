/**
 * Lightweight SVG wardrobe overlays for the AR mirror.
 * Emoji remain only in the catalogue; the camera view uses scalable vector garments.
 */
import React, { useId } from 'react';
import { WARDROBE_ITEMS } from '../../utils/characterRenderer';
import { CategoryType } from '../../types';

interface Props {
  itemId?: string;
  category: CategoryType;
  side?: 'left' | 'right';
}

export default function RealisticWardrobeOverlay({ itemId, category, side = 'left' }: Props) {
  const uid = useId().replace(/:/g, '');
  if (!itemId) return null;
  const item = WARDROBE_ITEMS.find((x) => x.id === itemId);
  if (!item) return null;
  const color = item.previewColor || '#ec4899';
  const dark = '#111827';
  const light = '#ffffff';
  const grad = `garment-${uid}`;
  const shine = `shine-${uid}`;

  const defs = (
    <defs>
      <linearGradient id={grad} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={light} stopOpacity=".78" />
        <stop offset="24%" stopColor={color} stopOpacity=".98" />
        <stop offset="72%" stopColor={color} stopOpacity=".82" />
        <stop offset="100%" stopColor={dark} stopOpacity=".34" />
      </linearGradient>
      <linearGradient id={shine} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fff" stopOpacity=".8" />
        <stop offset="55%" stopColor="#fff" stopOpacity=".08" />
        <stop offset="100%" stopColor="#000" stopOpacity=".18" />
      </linearGradient>
      <filter id={`shadow-${uid}`} x="-30%" y="-30%" width="160%" height="170%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity=".38" />
      </filter>
    </defs>
  );


  if (category === 'hair') {
    const pony = itemId.includes('ponytail');
    const bob = itemId.includes('bob');
    // Hair must frame the real face instead of painting an opaque blob over it.
    // The center is intentionally transparent; only fringe/sides/back are drawn.
    return (
      <svg viewBox="0 0 260 260" className="w-full h-full overflow-visible" aria-hidden>
        {defs}
        <g filter={`url(#shadow-${uid})`} fill={`url(#${grad})`} stroke="#fff" strokeOpacity=".16" strokeWidth="2.5">
          <path d="M54 105 Q55 35 130 22 Q205 35 206 105 Q184 76 164 68 Q130 52 96 68 Q74 76 54 105Z" />
          <path d={bob ? 'M54 91 Q42 137 62 208 Q77 226 94 206 L91 111 Q75 94 54 91Z' : 'M49 88 Q32 151 57 239 Q75 252 99 226 L91 107 Q72 91 49 88Z'} />
          <path d={bob ? 'M206 91 Q218 137 198 208 Q183 226 166 206 L169 111 Q185 94 206 91Z' : 'M211 88 Q228 151 203 239 Q185 252 161 226 L169 107 Q188 91 211 88Z'} />
          <path d="M78 86 Q103 50 130 51 Q158 50 183 86 Q161 70 146 72 Q130 85 114 72 Q96 70 78 86Z" fill="#fff" fillOpacity=".10" stroke="none" />
          {pony && <path d="M188 79 Q244 84 232 202 Q222 236 197 221 Q218 149 184 104Z" />}
        </g>
      </svg>
    );
  }

  if (category === 'mask') {
    const fox = itemId.includes('fox');
    const cyber = itemId.includes('cyber');
    return (
      <svg viewBox="0 0 240 150" className="w-full h-auto overflow-visible" aria-hidden>
        {defs}
        <g filter={`url(#shadow-${uid})`}>
          <path d={fox
            ? 'M38 35 L75 15 L102 46 Q120 34 138 46 L165 15 L202 35 L192 102 Q156 135 120 138 Q84 135 48 102Z'
            : 'M35 45 Q120 8 205 45 L190 112 Q120 145 50 112Z'}
            fill={cyber?'#0f172a':`url(#${grad})`} stroke={cyber?'#22d3ee':'#fff'} strokeOpacity=".8" strokeWidth="4"/>
          <path d="M58 66 Q83 48 106 67 Q88 88 62 83Z M134 67 Q158 48 182 66 Q178 84 151 84Z" fill={cyber?'#22d3ee':'#111827'} fillOpacity=".85"/>
          {cyber && <path d="M78 111 L120 95 L162 111" stroke="#ec4899" strokeWidth="5" fill="none"/>}
        </g>
      </svg>
    );
  }

  if (category === 'necklace') {
    return (
      <svg viewBox="0 0 220 180" className="w-full h-full overflow-visible" aria-hidden>
        {defs}
        <g filter={`url(#shadow-${uid})`}>
          <path d="M38 28 Q110 155 182 28" fill="none" stroke="#f8d34f" strokeWidth="8" strokeLinecap="round"/>
          <path d="M110 109 L128 131 L110 160 L92 131Z" fill={`url(#${grad})`} stroke="#fff" strokeWidth="3"/>
        </g>
      </svg>
    );
  }

  if (category === 'gloves') {
    const mirror = side === 'right' ? 'scale(-1 1) translate(-160 0)' : undefined;
    return (
      <svg viewBox="0 0 160 180" className="w-full h-full overflow-visible" aria-hidden>
        {defs}
        <g transform={mirror} filter={`url(#shadow-${uid})`}>
          <path d="M50 157 Q28 124 38 96 L43 53 Q45 40 55 45 L62 83 L65 31 Q67 19 78 25 L81 82 L88 29 Q91 18 101 26 L99 85 L109 42 Q113 31 122 39 L115 99 Q118 130 101 159Z" fill={`url(#${grad})`} stroke="#fff" strokeOpacity=".55" strokeWidth="3"/>
        </g>
      </svg>
    );
  }

  if (category === 'headaccessory' || category === 'bow') {
    const cat = itemId.includes('cat');
    const horn = itemId.includes('horn');
    return (
      <svg viewBox="0 0 240 130" className="w-full h-auto overflow-visible" aria-hidden>
        {defs}
        <g filter={`url(#shadow-${uid})`}>
          {cat && <><path d="M45 105 L66 18 L108 91Z" fill={`url(#${grad})`} stroke="#fff" strokeWidth="3"/><path d="M132 91 L174 18 L195 105Z" fill={`url(#${grad})`} stroke="#fff" strokeWidth="3"/></>}
          {horn && <><path d="M65 103 Q55 49 91 18 Q96 68 109 101Z" fill={`url(#${grad})`} stroke="#fff" strokeWidth="3"/><path d="M131 101 Q144 68 149 18 Q185 49 175 103Z" fill={`url(#${grad})`} stroke="#fff" strokeWidth="3"/></>}
          {!cat && !horn && <><circle cx="93" cy="67" r="33" fill={`url(#${grad})`}/><circle cx="147" cy="67" r="33" fill={`url(#${grad})`}/><circle cx="120" cy="67" r="17" fill="#fff" fillOpacity=".45"/></>}
        </g>
      </svg>
    );
  }

  if (category === 'hat' || category === 'crown') {
    const crown = itemId.includes('crown');
    return (
      <svg viewBox="0 0 220 130" className="w-full h-auto overflow-visible" aria-hidden>
        {defs}
        {crown ? (
          <g filter={`url(#shadow-${uid})`}>
            <path d="M28 102 L38 36 L79 74 L110 22 L142 74 L183 36 L193 102 Z" fill={`url(#${grad})`} stroke="#f8d34f" strokeWidth="5" />
            <path d="M31 101 Q110 116 190 101 L186 119 Q110 131 35 118Z" fill="#d89b18" />
            {[52,110,168].map((x,i)=><circle key={x} cx={x} cy={i===1?67:82} r="8" fill={i===1?'#f43f5e':'#38bdf8'} stroke="#fff" strokeWidth="2" />)}
          </g>
        ) : itemId === 'hat_party' ? (
          <g filter={`url(#shadow-${uid})`}>
            <path d="M64 111 L111 10 L164 111 Z" fill={`url(#${grad})`} stroke="#fff" strokeOpacity=".55" strokeWidth="3" />
            <path d="M72 94 Q112 111 155 91" fill="none" stroke="#fde68a" strokeWidth="8" strokeLinecap="round" />
            <circle cx="111" cy="9" r="12" fill="#fde047" />
          </g>
        ) : (
          <g filter={`url(#shadow-${uid})`}>
            <ellipse cx="110" cy="101" rx="97" ry="22" fill={`url(#${grad})`} stroke="#8b6b30" strokeWidth="3" />
            <path d="M58 94 C65 36 81 18 111 17 C142 18 158 37 164 94Z" fill={`url(#${grad})`} stroke="#8b6b30" strokeWidth="3" />
            <path d="M60 79 Q111 95 162 79" fill="none" stroke="#d946ef" strokeWidth="10" />
            <path d="M68 45 Q110 28 154 47" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="5" />
          </g>
        )}
      </svg>
    );
  }

  if (category === 'glasses') {
    const sunglass = itemId.includes('sun');
    return (
      <svg viewBox="0 0 240 90" className="w-full h-auto overflow-visible" aria-hidden>
        {defs}
        <g filter={`url(#shadow-${uid})`} stroke={sunglass?'#0f172a':'#b78a16'} strokeWidth="8" fill={sunglass?'#111827':'rgba(255,255,255,.12)'}>
          <path d="M15 25 Q25 18 36 22" fill="none" />
          <path d="M204 22 Q217 18 226 25" fill="none" />
          <rect x="31" y="18" width="74" height="51" rx={sunglass?14:26} />
          <rect x="135" y="18" width="74" height="51" rx={sunglass?14:26} />
          <path d="M105 37 Q120 28 135 37" fill="none" />
        </g>
        <path d="M43 29 Q72 19 94 29" stroke="#fff" strokeOpacity=".45" strokeWidth="5" fill="none" />
        <path d="M147 29 Q176 19 198 29" stroke="#fff" strokeOpacity=".45" strokeWidth="5" fill="none" />
      </svg>
    );
  }

  if (category === 'shirt') {
    const dress = itemId.includes('dress');
    const karate = itemId.includes('karate');
    const robot = itemId.includes('robot');
    return (
      <svg viewBox="0 0 260 330" preserveAspectRatio="xMidYMid meet" className="w-full h-full overflow-visible" aria-hidden>
        {defs}
        <g filter={`url(#shadow-${uid})`}>
          <path d={dress ? 'M72 50 L38 91 L66 126 L81 112 L55 299 Q130 326 205 299 L178 112 L195 126 L222 91 L188 50 L157 37 Q130 58 103 37Z' : 'M73 48 L33 92 L62 126 L82 108 L77 285 Q130 303 183 285 L178 108 L198 126 L227 92 L187 48 L157 35 Q130 55 103 35Z'} fill={`url(#${grad})`} stroke="#fff" strokeOpacity=".55" strokeWidth="3" />
          <path d="M104 38 Q130 61 157 38 Q150 78 130 79 Q109 77 104 38Z" fill="#0f172a" fillOpacity={robot?.5:.12} />
          {karate && <><path d="M130 75 L130 271" stroke="#334155" strokeWidth="5"/><path d="M75 184 Q130 207 184 184" stroke="#111827" strokeWidth="17"/></>}
          {robot && <><path d="M91 108 L169 108 L177 190 L130 220 L83 190Z" fill="#111827" fillOpacity=".56" stroke="#93c5fd" strokeWidth="4"/><circle cx="130" cy="153" r="26" fill="#22d3ee" fillOpacity=".72" stroke="#e0f2fe" strokeWidth="5"/></>}
          {!robot && !karate && <path d="M92 89 Q130 70 169 89" fill="none" stroke="#fff" strokeOpacity=".34" strokeWidth="8" strokeLinecap="round" />}
          {dress && <path d="M71 214 Q130 237 190 214" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="7" />}
        </g>
      </svg>
    );
  }

  if (category === 'shoes') {
    const mirror = side === 'right' ? 'scale(-1 1) translate(-220 0)' : undefined;
    return (
      <svg viewBox="0 0 220 125" className="w-full h-auto overflow-visible" aria-hidden>
        {defs}
        <g transform={mirror} filter={`url(#shadow-${uid})`}>
          <path d="M35 43 Q71 20 108 39 L128 69 Q159 72 191 88 Q202 95 194 108 Q121 123 43 108 Q22 95 35 43Z" fill={`url(#${grad})`} stroke="#fff" strokeOpacity=".58" strokeWidth="3" />
          <path d="M39 101 Q117 112 193 99" stroke="#f8fafc" strokeWidth="13" strokeLinecap="round" />
          <path d="M72 49 L125 61 M66 62 L133 72 M61 75 L141 82" stroke="#fff" strokeOpacity=".72" strokeWidth="5" strokeLinecap="round" />
          <path d="M149 80 Q169 83 186 92" stroke="#fff" strokeOpacity=".42" strokeWidth="5" fill="none" />
        </g>
      </svg>
    );
  }

  if (category === 'backpack') {
    return (
      <svg viewBox="0 0 220 260" className="w-full h-full overflow-visible" aria-hidden>
        {defs}
        <g filter={`url(#shadow-${uid})`}>
          <path d="M56 66 Q69 24 110 24 Q151 24 164 66" fill="none" stroke={color} strokeWidth="18" strokeLinecap="round" />
          <rect x="43" y="54" width="134" height="174" rx="45" fill={`url(#${grad})`} stroke="#fff" strokeOpacity=".55" strokeWidth="4" />
          <rect x="61" y="142" width="98" height="62" rx="23" fill="#111827" fillOpacity=".2" stroke="#fff" strokeOpacity=".34" strokeWidth="3" />
          <path d="M74 91 Q110 73 147 91" stroke="#fff" strokeOpacity=".46" strokeWidth="7" fill="none" strokeLinecap="round" />
        </g>
      </svg>
    );
  }

  if (category === 'wings') {
    return (
      <svg viewBox="0 0 360 250" className="w-full h-full overflow-visible" aria-hidden>
        {defs}
        <g filter={`url(#shadow-${uid})`} fill={`url(#${grad})`} stroke="#fff" strokeOpacity=".66" strokeWidth="4">
          <path d="M176 128 C142 38 55 20 24 64 C57 68 76 83 88 103 C49 98 27 119 20 151 C60 139 92 149 112 177 C75 174 58 199 56 224 C112 217 157 186 176 128Z" />
          <path d="M184 128 C218 38 305 20 336 64 C303 68 284 83 272 103 C311 98 333 119 340 151 C300 139 268 149 248 177 C285 174 302 199 304 224 C248 217 203 186 184 128Z" />
        </g>
      </svg>
    );
  }

  return null;
}
