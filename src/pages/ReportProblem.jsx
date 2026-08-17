import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { createReport, analyzePriority } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, AlertTriangle, MapPin, Camera, Sparkles, CheckCircle2, Loader2, ArrowRight, LocateFixed } from 'lucide-react';

const CATEGORIES = ['Road Damage', 'Garbage', 'Water Leakage', 'Streetlight', 'Flooding', 'Traffic', 'Other'];
const SEVERITIES = [
  { id: 'Low', label: 'Low', color: 'border-slate-700 hover:border-cyan-500 text-slate-300' },
  { id: 'Medium', label: 'Medium', color: 'border-amber-500/40 text-amber-400' },
  { id: 'High', label: 'High', color: 'border-orange-500/50 text-orange-400' },
  { id: 'Critical', label: 'Critical', color: 'border-rose-500 text-rose-400 bg-rose-500/10' },
];

export default function ReportProblem() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Road Damage');
  const [severity, setSeverity] = useState('High');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiScore, setAiScore] = useState(null);
  const [aiRecommendation, setAiRecommendation] = useState('');
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [submittedReportId, setSubmittedReportId] = useState(null);

  // Trigger live AI priority analysis when category, severity, or description changes
  useEffect(() => {
    let active = true;
    const runAnalysis = async () => {
      setAnalyzingAi(true);
      const res = await analyzePriority(category, severity, description);
      if (active && res) {
        setAiScore(res.priorityScore);
        setAiRecommendation(res.recommendation);
        setAnalyzingAi(false);
      }
    };
    const timer = setTimeout(runAnalysis, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [category, severity, description]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !location) return;

    setIsSubmitting(true);
    try {
      const report = await createReport({
        title,
        category,
        severity,
        location,
        latitude,
        longitude,
        description,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80',
        reportedBy: userProfile?.name || currentUser?.email || 'Citizen',
        priorityScore: aiScore
      });
      setSubmittedReportId(report.id);
    } catch (err) {
      console.error('Failed to submit report', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Report a Civic Problem</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Submit issue details for automatic AI severity calculation & priority dispatch.
              </p>
            </div>
          </div>
        </div>

        {submittedReportId ? (
          <div className="p-8 rounded-2xl glass-panel border border-cyan-500/30 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Report Submitted Successfully!</h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Your issue has been registered with ID <span className="font-mono text-cyan-400 font-bold">{submittedReportId}</span> and assigned an AI Priority Score of <span className="font-bold text-amber-400">{aiScore}/100</span>.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => navigate(`/report/${submittedReportId}`)}
                className="w-full sm:w-auto px-6 py-3 text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
              >
                <span>View Timeline & Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setSubmittedReportId(null);
                  setTitle('');
                  setDescription('');
                  setLocation('');
                }}
                className="w-full sm:w-auto px-6 py-3 text-xs font-semibold text-slate-300 hover:text-white glass-panel border border-slate-700 rounded-xl"
              >
                Submit Another Report
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <form onSubmit={handleSubmit} className="lg:col-span-2 p-6 rounded-2xl glass-panel border border-slate-800 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Problem Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Hazardous Deep Pothole on 5th Avenue"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl glass-input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Issue Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl glass-input bg-slate-900"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex justify-between">
                    <span>Location Landmark / Address *</span>
                    <button 
                      type="button" 
                      onClick={() => {
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition((pos) => {
                            setLatitude(pos.coords.latitude);
                            setLongitude(pos.coords.longitude);
                            setLocation(`GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
                          });
                        }
                      }}
                      className="text-cyan-400 flex items-center gap-1 hover:text-cyan-300 transition-colors"
                    >
                      <LocateFixed className="w-3 h-3" /> Get GPS
                    </button>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Near Central Metro Station"
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl glass-input"
                    />
                    <MapPin className="w-4 h-4 text-cyan-400 absolute left-3 top-3" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Self-Assessed Hazard Level</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {SEVERITIES.map((sev) => (
                    <button
                      type="button"
                      key={sev.id}
                      onClick={() => setSeverity(sev.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        severity === sev.id ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300 shadow-md' : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {sev.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Detailed Description</label>
                <textarea
                  rows="4"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the issue size, traffic impact, or any safety concerns..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl glass-input resize-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Photo Image URL (Optional)</label>
                <div className="relative">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl glass-input"
                  />
                  <Camera className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Registering Report...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>Submit Civic Problem Report</span>
                  </>
                )}
              </button>
            </form>

            {/* Live AI Analysis Panel */}
            <div className="p-6 rounded-2xl glass-panel border border-cyan-500/30 space-y-5 h-fit">
              <div className="flex items-center gap-2 text-cyan-400">
                <Sparkles className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Live AI Priority Scoring</h3>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Our embedded Civic Intelligence engine dynamically calculates urgency scores to bubble up critical hazards.
              </p>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Calculated Priority Score</span>
                <div className="text-4xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  {analyzingAi ? '...' : (aiScore !== null ? `${aiScore}/100` : '75/100')}
                </div>
                <div className="text-xs font-semibold text-cyan-300">
                  {aiRecommendation || 'Standard Priority Evaluation'}
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-400 border-t border-slate-800 pt-4">
                <div className="flex justify-between">
                  <span>Category Factor:</span>
                  <span className="text-slate-200 font-semibold">{category}</span>
                </div>
                <div className="flex justify-between">
                  <span>Hazard Severity:</span>
                  <span className="text-slate-200 font-semibold">{severity}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dispatch Target:</span>
                  <span className="text-emerald-400 font-semibold">Local Municipal Ward</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
