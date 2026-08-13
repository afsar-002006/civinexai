import React from 'react';

export default function PriorityBadge({ score = 0, severity = '' }) {
  let label = 'Low';
  let colorClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  let dotColor = 'bg-emerald-400';

  if (score >= 90 || severity.toLowerCase() === 'critical') {
    label = 'Critical';
    colorClass = 'bg-red-500/15 text-red-400 border-red-500/40 glow-red';
    dotColor = 'bg-red-500';
  } else if (score >= 70 || severity.toLowerCase() === 'high') {
    label = 'High';
    colorClass = 'bg-orange-500/15 text-orange-400 border-orange-500/30';
    dotColor = 'bg-orange-400';
  } else if (score >= 40 || severity.toLowerCase() === 'medium') {
    label = 'Medium';
    colorClass = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    dotColor = 'bg-amber-400';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${colorClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
      {label} {score > 0 ? `(${score})` : ''}
    </span>
  );
}
