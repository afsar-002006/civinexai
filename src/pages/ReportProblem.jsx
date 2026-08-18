import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import DuplicateAlert from '../components/DuplicateAlert';
import { createReport, analyzePriority, fetchReports, updateRelatedReportCount, updatePriorityScore } from '../services/api';
import { analyzePhotoWithAI, computeImageHash } from '../services/imageAnalysis';
import { checkForDuplicates, calculatePriorityScore } from '../services/duplicateDetection';
import { useAuth } from '../context/AuthContext';
import {
  PlusCircle, AlertTriangle, MapPin, Camera, Sparkles,
  CheckCircle2, Loader2, ArrowRight, LocateFixed, Upload, X, Image as ImageIcon,
  ShieldCheck, ShieldAlert, Mic, MicOff
} from 'lucide-react';

const CATEGORIES = ['Road Damage', 'Garbage', 'Water Leakage', 'Streetlight', 'Electricity', 'Flooding', 'Traffic', 'Other'];
const SEVERITIES = [
  { id: 'Low', label: 'Low' },
  { id: 'Medium', label: 'Medium' },
  { id: 'High', label: 'High' },
  { id: 'Critical', label: 'Critical' },
];

// ── Flow states ──────────────────────────────────────────────────────────────
const FLOW = {
  FORM: 'form',               // citizen filling in the form
  ANALYZING: 'analyzing',     // AI analyzing the photo
  DUPLICATE_CHECK: 'dup',     // checking for duplicates
  DUPLICATE_FOUND: 'dup_found', // showing duplicate alert
  SUBMITTING: 'submitting',   // writing to Firestore
  SUCCESS: 'success',         // done
};

export default function ReportProblem() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // ── Form fields ──
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Road Damage');
  const [severity, setSeverity] = useState('High');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // ── AI / duplicate / upload state ──
  const [flow, setFlow] = useState(FLOW.FORM);
  const [photoAnalysis, setPhotoAnalysis] = useState(null);
  const [imageHash, setImageHash] = useState(null);
  const [duplicateResult, setDuplicateResult] = useState(null);
  const [uploadMode, setUploadMode] = useState('file'); // 'file' | 'url'
  const [fileName, setFileName] = useState('');
  const [aiScore, setAiScore] = useState(null);
  const [aiRecommendation, setAiRecommendation] = useState('');
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [submittedReportId, setSubmittedReportId] = useState(null);

  // ── Voice Input (Microphone Dictation) State ──
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState(null);
  const recognitionRef = useRef(null);

  const toggleListening = () => {
    setMicError(null);
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMicError('Speech recognition is not supported in this browser. Please type your description manually or try Google Chrome/Edge.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript + ' ';
          }
        }
        if (transcript) {
          setDescription((prev) => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${transcript.trim()}` : transcript.trim();
          });
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setMicError('Microphone access was denied. Please allow microphone access in your browser settings.');
        } else if (event.error !== 'no-speech') {
          setMicError(`Voice input error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setMicError('Could not start microphone dictation.');
      setIsListening(false);
    }
  };

  // Live priority score (without photo)
  useEffect(() => {
    if (photoAnalysis) return;
    let active = true;
    const run = async () => {
      setAnalyzingAi(true);
      const res = await analyzePriority(category, severity, description);
      if (active && res) {
        setAiScore(res.priorityScore);
        setAiRecommendation(res.recommendation);
        setAnalyzingAi(false);
      }
    };
    const t = setTimeout(run, 300);
    return () => { active = false; clearTimeout(t); };
  }, [category, severity, description, photoAnalysis]);

  // ── Handle image URL change ──
  const handleImageUrlChange = (val) => {
    setImageUrl(val);
    setPhotoAnalysis(null);
    setImageHash(null);
    setDuplicateResult(null);
  };

  // ── Handle File Select ──
  const handleFileSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (.png, .jpg, .jpeg, .webp)');
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      handleImageUrlChange(reader.result);
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

  // ── Analyze Photo (manual button) ──
  const handleAnalyzePhoto = async () => {
    if (!imageUrl) return;
    setFlow(FLOW.ANALYZING);
    try {
      const [analysis, hash] = await Promise.all([
        analyzePhotoWithAI(imageUrl),
        computeImageHash(imageUrl),
      ]);
      setPhotoAnalysis(analysis);
      setImageHash(hash);
      setCategory(analysis.detectedCategory);
      setSeverity(analysis.aiSeverity);
      setAiScore(analysis.priorityScore);
      setAiRecommendation(analysis.priorityScore >= 75 ? 'Immediate Attention Recommended' : 'Standard Priority Evaluation');
    } catch (err) {
      console.error('Photo analysis error:', err);
    } finally {
      setFlow(FLOW.FORM);
    }
  };

  // ── Full submission flow ──────────────────────────────────────────────────
  const runFullSubmitFlow = async () => {
    if (!title || !location) return;

    // Step 1: analyze photo if not already done
    let analysis = photoAnalysis;
    let hash = imageHash;
    if (imageUrl && !analysis) {
      setFlow(FLOW.ANALYZING);
      try {
        [analysis, hash] = await Promise.all([
          analyzePhotoWithAI(imageUrl),
          computeImageHash(imageUrl),
        ]);
        setPhotoAnalysis(analysis);
        setImageHash(hash);
        setCategory(analysis.detectedCategory);
        setSeverity(analysis.aiSeverity);
        setAiScore(analysis.priorityScore);
      } catch (err) {
        console.error('Auto-analysis error:', err);
      }
    }

    // Step 2: duplicate check
    setFlow(FLOW.DUPLICATE_CHECK);
    let existingReports = [];
    try {
      existingReports = await fetchReports();
    } catch (_) {}

    const dupResult = checkForDuplicates(
      { category, latitude, longitude, description, imageHash: hash },
      existingReports
    );
    setDuplicateResult(dupResult);

    if (dupResult.isDuplicate) {
      setFlow(FLOW.DUPLICATE_FOUND);
      return; // pause — wait for citizen to decide
    }

    // Step 3: submit
    await doSubmit(analysis, hash, dupResult, existingReports);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    runFullSubmitFlow();
  };

  // Called when citizen clicks "Submit Anyway" from the duplicate alert
  const handleSubmitAnyway = async () => {
    setFlow(FLOW.SUBMITTING);
    const existingReports = await fetchReports().catch(() => []);
    await doSubmit(photoAnalysis, imageHash, duplicateResult, existingReports);
  };

  const doSubmit = async (analysis, hash, dupResult, existingReports) => {
    setFlow(FLOW.SUBMITTING);

    const relatedCount = dupResult?.relatedReports?.length ?? 0;
    const relatedIssueId = dupResult?.relatedReports?.[0]?.id ?? null;

    // Final priority score
    const finalPriority = calculatePriorityScore({
      severity,
      aiSeverity: analysis?.aiSeverity ?? severity,
      relatedReportCount: relatedCount,
      createdAt: new Date().toISOString(),
      aiPriorityScore: analysis?.priorityScore ?? aiScore,
    });

    try {
      const report = await createReport({
        title,
        category,
        severity,
        location,
        latitude,
        longitude,
        description,
        imageUrl: imageUrl || '',
        reportedBy: userProfile?.name || currentUser?.email || 'Citizen',
        priorityScore: finalPriority,

        // AI analysis
        imageAuthenticity: analysis?.imageAuthenticity ?? null,
        authenticityConfidence: analysis?.authenticityConfidence ?? null,
        detectedCategory: analysis?.detectedCategory ?? null,
        aiSeverity: analysis?.aiSeverity ?? null,
        aiReason: analysis?.aiReason ?? null,
        needsReview: analysis?.needsReview ?? false,

        // Duplicate detection
        imageHash: hash ?? null,
        duplicateDetected: dupResult?.isDuplicate ?? false,
        relatedIssueId,
        relatedReportCount: relatedCount,
      });

      // Update the related issue's relatedReportCount & priority
      if (relatedIssueId) {
        const related = existingReports.find(r => r.id === relatedIssueId);
        if (related) {
          const newCount = (related.relatedReportCount || 0) + 1;
          const newPriority = calculatePriorityScore({
            severity: related.severity,
            aiSeverity: related.aiSeverity ?? related.severity,
            relatedReportCount: newCount,
            createdAt: related.createdAt,
            aiPriorityScore: related.priorityScore,
          });
          await updateRelatedReportCount(relatedIssueId, newCount);
          await updatePriorityScore(relatedIssueId, newPriority);
        }
      }

      setSubmittedReportId(report.id);
      setAiScore(finalPriority);
      setFlow(FLOW.SUCCESS);
    } catch (err) {
      console.error('Failed to submit report', err);
      setFlow(FLOW.FORM);
    }
  };

  // ─── Render helpers ────────────────────────────────────────────────────────
  const isAnalyzing = flow === FLOW.ANALYZING;
  const isCheckingDup = flow === FLOW.DUPLICATE_CHECK;
  const isSubmitting = flow === FLOW.SUBMITTING;
  const isBusy = isAnalyzing || isCheckingDup || isSubmitting;

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
                AI analyzes your photo &amp; uploaded evidence → checks for duplicates → calculates priority.
              </p>
            </div>
          </div>
        </div>

        {/* ── Success Screen ── */}
        {flow === FLOW.SUCCESS ? (
          <div className="p-8 rounded-2xl glass-panel border border-cyan-500/30 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Report Submitted Successfully!</h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Your issue has been registered with ID{' '}
                <span className="font-mono text-cyan-400 font-bold">{submittedReportId}</span> and assigned a
                Priority Score of <span className="font-bold text-amber-400">{aiScore}/100</span>.
              </p>
              {duplicateResult?.isDuplicate && (
                <p className="text-xs text-amber-400 mt-2">
                  ℹ️ Your report was linked to {duplicateResult.relatedReports.length} existing similar report(s) — their priority has been updated.
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => navigate(`/report/${submittedReportId}`)}
                className="w-full sm:w-auto px-6 py-3 text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
              >
                <span>View Timeline &amp; Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setFlow(FLOW.FORM);
                  setSubmittedReportId(null);
                  setTitle(''); setDescription(''); setLocation('');
                  setImageUrl(''); setFileName(''); setPhotoAnalysis(null); setDuplicateResult(null);
                }}
                className="w-full sm:w-auto px-6 py-3 text-xs font-semibold text-slate-300 hover:text-white glass-panel border border-slate-700 rounded-xl"
              >
                Submit Another Report
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ── Main Form ── */}
            <div className="lg:col-span-2 space-y-4">
              <form onSubmit={handleFormSubmit} className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Problem Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Hazardous Deep Pothole on 5th Avenue"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl glass-input"
                    disabled={isBusy}
                  />
                </div>

                {/* Category + Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Issue Category *</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl glass-input bg-slate-900"
                      disabled={isBusy}
                    >
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex justify-between">
                      <span>Location / Address *</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(pos => {
                              setLatitude(pos.coords.latitude);
                              setLongitude(pos.coords.longitude);
                              setLocation(`GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
                            });
                          }
                        }}
                        className="text-cyan-400 flex items-center gap-1 hover:text-cyan-300 transition-colors"
                        disabled={isBusy}
                      >
                        <LocateFixed className="w-3 h-3" /> Get GPS
                      </button>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        placeholder="e.g. Near Central Metro Station"
                        className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl glass-input"
                        disabled={isBusy}
                      />
                      <MapPin className="w-4 h-4 text-cyan-400 absolute left-3 top-3" />
                    </div>
                  </div>
                </div>

                {/* Severity */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">Self-Assessed Hazard Level</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {SEVERITIES.map(sev => (
                      <button
                        type="button"
                        key={sev.id}
                        onClick={() => setSeverity(sev.id)}
                        disabled={isBusy}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          severity === sev.id
                            ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300 shadow-md'
                            : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        {sev.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">Detailed Description</label>
                    <button
                      type="button"
                      onClick={toggleListening}
                      disabled={isBusy}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-all ${
                        isListening
                          ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse shadow-md shadow-rose-500/20'
                          : 'bg-slate-900/60 border-slate-700 text-cyan-400 hover:text-cyan-300 hover:bg-slate-800'
                      }`}
                      title={isListening ? 'Click to stop voice dictation' : 'Click to dictate description with microphone'}
                    >
                      {isListening ? (
                        <>
                          <MicOff className="w-3.5 h-3.5" />
                          <span>Stop Listening</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-3.5 h-3.5" />
                          <span>Voice Input</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="relative">
                    <textarea
                      rows="4"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder={isListening ? "Listening... Speak now to dictate your description..." : "Describe the issue size, traffic impact, or any safety concerns..."}
                      className={`w-full px-3.5 py-2.5 text-sm rounded-xl glass-input resize-none transition-all ${
                        isListening ? 'border-rose-500/50 ring-1 ring-rose-500/30' : ''
                      }`}
                      disabled={isBusy}
                    />
                    {isListening && (
                      <div className="absolute right-3 bottom-3 flex items-center gap-1.5 px-2 py-1 rounded-md bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                        Listening...
                      </div>
                    )}
                  </div>
                  {micError && (
                    <p className="text-[11px] text-amber-400 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" /> {micError}
                    </p>
                  )}
                </div>

                {/* PHOTO IMAGE FILE UPLOAD / URL SECTION */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-300">Upload Issue Photograph (Before Condition)</label>
                    <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setUploadMode('file')}
                        className={`px-2 py-0.5 rounded font-semibold transition-all ${
                          uploadMode === 'file' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400'
                        }`}
                      >
                        Upload File
                      </button>
                      <button
                        type="button"
                        onClick={() => setUploadMode('url')}
                        className={`px-2 py-0.5 rounded font-semibold transition-all ${
                          uploadMode === 'url' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400'
                        }`}
                      >
                        Image URL
                      </button>
                    </div>
                  </div>

                  {uploadMode === 'file' ? (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileInputChange}
                        className="hidden"
                      />

                      {imageUrl ? (
                        <div className="relative rounded-xl overflow-hidden border border-cyan-500/40 bg-slate-900 p-2 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <img src={imageUrl} alt="Uploaded Preview" className="w-16 h-16 rounded-lg object-cover border border-slate-700" />
                            <div>
                              <div className="text-xs font-bold text-white truncate max-w-[200px]">{fileName || 'Uploaded Image'}</div>
                              <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                                <CheckCircle2 className="w-3 h-3" /> Image Ready for Report
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleAnalyzePhoto}
                              disabled={isBusy}
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-1"
                            >
                              {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                              <span>AI Analyze</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleImageUrlChange('');
                                setFileName('');
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                              title="Remove Image"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          onDrop={handleDrop}
                          onDragOver={handleDragOver}
                          className="border-2 border-dashed border-slate-800 hover:border-cyan-500/60 bg-slate-900/40 hover:bg-slate-900/80 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2 group"
                        >
                          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                            <Upload className="w-5 h-5" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-slate-200">Click to choose image file or drag &amp; drop</p>
                            <p className="text-[10px] text-slate-500">Supports PNG, JPG, JPEG, WEBP files directly from computer</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="url"
                          value={imageUrl}
                          onChange={e => handleImageUrlChange(e.target.value)}
                          placeholder="https://example.com/photo.jpg"
                          className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl glass-input"
                          disabled={isBusy}
                        />
                        <Camera className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      </div>
                      <button
                        type="button"
                        onClick={handleAnalyzePhoto}
                        disabled={!imageUrl || isBusy}
                        className="px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                      >
                        {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        Analyze Photo
                      </button>
                    </div>
                  )}
                </div>

        {/* ── Success Screen ── */}
        {flow === FLOW.SUCCESS ? (
          <div className="p-8 rounded-2xl glass-panel border border-cyan-500/30 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Report Submitted Successfully!</h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Your issue has been registered with ID{' '}
                <span className="font-mono text-cyan-400 font-bold">{submittedReportId}</span> and assigned a
                Priority Score of <span className="font-bold text-amber-400">{aiScore}/100</span>.
              </p>
              {duplicateResult?.isDuplicate && (
                <p className="text-xs text-amber-400 mt-2">
                  ℹ️ Your report was linked to {duplicateResult.relatedReports.length} existing similar report(s) — their priority has been updated.
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => navigate(`/report/${submittedReportId}`)}
                className="w-full sm:w-auto px-6 py-3 text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
              >
                <span>View Timeline &amp; Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setFlow(FLOW.FORM);
                  setSubmittedReportId(null);
                  setTitle('');
                  setDescription('');
                  setLocation('');
                  setImageUrl('');
                  setFileName('');
                  setPhotoAnalysis(null);
                  setDuplicateResult(null);
                }}
                className="w-full sm:w-auto px-6 py-3 text-xs font-semibold text-slate-300 hover:text-white glass-panel border border-slate-700 rounded-xl"
              >
                Submit Another Report
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ── Main Form ── */}
            <div className="lg:col-span-2 space-y-4">
              <form onSubmit={handleFormSubmit} className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Problem Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Hazardous Deep Pothole on 5th Avenue"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl glass-input"
                    disabled={isBusy}
                  />
                </div>

                {/* Category + Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Issue Category *</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl glass-input bg-slate-900"
                      disabled={isBusy}
                    >
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex justify-between">
                      <span>Location / Address *</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(pos => {
                              setLatitude(pos.coords.latitude);
                              setLongitude(pos.coords.longitude);
                              setLocation(`GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
                            });
                          }
                        }}
                        className="text-cyan-400 flex items-center gap-1 hover:text-cyan-300 transition-colors"
                        disabled={isBusy}
                      >
                        <LocateFixed className="w-3 h-3" /> Get GPS
                      </button>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        placeholder="e.g. Near Central Metro Station"
                        className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl glass-input"
                        disabled={isBusy}
                      />
                      <MapPin className="w-4 h-4 text-cyan-400 absolute left-3 top-3" />
                    </div>
                  </div>
                </div>

                {/* Severity */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">Self-Assessed Hazard Level</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {SEVERITIES.map(sev => (
                      <button
                        type="button"
                        key={sev.id}
                        onClick={() => setSeverity(sev.id)}
                        disabled={isBusy}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          severity === sev.id
                            ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300 shadow-md'
                            : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        {sev.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">Detailed Description</label>
                    <button
                      type="button"
                      onClick={toggleListening}
                      disabled={isBusy}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-all ${
                        isListening
                          ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse shadow-md shadow-rose-500/20'
                          : 'bg-slate-900/60 border-slate-700 text-cyan-400 hover:text-cyan-300 hover:bg-slate-800'
                      }`}
                      title={isListening ? 'Click to stop voice dictation' : 'Click to dictate description with microphone'}
                    >
                      {isListening ? (
                        <>
                          <MicOff className="w-3.5 h-3.5" />
                          <span>Stop Listening</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-3.5 h-3.5" />
                          <span>Voice Input</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="relative">
                    <textarea
                      rows="4"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder={isListening ? "Listening... Speak now to dictate your description..." : "Describe the issue size, traffic impact, or any safety concerns..."}
                      className={`w-full px-3.5 py-2.5 text-sm rounded-xl glass-input resize-none transition-all ${
                        isListening ? 'border-rose-500/50 ring-1 ring-rose-500/30' : ''
                      }`}
                      disabled={isBusy}
                    />
                    {isListening && (
                      <div className="absolute right-3 bottom-3 flex items-center gap-1.5 px-2 py-1 rounded-md bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                        Listening...
                      </div>
                    )}
                  </div>
                  {micError && (
                    <p className="text-[11px] text-amber-400 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" /> {micError}
                    </p>
                  )}
                </div>

                {/* PHOTO IMAGE FILE UPLOAD / URL SECTION */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-300">Upload Issue Photograph (Before Condition)</label>
                    <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setUploadMode('file')}
                        className={`px-2 py-0.5 rounded font-semibold transition-all ${
                          uploadMode === 'file' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400'
                        }`}
                      >
                        Upload File
                      </button>
                      <button
                        type="button"
                        onClick={() => setUploadMode('url')}
                        className={`px-2 py-0.5 rounded font-semibold transition-all ${
                          uploadMode === 'url' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400'
                        }`}
                      >
                        Image URL
                      </button>
                    </div>
                  </div>

                  {uploadMode === 'file' ? (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileInputChange}
                        className="hidden"
                      />

                      {imageUrl ? (
                        <div className="relative rounded-xl overflow-hidden border border-cyan-500/40 bg-slate-900 p-2 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <img src={imageUrl} alt="Uploaded Preview" className="w-16 h-16 rounded-lg object-cover border border-slate-700" />
                            <div>
                              <div className="text-xs font-bold text-white truncate max-w-[200px]">{fileName || 'Uploaded Image'}</div>
                              <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                                <CheckCircle2 className="w-3 h-3" /> Image Ready for Report
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleAnalyzePhoto}
                              disabled={isBusy}
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-1"
                            >
                              {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                              <span>AI Analyze</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleImageUrlChange('');
                                setFileName('');
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                              title="Remove Image"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          onDrop={handleDrop}
                          onDragOver={handleDragOver}
                          className="border-2 border-dashed border-slate-800 hover:border-cyan-500/60 bg-slate-900/40 hover:bg-slate-900/80 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2 group"
                        >
                          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                            <Upload className="w-5 h-5" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-slate-200">Click to choose image file or drag &amp; drop</p>
                            <p className="text-[10px] text-slate-500">Supports PNG, JPG, JPEG, WEBP files directly from computer</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="url"
                          value={imageUrl}
                          onChange={e => handleImageUrlChange(e.target.value)}
                          placeholder="https://example.com/photo.jpg"
                          className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl glass-input"
                          disabled={isBusy}
                        />
                        <Camera className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      </div>
                      <button
                        type="button"
                        onClick={handleAnalyzePhoto}
                        disabled={!imageUrl || isBusy}
                        className="px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                      >
                        {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        Analyze Photo
                      </button>
                    </div>
                  )}
                </div>

                {/* Status messages */}
                {isAnalyzing && (
                  <div className="flex items-center gap-2 text-xs text-indigo-300 bg-indigo-500/5 border border-indigo-500/20 rounded-xl px-3 py-2.5">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    AI is analyzing your photo for authenticity, category, and severity…
                  </div>
                )}
                {isCheckingDup && (
                  <div className="flex items-center gap-2 text-xs text-cyan-300 bg-cyan-500/5 border border-cyan-500/20 rounded-xl px-3 py-2.5">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Checking for existing similar reports nearby…
                  </div>
                )}

                {/* Duplicate Alert */}
                {flow === FLOW.DUPLICATE_FOUND && duplicateResult && (
                  <DuplicateAlert
                    result={duplicateResult}
                    onSubmitAnyway={handleSubmitAnyway}
                    onDismiss={() => setFlow(FLOW.FORM)}
                  />
                )}

                {/* Submit button (hidden when duplicate alert is shown) */}
                {flow !== FLOW.DUPLICATE_FOUND && (
                  <button
                    type="submit"
                    disabled={isBusy}
                    className="w-full py-3.5 text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /><span>Registering Report…</span></>
                    ) : (
                      <><PlusCircle className="w-4 h-4" /><span>Submit Civic Problem Report</span></>
                    )}
                  </button>
                )}
              </form>
            </div>

            {/* ── AI Analysis Sidebar ── */}
            <div className="p-6 rounded-2xl glass-panel border border-cyan-500/30 space-y-5 h-fit">
              <div className="flex items-center gap-2 text-cyan-400">
                <Sparkles className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">AI PHOTO ANALYSIS</h3>
              </div>

              {!photoAnalysis ? (
                <>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    The AI will automatically analyze your photo when you submit — or click "Analyze Photo" to preview now.
                  </p>

                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-2">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Calculated Priority Score</span>
                    <div className="text-4xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                      {analyzingAi ? '…' : (aiScore !== null ? `${aiScore}/100` : '—')}
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
                </>
              ) : (
                <div className="space-y-4">
                  {/* Authenticity */}
                  <div className="space-y-1">
                    <div className="text-xs text-slate-400">Image Authenticity</div>
                    <div className="text-sm font-semibold text-white flex items-center gap-2">
                      {photoAnalysis.imageAuthenticity === 'Likely Real' ? '🟢' :
                        photoAnalysis.imageAuthenticity === 'Possibly AI-Generated' ? '🟠' : '🟡'}
                      {photoAnalysis.imageAuthenticity}
                    </div>
                    <div className="text-xs text-slate-400">
                      {photoAnalysis.authenticityConfidence}% confidence
                    </div>
                    {photoAnalysis.needsReview && (
                      <div className="mt-1 text-xs text-amber-400 font-semibold flex items-center gap-1 bg-amber-500/5 border border-amber-500/20 rounded-lg px-2 py-1.5">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        ⚠️ Needs Authority Review
                      </div>
                    )}
                  </div>

                  {/* Detected Category */}
                  <div className="space-y-1">
                    <div className="text-xs text-slate-400">Detected</div>
                    <div className="text-sm font-semibold text-white">{photoAnalysis.detectedCategory}</div>
                  </div>

                  {/* Severity */}
                  <div className="space-y-1">
                    <div className="text-xs text-slate-400">Severity</div>
                    <div className="text-sm font-semibold">
                      {photoAnalysis.aiSeverity === 'Critical' ? '🔴 Critical' :
                        photoAnalysis.aiSeverity === 'High' ? '🟠 High' :
                        photoAnalysis.aiSeverity === 'Medium' ? '🟡 Medium' : '🟢 Low'}
                    </div>
                  </div>

                  {/* AI Reason */}
                  <div className="space-y-1">
                    <div className="text-xs text-slate-400">Reason</div>
                    <div className="text-xs text-slate-300 italic leading-relaxed">{photoAnalysis.aiReason}</div>
                  </div>

                  {/* Image hash indicator */}
                  {imageHash && (
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 bg-slate-900/50 border border-slate-800 rounded-lg px-2 py-1.5">
                      <ImageIcon className="w-3 h-3" />
                      <span>Image fingerprint computed for duplicate detection</span>
                    </div>
                  )}

                  {/* Priority Score */}
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Priority Score</span>
                    <div className="text-3xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                      {photoAnalysis.priorityScore}/100
                    </div>
                    <div className="text-xs font-semibold text-cyan-300 uppercase">
                      {photoAnalysis.priorityScore >= 80 ? 'CRITICAL — Immediate Attention' :
                        photoAnalysis.priorityScore >= 60 ? 'HIGH — Prompt Attention' : 'Routine Maintenance'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
