import React, { useState, useRef } from 'react';
import { X, Upload, CheckCircle2, ShieldCheck, Clock, AlertTriangle, Sparkles, Image as ImageIcon } from 'lucide-react';

const PRESET_AFTER_PHOTOS = [
  {
    category: 'Road Damage',
    label: 'Road Repaired & Potholes Filled',
    url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80'
  },
  {
    category: 'Garbage',
    label: 'Bin Cleaned & Sidewalk Sanitized',
    url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80'
  },
  {
    category: 'Electricity',
    label: 'Street Lamp & Fixture Fixed',
    url: 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&w=800&q=80'
  },
  {
    category: 'Water Leakage',
    label: 'Pipe Sealed & Asphalt Restored',
    url: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=800&q=80'
  }
];

export default function UploadAfterEvidenceModal({ report, isOpen, onClose, onSubmit }) {
  const fileInputRef = useRef(null);

  const [afterImageUrl, setAfterImageUrl] = useState(
    report?.afterImageUrl || ''
  );
  const [uploadMode, setUploadMode] = useState('file'); // 'file' | 'preset' | 'url'
  const [fileName, setFileName] = useState('');
  const [resolutionRemarks, setResolutionRemarks] = useState(
    report?.resolutionRemarks || ''
  );
  const [completionDate, setCompletionDate] = useState(
    report?.completionDate ? report.completionDate.split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [issueStatus, setIssueStatus] = useState(report?.status === 'Resolved' ? 'Resolved' : 'Resolved');
  const [verificationStatus, setVerificationStatus] = useState(
    report?.verificationStatus || 'Verified Resolved'
  );
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !report) return null;

  const handleFileSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (.png, .jpg, .jpeg, .webp)');
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAfterImageUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit({
      afterImageUrl,
      resolutionRemarks,
      completionDate: new Date(completionDate).toISOString(),
      status: issueStatus,
      verificationStatus
    });
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-purple-500/30 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Upload Completion Evidence (After Condition)</h2>
              <p className="text-xs text-slate-400">Report #{report.id} — {report.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* PHOTO UPLOAD SELECTOR */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-slate-200">Resolution Photo Evidence</label>
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setUploadMode('file')}
                  className={`px-2 py-0.5 rounded font-semibold transition-all ${
                    uploadMode === 'file' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-400'
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('preset')}
                  className={`px-2 py-0.5 rounded font-semibold transition-all ${
                    uploadMode === 'preset' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-400'
                  }`}
                >
                  Presets
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('url')}
                  className={`px-2 py-0.5 rounded font-semibold transition-all ${
                    uploadMode === 'url' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-400'
                  }`}
                >
                  URL
                </button>
              </div>
            </div>

            {uploadMode === 'file' && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                {afterImageUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-purple-500/40 bg-slate-950 p-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img src={afterImageUrl} alt="After Evidence Preview" className="w-16 h-16 rounded-lg object-cover border border-slate-800" />
                      <div>
                        <div className="text-xs font-bold text-white truncate max-w-[220px]">{fileName || 'Completion Photo Evidence'}</div>
                        <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Ready for Verification Audit
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        fileInputRef.current?.click();
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold text-purple-300 bg-purple-950/60 hover:bg-purple-900 rounded-lg border border-purple-500/30 transition-colors"
                    >
                      Change File
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="border-2 border-dashed border-purple-500/30 hover:border-purple-500/70 bg-purple-950/10 hover:bg-purple-950/20 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2 group"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-200">Click to upload completion photo or drag & drop file</p>
                      <p className="text-[10px] text-slate-400">Supports PNG, JPG, JPEG, WEBP files directly from device</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {uploadMode === 'preset' && (
              <div className="grid grid-cols-2 gap-2">
                {PRESET_AFTER_PHOTOS.map((preset, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setAfterImageUrl(preset.url)}
                    className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                      afterImageUrl === preset.url
                        ? 'border-purple-500 bg-purple-500/15 text-white ring-1 ring-purple-500'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <img src={preset.url} alt={preset.label} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-200 text-[11px] line-clamp-1">{preset.label}</div>
                      <div className="text-[10px] text-purple-400">{preset.category}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {uploadMode === 'url' && (
              <div>
                <input
                  type="url"
                  value={afterImageUrl}
                  onChange={(e) => setAfterImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  required
                />
              </div>
            )}
          </div>

          {/* Resolution Remarks */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-200">Resolution Remarks & Action Notes</label>
            <textarea
              value={resolutionRemarks}
              onChange={(e) => setResolutionRemarks(e.target.value)}
              rows={3}
              placeholder="Describe corrective actions completed by field squad..."
              className="w-full px-3 py-2 rounded-xl glass-input text-xs"
              required
            />
          </div>

          {/* Completion Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block font-bold text-slate-200">Completion Date</label>
              <input
                type="date"
                value={completionDate}
                onChange={(e) => setCompletionDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs bg-slate-900"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-200">Updated Issue Status</label>
              <select
                value={issueStatus}
                onChange={(e) => setIssueStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs bg-slate-900"
              >
                <option value="Resolved">Resolved (Completed)</option>
                <option value="In Progress">In Progress (Partial Evidence)</option>
              </select>
            </div>
          </div>

          {/* Verification Status Selector */}
          <div className="space-y-1.5 pt-1">
            <label className="block font-bold text-slate-200">Verification Status Assignment</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setVerificationStatus('Pending Verification')}
                className={`py-2 px-2 rounded-xl border text-center font-semibold text-[11px] transition-all flex items-center justify-center gap-1 ${
                  verificationStatus === 'Pending Verification'
                    ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Pending</span>
              </button>

              <button
                type="button"
                onClick={() => setVerificationStatus('Verified Resolved')}
                className={`py-2 px-2 rounded-xl border text-center font-semibold text-[11px] transition-all flex items-center justify-center gap-1 ${
                  verificationStatus === 'Verified Resolved'
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified</span>
              </button>

              <button
                type="button"
                onClick={() => setVerificationStatus('Requires Review')}
                className={`py-2 px-2 rounded-xl border text-center font-semibold text-[11px] transition-all flex items-center justify-center gap-1 ${
                  verificationStatus === 'Requires Review'
                    ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Requires Review</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white rounded-xl font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-purple-500/20 flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <span>Saving Evidence...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Verification Evidence</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
