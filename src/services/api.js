import { collection, addDoc, getDocs, doc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

// Fetch all reports from Firestore
export async function fetchReports() {
  try {
    const querySnapshot = await getDocs(collection(db, 'issues'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error('Error fetching reports from Firestore:', err);
    return [];
  }
}

// Fetch single report by ID
export async function fetchReportById(id) {
  const reports = await fetchReports();
  return reports.find(r => r.id === id) || null;
}

// Subscribe to real-time reports updates
export function subscribeToReports(callback) {
  const q = collection(db, 'issues');
  return onSnapshot(q, (snapshot) => {
    const reports = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(reports);
  });
}

// Submit a new civic problem report
export async function createReport(reportData) {
  // Calculate local mock priority score if not provided
  let baseScore = 50;
  if (reportData.severity === 'Critical') baseScore += 35;
  else if (reportData.severity === 'High') baseScore += 25;
  else if (reportData.severity === 'Medium') baseScore += 10;
  if (reportData.category === 'Road Damage' || reportData.category === 'Water Leakage') baseScore += 10;

  const priorityScore = reportData.priorityScore || Math.min(100, Math.max(15, baseScore));

  const newReport = {
    title: reportData.title || 'Untitled Civic Issue',
    category: reportData.category || 'General',
    severity: reportData.severity || 'Medium',
    priorityScore: priorityScore,
    status: 'Pending',
    address: reportData.location || reportData.address || 'Central City Ward',
    location: reportData.location || reportData.address || 'Central City Ward',
    latitude: reportData.latitude || (13.08 + Math.random() * 0.02),
    longitude: reportData.longitude || (80.27 + Math.random() * 0.02),
    description: reportData.description || '',
    createdAt: new Date().toISOString(),
    reportedBy: reportData.reportedBy || 'Citizen',
    image: reportData.imageUrl || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80',
    imageUrl: reportData.imageUrl || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80'
  };

  try {
    const docRef = await addDoc(collection(db, 'issues'), newReport);
    return { id: docRef.id, ...newReport };
  } catch (err) {
    console.error('Error creating report in Firestore:', err);
    throw err;
  }
}

// Update report resolution status
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

// Analyze AI Priority
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
