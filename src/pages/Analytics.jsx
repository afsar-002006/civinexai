import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { fetchAnalyticsStats, fetchReports } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, TrendingUp, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

const COLORS = ['#06b6d4', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444', '#10b981'];

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const analytics = await fetchAnalyticsStats();
      const allReports = await fetchReports();
      setStats(analytics);
      setReports(allReports || []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading || !stats) {
    return (
      <DashboardLayout>
        <div className="p-12 text-center text-xs text-slate-400 glass-panel rounded-2xl border border-slate-800">
          Loading municipal analytics...
        </div>
      </DashboardLayout>
    );
  }

  // Transform reports for Recharts charts
  const categoryData = stats.categoryDistribution || [];
  
  const statusData = [
    { name: 'Pending Review', value: stats.pendingCount },
    { name: 'In Progress', value: stats.inProgressCount },
    { name: 'Resolved', value: stats.resolvedCount },
  ];

  const severityData = [
    { name: 'Critical', count: reports.filter(r => r.severity === 'Critical').length },
    { name: 'High', count: reports.filter(r => r.severity === 'High').length },
    { name: 'Medium', count: reports.filter(r => r.severity === 'Medium').length },
    { name: 'Low', count: reports.filter(r => r.severity === 'Low').length },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Civic Intelligence Analytics</h1>
              <p className="text-xs text-slate-400">Recharts visual metrics across categories, status, and severity</p>
            </div>
          </div>
        </div>

        {/* Quick Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl glass-panel border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Reports Logged</div>
            <div className="text-3xl font-bold text-white mt-1">{stats.totalReports}</div>
          </div>

          <div className="p-5 rounded-2xl glass-panel border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-amber-400">Pending Review</div>
            <div className="text-3xl font-bold text-amber-400 mt-1">{stats.pendingCount}</div>
          </div>

          <div className="p-5 rounded-2xl glass-panel border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-blue-400">In Progress</div>
            <div className="text-3xl font-bold text-blue-400 mt-1">{stats.inProgressCount}</div>
          </div>

          <div className="p-5 rounded-2xl glass-panel border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-emerald-400">Resolution Rate</div>
            <div className="text-3xl font-bold text-emerald-400 mt-1">{stats.resolutionRate}</div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Distribution Bar Chart */}
          <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3">Issues by Category</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="count" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status Breakdown Pie Chart */}
          <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3">Status Breakdown</h2>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
