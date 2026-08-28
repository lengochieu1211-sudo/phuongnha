import React from 'react';
import { CheckCircle2, Clock3, GitCommit, ShieldCheck, X } from 'lucide-react';
import { BUILD_INFO, formatBuildTime } from '../lib/buildInfo';

interface VersionInfoModalProps {
  onClose: () => void;
}

export default function VersionInfoModal({ onClose }: VersionInfoModalProps) {
  return (
    <div
      id="version-info-modal"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 backdrop-blur-sm p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="version-info-title"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <div className="w-full max-w-xl max-h-[88svh] overflow-y-auto rounded-3xl border border-cyan-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-cyan-100 bg-gradient-to-r from-cyan-50 via-white to-pink-50 px-5 py-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-700">Phương Nhã • Release Info</p>
            <h2 id="version-info-title" className="mt-1 text-xl sm:text-2xl font-black text-slate-900">
              Phiên bản v{BUILD_INFO.version}
            </h2>
            <p className="mt-1 text-xs font-bold text-slate-500">Ghi chú phiên bản & thông tin build</p>
          </div>
          <button
            id="version-info-close-btn"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:bg-slate-50 active:scale-95"
            aria-label="Đóng thông tin phiên bản"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
              <div className="flex items-center gap-2 text-emerald-800"><ShieldCheck className="h-4 w-4" /><span className="text-xs font-black">Release Gate</span></div>
              <p className="mt-1 text-sm font-black text-emerald-950">VERIFIED</p>
            </div>
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-3">
              <div className="flex items-center gap-2 text-sky-800"><Clock3 className="h-4 w-4" /><span className="text-xs font-black">Build</span></div>
              <p className="mt-1 text-[11px] font-bold leading-snug text-sky-950">{formatBuildTime(BUILD_INFO.buildTimeIso)}</p>
            </div>
            <div className="rounded-2xl border border-violet-200 bg-violet-50 p-3">
              <div className="flex items-center gap-2 text-violet-800"><GitCommit className="h-4 w-4" /><span className="text-xs font-black">Commit</span></div>
              <p className="mt-1 truncate font-mono text-[11px] font-bold text-violet-950">{BUILD_INFO.commitSha || 'local'}</p>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-black uppercase tracking-wide text-slate-800">Có gì mới trong v{BUILD_INFO.version}</h3>
            <div className="space-y-2">
              {BUILD_INFO.notes.map((note) => (
                <div key={note} className="flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <p className="text-xs sm:text-sm font-semibold leading-relaxed text-slate-700">{note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold leading-relaxed text-amber-950">
            Build channel: <span className="font-black">{BUILD_INFO.channel}</span>. Khi cần kiểm tra máy đang chạy đúng bản hay chưa, hãy đối chiếu Version + Build + Commit tại cửa sổ này.
          </div>
        </div>
      </div>
    </div>
  );
}
