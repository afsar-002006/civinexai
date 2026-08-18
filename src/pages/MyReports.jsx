import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import VerificationBadge from '../components/VerificationBadge';
import { fetchReports } from '../services/api';
import { FileText, Search, Filter, PlusCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function MyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterVerification, setFilterVerification] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await fetchReports();
      setReports(data || []);
      setLoading(false);
    }
    loadData();
  }, []);

  const filteredReports = reports.filter(r => {
    const matchesCat = filterCategory === 'All' || r.category === filterCategory;
    const matchesStatus = filterStatus === 'All' || r.status === filterStatus;
    const matchesVerification = filterVerification === 'All' || r.verificationStatus === filterVerification;
    const matchesSearch = !searchQuery || r.title.toLowerCase().includes(searchQuery.toLowerCase()) || r.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesStatus && matchesVerification && matchesSearch;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Submitted Civic Reports</h1>
              <p className="text-xs text-slate-400">View resolution statuses & Before/After photographic evidence</p>
            </div>
          </div>

          <Link
            to="/report-problem"
            className="px-4 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Report</span>
          </Link>
        </div>

        {/* Search & Filter Controls */}
        <div className="p-4 rounded-2xl glass-panel border border-slate-800 flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports by title or location..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl glass-input"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl glass-input bg-slate-900 flex-1 md:flex-initial"
            >
              <option value="All">All Categories</option>
              <option value="Road Damage">Road Damage</option>
              <option value="Garbage">Garbage</option>
              <option value="Water Leakage">Water Leakage</option>
              <option value="Electricity">Electricity</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl glass-input bg-slate-900 flex-1 md:flex-initial"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>

            <select
              value={filterVerification}
              onChange={(e) => setFilterVerification(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl glass-input bg-slate-900 flex-1 md:flex-initial"
            >
              <option value="All">All Verifications</option>
              <option value="Verified Resolved">Verified Resolved</option>
              <option value="Pending Verification">Pending Verification</option>
              <option value="Requires Review">Requires Review</option>
            </select>
          </div>
        </div>

        {/* Reports List Grid */}
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 glass-panel rounded-2xl border border-slate-800">
            Loading submitted reports...
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 glass-panel rounded-2xl border border-slate-800 space-y-2">
            <p className="text-sm font-semibold text-slate-200">No reports matched your filters.</p>
            <p>Try adjusting your search query or filter selections.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReports.map((report) => (
              <div key={report.id} className="p-5 rounded-2xl glass-panel glass-panel-hover border border-slate-800 flex flex-col justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-400">{report.id}</span>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={report.status} />
                      <VerificationBadge status={report.verificationStatus || 'Pending Verification'} size="sm" showIcon={false} />
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white line-clamp-1">{report.title}</h3>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {report.description || 'No description provided.'}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 truncate max-w-[200px]">{report.location}</span>
                    <PriorityBadge score={report.priorityScore} severity={report.severity} />
                  </div>

                  <Link
                    to={`/report/${report.id}`}
                    className="w-full py-2 text-xs font-semibold text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/60 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>View Before & After Audit</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
