const API_BASE_URL = 'http://localhost:5000/api';

// Initial local storage key for client persistence
const LOCAL_REPORTS_KEY = 'civinex_local_reports';

const defaultSeedReports = [
  {
    id: 'rep-101',
    title: 'Major Pothole on Main Street',
    category: 'Road Damage',
    severity: 'High',
    priorityScore: 88,
    status: 'Pending',
    location: '123 Main St, Central Ward',
    latitude: 13.0827,
    longitude: 80.2707,
    description: 'Large hazard hole in the left lane causing traffic slowdowns and wheel damage.',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    reportedBy: 'citizen@civinex.org',
    imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'rep-102',
    title: 'Overflowing Garbage Bin',
    category: 'Garbage',
    severity: 'Medium',
    priorityScore: 65,
    status: 'In Progress',
    location: 'Park Avenue & 4th St',
    latitude: 13.0878,
    longitude: 80.2785,
    description: 'Waste bin uncleaned for 3 days attracting pests near residential area.',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    reportedBy: 'resident@civinex.org',
    imageUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'rep-103',
    title: 'Broken Streetlight Near School Zone',
    category: 'Electricity',
    severity: 'Medium',
    priorityScore: 54,
    status: 'Resolved',
    location: 'School Zone Ward 8',
    latitude: 13.0750,
    longitude: 80.2600,
    description: 'Dark corner at night creating safety concerns for children and parents.',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    reportedBy: 'parent@civinex.org',
    imageUrl: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'rep-104',
    title: 'Severe Underground Pipe Leakage',
    category: 'Water Leakage',
    severity: 'Critical',
    priorityScore: 95,
    status: 'Pending',
    location: 'Sector 4, Market Complex',
    latitude: 13.0900,
    longitude: 80.2850,
    description: 'Continuous clean water leak flooding market pathway and eroding asphalt.',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    reportedBy: 'shopowner@civinex.org',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=600&q=80'
  }
];

function getStoredLocalReports() {
  const saved = localStorage.getItem(LOCAL_REPORTS_KEY);
  if (!saved) {
    localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(defaultSeedReports));
    return defaultSeedReports;
  }
  try {
    return JSON.parse(saved);
  } catch (e) {
    return defaultSeedReports;
  }
}

function saveLocalReports(reports) {
  localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(reports));
}

// Fetch all reports from backend with local fallback
export async function fetchReports() {
  try {
    const res = await fetch(`${API_BASE_URL}/reports`);
    if (res.ok) {
      const data = await res.json();
      if (data.reports) {
        saveLocalReports(data.reports);
        return data.reports;
      }
    }
  } catch (err) {
    console.warn('Backend offline, using local storage fallback for reports:', err);
  }
  return getStoredLocalReports();
}

// Fetch single report by ID
export async function fetchReportById(id) {
  const reports = await fetchReports();
  return reports.find(r => r.id === id) || null;
}

// Submit a new civic problem report
export async function createReport(reportData) {
  try {
    const res = await fetch(`${API_BASE_URL}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.report) return data.report;
    }
  } catch (err) {
    console.warn('Backend offline, creating report in local storage:', err);
  }

  // Calculate local mock priority score
  let baseScore = 50;
  if (reportData.severity === 'Critical') baseScore += 35;
  else if (reportData.severity === 'High') baseScore += 25;
  else if (reportData.severity === 'Medium') baseScore += 10;
  if (reportData.category === 'Road Damage' || reportData.category === 'Water Leakage') baseScore += 10;

  const newReport = {
    id: `rep-${Date.now()}`,
    title: reportData.title || 'Untitled Civic Issue',
    category: reportData.category || 'General',
    severity: reportData.severity || 'Medium',
    priorityScore: Math.min(100, Math.max(15, baseScore)),
    status: 'Pending',
    location: reportData.location || 'Central City Ward',
    latitude: reportData.latitude || (13.08 + Math.random() * 0.02),
    longitude: reportData.longitude || (80.27 + Math.random() * 0.02),
    description: reportData.description || '',
    createdAt: new Date().toISOString(),
    reportedBy: reportData.reportedBy || 'Citizen',
    imageUrl: reportData.imageUrl || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80'
  };

  const reports = getStoredLocalReports();
  reports.unshift(newReport);
  saveLocalReports(reports);
  return newReport;
}

// Update report resolution status (Pending -> In Progress -> Resolved)
export async function updateReportStatus(id, status) {
  try {
    const res = await fetch(`${API_BASE_URL}/reports/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.report) return data.report;
    }
  } catch (err) {
    console.warn('Backend offline, updating report status in local storage:', err);
  }

  const reports = getStoredLocalReports();
  const report = reports.find(r => r.id === id);
  if (report) {
    report.status = status;
    saveLocalReports(reports);
  }
  return report;
}

// Analyze AI Priority
export async function analyzePriority(category, severity, description) {
  try {
    const res = await fetch(`${API_BASE_URL}/ai/analyze-priority`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, severity, description })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend AI service offline, calculating locally:', err);
  }

  let baseScore = 50;
  if (severity === 'Critical') baseScore += 35;
  else if (severity === 'High') baseScore += 25;
  else if (severity === 'Medium') baseScore += 10;
  if (category === 'Road Damage' || category === 'Water Leakage') baseScore += 10;

  const score = Math.min(100, Math.max(15, baseScore));
  return {
    success: true,
    priorityScore: score,
    recommendation: score >= 75 ? 'Immediate Authority Dispatch Required' : 'Standard Scheduled Maintenance'
  };
}

// Fetch analytics statistics
export async function fetchAnalyticsStats() {
  const reports = await fetchReports();
  const total = reports.length;
  const pending = reports.filter(r => r.status === 'Pending' || r.status === 'Under Review').length;
  const inProgress = reports.filter(r => r.status === 'In Progress').length;
  const resolved = reports.filter(r => r.status === 'Resolved').length;

  return {
    totalReports: total,
    pendingCount: pending,
    inProgressCount: inProgress,
    resolvedCount: resolved,
    resolutionRate: total > 0 ? `${Math.round((resolved / total) * 100)}%` : '0%',
    categoryDistribution: [
      { name: 'Road Damage', count: reports.filter(r => r.category === 'Road Damage').length },
      { name: 'Garbage', count: reports.filter(r => r.category === 'Garbage').length },
      { name: 'Water Leakage', count: reports.filter(r => r.category === 'Water Leakage').length },
      { name: 'Electricity', count: reports.filter(r => r.category === 'Electricity').length },
    ]
  };
}
