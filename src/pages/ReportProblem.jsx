import React from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { PlusCircle, AlertCircle } from 'lucide-react';

export default function ReportProblem() {
  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto p-6 rounded-2xl glass-panel border border-slate-800 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Report a Civic Problem</h1>
            <p className="text-xs text-slate-400">Submit issue details for mock AI priority analysis</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
          <p className="font-semibold text-cyan-400 mb-1">Phase 2 Preview</p>
          Form fields for category selection, photo upload, location coordinates, and local AI severity evaluation will be connected to Firestore in Phase 2.
        </div>
      </div>
    </DashboardLayout>
  );
}
