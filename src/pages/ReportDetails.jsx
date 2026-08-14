import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';
import { fetchReportById, updateReportStatus } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, MapPin, Calendar, User, Sparkles, CheckCircle2, Clock, ArrowLeft, ShieldCheck, RefreshCw } from 'lucide-react';

export default function ReportDetails() {
  const { id } = useParams();
  const { role } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    const data = await fetchReportById(id);
    setReport(data);
    setLoading(false);
  };

  useEffect(() => {
    loadReport();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    const updated = await updateReportStatus(id, newStatus);
    if (updated) {
      setReport({ ...updated });
    }
    setUpdating(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-12 text-center text-xs text-slate-400 glass-panel rounded-2xl border border-slate-800">
          Loading report details...
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
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Reports List</span>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  // Define resolution timeline stages
  const isPending = report.status === 'Pending' || report.status === 'Under Review';
  const isInProgress = report.status === 'In Progress';
  const isResolved = report.status === 'Resolved';

  const timelineSteps = [
    {
      title: 'Report Submitted',
      desc: `Registered by ${report.reportedBy || 'Citizen'}`,
      completed: true,
      time: new Date(report.createdAt).toLocaleString()
    },
    {
      title: 'AI Priority Evaluated',
      desc: `Assigned urgency score: ${report.priorityScore}/100`,
      completed: true,
      time: 'Automated Instant'
    },
    {
      title: 'Municipal Task Dispatched',
      desc: isInProgress || isResolved ? 'Field team assigned to location' : 'Awaiting officer dispatch',
      completed: isInProgress || isResolved,
      current: isPending
    },
    {
      title: 'Issue Resolved & Verified',
      desc: isResolved ? 'Problem fixed and verified by authority' : 'Resolution in progress',
      completed: isResolved,
      current: isInProgress
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Link & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl glass-panel border border-slate-800">
          <div className="space-y-1">
            <Link to="/my-reports" className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:underline mb-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Reports</span>
            </Link>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">{report.title}</h1>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">{report.id}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={report.status} />
            <PriorityBadge score={report.priorityScore} severity={report.severity} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview & Image */}
            <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
              <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3">Issue Overview & Photo Proof</h2>

              {report.imageUrl && (
                <div className="rounded-xl overflow-hidden max-h-80 border border-slate-800">
                  <img src={report.imageUrl} alt={report.title} className="w-full h-full object-cover" />
                </div>
              )}

              <p className="text-sm text-slate-300 leading-relaxed">
                {report.description || 'No detailed description was logged for this report.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-slate-400">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-500 font-semibold">LOCATION</div>
                    <div className="text-slate-200 truncate">{report.location}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-500 font-semibold">SUBMITTED</div>
                    <div className="text-slate-200">{new Date(report.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <User className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-500 font-semibold">REPORTER</div>
                    <div className="text-slate-200 truncate">{report.reportedBy}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Resolution Progress Timeline */}
            <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
              <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3">Resolution Workflow Timeline</h2>

              <div className="space-y-6 relative pl-6 border-l-2 border-slate-800 py-2">
                {timelineSteps.map((step, idx) => (
                  <div key={idx} className="relative">
                    <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      step.completed ? 'bg-emerald-500 border-emerald-400' : (step.current ? 'bg-amber-500 border-amber-400 animate-pulse' : 'bg-slate-900 border-slate-700')
                    }`}>
                    </div>
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

          {/* Right Sidebar: AI Analysis & Authority Action */}
          <div className="space-y-6">
            {/* AI Insights Card */}
            <div className="p-6 rounded-2xl glass-panel border border-cyan-500/30 space-y-4">
              <div className="flex items-center gap-2 text-cyan-400">
                <Sparkles className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white">AI Diagnostic Summary</h3>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Priority Urgency</span>
                <div className="text-3xl font-extrabold text-cyan-400">{report.priorityScore}/100</div>
              </div>

              <div className="space-y-2 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Category Impact:</span>
                  <span className="text-slate-200 font-semibold">{report.category}</span>
                </div>
                <div className="flex justify-between">
                  <span>Severity Hazard:</span>
                  <span className="text-amber-400 font-semibold">{report.severity}</span>
                </div>
              </div>
            </div>

            {/* Officer Workflow Control */}
            <div className="p-6 rounded-2xl glass-panel border border-purple-500/30 space-y-4">
              <div className="flex items-center gap-2 text-purple-400">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white">Authority Status Controls</h3>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Officers can update the resolution status of this report in real time.
              </p>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => handleStatusChange('Pending')}
                  disabled={updating || report.status === 'Pending'}
                  className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 disabled:opacity-40 transition-all text-left flex items-center justify-between"
                >
                  <span>Set Pending Review</span>
                  {report.status === 'Pending' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                </button>

                <button
                  onClick={() => handleStatusChange('In Progress')}
                  disabled={updating || report.status === 'In Progress'}
                  className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 disabled:opacity-40 transition-all text-left flex items-center justify-between"
                >
                  <span>Dispatch Team (In Progress)</span>
                  {report.status === 'In Progress' && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                </button>

                <button
                  onClick={() => handleStatusChange('Resolved')}
                  disabled={updating || report.status === 'Resolved'}
                  className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-40 transition-all text-left flex items-center justify-between"
                >
                  <span>Mark Issue as Resolved</span>
                  {report.status === 'Resolved' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
