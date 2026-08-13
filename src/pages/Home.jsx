import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { ShieldAlert, AlertTriangle, Cpu, BarChart2, CheckCircle2, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 px-4">
        {/* Background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel border-cyan-500/30 text-cyan-400 text-xs font-semibold">
            <Cpu className="w-4 h-4" />
            <span>AI-Powered Civic Intelligence Platform</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Report Civic Issues. <br />
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
              Prioritize with Intelligence.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base md:text-lg text-slate-400 font-normal">
            CiviNex connects proactive citizens with municipal authorities using local AI analysis to detect problem severity, calculate priority scores, and resolve local issues faster.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-slate-300 hover:text-white glass-panel hover:bg-slate-900 border border-slate-700/60 rounded-xl transition-all"
            >
              Sign In to Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-6xl mx-auto px-4 pb-20 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl glass-panel glass-panel-hover">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4 border border-cyan-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Instant Issue Submission</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Report potholes, garbage dumps, water leakage, flooding, or streetlights in seconds with photo upload and location details.
          </p>
        </div>

        <div className="p-6 rounded-2xl glass-panel glass-panel-hover">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 border border-purple-500/20">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Mock AI Priority Scoring</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Automated intelligence analyzes category severity and generates priority scores (0–100) to bubble up critical hazards.
          </p>
        </div>

        <div className="p-6 rounded-2xl glass-panel glass-panel-hover">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20">
            <BarChart2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Transparent Progress Tracking</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Track report statuses from submission to review, in-progress resolution, and final completion on interactive timelines.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <p>CiviNex Civic Intelligence Prototype &copy; {new Date().getFullYear()} — College Project</p>
      </footer>
    </div>
  );
}
