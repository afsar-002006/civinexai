import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Camera, 
  Sparkles, 
  Layers, 
  SlidersHorizontal, 
  MapPin, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  Play, 
  Pause, 
  ChevronRight, 
  ChevronLeft,
  AlertTriangle,
  Building2,
  RefreshCw,
  Eye,
  Check,
  Zap,
  Activity,
  Map,
  FileCheck
} from 'lucide-react';

const WORKFLOW_STEPS = [
  {
    id: 1,
    title: "AI Citizen Reporting",
    badge: "Input & AI Scan",
    icon: Camera,
    color: "from-cyan-500 to-blue-500",
    glowColor: "rgba(6, 182, 212, 0.4)",
    summary: "Citizens submit issue photos with GPS data. CiviNex AI performs real-time image analysis, detecting categories, severity, and photo authenticity.",
    details: [
      "Deep Learning categorization (potholes, garbage, water leaks)",
      "Photo authenticity verification (detects digital manipulation & web downloads)",
      "Automatic EXIF geolocation & timestamp validation"
    ]
  },
  {
    id: 2,
    title: "Duplicate & Cluster Detection",
    badge: "Spatial AI Match",
    icon: Layers,
    color: "from-purple-500 to-indigo-500",
    glowColor: "rgba(168, 85, 247, 0.4)",
    summary: "Prevents municipal ticket clutter by grouping multiple citizen reports of the same issue using spatial radius, visual hashing, and description similarity.",
    details: [
      "Perceptual Image Hashing (pHash) for visual comparison",
      "Dynamic spatial buffering (50m-200m GPS radius)",
      "Master Issue auto-clustering with aggregated vote counts"
    ]
  },
  {
    id: 3,
    title: "Dynamic Priority Matrix",
    badge: "Priority Engine",
    icon: SlidersHorizontal,
    color: "from-amber-500 to-orange-500",
    glowColor: "rgba(245, 158, 11, 0.4)",
    summary: "Calculates an objective 0–100 Priority Score based on safety hazards, public exposure, proximity to critical zones, and citizen report volume.",
    details: [
      "Category severity weight (e.g. exposed electrical wires > minor litter)",
      "Proximity impact (schools, main arterial roads, hospitals)",
      "Real-time escalation based on community report velocity"
    ]
  },
  {
    id: 4,
    title: "Authority Dispatch & GIS Map",
    badge: "Smart Routing",
    icon: MapPin,
    color: "from-sky-500 to-cyan-400",
    glowColor: "rgba(56, 189, 248, 0.4)",
    summary: "Automatically dispatches tickets to designated municipal departments (Sanitation, Public Works, Water Board) with live GIS heatmaps & SLA timers.",
    details: [
      "Automated department auto-assignment rules",
      "Interactive GIS spatial heatmaps for field crew optimization",
      "SLA timers with automated supervisor escalation"
    ]
  },
  {
    id: 5,
    title: "Before/After Proof Verification",
    badge: "Closed-Loop SLA",
    icon: CheckCircle2,
    color: "from-emerald-400 to-teal-500",
    glowColor: "rgba(52, 211, 153, 0.4)",
    summary: "Field crews resolve the issue and submit an 'After' photo. AI compares before/after structural evidence to verify completion and notify citizens.",
    details: [
      "AI structural comparison verifying resolution evidence",
      "Automated notification sent to reporting citizens",
      "Downloadable A4 official audit reports & public transparency log"
    ]
  }
];

// Sample preset issues for Step 1 Simulator
const SAMPLE_ISSUES = [
  {
    name: "Deep Pothole on Main Blvd",
    category: "Pothole / Road Damage",
    severity: "High",
    authenticity: 98.6,
    badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    img: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "High Pressure Water Leak",
    category: "Water Supply / Pipeline",
    severity: "Critical",
    authenticity: 99.2,
    badgeColor: "bg-red-500/20 text-red-400 border-red-500/30",
    img: "https://images.unsplash.com/photo-1584467735815-f778f274e296?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Overflowing Garbage Dumpster",
    category: "Sanitation / Waste",
    severity: "Medium",
    authenticity: 96.4,
    badgeColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    img: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Broken Streetlight & Exposed Wire",
    category: "Electrical / Safety",
    severity: "High",
    authenticity: 97.9,
    badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    img: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80"
  }
];

export default function InteractiveWorkflow() {
  const [activeStep, setActiveStep] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewTab, setViewTab] = useState('simulator'); // 'simulator' | 'architecture'
  
  // Step 1 Simulator State
  const [selectedIssueIdx, setSelectedIssueIdx] = useState(0);
  const [isScanning, setIsScanning] = useState(false);

  // Step 2 Simulator State
  const [isDuplicateScanning, setIsDuplicateScanning] = useState(false);
  const [duplicatesFound, setDuplicatesFound] = useState(true);

  // Step 3 Simulator State
  const [simSeverity, setSimSeverity] = useState(4); // 1-5
  const [simReports, setSimReports] = useState(12); // 1-50
  const [simZone, setSimZone] = useState('school'); // 'quiet', 'normal', 'hospital', 'school'

  // Step 5 Simulator State
  const [beforeAfterTab, setBeforeAfterTab] = useState('after'); // 'before' | 'after' | 'split'

  // Autoplay timer
  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        setActiveStep((prev) => (prev % WORKFLOW_STEPS.length) + 1);
      }, 5000);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  // Handle Step Change
  const handleStepClick = (stepId) => {
    setActiveStep(stepId);
    setIsPlaying(false);
  };

  // Trigger scan animation in Step 1
  const handleScanSample = (idx) => {
    setSelectedIssueIdx(idx);
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 1200);
  };

  // Calculate dynamic priority score for Step 3 Sandbox
  const calculatePriorityScore = () => {
    let base = simSeverity * 15; // max 75
    let reportsBonus = Math.min(simReports * 0.5, 15); // max 15
    let zoneBonus = simZone === 'school' ? 10 : simZone === 'hospital' ? 10 : simZone === 'normal' ? 5 : 0;
    return Math.min(Math.round(base + reportsBonus + zoneBonus), 100);
  };

  const priorityScore = calculatePriorityScore();
  const currentStepObj = WORKFLOW_STEPS.find(s => s.id === activeStep);

  return (
    <section className="py-20 px-4 max-w-7xl mx-auto relative overflow-hidden" id="workflow">
      {/* Background Lighting Gradients */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Section Title */}
      <div className="text-center space-y-4 mb-14 relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel border-cyan-500/30 text-cyan-400 text-xs font-semibold">
          <Sparkles className="w-4 h-4 animate-pulse text-cyan-400" />
          <span>Interactive Lifecycle Workflow</span>
        </div>

        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
          How <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">CiviNex AI</span> Works
        </h2>
        <p className="max-w-2xl mx-auto text-slate-400 text-sm md:text-base leading-relaxed">
          From the instant a citizen snaps a photo to local AI verification, priority scoring, automated dispatch, and verified SLA completion.
        </p>

        {/* View Switcher: Interactive Simulator vs Architecture Flow Map */}
        <div className="pt-2 flex justify-center">
          <div className="inline-flex p-1 rounded-xl bg-slate-900/90 border border-slate-800 backdrop-blur-md">
            <button
              onClick={() => setViewTab('simulator')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                viewTab === 'simulator'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Interactive Step Simulator</span>
            </button>
            <button
              onClick={() => setViewTab('architecture')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                viewTab === 'architecture'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>System Architecture Map</span>
            </button>
          </div>
        </div>
      </div>

      {viewTab === 'simulator' ? (
        <div>
          {/* Workflow Stepper Navigation Tabs */}
          <div className="relative mb-10">
            {/* Step Connecting Progress Line (Desktop) */}
            <div className="hidden lg:block absolute top-1/2 left-10 right-10 h-0.5 bg-slate-800 -translate-y-1/2 z-0" />
            <div 
              className="hidden lg:block absolute top-1/2 left-10 h-0.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-emerald-400 -translate-y-1/2 z-0 transition-all duration-500"
              style={{ width: `${((activeStep - 1) / (WORKFLOW_STEPS.length - 1)) * 85}%` }}
            />

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 relative z-10">
              {WORKFLOW_STEPS.map((step) => {
                const StepIcon = step.icon;
                const isActive = step.id === activeStep;
                const isPassed = step.id < activeStep;

                return (
                  <button
                    key={step.id}
                    onClick={() => handleStepClick(step.id)}
                    className={`text-left p-3.5 rounded-2xl transition-all duration-300 border flex flex-col justify-between relative group ${
                      isActive
                        ? 'bg-slate-900/90 border-cyan-500/50 shadow-lg shadow-cyan-500/10 scale-[1.03]'
                        : isPassed
                        ? 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 text-slate-300'
                        : 'bg-slate-950/40 border-slate-900 hover:border-slate-800 text-slate-500'
                    }`}
                  >
                    {/* Top step header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-colors ${
                        isActive
                          ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/30'
                          : isPassed
                          ? 'bg-slate-800 text-cyan-400'
                          : 'bg-slate-900 text-slate-600'
                      }`}>
                        {step.id}
                      </div>

                      <div className={`p-2 rounded-xl transition-all ${
                        isActive
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : 'bg-slate-800/50 text-slate-400 group-hover:text-slate-200'
                      }`}>
                        <StepIcon className="w-4 h-4" />
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-wider text-cyan-400/80 mb-0.5">
                        {step.badge}
                      </div>
                      <div className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>
                        {step.title}
                      </div>
                    </div>

                    {/* Active Indicator Glow */}
                    {isActive && (
                      <div className="absolute -bottom-1 left-4 right-4 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full blur-[2px]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stepper Controls Bar (Autoplay & Next/Prev) */}
          <div className="flex items-center justify-between mb-6 px-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 text-cyan-400" /> : <Play className="w-3.5 h-3.5 text-cyan-400" />}
                <span>{isPlaying ? 'Pause Auto Tour' : 'Autoplay Workflow'}</span>
              </button>
              {isPlaying && (
                <span className="text-[11px] text-slate-500 animate-pulse flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
                  Auto-advancing every 5s...
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={activeStep === 1}
                onClick={() => handleStepClick(activeStep - 1)}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Previous Step"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-slate-400 px-2">
                Step {activeStep} of {WORKFLOW_STEPS.length}
              </span>
              <button
                disabled={activeStep === WORKFLOW_STEPS.length}
                onClick={() => handleStepClick(activeStep + 1)}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Next Step"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* MAIN INTERACTIVE DISPLAY AREA (Split: Left Info, Right Sandbox) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left Box: Step Description & Micro Details */}
            <div className="lg:col-span-5 flex flex-col justify-between glass-panel p-6 lg:p-8 rounded-3xl border border-slate-800/80 relative">
              <div className="space-y-6">
                {/* Step Badge */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    Step 0{activeStep} • {currentStepObj.badge}
                  </span>
                </div>

                <h3 className="text-2xl lg:text-3xl font-extrabold text-white">
                  {currentStepObj.title}
                </h3>

                <p className="text-sm lg:text-base text-slate-300 leading-relaxed">
                  {currentStepObj.summary}
                </p>

                {/* Key Bullet Highlights */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                    Core Intelligence Features
                  </h4>
                  {currentStepObj.details.map((detail, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-xs md:text-sm text-slate-300">
                      <div className="w-5 h-5 rounded-md bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5 border border-cyan-500/20">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Quick Call to Action */}
              <div className="pt-8 border-t border-slate-800/80 mt-6 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Ready to test CiviNex in action?
                </span>
                <Link
                  to="/report-problem"
                  className="px-4 py-2 text-xs font-bold text-cyan-400 hover:text-white glass-panel hover:bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-center gap-1.5 transition-all"
                >
                  <span>Submit Live Issue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Right Box: LIVE DYNAMIC INTERACTIVE DEMO SANDBOX */}
            <div className="lg:col-span-7 glass-panel p-6 lg:p-8 rounded-3xl border border-slate-800/80 flex flex-col justify-between relative overflow-hidden bg-slate-950/60">
              
              {/* SANDBOX STEP 1: AI CITIZEN REPORTING DEMO */}
              {activeStep === 1 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        AI Vision Scanner Demo
                      </h4>
                      <p className="text-xs text-slate-400">Click a sample issue below to simulate real-time AI classification</p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Model Ready
                    </span>
                  </div>

                  {/* Preset Selector */}
                  <div className="grid grid-cols-2 gap-2">
                    {SAMPLE_ISSUES.map((sample, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleScanSample(idx)}
                        className={`p-2.5 rounded-xl text-left border text-xs transition-all ${
                          selectedIssueIdx === idx
                            ? 'bg-slate-900 border-cyan-500 text-white shadow-md shadow-cyan-500/10'
                            : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="font-bold truncate">{sample.name}</div>
                        <div className="text-[10px] text-slate-400">{sample.category}</div>
                      </button>
                    ))}
                  </div>

                  {/* Simulated Camera View & Scan Overlay */}
                  <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 aspect-video group">
                    <img 
                      src={SAMPLE_ISSUES[selectedIssueIdx].img} 
                      alt="Sample" 
                      className="w-full h-full object-cover opacity-80"
                    />

                    {/* Scanning Laser Animation */}
                    {isScanning && (
                      <div className="absolute inset-0 bg-cyan-500/10 backdrop-blur-[1px] flex flex-col items-center justify-center">
                        <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent absolute top-0 animate-bounce shadow-lg shadow-cyan-400" />
                        <div className="bg-slate-950/80 px-4 py-2 rounded-xl border border-cyan-500/40 text-cyan-400 text-xs font-bold flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                          <span>Extracting EXIF & Neural Feature Hashing...</span>
                        </div>
                      </div>
                    )}

                    {/* Detected AI Tag Bounding Boxes */}
                    {!isScanning && (
                      <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none">
                        <div className="flex justify-between items-start">
                          <div className="bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-200 space-y-0.5 pointer-events-auto">
                            <div className="text-[10px] text-slate-400 uppercase font-bold">Detected Object</div>
                            <div className="font-bold text-cyan-400">{SAMPLE_ISSUES[selectedIssueIdx].category}</div>
                          </div>

                          <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${SAMPLE_ISSUES[selectedIssueIdx].badgeColor}`}>
                            Severity: {SAMPLE_ISSUES[selectedIssueIdx].severity}
                          </div>
                        </div>

                        <div className="bg-slate-950/90 backdrop-blur-md p-3 rounded-xl border border-slate-800 text-xs flex items-center justify-between pointer-events-auto">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span className="text-slate-300 text-xs">Authenticity Score:</span>
                            <span className="font-black text-emerald-400">{SAMPLE_ISSUES[selectedIssueIdx].authenticity}% Genuine</span>
                          </div>
                          <span className="text-[10px] text-slate-400">GPS: 13.0827° N, 80.2707° E</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SANDBOX STEP 2: DUPLICATE DETECTION DEMO */}
              {activeStep === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Layers className="w-4 h-4 text-purple-400" />
                        Spatial AI Clustering Engine
                      </h4>
                      <p className="text-xs text-slate-400">Real-time matching of incoming citizen report against recent radius logs</p>
                    </div>
                    <button
                      onClick={() => setIsDuplicateScanning(!isDuplicateScanning)}
                      className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold hover:bg-purple-500/30 transition-all flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isDuplicateScanning ? 'animate-spin' : ''}`} />
                      <span>Re-Run Radar Scan</span>
                    </button>
                  </div>

                  {/* Visual Cluster Diagram */}
                  <div className="relative p-6 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-4">
                    <div className="text-xs font-semibold text-slate-300 flex items-center justify-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                      Radius: 150 meters • Spatial pHash Threshold &gt; 85%
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-2">
                      <div className="p-3 rounded-xl bg-slate-950 border border-purple-500/30 text-left relative overflow-hidden">
                        <div className="text-[10px] text-purple-400 font-bold uppercase">Primary Ticket</div>
                        <div className="text-xs font-bold text-white truncate">Report #CVX-901</div>
                        <div className="text-[10px] text-slate-400 mt-1">Water Leakage • 2m ago</div>
                        <div className="mt-2 text-[10px] font-black text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded text-center">
                          Master Parent
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-left">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Citizen #2</div>
                        <div className="text-xs font-bold text-slate-200 truncate">Report #CVX-904</div>
                        <div className="text-[10px] text-slate-400 mt-1">Pipe Burst • 45m away</div>
                        <div className="mt-2 text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded text-center">
                          94.2% Match
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-left">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Citizen #3</div>
                        <div className="text-xs font-bold text-slate-200 truncate">Report #CVX-907</div>
                        <div className="text-[10px] text-slate-400 mt-1">Road Flood • 80m away</div>
                        <div className="mt-2 text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded text-center">
                          89.8% Match
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200 flex items-center justify-between">
                      <span className="font-semibold">Cluster Status:</span>
                      <span className="font-bold text-purple-300">Merged into 1 Consolidated Work Order (+2 Upvotes)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* SANDBOX STEP 3: DYNAMIC PRIORITY SCORE CALCULATOR */}
              {activeStep === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                        Live Priority Matrix Simulator
                      </h4>
                      <p className="text-xs text-slate-400">Adjust parameters to see how AI computes urgency scores</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    {/* Sliders Control */}
                    <div className="space-y-4 text-xs">
                      <div>
                        <div className="flex justify-between font-bold mb-1 text-slate-300">
                          <span>Category Hazard Level:</span>
                          <span className="text-amber-400">{simSeverity} / 5</span>
                        </div>
                        <input 
                          type="range" 
                          min="1" 
                          max="5" 
                          value={simSeverity} 
                          onChange={(e) => setSimSeverity(Number(e.target.value))}
                          className="w-full accent-amber-400 bg-slate-800 rounded-lg cursor-pointer h-2"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between font-bold mb-1 text-slate-300">
                          <span>Citizen Report Volume:</span>
                          <span className="text-amber-400">{simReports} Reports</span>
                        </div>
                        <input 
                          type="range" 
                          min="1" 
                          max="50" 
                          value={simReports} 
                          onChange={(e) => setSimReports(Number(e.target.value))}
                          className="w-full accent-amber-400 bg-slate-800 rounded-lg cursor-pointer h-2"
                        />
                      </div>

                      <div>
                        <div className="font-bold mb-1.5 text-slate-300">Zone Sensitivity:</div>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: 'quiet', label: 'Residential Alley' },
                            { id: 'normal', label: 'Commercial St.' },
                            { id: 'hospital', label: 'Hospital Zone' },
                            { id: 'school', label: 'School Zone' }
                          ].map((z) => (
                            <button
                              key={z.id}
                              onClick={() => setSimZone(z.id)}
                              className={`p-2 rounded-lg text-[11px] font-bold border transition-all ${
                                simZone === z.id
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : 'bg-slate-900 border-slate-800 text-slate-400'
                              }`}
                            >
                              {z.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Calculated Score Meter Display */}
                    <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        Computed Priority Score
                      </div>
                      
                      <div className={`text-5xl font-black transition-colors ${
                        priorityScore >= 85 ? 'text-red-400' : priorityScore >= 65 ? 'text-amber-400' : 'text-cyan-400'
                      }`}>
                        {priorityScore}<span className="text-xl text-slate-500">/100</span>
                      </div>

                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                        priorityScore >= 85
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : priorityScore >= 65
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      }`}>
                        {priorityScore >= 85 ? '🚨 CRITICAL DISPATCH' : priorityScore >= 65 ? '⚡ HIGH PRIORITY' : '✅ NORMAL ROUTINE'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SANDBOX STEP 4: GIS MAP & ROUTING */}
              {activeStep === 4 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-sky-400" />
                        GIS Department Auto-Routing
                      </h4>
                      <p className="text-xs text-slate-400">Intelligent dispatch to field units with SLA tracking</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/30 space-y-2">
                      <div className="flex items-center gap-2 text-cyan-400 font-bold">
                        <Building2 className="w-4 h-4" />
                        <span>Public Works Dept</span>
                      </div>
                      <p className="text-[11px] text-slate-400">Assigned for: Road Potholes, Structural Damage</p>
                      <div className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-1 rounded w-fit">
                        SLA Target: 24 Hours
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900 border border-purple-500/30 space-y-2">
                      <div className="flex items-center gap-2 text-purple-400 font-bold">
                        <Building2 className="w-4 h-4" />
                        <span>Sanitation Department</span>
                      </div>
                      <p className="text-[11px] text-slate-400">Assigned for: Waste Overflow, Illegal Dumps</p>
                      <div className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-1 rounded w-fit">
                        SLA Target: 12 Hours
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400">
                        <Map className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Live GIS Map Integration</div>
                        <div className="text-[11px] text-slate-400">Interactive heatmap views for municipal authorities</div>
                      </div>
                    </div>
                    <Link
                      to="/map"
                      className="px-3.5 py-1.5 text-xs font-bold text-sky-400 hover:text-white glass-panel border border-sky-500/30 rounded-xl flex items-center gap-1.5 transition-all"
                    >
                      <span>Open Live Map</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}

              {/* SANDBOX STEP 5: BEFORE / AFTER PROOF VERIFICATION */}
              {activeStep === 5 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        AI Resolution Proof Matcher
                      </h4>
                      <p className="text-xs text-slate-400">Comparing original citizen report against field maintenance evidence</p>
                    </div>
                  </div>

                  {/* Before / After Selector */}
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => setBeforeAfterTab('before')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        beforeAfterTab === 'before' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      Original Problem (Before)
                    </button>
                    <button
                      onClick={() => setBeforeAfterTab('after')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        beforeAfterTab === 'after' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      Fixed Issue (After)
                    </button>
                  </div>

                  {/* Image Display */}
                  <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 aspect-video">
                    <img 
                      src={
                        beforeAfterTab === 'before'
                          ? "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80"
                          : "https://images.unsplash.com/photo-1578991624414-276ef23a534f?w=600&auto=format&fit=crop&q=80"
                      }
                      alt="Comparison" 
                      className="w-full h-full object-cover"
                    />

                    <div className="absolute top-3 left-3 px-3 py-1 rounded-xl bg-slate-950/90 border border-slate-700 text-xs font-bold text-white">
                      {beforeAfterTab === 'before' ? '🔴 Initial Citizen Upload' : '🟢 Verified Crew Resolution'}
                    </div>

                    <div className="absolute bottom-3 right-3 px-3.5 py-1.5 rounded-xl bg-slate-950/90 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>AI Verification: 99.1% Structural Resolution</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      ) : (
        /* ARCHITECTURE FLOW DIAGRAM VIEW */
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-8">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h3 className="text-xl font-bold text-white">System Architecture & Data Stream Flow</h3>
            <p className="text-xs text-slate-400">
              End-to-end data pipeline from client React app to Firebase Firestore, AI Neural Workers, and Municipal Portals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {[
              { title: "Citizen Portal", sub: "Web/Mobile Upload", tech: "React + Tailwind", icon: Camera },
              { title: "AI Vision Worker", sub: "EXIF & pHash Analysis", tech: "Local AI Services", icon: Sparkles },
              { title: "Priority Engine", sub: "Dynamic Scoring", tech: "Formula & Geo-radius", icon: SlidersHorizontal },
              { title: "Firestore GIS", sub: "Real-time Sync", tech: "Firebase Cloud DB", icon: MapPin },
              { title: "Authority Hub", sub: "Dispatch & Verification", tech: "Role-based Portal", icon: CheckCircle2 }
            ].map((node, i) => {
              const NodeIcon = node.icon;
              return (
                <div key={i} className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-3 relative group hover:border-cyan-500/40 transition-all">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center font-bold">
                    <NodeIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{node.title}</div>
                    <div className="text-[11px] text-slate-400">{node.sub}</div>
                  </div>
                  <div className="text-[9px] uppercase font-bold tracking-wider text-cyan-400/80 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    {node.tech}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
