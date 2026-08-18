import React from 'react';
import { ShieldCheck, Clock, AlertTriangle } from 'lucide-react';

export default function VerificationBadge({ status = 'Pending Verification', showIcon = true, size = 'normal' }) {
  const getStyle = () => {
    switch (status) {
      case 'Verified Resolved':
        return {
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          icon: ShieldCheck,
          label: 'Verified Resolved'
        };
      case 'Requires Review':
        return {
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          icon: AlertTriangle,
          label: 'Requires Review'
        };
      case 'Pending Verification':
      default:
        return {
          bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
          icon: Clock,
          label: 'Pending Verification'
        };
    }
  };

  const config = getStyle();
  const IconComponent = config.icon;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${config.bg} ${sizeClasses}`}>
      {showIcon && <IconComponent className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      <span>{config.label}</span>
    </span>
  );
}
