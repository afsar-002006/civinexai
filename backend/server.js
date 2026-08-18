const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Category image dictionary for accurate before/after images
const CATEGORY_IMAGES = {
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

// In-memory data store for local development backend
let reports = [
  {
    id: 'rep-101',
    title: 'Major Pothole on Main Street',
    category: 'Road Damage',
    severity: 'High',
    priorityScore: 88,
    status: 'Pending',
    verificationStatus: 'Requires Review',
    location: '123 Main St, Central Ward',
    description: 'Large hazard hole in the left lane causing traffic slowdowns and wheel damage.',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    reportedBy: 'demo-citizen@civinex.org',
    beforeImageUrl: CATEGORY_IMAGES['Road Damage'].before,
    imageUrl: CATEGORY_IMAGES['Road Damage'].before,
    afterImageUrl: CATEGORY_IMAGES['Road Damage'].after,
    completionDate: new Date(Date.now() - 3600000 * 1).toISOString(),
    resolutionRemarks: 'Road repair asphalt crew dispatched. Pothole filled and sealed.'
  },
  {
    id: 'rep-102',
    title: 'Overflowing Garbage Bin',
    category: 'Garbage',
    severity: 'Medium',
    priorityScore: 65,
    status: 'In Progress',
    verificationStatus: 'Pending Verification',
    location: 'Park Avenue & 4th St',
    description: 'Waste bin uncleaned for 3 days attracting pests.',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    reportedBy: 'resident@civinex.org',
    beforeImageUrl: CATEGORY_IMAGES['Garbage'].before,
    imageUrl: CATEGORY_IMAGES['Garbage'].before,
    afterImageUrl: CATEGORY_IMAGES['Garbage'].after,
    completionDate: new Date(Date.now() - 3600000 * 2).toISOString(),
    resolutionRemarks: 'Sanitation squad dispatched. Dumpster emptied and surrounding sidewalk sanitized.'
  },
  {
    id: 'rep-103',
    title: 'Broken Streetlight Near School',
    category: 'Electricity',
    severity: 'Medium',
    priorityScore: 54,
    status: 'Resolved',
    verificationStatus: 'Verified Resolved',
    location: 'School Zone Ward 8',
    description: 'Dark corner at night creating safety concerns for students.',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    reportedBy: 'parent@civinex.org',
    beforeImageUrl: CATEGORY_IMAGES['Electricity'].before,
    imageUrl: CATEGORY_IMAGES['Electricity'].before,
    afterImageUrl: CATEGORY_IMAGES['Electricity'].after,
    completionDate: new Date(Date.now() - 3600000 * 12).toISOString(),
    resolutionRemarks: 'Replaced faulty LED transformer fixture and tested wiring system. Light fully operational.'
  }
];

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CiviNex Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// AI Priority Calculation Engine
app.post('/api/ai/analyze-priority', (req, res) => {
  const { category, severity, description = '' } = req.body;

  let baseScore = 50;
  if (severity === 'Critical') baseScore += 35;
  else if (severity === 'High') baseScore += 25;
  else if (severity === 'Medium') baseScore += 10;
  else if (severity === 'Low') baseScore -= 10;

  if (category === 'Road Damage' || category === 'Water Leakage') baseScore += 10;
  if (description.toLowerCase().includes('danger') || description.toLowerCase().includes('hazard')) baseScore += 5;

  const priorityScore = Math.min(100, Math.max(10, baseScore));
  
  res.json({
    success: true,
    priorityScore,
    category,
    severity,
    recommendation: priorityScore >= 75 ? 'Immediate Authority Dispatch Required' : 'Standard Routine Maintenance'
  });
});

// Get all reports
app.get('/api/reports', (req, res) => {
  res.json({ success: true, count: reports.length, reports });
});

// Create new report
app.post('/api/reports', (req, res) => {
  const { title, category, severity, location, description, reportedBy, imageUrl } = req.body;
  
  let baseScore = 50;
  if (severity === 'Critical') baseScore += 35;
  else if (severity === 'High') baseScore += 25;
  else if (severity === 'Medium') baseScore += 10;

  const catImages = CATEGORY_IMAGES[category] || CATEGORY_IMAGES['Road Damage'];
  const img = imageUrl || catImages.before;

  const newReport = {
    id: `rep-${Date.now()}`,
    title: title || 'Untitled Civic Issue',
    category: category || 'General',
    severity: severity || 'Medium',
    priorityScore: Math.min(100, Math.max(10, baseScore)),
    status: 'Pending',
    verificationStatus: 'Pending Verification',
    location: location || 'Unspecified Location',
    description: description || '',
    createdAt: new Date().toISOString(),
    reportedBy: reportedBy || 'Anonymous',
    beforeImageUrl: img,
    imageUrl: img,
    afterImageUrl: '',
    completionDate: '',
    resolutionRemarks: ''
  };

  reports.unshift(newReport);
  res.status(201).json({ success: true, report: newReport });
});

// Update report status & after verification evidence
app.patch('/api/reports/:id', (req, res) => {
  const { id } = req.params;
  const { status, verificationStatus, afterImageUrl, completionDate, resolutionRemarks } = req.body;

  const report = reports.find(r => r.id === id);
  if (!report) {
    return res.status(404).json({ success: false, message: 'Report not found' });
  }

  if (status !== undefined) report.status = status;
  if (verificationStatus !== undefined) report.verificationStatus = verificationStatus;
  if (afterImageUrl !== undefined) report.afterImageUrl = afterImageUrl;
  if (completionDate !== undefined) report.completionDate = completionDate;
  if (resolutionRemarks !== undefined) report.resolutionRemarks = resolutionRemarks;

  res.json({ success: true, report });
});

// Get analytics stats
app.get('/api/analytics/stats', (req, res) => {
  const total = reports.length;
  const pending = reports.filter(r => r.status === 'Pending').length;
  const inProgress = reports.filter(r => r.status === 'In Progress').length;
  const resolved = reports.filter(r => r.status === 'Resolved').length;

  res.json({
    success: true,
    stats: {
      totalReports: total,
      pendingCount: pending,
      inProgressCount: inProgress,
      resolvedCount: resolved,
      resolutionRate: total > 0 ? `${Math.round((resolved / total) * 100)}%` : '0%'
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 CiviNex Backend Server running on http://localhost:${PORT}`);
});
