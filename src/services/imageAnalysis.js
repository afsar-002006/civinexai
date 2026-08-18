/**
 * imageAnalysis.js
 * Handles AI photo analysis (authenticity, category, severity)
 * and lightweight image hashing for near-duplicate detection.
 */

// ─── Image Hashing ────────────────────────────────────────────────────────────
/**
 * Generates a perceptual hash of an image via a canvas downscale.
 * Works for same-origin or CORS-enabled images.
 * Falls back to a URL-based hash for external images where canvas is blocked.
 */
export async function computeImageHash(imageUrl) {
  if (!imageUrl) return null;

  // Try canvas-based hash (works if CORS headers allow it)
  try {
    const hash = await canvasHash(imageUrl);
    if (hash) return hash;
  } catch (_) {
    // CORS or load error – fall back to URL hash
  }

  // Fallback: hash the URL string (still catches exact-duplicate URLs)
  return simpleStringHash(imageUrl);
}

async function canvasHash(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const SIZE = 8; // 8×8 → 64-bit hash
        const canvas = document.createElement('canvas');
        canvas.width = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, SIZE, SIZE);
        const data = ctx.getImageData(0, 0, SIZE, SIZE).data;

        // Convert to grayscale array
        const grays = [];
        for (let i = 0; i < data.length; i += 4) {
          grays.push(Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]));
        }

        // Average hash
        const avg = grays.reduce((a, b) => a + b, 0) / grays.length;
        const bits = grays.map(g => (g >= avg ? '1' : '0')).join('');
        // Convert bits to hex
        let hex = '';
        for (let i = 0; i < bits.length; i += 4) {
          hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
        }
        resolve(hex);
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = reject;
    img.src = url;
  });
}

function simpleStringHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return 'url-' + Math.abs(h).toString(16);
}

/**
 * Hamming distance between two hex hashes.
 * Returns a value 0–64 (lower = more similar).
 */
export function hammingDistance(h1, h2) {
  if (!h1 || !h2) return 64; // treat missing as completely different
  // If either is a URL-hash, do exact comparison
  if (h1.startsWith('url-') || h2.startsWith('url-')) {
    return h1 === h2 ? 0 : 64;
  }
  // Pad to same length
  const len = Math.max(h1.length, h2.length);
  const a = h1.padStart(len, '0');
  const b = h2.padStart(len, '0');
  let dist = 0;
  for (let i = 0; i < len; i++) {
    const bitsA = parseInt(a[i], 16).toString(2).padStart(4, '0');
    const bitsB = parseInt(b[i], 16).toString(2).padStart(4, '0');
    for (let j = 0; j < 4; j++) {
      if (bitsA[j] !== bitsB[j]) dist++;
    }
  }
  return dist;
}

// ─── AI Photo Analysis ────────────────────────────────────────────────────────
/**
 * Analyses an image URL and returns AI-style authenticity + severity info.
 * This is a deterministic simulation; replace with a real Vision API call
 * (e.g. Google Vision, Gemini Pro Vision) when available.
 */
export async function analyzePhotoWithAI(imageUrl) {
  // Simulate network delay (real API call would go here)
  await new Promise(resolve => setTimeout(resolve, 1200));

  // Deterministic seed from URL so results are consistent per image
  let seed = 0;
  for (let i = 0; i < imageUrl.length; i++) {
    seed += imageUrl.charCodeAt(i) * (i + 1);
  }

  // ── Authenticity ──
  // Weight heavily toward "Likely Real" (most civic photos are genuine)
  let imageAuthenticity = 'Likely Real';
  let authenticityConfidence = 85 + (seed % 12); // 85–96

  if (seed % 9 === 0) {
    imageAuthenticity = 'Possibly AI-Generated';
    authenticityConfidence = 58 + (seed % 22); // 58–79
  } else if (seed % 11 === 0) {
    imageAuthenticity = 'Uncertain';
    authenticityConfidence = 42 + (seed % 18); // 42–59
  }

  // ── Category detection ──
  const CATEGORIES = ['Road Damage', 'Garbage', 'Water Leakage', 'Streetlight', 'Flooding', 'Traffic', 'Other'];
  const detectedCategory = CATEGORIES[seed % CATEGORIES.length];

  // ── Severity ──
  let aiSeverity = 'Medium';
  let priorityScore = 55;

  const sevSeed = seed % 7;
  if (sevSeed <= 1) {
    aiSeverity = 'Critical';
    priorityScore = 85 + (seed % 11);
  } else if (sevSeed <= 3) {
    aiSeverity = 'High';
    priorityScore = 68 + (seed % 17);
  } else if (sevSeed === 4) {
    aiSeverity = 'Low';
    priorityScore = 20 + (seed % 25);
  }

  // ── AI Reason ──
  const reasonMap = {
    Critical: `Large visible ${detectedCategory.toLowerCase()} detected — poses significant safety risk to the public.`,
    High: `Moderate to severe ${detectedCategory.toLowerCase()} confirmed; prompt municipal attention recommended.`,
    Medium: `Visible ${detectedCategory.toLowerCase()} detected; routine maintenance evaluation needed.`,
    Low: `Minor ${detectedCategory.toLowerCase()} observed; can be scheduled for regular maintenance cycle.`,
  };
  const aiReason = reasonMap[aiSeverity];

  return {
    success: true,
    imageAuthenticity,
    authenticityConfidence,
    detectedCategory,
    aiSeverity,
    aiReason,
    priorityScore: Math.min(100, Math.max(10, priorityScore)),
    needsReview: imageAuthenticity !== 'Likely Real',
  };
}
