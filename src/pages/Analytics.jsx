import React from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { BarChart3 } from 'lucide-react';

export default function Analytics() {
  return (
    <DashboardLayout>
      <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Civic Analytics & Intelligence</h1>
            <p className="text-xs text-slate-400">Recharts visual metrics across categories, status, and time</p>
          </div>
        </div>

        <p className="text-xs text-slate-400">Recharts data visualizations will be rendered here in Phase 4.</p>
      </div>
    </DashboardLayout>
  );
}
