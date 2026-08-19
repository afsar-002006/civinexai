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
    afterImageUrl: '',
    completionDate: '',
    resolutionRemarks: ''
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
    afterImageUrl: '',
    completionDate: '',
    resolutionRemarks: ''
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

// Purge/Delete long-time resolved reports
app.delete('/api/reports/resolved/purge', (req, res) => {
  const initialCount = reports.length;
  reports = reports.filter(r => r.status !== 'Resolved' && r.verificationStatus !== 'Verified Resolved');
  const deletedCount = initialCount - reports.length;
  res.json({ success: true, deletedCount, remainingCount: reports.length });
});

// Delete single report by ID
app.delete('/api/reports/:id', (req, res) => {
  const { id } = req.params;
  const initialCount = reports.length;
  reports = reports.filter(r => r.id !== id);
  if (reports.length === initialCount) {
    return res.status(404).json({ success: false, message: 'Report not found' });
  }
  res.json({ success: true, message: `Report ${id} deleted successfully` });
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
