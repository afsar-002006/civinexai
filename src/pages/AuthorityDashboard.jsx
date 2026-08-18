import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import VerificationBadge from '../components/VerificationBadge';
import UploadAfterEvidenceModal from '../components/UploadAfterEvidenceModal';
import { fetchReports, updateReportStatus, updateReportEvidence } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, AlertCircle, Clock, Activity, CheckCircle2, ArrowRight, RefreshCw, Upload, Image as ImageIcon } from 'lucide-react';

export default function AuthorityDashboard() {
  const { userProfile } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [filterPriority, setFilterPriority] = useState('All');
  const [selectedReportForModal, setSelectedReportForModal] = useState(null);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchReports();
    setReports(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusUpdate = async (id, nextStatus) => {
    setUpdatingId(id);
    await updateReportStatus(id, nextStatus);
    await loadData();
    setUpdatingId(null);
  };

  const handleEvidenceSubmit = async (evidenceData) => {
    if (!selectedReportForModal) return;
    setUpdatingId(selectedReportForModal.id);
    await updateReportEvidence(selectedReportForModal.id, evidenceData);
    await loadData();
    setUpdatingId(null);
  };

  const total = reports.length;
  const criticalCount = reports.filter(r => r.severity === 'Critical' || r.priorityScore >= 80).length;
  const pendingCount = reports.filter(r => r.status === 'Pending' || r.status === 'Under Review').length;
  const verifiedCount = reports.filter(r => r.verificationStatus === 'Verified Resolved').length;

  const stats = [
    { title: 'Total Issues', value: String(total), icon: Activity, color: 'cyan', subtitle: 'Municipal jurisdiction' },
    { title: 'High AI Priority', value: String(criticalCount), icon: AlertCircle, color: 'red', subtitle: 'Requires urgent dispatch' },
    { title: 'Pending Dispatch', value: String(pendingCount), icon: Clock, color: 'amber', subtitle: 'Awaiting field team' },
    { title: 'Verified Resolved', value: String(verifiedCount), icon: ShieldCheck, color: 'emerald', subtitle: 'Before/After proof verified' },
  ];

  // Apply filters
  const filteredReports = reports.filter(r => {
    if (filterPriority === 'All') return true;
    if (['Critical', 'High', 'Medium', 'Low'].includes(filterPriority)) {
      return r.severity === filterPriority || r.aiSeverity === filterPriority;
    }
    if (filterPriority === 'AI Verified') {
      return r.imageAuthenticity === 'Likely Real';
    }
    if (filterPriority === 'Needs Review') {
      return r.imageAuthenticity === 'Possibly AI-Generated' || r.imageAuthenticity === 'Uncertain';
    }
    return true;
  });

  // Sort reports by priority score descending
  const sortedReports = [...filteredReports].sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl glass-panel border border-purple-500/30">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Municipal Command Center</span>
            </div>
            <h1 className="text-2xl font-bold text-white">
              Authority Portal — <span className="text-purple-400">{userProfile?.name || 'Officer'}</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Dispatch teams, upload completion evidence (After photos), and audit Before & After verification statuses.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-end">
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl glass-input bg-slate-900 border border-slate-700 text-white"
            >
              <option value="All">All Priority</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
              <option value="AI Verified">AI Verified</option>
              <option value="Needs Review">Needs Review</option>
            </select>
            <button
              onClick={loadData}
              className="p-2.5 rounded-xl glass-panel border border-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Refresh Queue"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link
              to="/analytics"
              className="px-4 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 shrink-0"
            >
              <span>View Analytics</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
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
              <h2 className="text-lg font-bold text-white">Priority Issue & Verification Queue</h2>
              <p className="text-xs text-slate-400">Sorted by AI Priority Score with Before/After audit status</p>
            </div>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading priority queue...</div>
          ) : sortedReports.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No issues currently logged.</div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {sortedReports.map((report) => (
                <div key={report.id} className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-900/30 px-3 rounded-xl transition-colors">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-cyan-400 font-bold">{report.id}</span>
                      <span className="font-bold text-sm text-white">{report.title}</span>
                      <PriorityBadge score={report.priorityScore} severity={report.severity} />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                      <span className="text-purple-400 font-medium">{report.category}</span>
                      <span>•</span>
                      <span>{report.location}</span>
                      <span>•</span>
                      <span>Reported by {report.reportedBy}</span>
                      {report.imageAuthenticity && (
                        <>
                          <span>•</span>
                          <span className={`flex items-center gap-1 ${report.imageAuthenticity === 'Likely Real' ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {report.imageAuthenticity === 'Likely Real' ? '✓ AI Verified' : '⚠️ Needs Review'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <StatusBadge status={report.status} />
                    <VerificationBadge status={report.verificationStatus || 'Pending Verification'} size="sm" />

                    {/* Officer Status & Evidence Action Buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedReportForModal(report)}
                        className="px-3 py-1.5 text-xs font-semibold text-purple-300 hover:text-white bg-purple-950/80 hover:bg-purple-800 border border-purple-500/30 rounded-lg transition-colors flex items-center gap-1"
                        title="Upload completion photograph evidence"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Evidence</span>
                      </button>

                      {report.status !== 'In Progress' && report.status !== 'Resolved' && (
                        <button
                          onClick={() => handleStatusUpdate(report.id, 'In Progress')}
                          disabled={updatingId === report.id}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors shadow-md disabled:opacity-50"
                        >
                          Dispatch
                        </button>
                      )}
                      
                      <Link
                        to={`/report/${report.id}`}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-700 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <span>Audit</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Evidence Modal */}
      {selectedReportForModal && (
        <UploadAfterEvidenceModal
          report={selectedReportForModal}
          isOpen={Boolean(selectedReportForModal)}
          onClose={() => setSelectedReportForModal(null)}
          onSubmit={handleEvidenceSubmit}
        />
      )}
    </DashboardLayout>
  );
}
