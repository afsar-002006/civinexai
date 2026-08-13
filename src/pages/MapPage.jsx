import React from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { MapPin } from 'lucide-react';

export default function MapPage() {
  return (
    <DashboardLayout>
      <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Civic Issue Map</h1>
            <p className="text-xs text-slate-400">Spatial issue mapping with priority indicators</p>
          </div>
        </div>

        <p className="text-xs text-slate-400">Interactive civic issue map interface will be rendered here in Phase 5.</p>
      </div>
    </DashboardLayout>
  );
}
