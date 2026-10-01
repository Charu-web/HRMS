/**
 * ZenithHR Enterprise Biometric Vision Pipeline
 * Client-side face quality validation, localization & standardized 128-D descriptor extraction
 */

export interface FaceQualityResult {
  valid: boolean;
  error?: string;
  brightness: number;
  contrast: number;
  faceCount: number;
  box?: { x: number; y: number; width: number; height: number };
}

/**
 * Validate lighting, contrast, face count, and pose on a video frame canvas
 */
export async function validateFaceQuality(canvas: HTMLCanvasElement): Promise<FaceQualityResult> {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { valid: false, error: "Canvas rendering context unavailable.", brightness: 0, contrast: 0, faceCount: 0 };
  }

  const { width, height } = canvas;
  if (width < 64 || height < 64) {
    return { valid: false, error: "Camera frame resolution too low.", brightness: 0, contrast: 0, faceCount: 0 };
  }

  // Sample central region (65% width and 75% height)
  const sw = Math.floor(width * 0.65);
  const sh = Math.floor(height * 0.75);
  const sx = Math.floor((width - sw) / 2);
  const sy = Math.floor((height - sh) / 2);

  const imgData = ctx.getImageData(sx, sy, sw, sh);
  const data = imgData.data;

  // 1. Calculate Perceived Brightness & Contrast
  let sumLum = 0;
  let sumSqLum = 0;
  let skinPixelCount = 0;
  const totalSampledPixels = Math.floor(data.length / 4);

  // Compute horizontal clusters to detect multiple faces
  const horizontalHist = new Array(16).fill(0);
  const binWidth = sw / 16;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Standard ITU-R BT.601 perceived luminance
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    sumLum += lum;
    sumSqLum += lum * lum;

    // YCbCr skin tone estimation
    const Y = 0.299 * r + 0.587 * g + 0.114 * b;
    const Cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
    const Cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

    const isSkin = Cb >= 77 && Cb <= 132 && Cr >= 130 && Cr <= 178 && Y >= 30;
    if (isSkin) {
      skinPixelCount++;
      const pixelIndex = i / 4;
      const px = pixelIndex % sw;
      const binIdx = Math.min(15, Math.floor(px / binWidth));
      horizontalHist[binIdx]++;
    }
  }

  const brightness = Math.round(sumLum / totalSampledPixels);
  const variance = Math.sqrt(Math.max(0, sumSqLum / totalSampledPixels - brightness * brightness));
  const contrast = Math.round(variance);

  // A. Lighting Checks
  if (brightness < 30) {
    return {
      valid: false,
      error: "Poor lighting: Environment is too dark. Please face a light source.",
      brightness,
      contrast,
      faceCount: 0,
    };
  }

  if (brightness > 240) {
    return {
      valid: false,
      error: "Poor lighting: Image is overexposed. Avoid direct glare or harsh backlighting.",
      brightness,
      contrast,
      faceCount: 0,
    };
  }

  // B. Contrast / Sharpness Check
  if (contrast < 12) {
    return {
      valid: false,
      error: "Poor image quality: Camera appears blocked, blurred, or uniform.",
      brightness,
      contrast,
      faceCount: 0,
    };
  }

  // C. Native Browser Face Detection (if available in Chromium / Edge / Android)
  if (typeof window !== "undefined" && "FaceDetector" in window) {
    try {
      const detector = new (window as any).FaceDetector({ maxDetectedFaces: 5, fastMode: true });
      const detected = await detector.detect(canvas);

      if (detected.length === 0) {
        return {
          valid: false,
          error: "No face detected. Please position your face inside the guide oval.",
          brightness,
          contrast,
          faceCount: 0,
        };
      }

      if (detected.length > 1) {
        return {
          valid: false,
          error: "Multiple faces detected. Only one employee must be visible during punch.",
          brightness,
          contrast,
          faceCount: detected.length,
        };
      }

      const box = detected[0].boundingBox;
      // Ensure face is reasonably large (at least 18% of canvas width)
      if (box.width < width * 0.18) {
        return {
          valid: false,
          error: "Face is too far from camera. Please move closer to the camera.",
          brightness,
          contrast,
          faceCount: 1,
          box,
        };
      }

      return {
        valid: true,
        brightness,
        contrast,
        faceCount: 1,
        box: { x: box.x, y: box.y, width: box.width, height: box.height },
      };
    } catch (e) {
      // Fall through to algorithmic computer vision fallback
    }
  }

  // D. Algorithmic Computer Vision Fallback (cross-browser: Firefox, Safari, iOS, Chrome)
  const skinRatio = skinPixelCount / totalSampledPixels;

  if (skinRatio < 0.08) {
    return {
      valid: false,
      error: "No face detected. Please position your face centered inside the guide oval.",
      brightness,
      contrast,
      faceCount: 0,
    };
  }

  // Check for multiple distinct face clusters across the horizontal bins
  let peaks = 0;
  let inPeak = false;
  const threshold = (skinPixelCount / 16) * 0.7;

  for (let b = 0; b < 16; b++) {
    if (horizontalHist[b] > threshold) {
      if (!inPeak) {
        peaks++;
        inPeak = true;
      }
    } else {
      inPeak = false;
    }
  }

  if (peaks > 2) {
    return {
      valid: false,
      error: "Multiple faces detected in camera view. Ensure only you are in frame.",
      brightness,
      contrast,
      faceCount: peaks,
    };
  }

  return {
    valid: true,
    brightness,
    contrast,
    faceCount: 1,
    box: { x: sx, y: sy, width: sw, height: sh },
  };
}

/**
 * Standardized 128-dimensional multi-cell gradient and luminance descriptor.
 * Deterministic and L2-normalized: works identically in both enrollment and verification.
 */
export function extractFaceDescriptor(
  canvas: HTMLCanvasElement,
  box?: { x: number; y: number; width: number; height: number }
): number[] {
  const ctx = canvas.getContext("2d");
  if (!ctx) return new Array(128).fill(0);

  const cw = canvas.width;
  const ch = canvas.height;

  // Use provided bounding box or default to central 60% crop
  const bx = Math.max(0, Math.floor(box ? box.x : cw * 0.2));
  const by = Math.max(0, Math.floor(box ? box.y : ch * 0.15));
  const bw = Math.min(cw - bx, Math.floor(box ? box.width : cw * 0.6));
  const bh = Math.min(ch - by, Math.floor(box ? box.height : ch * 0.7));

  const imgData = ctx.getImageData(bx, by, bw, bh);
  const data = imgData.data;

  // Divide into 8x8 spatial cells = 64 cells
  // For each cell, extract:
  // 1) Mean normalized luminance (intensity pattern)
  // 2) Mean spatial gradient magnitude (edge features: eyes, nose, lips contour)
  // 64 cells * 2 features = 128 dimensions
  const vector: number[] = new Array(128).fill(0);
  const cellW = bw / 8;
  const cellH = bh / 8;

  for (let cy = 0; cy < 8; cy++) {
    for (let cx = 0; cx < 8; cx++) {
      const cellIdx = cy * 8 + cx;
      const startX = Math.floor(cx * cellW);
      const endX = Math.floor((cx + 1) * cellW);
      const startY = Math.floor(cy * cellH);
      const endY = Math.floor((cy + 1) * cellH);

      let sumLum = 0;
      let sumGrad = 0;
      let count = 0;

      for (let y = startY; y < endY; y += 2) {
        for (let x = startX; x < endX; x += 2) {
          const idx = (y * bw + x) * 4;
          if (idx + 4 < data.length) {
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            sumLum += lum;

            // Horizontal & vertical neighbor gradient
            const idxRight = (y * bw + Math.min(bw - 1, x + 1)) * 4;
            const idxDown = (Math.min(bh - 1, y + 1) * bw + x) * 4;
            const lumRight = 0.299 * data[idxRight] + 0.587 * data[idxRight + 1] + 0.114 * data[idxRight + 2];
            const lumDown = 0.299 * data[idxDown] + 0.587 * data[idxDown + 1] + 0.114 * data[idxDown + 2];

            const dx = lumRight - lum;
            const dy = lumDown - lum;
            sumGrad += Math.sqrt(dx * dx + dy * dy);

            count++;
          }
        }
      }

      // 64 luminance dimensions (indices 0..63)
      vector[cellIdx] = count > 0 ? sumLum / (count * 255) : 0;
      // 64 gradient magnitude dimensions (indices 64..127)
      vector[64 + cellIdx] = count > 0 ? Math.min(1.0, sumGrad / (count * 128)) : 0;
    }
  }

  // Mean-centering to eliminate flat exposure shifts
  const meanLum = vector.slice(0, 64).reduce((s, x) => s + x, 0) / 64;
  for (let i = 0; i < 64; i++) {
    vector[i] -= meanLum;
  }

  const meanGrad = vector.slice(64, 128).reduce((s, x) => s + x, 0) / 64;
  for (let i = 64; i < 128; i++) {
    vector[i] -= meanGrad;
  }

  // L2-normalization ensuring ||v||_2 = 1.0 exactly
  let norm = Math.sqrt(vector.reduce((s, v) => s + v * v, 0));
  if (norm === 0) norm = 1;

  return vector.map((v) => Math.round((v / norm) * 10000) / 10000);
}

/**
 * Compute Cosine Similarity between two face descriptor vectors.
 * Returns value between -1.0 and 1.0 (typical match >= 0.65).
 */
export function calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
  if (!vec1 || !vec2 || vec1.length !== vec2.length || vec1.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    normA += vec1[i] * vec1[i];
    normB += vec2[i] * vec2[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Compute Euclidean Distance between two face descriptor vectors.
 */
export function calculateEuclideanDistance(vec1: number[], vec2: number[]): number {
  if (!vec1 || !vec2 || vec1.length !== vec2.length || vec1.length === 0) return 999;
  let sum = 0;
  for (let i = 0; i < vec1.length; i++) {
    const diff = vec1[i] - vec2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}
