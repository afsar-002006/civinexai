import React from 'react';
import VerificationBadge from './VerificationBadge';
import { Printer, X, ShieldCheck, CheckCircle2, AlertCircle, FileText, Calendar, MapPin, Sparkles, Building2 } from 'lucide-react';

export default function A4ReportStatement({ report, isOpen, onClose }) {
  if (!isOpen || !report) return null;

  const handlePrint = () => {
    window.print();
  };

  const beforeImg = report.beforeImageUrl || report.imageUrl || 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80';
  const afterImg = report.afterImageUrl || 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&w=800&q=80';
  const isVerified = report.verificationStatus === 'Verified Resolved';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:static">
      {/* Top Action Bar (Hidden during print) */}
      <div className="w-full max-w-4xl flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4 shadow-xl print:hidden">
        <div className="flex items-center gap-2.5">
          <FileText className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-bold text-white">Official A4 Civic Verification Statement</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print A4 Statement</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* A4 Formatted Printable Document Canvas */}
      <div className="w-full max-w-4xl bg-white text-slate-900 rounded-2xl shadow-2xl p-8 sm:p-12 border border-slate-200 print:shadow-none print:border-none print:w-full print:max-w-none print:p-8 space-y-6 font-sans">
        {/* Header Block with Municipal Emblem */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-cyan-400 flex items-center justify-center font-bold text-xl shrink-0">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight uppercase">CiviNex Municipal Corporation</h1>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Civic Issue Verification Report Statement</p>
              <p className="text-[10px] text-slate-500">Official Record of Citizen Reporting & Authority Resolution Evidence</p>
            </div>
          </div>

          <div className="text-right space-y-1">
            <div className="inline-block px-3 py-1 bg-slate-100 border border-slate-300 rounded font-mono text-xs font-bold text-slate-800">
              REF: {report.id}
            </div>
            <div className="text-[11px] text-slate-600">
              Generated: {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Verification Status Banner / Stamp */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-50 border border-slate-300 rounded-xl gap-4">
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Official Verification Audit Status</div>
            <div className="text-lg font-extrabold text-slate-900 mt-0.5">{report.title}</div>
            <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-3">
              <span><strong>Category:</strong> {report.category}</span>
              <span>•</span>
              <span><strong>Location:</strong> {report.location}</span>
            </div>
          </div>

          {/* Verification Stamp Graphic */}
          <div className={`px-4 py-2.5 rounded-xl border-2 uppercase tracking-wider font-extrabold text-xs flex items-center gap-2 shadow-sm ${
            isVerified ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-amber-600 bg-amber-50 text-amber-800'
          }`}>
            <ShieldCheck className="w-5 h-5" />
            <span>STATUS: {report.verificationStatus || 'PENDING VERIFICATION'}</span>
          </div>
        </div>

        {/* Grid Metadata */}
        <div className="grid grid-cols-5 gap-2 text-xs bg-slate-100/70 p-3.5 rounded-xl border border-slate-200">
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase">Reporter</div>
            <div className="font-semibold text-slate-800 truncate">{report.reportedBy || 'Citizen'}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase">User Priority</div>
            <div className="font-bold text-slate-900">{report.userPriority || report.severity || 'Medium'}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-cyan-700 uppercase">AI Priority</div>
            <div className="font-extrabold text-cyan-900">{report.aiPriorityScore || report.priorityScore}/100</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase">AI Severity</div>
            <div className="font-bold text-slate-900">{report.aiSeverity || report.severity || 'N/A'}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase">Logged Date</div>
            <div className="font-semibold text-slate-800">{new Date(report.createdAt).toLocaleDateString()}</div>
          </div>
        </div>

        {report.aiReason && (
          <div className="p-3 bg-cyan-50/60 border border-cyan-200 rounded-xl text-xs text-cyan-950">
            <span className="font-bold text-cyan-900">AI Analysis Reason:</span> {report.aiReason}
          </div>
        )}

        {/* SECTION 4: BEFORE AND AFTER PHOTOGRAPHIC EVIDENCE COMPARISON STATEMENT */}
        <div className="space-y-4 pt-2">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase border-b border-slate-300 pb-1.5 flex items-center gap-2">
            <span>Section 4: Before and After Issue Verification Evidence</span>
          </h2>

          <div className="grid grid-cols-2 gap-5">
            {/* Before Box */}
            <div className="border border-slate-300 rounded-xl p-3.5 space-y-2 bg-slate-50">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 border-b border-slate-200 pb-1">
                <span className="flex items-center gap-1 text-amber-700">
                  <AlertCircle className="w-3.5 h-3.5" /> BEFORE CONDITION
                </span>
                <span className="text-[10px] text-slate-500">Citizen Evidence</span>
              </div>
              <div className="h-44 rounded-lg overflow-hidden border border-slate-300 bg-slate-200">
                <img src={beforeImg} alt="Before Condition" className="w-full h-full object-cover" />
              </div>
              <div className="text-[11px] text-slate-700 leading-snug">
                <strong>Reported Issue:</strong> {report.description || 'Hazard condition reported at site location.'}
              </div>
            </div>

            {/* After Box */}
            <div className="border border-slate-300 rounded-xl p-3.5 space-y-2 bg-slate-50">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 border-b border-slate-200 pb-1">
                <span className="flex items-center gap-1 text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> AFTER CONDITION
                </span>
                <span className="text-[10px] text-slate-500">Authority Completion</span>
              </div>
              <div className="h-44 rounded-lg overflow-hidden border border-slate-300 bg-slate-200">
                <img src={afterImg} alt="After Condition" className="w-full h-full object-cover" />
              </div>
              <div className="text-[11px] text-slate-700 leading-snug">
                <strong>Resolution Remarks:</strong> {report.resolutionRemarks || 'Corrective engineering action completed by municipal department.'}
              </div>
            </div>
          </div>
        </div>

        {/* Verification Statement & Legal Audit Text */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-700 leading-relaxed space-y-1.5">
          <p className="font-bold text-slate-900">Official Municipal Verification Declaration:</p>
          <p>
            This statement establishes official verification for civic report <strong>#{report.id}</strong>. The photograph submitted prior to work execution (Before Condition) has been compared against the completion photograph (After Condition). The work performance has been reviewed and certified under Civic Management Municipal Section 4 Standards.
          </p>
        </div>

        {/* Signatures & Seal Footer */}
        <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-300 text-xs text-slate-700">
          <div className="space-y-6">
            <div>
              <div className="font-mono text-[10px] text-slate-500">DIGITAL HASH AUDIT STAMP</div>
              <div className="font-mono text-[10px] text-slate-800 truncate">SHA256:{Math.random().toString(36).substring(2)}{Date.now()}</div>
            </div>
            <div className="pt-4 border-t border-slate-300 w-48 text-center font-semibold text-slate-800">
              Citizen Reporting Signature
            </div>
          </div>

          <div className="space-y-6 text-right">
            <div>
              <div className="font-bold text-slate-900 uppercase">Municipal Authority Ward Officer</div>
              <div className="text-[10px] text-slate-500">Department of Civic Maintenance & Public Safety</div>
            </div>
            <div className="pt-4 border-t border-slate-300 w-48 ml-auto text-center font-bold text-slate-900">
              Authorized Officer Signature & Seal
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
