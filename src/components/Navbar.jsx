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
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-cyan-500/20 px-4 lg:px-8 py-3 shadow-xl backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link to={currentUser ? (role === 'Authority' ? '/authority-dashboard' : '/citizen-dashboard') : '/'} className="flex items-center gap-2.5 group">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 text-white shadow-lg shadow-cyan-500/30 group-hover:scale-105 group-hover:shadow-cyan-500/50 transition-all">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-extrabold tracking-tight text-white">Civi<span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">Nex</span></span>
              <span className="text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm shadow-cyan-500/20">AI</span>
            </div>
            <p className="text-[10px] text-slate-400 -mt-0.5 hidden sm:block font-medium">Civic Intelligence Platform</p>
          </div>
        </Link>

        {/* Navigation / User controls */}
        <div className="flex items-center gap-4">
          <a
            href="#workflow"
            onClick={handleWorkflowClick}
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-cyan-400 transition-colors px-3 py-1.5 rounded-xl hover:bg-slate-900/80 border border-transparent hover:border-cyan-500/30"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Workflow</span>
          </a>

          {currentUser ? (
            <div className="flex items-center gap-3">
              {/* Role badge & info */}
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-sm">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
                    {userProfile?.name && !userProfile.name.includes('@')
                      ? userProfile.name
                      : (currentUser.displayName && !currentUser.displayName.includes('@'))
                        ? currentUser.displayName
                        : (currentUser.email ? currentUser.email.split('@')[0].replace(/[0-9_.-]+/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Citizen')}
                  </span>
                </div>
                <span className={`text-[9px] sm:text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-0.5 rounded-full border shadow-sm ${
                  role === 'Authority' 
                    ? 'bg-purple-500/20 text-purple-300 border-purple-400/50 shadow-purple-500/20' 
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 shadow-cyan-500/20'
                }`}>
                  {role || 'Citizen'}
                </span>
              </div>

              {/* Logout Button */}
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-900/90 hover:bg-rose-500/20 border border-slate-700/80 hover:border-rose-500/40 rounded-xl transition-all shadow-md"
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
                className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white transition-colors"
              >
                Login
              </Link>
              <Link 
                to="/register"
                className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 rounded-xl shadow-lg shadow-cyan-500/30 transition-all hover:scale-105"
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
