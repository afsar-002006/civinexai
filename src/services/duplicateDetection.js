/**
 * duplicateDetection.js
 * Checks new issues against existing Firestore issues for:
 *  1. Location proximity
 *  2. Same category
 *  3. Description similarity
 *  4. Image hash similarity
 *
 * Uses a weighted confidence score so we never auto-reject.
 */

import { hammingDistance } from './imageAnalysis';

// ─── Constants ────────────────────────────────────────────────────────────────
const NEARBY_DISTANCE_M = 500;   // metres — reports within this radius are candidates
const CLOSE_DISTANCE_M  = 200;   // metres — considered "very close"
const IMAGE_HASH_THRESHOLD = 8;  // hamming distance ≤ this → images are similar

// ─── Haversine distance ───────────────────────────────────────────────────────
export function haversineMeters(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some(v => v == null || v === '')) return Infinity;
  const R = 6371000;
  const toRad = d => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Simple description similarity (Jaccard on word tokens) ───────────────────
function descriptionSimilarity(a = '', b = '') {
  if (!a && !b) return 0;
  const tokensA = new Set(a.toLowerCase().split(/\W+/).filter(Boolean));
  const tokensB = new Set(b.toLowerCase().split(/\W+/).filter(Boolean));
  const intersection = [...tokensA].filter(t => tokensB.has(t)).length;
  const union = new Set([...tokensA, ...tokensB]).size;
  return union === 0 ? 0 : intersection / union;
}

// ─── Main function ────────────────────────────────────────────────────────────
/**
 * Checks existingReports against a new report draft.
 * @param {object} newReport  - { category, latitude, longitude, description, imageHash }
 * @param {array}  existingReports - full array from Firestore
 * @returns {object} { isDuplicate, confidence, label, relatedReports, nearestDistanceM }
 */
export function checkForDuplicates(newReport, existingReports) {
  const { category, latitude, longitude, description, imageHash } = newReport;

  const candidates = [];

  for (const existing of existingReports) {
    const distM = haversineMeters(
      parseFloat(latitude),
      parseFloat(longitude),
      parseFloat(existing.latitude),
      parseFloat(existing.longitude)
    );

    // Only consider reports within NEARBY_DISTANCE_M
    if (distM > NEARBY_DISTANCE_M) continue;

    // ── Scoring ──
    let score = 0;

    // 1. Location (max 35 pts)
    if (distM <= CLOSE_DISTANCE_M) score += 35;
    else score += 35 * (1 - (distM - CLOSE_DISTANCE_M) / (NEARBY_DISTANCE_M - CLOSE_DISTANCE_M));

    // 2. Category match (max 30 pts)
    if (existing.category === category) score += 30;
    else score += 0; // different category is a strong negative signal

    // 3. Description similarity (max 20 pts)
    const descSim = descriptionSimilarity(description, existing.description);
    score += descSim * 20;

    // 4. Image hash similarity (max 15 pts)
    if (imageHash && existing.imageHash) {
      const dist = hammingDistance(imageHash, existing.imageHash);
      if (dist <= IMAGE_HASH_THRESHOLD) {
        score += 15;
        existing._imageSimilar = true;
      }
    }

    candidates.push({ report: existing, score, distM });
  }

  if (candidates.length === 0) {
    return { isDuplicate: false, confidence: 0, label: null, relatedReports: [], nearestDistanceM: null };
  }

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);
  const top = candidates[0];

  // ── Label & confidence ──
  let label = null;
  let isDuplicate = false;
  let confidence = Math.round(top.score); // 0–100

  if (top.score >= 70) {
    isDuplicate = true;
    label = 'Similar existing report found nearby.';
  } else if (top.score >= 45) {
    isDuplicate = true;
    label = 'Possible Similar Report';
  }
  // < 45 → not flagged as duplicate, but we still return all nearby candidates for context

  return {
    isDuplicate,
    confidence,
    label,
    relatedReports: candidates.map(c => c.report),
    nearestDistanceM: Math.round(top.distM),
    topScore: top.score,
    hasImageMatch: candidates.some(c => c.report._imageSimilar),
  };
}

// ─── Issue Clustering ─────────────────────────────────────────────────────────
/**
 * Groups a flat array of reports into clusters.
 * Cluster = reports within NEARBY_DISTANCE_M of each other with the same category.
 * The cluster "representative" is the report with the highest priorityScore.
 */
export function clusterReports(reports) {
  const visited = new Set();
  const clusters = [];

  for (const report of reports) {
    if (visited.has(report.id)) continue;
    visited.add(report.id);

    const cluster = [report];

    for (const other of reports) {
      if (visited.has(other.id) || other.id === report.id) continue;
      if (other.category !== report.category) continue;
      const d = haversineMeters(
        parseFloat(report.latitude), parseFloat(report.longitude),
        parseFloat(other.latitude), parseFloat(other.longitude)
      );
      if (d <= NEARBY_DISTANCE_M) {
        cluster.push(other);
        visited.add(other.id);
      }
    }

    // Representative = highest priority score
    const rep = [...cluster].sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))[0];

    clusters.push({
      representative: rep,
      reports: cluster,
      count: cluster.length,
    });
  }

  return clusters;
}

// ─── Priority Score ───────────────────────────────────────────────────────────
/**
 * Calculates the final priority score for an issue.
 * Considers: AI severity, user severity, related report count, recency.
 */
export function calculatePriorityScore({ severity, aiSeverity, relatedReportCount = 0, createdAt, aiPriorityScore = null }) {
  // Base from severity
  const severityBase = {
    Critical: 80,
    High: 65,
    Medium: 45,
    Low: 25,
  };
  let base = severityBase[aiSeverity] || severityBase[severity] || 45;

  // If AI gave us a priority score, weight it in
  if (aiPriorityScore !== null) {
    base = Math.round(base * 0.4 + aiPriorityScore * 0.6);
  }

  // Duplicate/related report bonus (max +15 pts)
  const dupBonus = Math.min(15, relatedReportCount * 3);

  // Recency bonus (max +5 pts) — issues in the last 24h get full bonus
  let recencyBonus = 0;
  if (createdAt) {
    const ageHours = (Date.now() - new Date(createdAt).getTime()) / 3600000;
    recencyBonus = ageHours < 24 ? 5 : ageHours < 72 ? 2 : 0;
  }

  return Math.min(100, Math.max(10, Math.round(base + dupBonus + recencyBonus)));
}
