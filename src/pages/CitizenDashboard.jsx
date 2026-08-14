import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { fetchReports } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, FileText, Clock, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';

export default function CitizenDashboard() {
  const { userProfile } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchReports();
    setReports(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalCount = reports.length;
  const pendingCount = reports.filter(r => r.status === 'Pending' || r.status === 'Under Review').length;
  const inProgressCount = reports.filter(r => r.status === 'In Progress').length;
  const resolvedCount = reports.filter(r => r.status === 'Resolved').length;

  const stats = [
    { title: 'Total Reports', value: String(totalCount), icon: FileText, color: 'cyan', subtitle: 'Submitted issues' },
    { title: 'Pending Review', value: String(pendingCount), icon: Clock, color: 'amber', subtitle: 'Awaiting authority' },
    { title: 'In Progress', value: String(inProgressCount), icon: AlertTriangle, color: 'blue', subtitle: 'Work assigned' },
    { title: 'Resolved', value: String(resolvedCount), icon: CheckCircle2, color: 'emerald', subtitle: 'Fixed successfully' },
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
              Track your reported civic issues and receive AI-driven status insights in real time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="p-2.5 rounded-xl glass-panel border border-slate-700/60 text-slate-300 hover:text-white transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link
              to="/report-problem"
              className="px-4 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report New Problem</span>
            </Link>
          </div>
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
              <h2 className="text-lg font-bold text-white">Recent Civic Reports</h2>
              <p className="text-xs text-slate-400">Issues submitted across your local jurisdiction</p>
            </div>

            <Link to="/my-reports" className="text-xs font-semibold text-cyan-400 hover:underline flex items-center gap-1">
              <span>View All Reports</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading civic reports from backend...</div>
          ) : reports.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No reports found. Submit your first problem report!</div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {reports.slice(0, 5).map((report) => (
                <div key={report.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/30 px-2 rounded-lg transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-100">{report.title}</span>
                      <PriorityBadge score={report.priorityScore} severity={report.severity} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="text-cyan-400 font-medium">{report.category}</span>
                      <span>•</span>
                      <span>{report.location}</span>
                      <span>•</span>
                      <span>{new Date(report.createdAt).toLocaleDateString()}</span>
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
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
