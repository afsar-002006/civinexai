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
    <aside className="w-full md:w-64 glass-panel border-r border-slate-800/80 p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-6">
        <div className="px-3 py-2 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
          {role === 'Authority' ? 'Authority Portal' : 'Citizen Workspace'}
        </div>

        <nav className="space-y-1.5">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-400 border border-cyan-500/30 shadow-md shadow-cyan-500/10 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Teammate credit / Prototype info */}
      <div className="mt-8 p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 text-xs text-slate-400 space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-cyan-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>CiviNex AI Core</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-tight">
          Powered by local mock priority scoring & intelligent severity engine.
        </p>
      </div>
    </aside>
  );
}
