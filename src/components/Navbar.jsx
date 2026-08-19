import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, LogOut, User, Sparkles, Activity } from 'lucide-react';

export default function Navbar() {
  const { currentUser, userProfile, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const handleWorkflowClick = (e) => {
    if (location.pathname === '/') {
      e.preventDefault();
      const el = document.getElementById('workflow');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate('/#workflow');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link to={currentUser ? (role === 'Authority' ? '/authority-dashboard' : '/citizen-dashboard') : '/'} className="flex items-center gap-2.5 group">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black tracking-tight text-white">Civi<span className="text-cyan-400">Nex</span></span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">AI</span>
            </div>
            <p className="text-[10px] text-slate-400 -mt-1 hidden sm:block">Civic Intelligence Platform</p>
          </div>
        </Link>

        {/* Navigation / User controls */}
        <div className="flex items-center gap-4">
          <a
            href="#workflow"
            onClick={handleWorkflowClick}
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-cyan-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Workflow</span>
          </a>

          {currentUser ? (
            <div className="flex items-center gap-3">
              {/* Role badge & info */}
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-semibold text-slate-200">{userProfile?.name || currentUser.email}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  role === 'Authority' 
                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' 
                    : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                }`}>
                  {role || 'Citizen'}
                </span>
              </div>

              {/* Logout Button */}
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link 
                to="/login"
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Login
              </Link>
              <Link 
                to="/register"
                className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-lg shadow-md shadow-cyan-500/20 transition-all"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
