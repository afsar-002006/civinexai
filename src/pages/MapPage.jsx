import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';
import { fetchReports } from '../services/api';
import { MapPin, Filter, Layers, Navigation, ArrowRight, ShieldAlert } from 'lucide-react';

export default function MapPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [filterCategory, setFilterCategory] = useState('All');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchReports();
      setReports(data || []);
      if (data && data.length > 0) setSelectedReport(data[0]);
      setLoading(false);
    }
    load();
  }, []);

  const filteredReports = reports.filter(r => filterCategory === 'All' || r.category === filterCategory);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Spatial Civic Issue Map</h1>
              <p className="text-xs text-slate-400">Interactive hotspot geographic view with priority pins</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl glass-input bg-slate-900"
            >
              <option value="All">All Map Hotspots</option>
              <option value="Road Damage">Road Damage</option>
              <option value="Garbage">Garbage</option>
              <option value="Water Leakage">Water Leakage</option>
              <option value="Electricity">Electricity</option>
            </select>
          </div>
        </div>

        {/* Map Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Interactive Geographic Map Canvas View */}
          <div className="lg:col-span-2 p-6 rounded-2xl glass-panel border border-slate-800 space-y-4 relative min-h-[420px] flex flex-col justify-between overflow-hidden">
            {/* Map background styling */}
            <div className="absolute inset-0 bg-slate-950 opacity-90 pointer-events-none"></div>
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none"></div>

            <div className="relative z-10 flex items-center justify-between">
              <span className="text-xs font-mono text-cyan-400 font-semibold flex items-center gap-1.5">
                <Navigation className="w-4 h-4 animate-spin text-cyan-400" />
                GPS WARD BOUNDARY — CENTRAL MUNICIPAL ZONE
              </span>
              <span className="text-[10px] text-slate-400 px-2 py-1 rounded bg-slate-900 border border-slate-800">
                {filteredReports.length} Pin Locations Active
              </span>
            </div>

            {/* Interactive Pins Container */}
            <div className="relative z-10 my-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {filteredReports.map((report) => {
                const isSelected = selectedReport?.id === report.id;
                const isCritical = report.severity === 'Critical' || report.priorityScore >= 80;

                return (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReport(report)}
                    className={`p-3.5 rounded-xl border text-left transition-all relative group ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400 shadow-lg shadow-cyan-500/20 scale-[1.03]'
                        : 'bg-slate-900/80 hover:bg-slate-800/90 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${isCritical ? 'bg-rose-500 animate-ping' : 'bg-cyan-400'}`}></span>
                      <span className="text-[10px] font-mono text-slate-400 font-bold">{report.id}</span>
                    </div>
                    <div className="text-xs font-bold text-white truncate">{report.title}</div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">{report.location}</div>
                  </button>
                );
              })}
            </div>

            <div className="relative z-10 text-[10px] text-slate-500 flex items-center justify-between border-t border-slate-800/80 pt-3">
              <span>Coordinates: 13.0827° N, 80.2707° E</span>
              <span>Click pin box to inspect details</span>
            </div>
          </div>

          {/* Pin Details Inspector Card */}
          <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4 h-fit">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              <span>Inspected Hotspot</span>
            </h2>

            {selectedReport ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-mono font-bold text-cyan-400">{selectedReport.id}</span>
                  <h3 className="text-lg font-bold text-white">{selectedReport.title}</h3>
                  <p className="text-xs text-slate-400">{selectedReport.description}</p>
                </div>

                <div className="space-y-2 pt-2 text-xs border-t border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Category:</span>
                    <span className="text-cyan-400 font-semibold">{selectedReport.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Hazard Severity:</span>
                    <span className="text-amber-400 font-semibold">{selectedReport.severity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Priority Urgency:</span>
                    <span className="text-white font-bold">{selectedReport.priorityScore}/100</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <StatusBadge status={selectedReport.status} />
                  <PriorityBadge score={selectedReport.priorityScore} severity={selectedReport.severity} />
                </div>

                <Link
                  to={`/report/${selectedReport.id}`}
                  className="w-full py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all mt-2"
                >
                  <span>Open Report Resolution Details</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                Select a hotspot pin on the map to view detailed AI metrics.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
