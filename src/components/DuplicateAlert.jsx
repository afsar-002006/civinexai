/**
 * DuplicateAlert.jsx
 * Shown to the citizen after duplicate detection runs during report submission.
 * Never auto-rejects — always offers [Submit Anyway] or [View Existing Issue].
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, MapPin, LayoutList, ArrowRight, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react';

export default function DuplicateAlert({ result, onSubmitAnyway, onDismiss }) {
  const [expanded, setExpanded] = useState(false);

  if (!result || !result.isDuplicate) return null;

  const { label, confidence, relatedReports, nearestDistanceM, hasImageMatch } = result;
  const isPossible = label === 'Possible Similar Report';
  const topReport = relatedReports?.[0];

  return (
    <div className={`rounded-2xl border p-5 space-y-4 ${
      isPossible
        ? 'bg-amber-500/5 border-amber-500/30'
        : 'bg-orange-500/8 border-orange-500/40'
    }`}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-xl shrink-0 ${isPossible ? 'bg-amber-500/10 text-amber-400' : 'bg-orange-500/10 text-orange-400'}`}>
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold ${isPossible ? 'text-amber-300' : 'text-orange-300'}`}>
            {label}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {isPossible
              ? 'A possibly related report exists nearby. Review before submitting.'
              : 'One or more similar reports already exist for this area.'}
          </p>
        </div>
        <span className={`text-xs font-mono px-2 py-0.5 rounded-lg border shrink-0 ${
          isPossible ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' : 'border-orange-500/30 text-orange-400 bg-orange-500/10'
        }`}>
          {confidence}% match
        </span>
      </div>

      {/* Key stats row */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
          <div className="text-slate-400 text-[10px] uppercase font-semibold mb-0.5">Similar Reports</div>
          <div className="text-white font-bold text-base">{relatedReports?.length ?? 0}</div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
          <div className="text-slate-400 text-[10px] uppercase font-semibold mb-0.5">Nearest</div>
          <div className="text-white font-bold text-base">
            {nearestDistanceM != null ? `${nearestDistanceM}m` : '—'}
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
          <div className="text-slate-400 text-[10px] uppercase font-semibold mb-0.5">Category</div>
          <div className="text-cyan-400 font-bold text-[11px] leading-tight">{topReport?.category ?? '—'}</div>
        </div>
      </div>

      {/* Image match warning */}
      {hasImageMatch && (
        <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/5 border border-amber-500/20 rounded-xl px-3 py-2">
          <ImageIcon className="w-4 h-4 shrink-0" />
          <span>⚠️ Similar image already submitted — please confirm this is a new photo of the same issue.</span>
        </div>
      )}

      {/* Top related report preview */}
      {topReport && (
        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Top Related Report</span>
            {relatedReports.length > 1 && (
              <button
                type="button"
                onClick={() => setExpanded(e => !e)}
                className="text-[10px] text-cyan-400 flex items-center gap-1 hover:text-cyan-300"
              >
                {expanded ? 'Show less' : `+${relatedReports.length - 1} more`}
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>
          <div className="text-sm font-semibold text-white">{topReport.title}</div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <MapPin className="w-3 h-3 text-cyan-400" />
            <span>{topReport.location || topReport.address}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Status:</span>
            <span className="text-slate-200 font-semibold">{topReport.status}</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-400">Priority:</span>
            <span className="text-white font-bold">{topReport.priorityScore}/100</span>
          </div>
        </div>
      )}

      {/* Expanded: additional reports */}
      {expanded && relatedReports.slice(1).map(r => (
        <div key={r.id} className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1">
          <div className="text-sm font-semibold text-white">{r.title}</div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <MapPin className="w-3 h-3 text-cyan-400" />
            <span>{r.location || r.address}</span>
            <span className="text-slate-600">|</span>
            <span>{r.status}</span>
          </div>
        </div>
      ))}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-2 pt-1">
        {topReport && (
          <Link
            to={`/report/${topReport.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2.5 text-xs font-semibold text-slate-200 border border-slate-700 hover:border-cyan-500/50 hover:text-white glass-panel rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            <LayoutList className="w-4 h-4" />
            View Existing Issue
          </Link>
        )}
        <button
          type="button"
          onClick={onSubmitAnyway}
          className="flex-1 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
        >
          <ArrowRight className="w-4 h-4" />
          Submit Anyway
        </button>
      </div>
    </div>
  );
}
