import React from 'react';

export default function StatusBadge({ status = 'Under Review' }) {
  const getBadgeStyle = () => {
    switch (status) {
      case 'Resolved':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'In Progress':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'Rejected':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'Under Review':
      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    }
  };

  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getBadgeStyle()}`}>
      {status}
    </span>
  );
}
