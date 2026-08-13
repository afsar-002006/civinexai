import React from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, FileText, Clock, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export default function CitizenDashboard() {
  const { userProfile } = useAuth();

  // Placeholder statistics (will bind to Firestore in Phase 2)
  const stats = [
    { title: 'Total Reports', value: '4', icon: FileText, color: 'cyan', subtitle: 'Submitted by you' },
    { title: 'Pending Review', value: '2', icon: Clock, color: 'amber', subtitle: 'Awaiting authority' },
    { title: 'In Progress', value: '1', icon: AlertTriangle, color: 'blue', subtitle: 'Work assigned' },
    { title: 'Resolved', value: '1', icon: CheckCircle2, color: 'emerald', subtitle: 'Fixed successfully' },
  ];

  // Placeholder recent reports for initial layout view
  const recentReports = [
    {
      id: 'rep-1',
      title: 'Severe Pothole on Main Road',
      category: 'Road Damage',
      location: 'Downtown 5th Avenue',
      severity: 'High',
      priorityScore: 85,
      status: 'Under Review',
      createdAt: '2 hours ago'
    },
    {
      id: 'rep-2',
      title: 'Overflowing Waste Bin',
      category: 'Garbage',
      location: 'Central Park North Gate',
      severity: 'Medium',
      priorityScore: 62,
      status: 'In Progress',
      createdAt: '1 day ago'
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl glass-panel border border-slate-800">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Welcome back, <span className="text-cyan-400">{userProfile?.name || 'Citizen'}</span> 👋
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Track your reported civic issues and receive AI-driven status insights.
            </p>
          </div>

          <Link
            to="/report-problem"
            className="px-4 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report New Problem</span>
          </Link>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <StatCard key={idx} {...stat} />
          ))}
        </div>

        {/* Recent Reports Section */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Recent Reports</h2>
              <p className="text-xs text-slate-400">Issues you submitted recently</p>
            </div>

            <Link to="/my-reports" className="text-xs font-semibold text-cyan-400 hover:underline flex items-center gap-1">
              <span>View All Reports</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-800/80">
            {recentReports.map((report) => (
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
                  <Link
                    to={`/report/${report.id}`}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-700/60 rounded-lg transition-colors"
                  >
                    Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
