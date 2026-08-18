import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';
import VerificationBadge from '../components/VerificationBadge';
import BeforeAfterComparison from '../components/BeforeAfterComparison';
import UploadAfterEvidenceModal from '../components/UploadAfterEvidenceModal';
import A4ReportStatement from '../components/A4ReportStatement';
import { fetchReportById, fetchReports, updateReportStatus, updateReportEvidence, updateVerificationStatus } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert, MapPin, Calendar, User, Sparkles, CheckCircle2,
  Clock, ArrowLeft, ShieldCheck, RefreshCw, Upload, AlertTriangle,
  Printer, FileText, Users, Image as ImageIcon
} from 'lucide-react';

export default function ReportDetails() {
  const { id } = useParams();
  const { role } = useAuth();
  const [report, setReport] = useState(null);
  const [relatedReports, setRelatedReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isA4ModalOpen, setIsA4ModalOpen] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    const data = await fetchReportById(id);
    setReport(data);

    // Find related reports (those that have this report's id as relatedIssueId, or vice versa)
    if (data) {
      const all = await fetchReports();
      const related = all.filter(r => r.id !== id && (
        r.relatedIssueId === id || data.relatedIssueId === r.id
      ));
      setRelatedReports(related);
    }
    setLoading(false);
  };

  useEffect(() => { loadReport(); }, [id]);

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    const updated = await updateReportStatus(id, newStatus);
    if (updated) setReport(prev => ({ ...prev, ...updated, status: newStatus }));
    setUpdating(false);
  };

  const handleVerificationChange = async (newVerStatus) => {
    setUpdating(true);
    const updated = await updateVerificationStatus(id, newVerStatus);
    if (updated) setReport(prev => ({ ...prev, ...updated, verificationStatus: newVerStatus }));
    setUpdating(false);
  };

  const handleEvidenceSubmit = async (evidenceData) => {
    setUpdating(true);
    const updated = await updateReportEvidence(id, evidenceData);
    if (updated) setReport(prev => ({ ...prev, ...updated }));
    setUpdating(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-12 text-center text-xs text-slate-400 glass-panel rounded-2xl border border-slate-800">
          Loading report details & photographic evidence...
        </div>
      </DashboardLayout>
    );
  }

  if (!report) {
    return (
      <DashboardLayout>
        <div className="p-12 text-center text-xs text-slate-400 glass-panel rounded-2xl border border-slate-800 space-y-4">
          <p className="text-base font-bold text-white">Report #{id} Not Found</p>
          <Link to="/my-reports" className="inline-flex items-center gap-1.5 text-cyan-400 hover:underline">
            <ArrowLeft className="w-4 h-4" /><span>Return to Reports List</span>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  // Resolution timeline stages
  const isPending = report.status === 'Pending' || report.status === 'Under Review';
  const isInProgress = report.status === 'In Progress';
  const isResolved = report.status === 'Resolved';
  const isVerified = report.verificationStatus === 'Verified Resolved';

  const timelineSteps = [
    {
      title: 'Report Submitted',
      desc: `Registered by ${report.reportedBy || 'Citizen'} with Before photograph evidence`,
      completed: true,
      time: new Date(report.createdAt).toLocaleString()
    },
    {
      title: 'AI Urgency Evaluation',
      desc: `Urgency priority score: ${report.priorityScore}/100`,
      completed: true,
      time: 'Automated Instant'
    },
    {
      title: 'Duplicate/Similar Check',
      desc: report.duplicateDetected
        ? `${report.relatedReportCount} similar report(s) found nearby`
        : 'No duplicate detected',
      completed: true,
      time: 'Automated'
    },
    {
      title: 'Municipal Task Dispatched',
      desc: isInProgress || isResolved ? 'Field team assigned to location' : 'Awaiting officer dispatch',
      completed: isInProgress || isResolved,
      current: isPending
    },
    {
      title: 'Corrective Action & After Photo Upload',
      desc: report.afterImageUrl ? `Completion evidence uploaded (${report.completionDate ? new Date(report.completionDate).toLocaleDateString() : 'Recorded'})` : 'Awaiting completion photo from authority',
      completed: Boolean(report.afterImageUrl),
      current: isInProgress && !report.afterImageUrl
    },
    {
      title: 'Verification Status Audit',
      desc: `Current audit state: ${report.verificationStatus || 'Pending Verification'}`,
      completed: isVerified,
      current: Boolean(report.afterImageUrl) && !isVerified
    }
  ];

  const severityColor = {
    Critical: '#ef4444',
    High: '#f97316',
    Medium: '#eab308',
    Low: '#22c55e',
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl glass-panel border border-slate-800">
          <div className="space-y-1">
            <Link to="/my-reports" className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:underline mb-1">
              <ArrowLeft className="w-3.5 h-3.5" /><span>Back to Reports</span>
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-white">{report.title}</h1>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">{report.id}</span>
              {report.needsReview && (
                <span className="flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-2 py-0.5">
                  <AlertTriangle className="w-3 h-3" />⚠️ Needs Review
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={report.status} />
            <VerificationBadge status={report.verificationStatus || 'Pending Verification'} />
            <PriorityBadge score={report.priorityScore} severity={report.severity} />

            {/* Print Official A4 Statement Button */}
            <button
              onClick={() => setIsA4ModalOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 shrink-0"
              title="Generate printable official A4 report statement"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A4 Statement</span>
            </button>
          </div>
        </div>

        {/* BEFORE AND AFTER ISSUE VERIFICATION SECTION */}
        <div className="p-6 rounded-2xl glass-panel border border-cyan-500/30 space-y-4">
          <BeforeAfterComparison
            report={report}
            onOpenUploadModal={() => setIsUploadModalOpen(true)}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details & Timeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Details */}
            <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
              <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3">Civic Complaint Specification</h2>

              <p className="text-sm text-slate-300 leading-relaxed">
                {report.description || 'No detailed description was logged for this report.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-slate-400">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">LOCATION</div>
                    <div className="text-slate-200 truncate">{report.location}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">LOGGED DATE</div>
                    <div className="text-slate-200">{new Date(report.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <User className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">REPORTER</div>
                    <div className="text-slate-200 truncate">{report.reportedBy}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Related Reports / Cluster Info */}
            {(report.duplicateDetected || relatedReports.length > 0 || (report.relatedReportCount > 0)) && (
              <div className="p-6 rounded-2xl glass-panel border border-purple-500/30 space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  <h2 className="text-base font-bold text-white">Issue Cluster</h2>
                  <span className="ml-auto text-xs bg-purple-500/10 border border-purple-500/30 text-purple-400 font-bold px-2 py-0.5 rounded-lg">
                    {report.relatedReportCount || relatedReports.length} related
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Multiple citizens have independently reported a similar issue nearby. Individual reports are preserved.
                </p>
                {relatedReports.length > 0 && (
                  <div className="space-y-2">
                    {relatedReports.slice(0, 5).map(r => (
                      <div key={r.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <Link to={`/report/${r.id}`} className="text-xs font-semibold text-white hover:text-cyan-400 truncate block">{r.title}</Link>
                          <div className="text-[10px] text-slate-500">{r.location} · {r.status}</div>
                        </div>
                        <span className="text-xs font-bold text-amber-400 ml-3 shrink-0">{r.priorityScore}/100</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Resolution Timeline */}
            <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
              <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3">Verification & Resolution Timeline</h2>
              <div className="space-y-6 relative pl-6 border-l-2 border-slate-800 py-2">
                {timelineSteps.map((step, idx) => (
                  <div key={idx} className="relative">
                    <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      step.completed ? 'bg-emerald-500 border-emerald-400' :
                      step.current ? 'bg-amber-500 border-amber-400 animate-pulse' :
                      'bg-slate-900 border-slate-700'
                    }`} />
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-bold ${step.completed ? 'text-white' : 'text-slate-400'}`}>{step.title}</span>
                        {step.time && <span className="text-[10px] text-slate-500">{step.time}</span>}
                      </div>
                      <p className="text-xs text-slate-400">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar: AI Diagnostic & Verification Action Panel */}
          <div className="space-y-6">
            {/* AI Diagnostic Summary */}
            <div className="p-6 rounded-2xl glass-panel border border-cyan-500/30 space-y-4">
              <div className="flex items-center gap-2 text-cyan-400">
                <Sparkles className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white">AI Diagnostic Summary</h3>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Priority Score</span>
                <div className="text-3xl font-extrabold text-cyan-400">{report.priorityScore}/100</div>
              </div>

              {/* Image Authenticity */}
              {report.imageAuthenticity && (
                <div className="space-y-1.5 text-xs">
                  <div className="text-slate-400 font-semibold">Image Authenticity</div>
                  <div className={`flex items-center gap-2 font-bold text-sm ${
                    report.imageAuthenticity === 'Likely Real' ? 'text-emerald-400' :
                    report.imageAuthenticity === 'Possibly AI-Generated' ? 'text-orange-400' : 'text-amber-400'
                  }`}>
                    {report.imageAuthenticity === 'Likely Real' ? '🟢' :
                     report.imageAuthenticity === 'Possibly AI-Generated' ? '🟠' : '🟡'}
                    {report.imageAuthenticity}
                  </div>
                  {report.authenticityConfidence && (
                    <div className="text-slate-400">{report.authenticityConfidence}% confidence</div>
                  )}
                  {report.needsReview && (
                    <div className="flex items-center gap-1 text-amber-400 text-xs font-semibold bg-amber-500/5 border border-amber-500/20 rounded-lg px-2 py-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      ⚠️ Authority review recommended
                    </div>
                  )}
                </div>
              )}

              {/* AI Reason */}
              {report.aiReason && (
                <div className="space-y-1 text-xs">
                  <div className="text-slate-400 font-semibold">AI Reason</div>
                  <div className="text-slate-300 italic leading-relaxed">{report.aiReason}</div>
                </div>
              )}

              <div className="space-y-2 text-xs text-slate-400 border-t border-slate-800 pt-3">
                <div className="flex justify-between">
                  <span>Category:</span>
                  <span className="text-slate-200 font-semibold">{report.category}</span>
                </div>
                <div className="flex justify-between">
                  <span>Severity Hazard:</span>
                  <span className="font-semibold" style={{ color: severityColor[report.severity] || '#94a3b8' }}>{report.severity}</span>
                </div>
                {report.detectedCategory && report.detectedCategory !== report.category && (
                  <div className="flex justify-between">
                    <span>AI Detected:</span>
                    <span className="text-indigo-400 font-semibold">{report.detectedCategory}</span>
                  </div>
                )}
                {report.relatedReportCount > 0 && (
                  <div className="flex justify-between">
                    <span>Related Reports:</span>
                    <span className="text-purple-400 font-bold">{report.relatedReportCount}</span>
                  </div>
                )}
                {report.imageHash && (
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1">
                    <ImageIcon className="w-3 h-3" />
                    Image fingerprint stored
                  </div>
                )}
              </div>
            </div>

            {/* Officer Evidence & Verification Controls */}
            <div className="p-6 rounded-2xl glass-panel border border-purple-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-400">
                  <ShieldCheck className="w-5 h-5" />
                  <h3 className="text-sm font-bold text-white">Verification Controls</h3>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Upload After-condition completion photo evidence and manage audit verification status.
              </p>

              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="w-full py-2.5 px-3 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 transition-all"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Completion Evidence</span>
              </button>

              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Change Verification Status</span>
                <button
                  onClick={() => handleVerificationChange('Verified Resolved')}
                  disabled={updating || report.verificationStatus === 'Verified Resolved'}
                  className="w-full py-2 px-3 text-xs font-semibold rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-40 transition-all text-left flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Set Verified Resolved</span>
                  </span>
                  {report.verificationStatus === 'Verified Resolved' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </button>
                <button
                  onClick={() => handleVerificationChange('Pending Verification')}
                  disabled={updating || report.verificationStatus === 'Pending Verification'}
                  className="w-full py-2 px-3 text-xs font-semibold rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 disabled:opacity-40 transition-all text-left flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    <span>Set Pending Verification</span>
                  </span>
                  {report.verificationStatus === 'Pending Verification' && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                </button>
                <button
                  onClick={() => handleVerificationChange('Requires Review')}
                  disabled={updating || report.verificationStatus === 'Requires Review'}
                  className="w-full py-2 px-3 text-xs font-semibold rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 disabled:opacity-40 transition-all text-left flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Set Requires Review</span>
                  </span>
                  {report.verificationStatus === 'Requires Review' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Evidence Upload Modal */}
      <UploadAfterEvidenceModal
        report={report}
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSubmit={handleEvidenceSubmit}
      />

      {/* A4 Report Statement Printable Modal */}
      <A4ReportStatement
        report={report}
        isOpen={isA4ModalOpen}
        onClose={() => setIsA4ModalOpen(false)}
      />
    </DashboardLayout>
  );
}
