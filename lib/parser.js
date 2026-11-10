'use strict';

/**
 * Extract all numbers (x, y coordinates) from an SVG path 'd' string.
 * @param {string} d
 * @returns {{ xs: number[], ys: number[] }}
 */
function extractCoordinates(d) {
  const nums = d.match(/[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?/g);
  if (!nums) return { xs: [], ys: [] };

  const xs = [];
  const ys = [];
  for (let i = 0; i < nums.length; i += 2) {
    xs.push(parseFloat(nums[i]));
    if (i + 1 < nums.length) {
      ys.push(parseFloat(nums[i + 1]));
    }
  }
  return { xs, ys };
}

/**
 * Check if path represents a noise line rather than a character glyph.
 * @param {object} path
 * @param {number|null} svgWidth
 * @returns {boolean}
 */
function isNoisePath(path, svgWidth) {
  // Glyphs in font are closed paths ending with Z/z
  if (!/[Zz]/.test(path.d)) {
    return true;
  }

  // If explicitly fill="none", it is a stroke/noise line
  if (path.fill && (path.fill.toLowerCase() === 'none' || path.fill.toLowerCase() === 'transparent')) {
    return true;
  }

  // Stroke without fill
  if (path.stroke && !path.fill) {
    return true;
  }

  // Check for lines stretching across canvas
  if (svgWidth && path.width > svgWidth * 0.75 && path.height < 10) {
    return true;
  }

  return false;
}

/**
 * Parse an SVG string and extract sorted character path elements.
 * @param {string} svgContent
 * @returns {Array<object>}
 */
function parseSvg(svgContent) {
  const widthMatch = svgContent.match(/width\s*=\s*["']([0-9.]+)/i);
  const svgWidth = widthMatch ? parseFloat(widthMatch[1]) : null;

  const pathRegex = /<path\b([^>]*)\/?>/gi;
  let match;
  const rawPaths = [];

  while ((match = pathRegex.exec(svgContent)) !== null) {
    const attrs = match[1];
    const dMatch = attrs.match(/\bd\s*=\s*["']([^"']+)["']/i);
    if (!dMatch) continue;

    const d = dMatch[1];
    const fillMatch = attrs.match(/\bfill\s*=\s*["']([^"']+)["']/i);
    const strokeMatch = attrs.match(/\bstroke\s*=\s*["']([^"']+)["']/i);

    rawPaths.push({
      d,
      fill: fillMatch ? fillMatch[1].trim() : null,
      stroke: strokeMatch ? strokeMatch[1].trim() : null,
    });
  }

  const candidatePaths = [];

  for (const item of rawPaths) {
    const { xs, ys } = extractCoordinates(item.d);
    if (xs.length === 0 || ys.length === 0) continue;

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const width = maxX - minX;
    const height = maxY - minY;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const pattern = item.d.replace(/[^A-Za-z]/g, '');

    const element = {
      d: item.d,
      pattern,
      minX,
      maxX,
      minY,
      maxY,
      width,
      height,
      centerX,
      centerY,
      fill: item.fill,
      stroke: item.stroke,
      bbox: [minX, maxX, minY, maxY]
    };

    if (!isNoisePath(element, svgWidth)) {
      candidatePaths.push(element);
    }
  }

  // Sort from left to right by minX
  candidatePaths.sort((a, b) => a.minX - b.minX);

  return candidatePaths;
}

module.exports = {
  extractCoordinates,
  isNoisePath,
  parseSvg
};
