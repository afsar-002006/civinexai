import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';
import { subscribeToReports } from '../services/api';
import { clusterReports } from '../services/duplicateDetection';
import { MapPin, Filter, Layers, Navigation, ArrowRight, ShieldAlert, Activity, Users } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const mapStyle = { height: '100%', width: '100%', minHeight: '500px', borderRadius: '1rem', zIndex: 0 };

export default function MapPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [heatmapMode, setHeatmapMode] = useState(false);
  const [clusterMode, setClusterMode] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToReports((data) => {
      setReports(data || []);
      if (data && data.length > 0) {
        setSelectedReport(prev => {
          if (!prev) return data[0];
          const updated = data.find(r => r.id === prev.id);
          return updated || prev;
        });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredReports = [...reports].filter(r => {
    const matchCategory = filterCategory === 'All' || r.category === filterCategory;
    const matchStatus = filterStatus === 'All' || r.status === filterStatus;
    return matchCategory && matchStatus;
  }).sort((a, b) => (a.priorityScore || 0) - (b.priorityScore || 0));

  // Build clusters for cluster view
  const clusters = clusterMode ? clusterReports(filteredReports) : null;

  const getMarkerColor = (severity, priorityScore) => {
    if (priorityScore >= 85) return '#ef4444';     // Critical red
    switch (severity) {
      case 'Critical': return '#ef4444';
      case 'High': return '#f97316';
      case 'Medium': return '#eab308';
      case 'Low': return '#22c55e';
      default: return '#3b82f6';
    }
  };

  const getClusterMarkerColor = (count) => {
    if (count >= 5) return '#ef4444';
    if (count >= 3) return '#f97316';
    if (count >= 2) return '#eab308';
    return '#3b82f6';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Spatial Civic Issue Map</h1>
              <p className="text-xs text-slate-400">Real-time interactive geographic view with Leaflet hotspot mapping</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setHeatmapMode(!heatmapMode)}
              className={`px-3 py-2 text-xs rounded-xl border flex items-center gap-2 transition-all ${
                heatmapMode ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' : 'glass-input bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Activity className="w-4 h-4" />
              Heatmap
            </button>
            <button
              onClick={() => setClusterMode(!clusterMode)}
              className={`px-3 py-2 text-xs rounded-xl border flex items-center gap-2 transition-all ${
                clusterMode ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' : 'glass-input bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Users className="w-4 h-4" />
              Cluster View
            </button>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl glass-input bg-slate-900"
            >
              <option value="All">All Categories</option>
              <option value="Road Damage">Road Damage</option>
              <option value="Garbage">Garbage</option>
              <option value="Water Leakage">Water Leakage</option>
              <option value="Electricity">Electricity</option>
              <option value="Streetlight">Streetlight</option>
              <option value="Flooding">Flooding</option>
              <option value="Traffic">Traffic</option>
              <option value="Other">Other</option>
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl glass-input bg-slate-900"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 px-2 text-xs font-semibold">
          <span className="text-slate-400">Legend:</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" />Critical</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" />High</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />Medium</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500" />Low</span>
          {clusterMode && (
            <span className="flex items-center gap-1.5 text-purple-400">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 ring-2 ring-purple-400 ring-offset-1 ring-offset-slate-900" />
              Cluster (multiple reports)
            </span>
          )}
        </div>

        {/* Map Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2 p-1 rounded-2xl glass-panel border border-slate-800 relative min-h-[500px] flex flex-col overflow-hidden">
            <MapContainer center={[13.0827, 80.2707]} zoom={12} style={mapStyle}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              {/* Cluster Mode */}
              {clusterMode && clusters && clusters.map((cluster, idx) => {
                const rep = cluster.representative;
                const lat = Number(rep.latitude) || 13.0827;
                const lng = Number(rep.longitude) || 80.2707;
                const radius = Math.max(8, Math.min(22, 8 + cluster.count * 3));
                return (
                  <CircleMarker
                    key={`cluster-${idx}`}
                    center={[lat, lng]}
                    radius={radius}
                    pathOptions={{
                      color: '#7c3aed',
                      weight: 2,
                      fillColor: getClusterMarkerColor(cluster.count),
                      fillOpacity: 0.85,
                    }}
                    eventHandlers={{ click: () => setSelectedReport({ ...rep, _clusterCount: cluster.count, _clusterReports: cluster.reports }) }}
                  >
                    <Popup className="custom-popup">
                      <div className="text-slate-800 font-sans p-1 min-w-[170px]">
                        <h4 className="font-bold text-sm mb-1">{rep.title}</h4>
                        <p className="text-xs text-slate-600">{rep.address || rep.location}</p>
                        <p className="text-xs font-semibold mt-1" style={{ color: getClusterMarkerColor(cluster.count) }}>
                          {cluster.count} related reports · Priority: {rep.priorityScore}/100
                        </p>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}

              {/* Normal / Heatmap Mode */}
              {!clusterMode && filteredReports.map(report => {
                const lat = Number(report.latitude) || 13.0827;
                const lng = Number(report.longitude) || 80.2707;

                if (heatmapMode) {
                  return (
                    <CircleMarker
                      key={report.id}
                      center={[lat, lng]}
                      radius={25}
                      pathOptions={{ stroke: false, fillColor: '#ef4444', fillOpacity: 0.3 }}
                    />
                  );
                }

                const relatedCount = report.relatedReportCount || 0;
                const radius = Math.max(8, Math.min(16, 8 + relatedCount * 2));

                return (
                  <CircleMarker
                    key={report.id}
                    center={[lat, lng]}
                    radius={radius}
                    pathOptions={{
                      color: '#0f172a',
                      weight: 2,
                      fillColor: getMarkerColor(report.severity, report.priorityScore),
                      fillOpacity: 1,
                    }}
                    eventHandlers={{ click: () => setSelectedReport(report) }}
                  >
                    <Popup className="custom-popup">
                      <div className="text-slate-800 font-sans p-1 min-w-[160px]">
                        <h4 className="font-bold text-sm mb-1">{report.title}</h4>
                        <p className="text-xs text-slate-600 mb-1">{report.address || report.location}</p>
                        <p className="text-xs font-semibold" style={{ color: getMarkerColor(report.severity, report.priorityScore) }}>
                          {report.severity} · Priority: {report.priorityScore}/100
                        </p>
                        {relatedCount > 0 && (
                          <p className="text-xs text-purple-600 font-semibold mt-1">
                            {relatedCount} related report{relatedCount > 1 ? 's' : ''}
                          </p>
                        )}
                        <div className="mt-2 pt-2 border-t border-slate-200">
                          <button onClick={() => setSelectedReport(report)} className="text-xs text-blue-600 font-bold hover:underline">View in Panel</button>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>

          {/* Inspection Panel */}
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
                    <span className="font-semibold" style={{ color: getMarkerColor(selectedReport.severity, selectedReport.priorityScore) }}>
                      {selectedReport.severity}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Priority:</span>
                    <span className="text-white font-bold">{selectedReport.priorityScore}/100</span>
                  </div>

                  {/* Related Reports Count */}
                  {(selectedReport.relatedReportCount > 0 || selectedReport._clusterCount > 1) && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Related Reports:</span>
                      <span className="text-purple-400 font-bold flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {selectedReport._clusterCount || selectedReport.relatedReportCount}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-slate-400">Address:</span>
                    <span className="text-white font-semibold text-right max-w-[60%] truncate" title={selectedReport.address || selectedReport.location}>
                      {selectedReport.address || selectedReport.location}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Coordinates:</span>
                    <span className="text-slate-400 font-mono text-right">
                      {Number(selectedReport.latitude || 13.0827).toFixed(4)}, {Number(selectedReport.longitude || 80.2707).toFixed(4)}
                    </span>
                  </div>

                  {/* AI authenticity badge */}
                  {selectedReport.imageAuthenticity && (
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-slate-400">AI Verification:</span>
                      <span className={`text-xs font-semibold flex items-center gap-1 ${
                        selectedReport.imageAuthenticity === 'Likely Real' ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {selectedReport.imageAuthenticity === 'Likely Real' ? '✓ Verified' : '⚠️ Needs Review'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <StatusBadge status={selectedReport.status} />
                  <PriorityBadge score={selectedReport.priorityScore} severity={selectedReport.severity} />
                </div>

                {/* Cluster-specific: show related reports list */}
                {selectedReport._clusterReports && selectedReport._clusterReports.length > 1 && (
                  <div className="border-t border-slate-800 pt-3 space-y-2">
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Reports in this cluster</p>
                    {selectedReport._clusterReports.slice(0, 4).map(r => (
                      <div key={r.id} className="flex justify-between items-center text-xs">
                        <Link to={`/report/${r.id}`} className="text-cyan-400 hover:underline truncate max-w-[140px]">{r.title}</Link>
                        <span className="text-slate-400 font-mono">{r.priorityScore}/100</span>
                      </div>
                    ))}
                    {selectedReport._clusterReports.length > 4 && (
                      <p className="text-[10px] text-slate-500">+{selectedReport._clusterReports.length - 4} more</p>
                    )}
                  </div>
                )}

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
