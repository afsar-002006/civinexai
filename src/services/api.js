import { collection, addDoc, getDocs, doc, updateDoc, onSnapshot, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { analyzePhotoWithAI } from './imageAnalysis';

// ─── Fetch all reports from Firestore ─────────────────────────────────────────
export async function fetchReports() {
  try {
    const querySnapshot = await getDocs(collection(db, 'issues'));
    return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('Error fetching reports from Firestore:', err);
    return [];
  }
}

// ─── Fetch single report by ID ────────────────────────────────────────────────
export async function fetchReportById(id) {
  const reports = await fetchReports();
  return reports.find(r => r.id === id) || null;
}

// ─── Subscribe to real-time reports ──────────────────────────────────────────
export function subscribeToReports(callback) {
  const q = collection(db, 'issues');
  return onSnapshot(q, (snapshot) => {
    const reports = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(reports);
  });
}

// ─── Submit a new civic problem report ───────────────────────────────────────
export async function createReport(reportData) {
  // Priority score: prefer explicitly passed value, fall back to calculation
  let baseScore = 50;
  if (reportData.severity === 'Critical') baseScore += 35;
  else if (reportData.severity === 'High') baseScore += 25;
  else if (reportData.severity === 'Medium') baseScore += 10;
  if (reportData.category === 'Road Damage' || reportData.category === 'Water Leakage') baseScore += 10;

  const priorityScore = reportData.priorityScore ?? Math.min(100, Math.max(15, baseScore));

  const newReport = {
    title: reportData.title || 'Untitled Civic Issue',
    category: reportData.category || 'General',
    severity: reportData.severity || 'Medium',
    priorityScore,
    status: 'Pending',
    address: reportData.location || reportData.address || 'Central City Ward',
    location: reportData.location || reportData.address || 'Central City Ward',
    latitude: reportData.latitude || (13.08 + Math.random() * 0.02),
    longitude: reportData.longitude || (80.27 + Math.random() * 0.02),
    description: reportData.description || '',
    createdAt: new Date().toISOString(),
    reportedBy: reportData.reportedBy || 'Citizen',
    image: reportData.imageUrl || '',
    imageUrl: reportData.imageUrl || '',

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

  try {
    const docRef = await addDoc(collection(db, 'issues'), newReport);
    return { id: docRef.id, ...newReport };
  } catch (err) {
    console.error('Error creating report in Firestore:', err);
    throw err;
  }
}

// ─── Update report status ─────────────────────────────────────────────────────
export async function updateReportStatus(id, status) {
  try {
    const reportRef = doc(db, 'issues', id);
    await updateDoc(reportRef, { status });
    return { id, status };
  } catch (err) {
    console.error('Error updating report status:', err);
    throw err;
  }
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
