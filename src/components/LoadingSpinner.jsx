import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ text = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-[200px]">
      <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-3" />
      {text && <p className="text-sm font-medium text-slate-400">{text}</p>}
    </div>
  );
}
