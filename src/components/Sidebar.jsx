import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  PlusCircle, 
  FileText, 
  BarChart3, 
  MapPin, 
  ShieldAlert,
  Sparkles
} from 'lucide-react';

export default function Sidebar() {
  const { role } = useAuth();

  const citizenLinks = [
    { to: '/citizen-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/report-problem', label: 'Report Problem', icon: PlusCircle },
    { to: '/my-reports', label: 'My Reports', icon: FileText },
    { to: '/map', label: 'Civic Map', icon: MapPin },
  ];

  const authorityLinks = [
    { to: '/authority-dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/map', label: 'Civic Map', icon: MapPin },
  ];

  const links = role === 'Authority' ? authorityLinks : citizenLinks;

  return (
    <aside className="w-full md:w-64 glass-panel border border-cyan-500/20 p-4 flex flex-col justify-between shrink-0 rounded-2xl shadow-xl">
      <div className="space-y-6">
        <div className="px-3.5 py-2 text-[10px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-500/10 rounded-xl border border-cyan-500/20 shadow-sm flex items-center justify-between">
          <span>{role === 'Authority' ? 'Authority Portal' : 'Citizen Workspace'}</span>
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        </div>

        <nav className="space-y-2">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/25 via-blue-500/20 to-purple-500/15 text-cyan-300 border border-cyan-400/40 shadow-lg shadow-cyan-500/20 font-extrabold scale-[1.02]'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/80 border border-transparent hover:border-slate-800'
                  }`
                }
              >
                <Icon className="w-4 h-4 text-cyan-400" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Teammate credit / Prototype info */}
      <div className="mt-8 p-4 rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-900/90 to-cyan-950/30 border border-cyan-500/20 text-xs text-slate-400 space-y-1.5 shadow-md">
        <div className="flex items-center gap-1.5 font-extrabold text-cyan-400">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>CiviNex AI Core</span>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
          Powered by local mock priority scoring &amp; intelligent severity engine.
        </p>
      </div>
    </aside>
  );
}
