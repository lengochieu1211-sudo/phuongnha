/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Camera, RotateCw } from 'lucide-react';

interface LandscapeNoticeProps {
  showPip: boolean;
  onTogglePip: (show: boolean) => void;
}

export default function LandscapeNotice({ showPip, onTogglePip }: LandscapeNoticeProps) {
  const [dismissNotice, setDismissNotice] = useState<boolean>(false);

  useEffect(() => {
    // Automatically dismiss the notice after 6 seconds so it never blocks the game HUD
    const timer = setTimeout(() => {
      setDismissNotice(true);
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Mobile Portrait Banner Guide */}
      {!dismissNotice && (
        <div className="hidden portrait:flex md:hidden fixed top-3 left-3 right-3 z-[9999] bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2.5 rounded-2xl shadow-xl border-2 border-amber-300 items-center justify-between text-xs font-bold animate-bounce">
          <div className="flex items-center gap-2">
            <RotateCw className="w-4 h-4 animate-spin" />
            <span>Xoay ngang màn hình và đứng cách 1.5–2.5m nhé!</span>
          </div>
          <button
            onClick={() => setDismissNotice(true)}
            className="ml-2 text-white bg-black/35 hover:bg-black/50 px-2.5 py-1 rounded-full text-[10px] transition-all"
          >
            Đóng
          </button>
        </div>
      )}

      {/* If the child hides the draggable preview, always keep one small recovery
          control available inside games. Previously the PiP could not be restored
          until returning to the main menu. */}
      {!showPip && (
        <button
          type="button"
          onClick={() => onTogglePip(true)}
          className="fixed right-3 bottom-3 z-[60] flex items-center gap-1.5 rounded-full border-2 border-emerald-300 bg-slate-950/90 px-3 py-2 text-[11px] font-black text-emerald-200 shadow-xl backdrop-blur-md hover:bg-slate-900"
          aria-label="Hiện lại camera AI"
        >
          <Camera className="h-4 w-4" />
          Hiện camera
        </button>
      )}
    </>
  );
}
