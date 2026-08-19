import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import VerificationBadge from '../components/VerificationBadge';
import UploadAfterEvidenceModal from '../components/UploadAfterEvidenceModal';
import { fetchReports, updateReportStatus, updateReportEvidence, deleteReport, deleteResolvedReports, purgeDuplicateAndTestReports, isValidImageUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, AlertCircle, Clock, Activity, CheckCircle2, ArrowRight, RefreshCw, Upload, Trash2, Sparkles } from 'lucide-react';

export default function AuthorityDashboard() {
  const { userProfile } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [filterPriority, setFilterPriority] = useState('All');
  const [selectedReportForModal, setSelectedReportForModal] = useState(null);
  const [actionMessage, setActionMessage] = useState('');

  const loadData = async () => {
    setLoading(true);
    const data = await fetchReports();
    setReports(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePurgeDuplicateData = async () => {
    if (window.confirm('Purge all duplicate test reports and reset queue to unique reports?')) {
      setLoading(true);
      await purgeDuplicateAndTestReports();
      setActionMessage('Cleared duplicate test reports successfully!');
      setTimeout(() => setActionMessage(''), 4000);
      await loadData();
    }
  };

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

  const handleDeleteSingle = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete report "${id}" (${title})?`)) {
      setUpdatingId(id);
      await deleteReport(id);
      setActionMessage(`Report ${id} deleted successfully.`);
      setTimeout(() => setActionMessage(''), 4000);
      await loadData();
      setUpdatingId(null);
    }
  };

  const handlePurgeAllSolved = async () => {
    const solvedCount = reports.filter(r => r.status === 'Resolved' || r.verificationStatus === 'Verified Resolved').length;
    if (solvedCount === 0) {
      alert('No solved or resolved reports currently found to clean up.');
      return;
    }

    if (window.confirm(`Are you sure you want to permanently delete all ${solvedCount} long-time solved reports and evidence images from the authority database?`)) {
      setLoading(true);
      const res = await deleteResolvedReports();
      setActionMessage(`Successfully purged ${res.deletedCount || solvedCount} long-time solved reports & evidence images!`);
      setTimeout(() => setActionMessage(''), 5000);
      await loadData();
    }
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

  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'priority'

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

  // Sort reports by newest createdAt first or AI priority score
  const sortedReports = [...filteredReports].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    return (b.priorityScore || 0) - (a.priorityScore || 0);
  });

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
              Dispatch teams, upload completion evidence (After photos), and delete long-time solved images.
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
              onClick={handlePurgeDuplicateData}
              className="px-3.5 py-2.5 text-xs font-bold text-amber-300 hover:text-white bg-amber-950/60 hover:bg-amber-900 border border-amber-500/40 rounded-xl transition-all shadow-md flex items-center gap-1.5"
              title="Clear duplicate test reports"
            >
              <Trash2 className="w-4 h-4 text-amber-400" />
              <span>Purge Duplicates</span>
            </button>

            <button
              onClick={handlePurgeAllSolved}
              className="px-3.5 py-2.5 text-xs font-bold text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 rounded-xl transition-all shadow-md flex items-center gap-1.5"
              title="Delete long-time solved reports and evidence images"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Purge Solved Records</span>
            </button>
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

        {/* Status Notification Toast Banner */}
        {actionMessage && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <StatCard key={idx} {...stat} />
          ))}
        </div>

        {/* Priority Dispatch Queue */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Priority Issue & Verification Queue</h2>
              <p className="text-xs text-slate-400">Sorted by newest uploads or AI Priority Score with Before/After audit status</p>
            </div>

            {/* Sort Toggle */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
              <button
                onClick={() => setSortBy('newest')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  sortBy === 'newest'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Newest First
              </button>
              <button
                onClick={() => setSortBy('priority')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  sortBy === 'priority'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                AI Priority Score
              </button>
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
                  <div className="flex items-start gap-3 flex-1">
                    {isValidImageUrl(report.beforeImageUrl || report.imageUrl) ? (
                      <img
                        src={report.beforeImageUrl || report.imageUrl}
                        alt="Uploaded Evidence"
                        className="w-14 h-14 rounded-xl object-cover border border-purple-500/30 shrink-0 shadow-md"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-500 text-[10px] shrink-0 font-mono">
                        <span>No Photo</span>
                      </div>
                    )}
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

                      {/* Delete Solved Report Button */}
                      <button
                        onClick={() => handleDeleteSingle(report.id, report.title)}
                        className="p-2 text-rose-400 hover:text-rose-200 hover:bg-rose-950/60 border border-rose-500/20 rounded-lg transition-colors"
                        title="Delete report & images from database"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
