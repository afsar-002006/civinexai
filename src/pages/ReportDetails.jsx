import React from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { ShieldAlert } from 'lucide-react';

export default function ReportDetails() {
  const { id } = useParams();

  return (
    <DashboardLayout>
      <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Report Details — #{id}</h1>
            <p className="text-xs text-slate-400">Complete AI analysis and resolution timeline</p>
          </div>
        </div>

        <p className="text-xs text-slate-400">Full timeline and AI insights will be presented here in Phase 3.</p>
      </div>
    </DashboardLayout>
  );
}
