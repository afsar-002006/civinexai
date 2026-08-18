import React, { useState, useRef } from 'react';
import VerificationBadge from './VerificationBadge';
import { Calendar, MapPin, User, CheckCircle2, AlertCircle, Maximize2, Sliders, LayoutGrid, Eye, FileText, Image as ImageIcon } from 'lucide-react';

export default function BeforeAfterComparison({ report, onOpenUploadModal }) {
  const [viewMode, setViewMode] = useState('slider'); // 'slider' | 'grid' | 'tabs'
  const [activeTab, setActiveTab] = useState('before'); // 'before' | 'after'
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const sliderRef = useRef(null);

  if (!report) return null;

  const beforeImg = report.beforeImageUrl || report.imageUrl || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80';
  const afterImg = report.afterImageUrl;
  const hasAfterImage = Boolean(afterImg);

  const handleMouseMove = (e) => {
    if (!sliderRef.current || viewMode !== 'slider') return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percent);
  };

  const handleTouchMove = (e) => {
    if (!sliderRef.current || viewMode !== 'slider') return;
    const touch = e.touches[0];
    const rect = sliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percent);
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Controls */}
      <div className="p-4 rounded-2xl glass-panel border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white">Before & After Verification Evidence</h3>
            <VerificationBadge status={report.verificationStatus || 'Pending Verification'} size="sm" />
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Photographic proof of reported issue condition versus completed authority resolution work.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
          <button
            onClick={() => setViewMode('slider')}
            disabled={!hasAfterImage}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
              viewMode === 'slider'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 disabled:opacity-30'
            }`}
            title="Interactive Split Slider View"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Split Slider</span>
          </button>

          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
              viewMode === 'grid'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Side-by-Side Grid View"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Side by Side</span>
          </button>

          <button
            onClick={() => setIsLightboxOpen(true)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-1"
            title="Open Lightbox Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'slider' && hasAfterImage ? (
        <div className="space-y-3">
          {/* Draggable Split Slider Canvas */}
          <div
            ref={sliderRef}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            className="relative w-full h-[380px] rounded-2xl overflow-hidden select-none cursor-ew-resize border border-slate-800 group shadow-2xl"
          >
            {/* After Image (Background layer) */}
            <img
              src={afterImg}
              alt="After Resolution Work"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute top-4 right-4 bg-emerald-950/80 backdrop-blur-md border border-emerald-500/40 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>AFTER CONDITION</span>
            </div>

            {/* Before Image (Clipped overlay layer) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPosition}%` }}
            >
              <img
                src={beforeImg}
                alt="Before Condition Logged"
                className="absolute inset-0 w-full h-full object-cover max-w-none"
                style={{ width: sliderRef.current ? `${sliderRef.current.clientWidth}px` : '100%' }}
              />
              <div className="absolute top-4 left-4 bg-amber-950/80 backdrop-blur-md border border-amber-500/40 text-amber-300 text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>BEFORE CONDITION</span>
              </div>
            </div>

            {/* Slider Divider Bar Handle */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_12px_#22d3ee] z-20 pointer-events-none"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-900 border-2 border-cyan-400 shadow-xl flex items-center justify-center text-cyan-400 text-xs">
                <Sliders className="w-4 h-4 rotate-90" />
              </div>
            </div>
          </div>

          {/* Slider Position Range Input Controller */}
          <div className="flex items-center gap-3 px-2">
            <span className="text-[10px] font-bold text-amber-400 tracking-wider">BEFORE (0%)</span>
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPosition}
              onChange={(e) => setSliderPosition(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <span className="text-[10px] font-bold text-emerald-400 tracking-wider">AFTER (100%)</span>
          </div>
        </div>
      ) : (
        /* Side by Side Grid View (or fallback when no after image yet) */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Before Card */}
          <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <AlertCircle className="w-4 h-4" />
                <span>BEFORE CONDITION EVIDENCE</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Citizen Submission</span>
            </div>

            <div className="rounded-xl overflow-hidden h-52 border border-slate-800/80 relative">
              <img src={beforeImg} alt="Before" className="w-full h-full object-cover" />
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Logged: {new Date(report.createdAt).toLocaleDateString()}</span>
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-purple-400" />
                  <span>{report.reportedBy || 'Citizen'}</span>
                </span>
              </div>
              <p className="text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800/60 text-xs">
                <strong className="text-slate-200">Initial Problem: </strong>
                {report.description || 'Original photograph logged upon citizen submission.'}
              </p>
            </div>
          </div>

          {/* After Card */}
          <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>AFTER CONDITION EVIDENCE</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Authority Completion</span>
            </div>

            {hasAfterImage ? (
              <>
                <div className="rounded-xl overflow-hidden h-52 border border-slate-800/80 relative">
                  <img src={afterImg} alt="After" className="w-full h-full object-cover" />
                </div>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Completed: {report.completionDate ? new Date(report.completionDate).toLocaleDateString() : 'Recently'}</span>
                    </span>
                    <VerificationBadge status={report.verificationStatus} size="sm" />
                  </div>
                  <p className="text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800/60 text-xs">
                    <strong className="text-emerald-400">Resolution Remarks: </strong>
                    {report.resolutionRemarks || 'Authority officer verified work completion.'}
                  </p>
                </div>
              </>
            ) : (
              <div className="h-full min-h-[220px] rounded-xl border-2 border-dashed border-slate-800 bg-slate-900/30 flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-300">No Completion Evidence Uploaded Yet</p>
                  <p className="text-[11px] text-slate-500 max-w-xs">
                    The field department will upload a verified completion photograph once corrective action is finished.
                  </p>
                </div>

                {onOpenUploadModal && (
                  <button
                    onClick={onOpenUploadModal}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl transition-all shadow-lg shadow-purple-500/20"
                  >
                    Upload Completion Evidence
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Verification Summary Banner */}
      {hasAfterImage && (
        <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-emerald-300">Before & After Audit Pair Verified: </span>
              <span className="text-slate-300">{report.resolutionRemarks || 'Photographic comparison confirms corrective action taken.'}</span>
            </div>
          </div>
          {onOpenUploadModal && (
            <button
              onClick={onOpenUploadModal}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:text-white bg-emerald-900/40 hover:bg-emerald-800/60 border border-emerald-500/30 rounded-xl transition-colors shrink-0"
            >
              Update Evidence
            </button>
          )}
        </div>
      )}

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl p-6 flex flex-col justify-between items-center overflow-y-auto">
          <div className="w-full flex items-center justify-between max-w-5xl border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-white">{report.title} — High-Res Photo Evidence</h3>
              <VerificationBadge status={report.verificationStatus} />
            </div>
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-700 rounded-xl"
            >
              Close Viewer
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-auto max-w-5xl w-full py-6">
            <div className="space-y-2 text-center">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Before (Reported Condition)</span>
              <div className="rounded-2xl overflow-hidden border border-slate-800 max-h-[420px]">
                <img src={beforeImg} alt="Before Full" className="w-full h-full object-contain bg-slate-900" />
              </div>
            </div>

            <div className="space-y-2 text-center">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">After (Completed Work)</span>
              <div className="rounded-2xl overflow-hidden border border-slate-800 max-h-[420px]">
                {hasAfterImage ? (
                  <img src={afterImg} alt="After Full" className="w-full h-full object-contain bg-slate-900" />
                ) : (
                  <div className="h-64 bg-slate-900 flex items-center justify-center text-slate-500 text-xs p-6">
                    No completion photograph submitted yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
