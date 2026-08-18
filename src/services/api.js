import { collection, addDoc, getDocs, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

const API_BASE_URL = 'http://localhost:5000/api';
const LOCAL_REPORTS_KEY = 'civinex_local_reports';

const CATEGORY_DEFAULT_IMAGES = {
  'Road Damage': {
    before: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    after: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80'
  },
  'Garbage': {
    before: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80',
    after: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80'
  },
  'Electricity': {
    before: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80',
    after: 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&w=800&q=80'
  },
  'Streetlight': {
    before: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80',
    after: 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&w=800&q=80'
  },
  'Water Leakage': {
    before: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=800&q=80',
    after: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=800&q=80'
  },
  'Flooding': {
    before: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80',
    after: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80'
  }
};

const defaultSeedReports = [
  {
    id: 'rep-101',
    title: 'Major Pothole on Main Street',
    category: 'Road Damage',
    severity: 'High',
    priorityScore: 88,
    status: 'Pending',
    verificationStatus: 'Requires Review',
    address: '123 Main St, Central Ward',
    location: '123 Main St, Central Ward',
    latitude: 13.0827,
    longitude: 80.2707,
    description: 'Large hazard hole in the left lane causing traffic slowdowns and wheel damage.',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    reportedBy: 'citizen@civinex.org',
    beforeImageUrl: CATEGORY_DEFAULT_IMAGES['Road Damage'].before,
    imageUrl: CATEGORY_DEFAULT_IMAGES['Road Damage'].before,
    afterImageUrl: CATEGORY_DEFAULT_IMAGES['Road Damage'].after,
    completionDate: new Date(Date.now() - 3600000 * 1).toISOString(),
    resolutionRemarks: 'Asphalt paving crew dispatched. Pothole completely filled and leveled.'
  },
  {
    id: 'rep-102',
    title: 'Overflowing Garbage Bin',
    category: 'Garbage',
    severity: 'Medium',
    priorityScore: 65,
    status: 'In Progress',
    verificationStatus: 'Pending Verification',
    address: 'Park Avenue & 4th St',
    location: 'Park Avenue & 4th St',
    latitude: 13.0878,
    longitude: 80.2785,
    description: 'Waste bin uncleaned for 3 days attracting pests near residential area.',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    reportedBy: 'resident@civinex.org',
    beforeImageUrl: CATEGORY_DEFAULT_IMAGES['Garbage'].before,
    imageUrl: CATEGORY_DEFAULT_IMAGES['Garbage'].before,
    afterImageUrl: CATEGORY_DEFAULT_IMAGES['Garbage'].after,
    completionDate: new Date(Date.now() - 3600000 * 2).toISOString(),
    resolutionRemarks: 'Sanitation squad dispatched. Dumpster emptied and surrounding sidewalk disinfected.'
  },
  {
    id: 'rep-103',
    title: 'Broken Streetlight Near School Zone',
    category: 'Electricity',
    severity: 'Medium',
    priorityScore: 54,
    status: 'Resolved',
    verificationStatus: 'Verified Resolved',
    address: 'School Zone Ward 8',
    location: 'School Zone Ward 8',
    latitude: 13.0750,
    longitude: 80.2600,
    description: 'Dark corner at night creating safety concerns for children and parents.',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    reportedBy: 'parent@civinex.org',
    beforeImageUrl: CATEGORY_DEFAULT_IMAGES['Electricity'].before,
    imageUrl: CATEGORY_DEFAULT_IMAGES['Electricity'].before,
    afterImageUrl: CATEGORY_DEFAULT_IMAGES['Electricity'].after,
    completionDate: new Date(Date.now() - 3600000 * 12).toISOString(),
    resolutionRemarks: 'Replaced faulty LED transformer fixture and tested wiring system. Light fully operational.'
  },
  {
    id: 'rep-104',
    title: 'Severe Underground Pipe Leakage',
    category: 'Water Leakage',
    severity: 'Critical',
    priorityScore: 95,
    status: 'Pending',
    verificationStatus: 'Pending Verification',
    address: 'Sector 4, Market Complex',
    location: 'Sector 4, Market Complex',
    latitude: 13.0900,
    longitude: 80.2850,
    description: 'Continuous clean water leak flooding market pathway and eroding asphalt.',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    reportedBy: 'shopowner@civinex.org',
    beforeImageUrl: CATEGORY_DEFAULT_IMAGES['Water Leakage'].before,
    imageUrl: CATEGORY_DEFAULT_IMAGES['Water Leakage'].before,
    afterImageUrl: CATEGORY_DEFAULT_IMAGES['Water Leakage'].after,
    completionDate: new Date(Date.now() - 3600000 * 1).toISOString(),
    resolutionRemarks: 'Hydro squad replaced ruptured pipe section and tested water pressure.'
  }
];

// Helper function to timeout hanging Firestore network requests
function withTimeout(promise, ms = 300) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Firestore operation timeout')), ms);
    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// Helper function to timeout hanging fetch requests
async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 300, ...fetchOptions } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(resource, {
      ...fetchOptions,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

function getStoredLocalReports() {
  const saved = localStorage.getItem(LOCAL_REPORTS_KEY);
  if (!saved) {
    localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(defaultSeedReports));
    return defaultSeedReports;
  }
  try {
    const parsed = JSON.parse(saved);
    // Ensure rep-103 and other seed reports have updated problem-specific photos,
    // while user created reports remain clean until officer uploads evidence.
    const updated = parsed.map(item => {
      const seedMatch = defaultSeedReports.find(s => s.id === item.id);
      if (seedMatch) {
        return {
          ...seedMatch,
          ...item,
          beforeImageUrl: seedMatch.beforeImageUrl,
          afterImageUrl: item.afterImageUrl || seedMatch.afterImageUrl,
          imageUrl: seedMatch.imageUrl
        };
      }
      // If it's a user-created report with a stock photo, clear afterImageUrl so officer uploads real evidence
      if (item.id && item.id.startsWith('rep-') && !['rep-101', 'rep-102', 'rep-103', 'rep-104'].includes(item.id)) {
        if (item.afterImageUrl && (item.afterImageUrl.includes('unsplash') || item.afterImageUrl.includes('photo-'))) {
          return { ...item, afterImageUrl: '' };
        }
      }
      return item;
    });
    localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return defaultSeedReports;
  }
}

function saveLocalReports(reports) {
  localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(reports));
}

// Fetch all reports (Firestore first, with backend/local fallback)
export async function fetchReports() {
  try {
    const querySnapshot = await withTimeout(getDocs(collection(db, 'issues')), 300);
    const firestoreReports = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (firestoreReports && firestoreReports.length > 0) {
      return firestoreReports;
    }
  } catch (err) {
    // Quiet fallback
  }

  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/reports`, { timeout: 300 });
    if (res.ok) {
      const data = await res.json();
      if (data.reports && data.reports.length > 0) {
        saveLocalReports(data.reports);
        return data.reports;
      }
    }
  } catch (err) {
    // Quiet fallback
  }
  return getStoredLocalReports();
}

// Subscribe to real-time reports updates (Firestore with local fallback)
export function subscribeToReports(callback) {
  try {
    const q = collection(db, 'issues');
    return onSnapshot(q, (snapshot) => {
      const reports = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      if (reports && reports.length > 0) {
        callback(reports);
      } else {
        fetchReports().then(callback);
      }
    }, (err) => {
      fetchReports().then(callback);
    });
  } catch (err) {
    fetchReports().then(callback);
    return () => {};
  }
}

// Fetch single report by ID
export async function fetchReportById(id) {
  const reports = await fetchReports();
  return reports.find(r => r.id === id) || null;
}

// Submit a new civic problem report
export async function createReport(reportData) {
  let baseScore = 50;
  if (reportData.severity === 'Critical') baseScore += 35;
  else if (reportData.severity === 'High') baseScore += 25;
  else if (reportData.severity === 'Medium') baseScore += 10;
  if (reportData.category === 'Road Damage' || reportData.category === 'Water Leakage') baseScore += 10;

  const priorityScore = reportData.priorityScore || Math.min(100, Math.max(15, baseScore));
  const categoryImages = CATEGORY_DEFAULT_IMAGES[reportData.category] || CATEGORY_DEFAULT_IMAGES['Road Damage'];
  const beforeImg = reportData.imageUrl || categoryImages.before;

  const newReport = {
    id: `rep-${Date.now()}`,
    title: reportData.title || 'Untitled Civic Issue',
    category: reportData.category || 'General',
    severity: reportData.severity || 'Medium',
    priorityScore: priorityScore,
    status: 'Pending',
    verificationStatus: 'Pending Verification',
    address: reportData.location || reportData.address || 'Central City Ward',
    location: reportData.location || reportData.address || 'Central City Ward',
    latitude: reportData.latitude || (13.08 + Math.random() * 0.02),
    longitude: reportData.longitude || (80.27 + Math.random() * 0.02),
    description: reportData.description || '',
    createdAt: new Date().toISOString(),
    reportedBy: reportData.reportedBy || 'Citizen',
    beforeImageUrl: beforeImg,
    image: beforeImg,
    imageUrl: beforeImg,
    afterImageUrl: '',
    completionDate: '',
    resolutionRemarks: ''
  };

  // Try Firestore with strict 300ms timeout
  try {
    await withTimeout(addDoc(collection(db, 'issues'), newReport), 300);
  } catch (err) {
    // Firestore timed out or unconfigured, proceed to backend / local store
  }

  // Try Backend API with strict 300ms timeout
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newReport),
      timeout: 300
    });
    if (res.ok) {
      const data = await res.json();
      if (data.report) {
        const reports = getStoredLocalReports();
        reports.unshift(data.report);
        saveLocalReports(reports);
        return data.report;
      }
    }
  } catch (err) {
    // Fallback to local storage
  }

  const reports = getStoredLocalReports();
  reports.unshift(newReport);
  saveLocalReports(reports);
  return newReport;
}

// Update report resolution status
export async function updateReportStatus(id, status) {
  return updateReportEvidence(id, { status });
}

// Update After Evidence & Verification Status
export async function updateReportEvidence(id, evidenceData) {
  try {
    const reportRef = doc(db, 'issues', id);
    await withTimeout(updateDoc(reportRef, evidenceData), 300);
  } catch (err) {
    // Firestore timeout fallback
  }

  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/reports/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(evidenceData),
      timeout: 300
    });
    if (res.ok) {
      const data = await res.json();
      if (data.report) {
        const reports = getStoredLocalReports();
        const idx = reports.findIndex(r => r.id === id);
        if (idx !== -1) {
          reports[idx] = { ...reports[idx], ...evidenceData };
          saveLocalReports(reports);
        }
        return data.report;
      }
    }
  } catch (err) {
    // Local fallback
  }

  const reports = getStoredLocalReports();
  const idx = reports.findIndex(r => r.id === id);
  if (idx !== -1) {
    reports[idx] = { ...reports[idx], ...evidenceData };
    saveLocalReports(reports);
    return reports[idx];
  }
  return { id, ...evidenceData };
}

// Update Verification Status
export async function updateVerificationStatus(id, verificationStatus, remarks) {
  const updatePayload = { verificationStatus };
  if (remarks) updatePayload.resolutionRemarks = remarks;
  return updateReportEvidence(id, updatePayload);
}

// Analyze AI Priority
export async function analyzePriority(category, severity, description) {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/ai/analyze-priority`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, severity, description }),
      timeout: 300
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Immediate calculation fallback
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

  const verifiedResolved = reports.filter(r => r.verificationStatus === 'Verified Resolved').length;
  const pendingVerification = reports.filter(r => r.verificationStatus === 'Pending Verification' || (!r.verificationStatus && r.status === 'In Progress')).length;
  const requiresReview = reports.filter(r => r.verificationStatus === 'Requires Review').length;

  return {
    totalReports: total,
    pendingCount: pending,
    inProgressCount: inProgress,
    resolvedCount: resolved,
    resolutionRate: total > 0 ? `${Math.round((resolved / total) * 100)}%` : '0%',
    verifiedResolvedCount: verifiedResolved,
    pendingVerificationCount: pendingVerification,
    requiresReviewCount: requiresReview,
    verificationRate: total > 0 ? `${Math.round((verifiedResolved / total) * 100)}%` : '0%',
    categoryDistribution: [
      { name: 'Road Damage', count: reports.filter(r => r.category === 'Road Damage').length },
      { name: 'Garbage', count: reports.filter(r => r.category === 'Garbage').length },
      { name: 'Water Leakage', count: reports.filter(r => r.category === 'Water Leakage').length },
      { name: 'Electricity', count: reports.filter(r => r.category === 'Electricity').length },
    ]
  };
}
