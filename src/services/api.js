import { collection, addDoc, getDocs, doc, updateDoc, onSnapshot, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { analyzePhotoWithAI } from './imageAnalysis';

const API_BASE_URL = 'http://localhost:5000/api';
const LOCAL_REPORTS_KEY = 'civinex_local_reports';

export function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.length < 10) return false;
  return (
    trimmed.startsWith('data:image') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:')
  );
}

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
    before: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80',
    after: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80'
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
    after: 'https://images.unsplash.com/photo-1498084393753-b411b2d26b34?auto=format&fit=crop&w=800&q=80'
  },
  'Traffic': {
    before: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=800&q=80',
    after: 'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?auto=format&fit=crop&w=800&q=80'
  },
  'Other': {
    before: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80',
    after: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80'
  }
};

const defaultSeedReports = [
  {
    id: 'rep-101',
    title: 'Major Pothole on Main Street',
    category: 'Road Damage',
    severity: 'High',
    userPriority: 'High',
    priorityScore: 88,
    aiPriorityScore: 88,
    aiSeverity: 'Critical',
    aiReason: 'Large visible road damage detected — poses significant safety risk to public traffic.',
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
    afterImageUrl: '',
    completionDate: '',
    resolutionRemarks: ''
  },
  {
    id: 'rep-102',
    title: 'Overflowing Garbage Bin',
    category: 'Garbage',
    severity: 'Medium',
    userPriority: 'Medium',
    priorityScore: 65,
    aiPriorityScore: 65,
    aiSeverity: 'High',
    aiReason: 'Overflowing waste dump detected near residential sidewalk.',
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
    afterImageUrl: '',
    completionDate: '',
    resolutionRemarks: ''
  },
  {
    id: 'rep-103',
    title: 'Broken Streetlight Near School Zone',
    category: 'Electricity',
    severity: 'Medium',
    userPriority: 'Medium',
    priorityScore: 54,
    aiPriorityScore: 54,
    aiSeverity: 'Medium',
    aiReason: 'Broken electrical light fixture logged in school zone.',
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
    userPriority: 'Critical',
    priorityScore: 95,
    aiPriorityScore: 95,
    aiSeverity: 'Critical',
    aiReason: 'Continuous water pipeline leakage flooding market pathway.',
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
    afterImageUrl: '',
    completionDate: '',
    resolutionRemarks: ''
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
    const initialSeeds = [...defaultSeedReports].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(initialSeeds));
    return initialSeeds;
  }
  try {
    const parsed = JSON.parse(saved);
    const updated = parsed.map(item => {
      const seedMatch = defaultSeedReports.find(s => s.id === item.id);
      if (seedMatch) {
        return {
          ...seedMatch,
          ...item,
          userPriority: item.userPriority || item.severity || seedMatch.userPriority,
          aiPriorityScore: item.aiPriorityScore || item.priorityScore || seedMatch.aiPriorityScore,
          aiSeverity: item.aiSeverity || seedMatch.aiSeverity,
          aiReason: item.aiReason || seedMatch.aiReason,
          // Preserve user uploaded image if present; fallback to seed photo ONLY for seed items
          beforeImageUrl: item.beforeImageUrl || item.imageUrl || seedMatch.beforeImageUrl,
          afterImageUrl: item.afterImageUrl || seedMatch.afterImageUrl,
          imageUrl: item.imageUrl || item.beforeImageUrl || seedMatch.imageUrl
        };
      }
      if (item.id && item.id.startsWith('rep-') && !['rep-101', 'rep-102', 'rep-103', 'rep-104'].includes(item.id)) {
        if (item.afterImageUrl && (item.afterImageUrl.includes('unsplash') || item.afterImageUrl.includes('photo-'))) {
          return { ...item, afterImageUrl: '' };
        }
      }
      return {
        ...item,
        userPriority: item.userPriority || item.severity || 'Medium',
        aiPriorityScore: item.aiPriorityScore || item.priorityScore || 50
      };
    });

    // Always sort by createdAt descending (newest uploads first)
    const sorted = updated.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(sorted));
    return sorted;
  } catch (e) {
    return [...defaultSeedReports].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}

function saveLocalReports(reports) {
  const sorted = [...reports].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(sorted));
}

// Fetch all reports (Firestore first, with backend/local fallback)
export async function fetchReports() {
  let reportsList = [];

  try {
    const querySnapshot = await withTimeout(getDocs(collection(db, 'issues')), 300);
    const firestoreReports = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (firestoreReports && firestoreReports.length > 0) {
      reportsList = firestoreReports;
    }
  } catch (err) {
    // Quiet fallback
  }

  if (reportsList.length === 0) {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/reports`, { timeout: 300 });
      if (res.ok) {
        const data = await res.json();
        if (data.reports && data.reports.length > 0) {
          saveLocalReports(data.reports);
          reportsList = data.reports;
        }
      }
    } catch (err) {
      // Quiet fallback
    }
  }

  if (reportsList.length === 0) {
    reportsList = getStoredLocalReports();
  }

  // Always return reports sorted by newest createdAt timestamp first!
  return [...reportsList].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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

// ─── Fetch single report by ID ────────────────────────────────────────────────
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

  const userPriority = reportData.userPriority || reportData.severity || 'Medium';
  const priorityScore = reportData.priorityScore ?? Math.min(100, Math.max(15, baseScore));
  const aiPriorityScore = reportData.aiPriorityScore ?? priorityScore;
  const beforeImg = reportData.imageUrl && isValidImageUrl(reportData.imageUrl) ? reportData.imageUrl.trim() : (reportData.imageUrl || '');

  const newReport = {
    id: `rep-${Date.now()}`,
    title: reportData.title || 'Untitled Civic Issue',
    category: reportData.category || 'General',
    userPriority,
    severity: userPriority, // stored for backward compatibility
    priorityScore,
    aiPriorityScore,
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
    resolutionRemarks: '',

    // ── AI Photo Analysis Fields ──
    imageAuthenticity: reportData.imageAuthenticity ?? null,
    authenticityConfidence: reportData.authenticityConfidence ?? null,
    detectedCategory: reportData.detectedCategory ?? null,
    aiSeverity: reportData.aiSeverity ?? null,
    aiReason: reportData.aiReason ?? null,
    needsReview: reportData.needsReview ?? false,

    // ── Duplicate Detection Fields ──
    imageHash: reportData.imageHash ?? null,
    duplicateDetected: reportData.duplicateDetected ?? false,
    relatedIssueId: reportData.relatedIssueId ?? null,
    relatedReportCount: reportData.relatedReportCount ?? 0,
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

// ─── Update report status ─────────────────────────────────────────────────────
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

// ─── Update related report count (when a new duplicate is added) ──────────────
export async function updateRelatedReportCount(id, count) {
  try {
    const reportRef = doc(db, 'issues', id);
    await updateDoc(reportRef, { relatedReportCount: count });
  } catch (err) {
    console.error('Error updating relatedReportCount:', err);
  }
}

// ─── Update priority score ────────────────────────────────────────────────────
export async function updatePriorityScore(id, priorityScore) {
  try {
    const reportRef = doc(db, 'issues', id);
    await updateDoc(reportRef, { priorityScore });
  } catch (err) {
    console.error('Error updating priorityScore:', err);
  }
}

// ─── Live AI priority analysis (fallback, no image) ──────────────────────────
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

// ─── AI Photo Analysis (wrapper kept for backwards compatibility) ─────────────
export async function analyzePhoto(imageUrl) {
  const result = await analyzePhotoWithAI(imageUrl);
  // Map field name for legacy callers (imageAuthenticityConfidence)
  return {
    ...result,
    imageAuthenticityConfidence: result.authenticityConfidence,
  };
}

// ─── Analytics stats ──────────────────────────────────────────────────────────
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

// Delete single report by ID (Authority feature)
export async function deleteReport(id) {
  try {
    await fetchWithTimeout(`${API_BASE_URL}/reports/${id}`, {
      method: 'DELETE',
      timeout: 300
    });
  } catch (err) {
    // Quiet fallback
  }

  const reports = getStoredLocalReports();
  const filtered = reports.filter(r => r.id !== id);
  saveLocalReports(filtered);
  return { success: true, id };
}

// Purge / Batch delete long-time solved reports & images (Authority storage cleanup)
export async function deleteResolvedReports() {
  try {
    await fetchWithTimeout(`${API_BASE_URL}/reports/resolved/purge`, {
      method: 'DELETE',
      timeout: 300
    });
  } catch (err) {
    // Quiet fallback
  }

  const reports = getStoredLocalReports();
  const remaining = reports.filter(r => r.status !== 'Resolved' && r.verificationStatus !== 'Verified Resolved');
  const deletedCount = reports.length - remaining.length;
  saveLocalReports(remaining);
  return { success: true, deletedCount, remainingCount: remaining.length };
}

// Purge duplicate test reports from local storage so user can upload fresh problems
export async function purgeDuplicateAndTestReports() {
  const reports = getStoredLocalReports();
  const cleaned = reports.filter(r => {
    if (['rep-101', 'rep-102', 'rep-103', 'rep-104'].includes(r.id)) {
      return true;
    }
    if (r.beforeImageUrl && (r.beforeImageUrl.startsWith('data:image') || !r.beforeImageUrl.includes('unsplash'))) {
      return true;
    }
    return false;
  });

  saveLocalReports(cleaned);
  return { success: true, count: cleaned.length };
}
