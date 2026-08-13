import React from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, AlertCircle, Clock, Activity, CheckCircle2, ArrowRight } from 'lucide-react';

export default function AuthorityDashboard() {
  const { userProfile } = useAuth();

  const stats = [
    { title: 'Total Issues', value: '18', icon: Activity, color: 'cyan', subtitle: 'Municipal jurisdiction' },
    { title: 'Critical Priority', value: '4', icon: AlertCircle, color: 'red', subtitle: 'Requires urgent action' },
    { title: 'Under Review', value: '7', icon: Clock, color: 'amber', subtitle: 'New submissions' },
    { title: 'In Progress / Fixed', value: '7', icon: CheckCircle2, color: 'emerald', subtitle: 'Dispatched teams' },
  ];

  const highPriorityReports = [
    {
      id: 'rep-101',
      title: 'Major Water Pipe Burst',
      category: 'Water Leakage',
      location: 'Sector 4, Market Complex',
      severity: 'Critical',
      priorityScore: 94,
      status: 'Under Review',
      createdAt: '30 mins ago'
    },
    {
      id: 'rep-102',
      title: 'Bridge Approach Road Cave-in',
      category: 'Flooding',
      location: 'South River Bridge',
      severity: 'Critical',
      priorityScore: 91,
      status: 'In Progress',
      createdAt: '1 hour ago'
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl glass-panel border border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Municipal Command Center</span>
            </div>
            <h1 className="text-2xl font-bold text-white">
              Authority Portal — <span className="text-purple-400">{userProfile?.name || 'Officer'}</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Review AI severity scores, assign dispatch tasks, and update civic resolution statuses.
            </p>
          </div>

          <Link
            to="/analytics"
            className="px-4 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 transition-all shrink-0"
          >
            <span>View Intelligence Analytics</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <StatCard key={idx} {...stat} />
          ))}
        </div>

        {/* Priority Dispatch Queue */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Critical Priority Queue</h2>
              <p className="text-xs text-slate-400">Issues sorted by Mock AI priority score</p>
            </div>
          </div>

          <div className="divide-y divide-slate-800/80">
            {highPriorityReports.map((report) => (
              <div key={report.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/30 px-2 rounded-lg transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-100">{report.title}</span>
                    <PriorityBadge score={report.priorityScore} severity={report.severity} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>{report.category}</span>
                    <span>•</span>
                    <span>{report.location}</span>
                    <span>•</span>
                    <span>{report.createdAt}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <StatusBadge status={report.status} />
                  <button className="px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors">
                    Update Status
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
