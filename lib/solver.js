'use strict';

const fs = require('fs');
const { CHAR_MAP, I_L_PATTERN } = require('./models');
const { parseSvg } = require('./parser');

/**
 * Calculate similarity between two strings (0.0 to 1.0) using Levenshtein distance.
 */
function stringSimilarity(s1, s2) {
  if (s1 === s2) return 1.0;
  const len1 = s1.length;
  const len2 = s2.length;
  if (len1 === 0 || len2 === 0) return 0.0;

  const d = [];
  for (let i = 0; i <= len1; i++) {
    d[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    d[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost
      );
    }
  }

  const maxLen = Math.max(len1, len2);
  return 1 - d[len1][len2] / maxLen;
}

class SvgCaptchaSolver {
  /**
   * @param {Object.<string, string>} [customModel] - optional additional pattern map
   */
  constructor(customModel = null) {
    this.model = Object.assign({}, CHAR_MAP, customModel || {});
  }

  /**
   * Match a single path element to a character.
   * @param {object} element
   * @returns {{ char: string, confidence: number, exactMatch: boolean }}
   */
  matchPattern(element) {
    const pat = element.pattern;

    if (pat in this.model) {
      if (pat === I_L_PATTERN) {
        // Disambiguate I vs l by aspect ratio
        const ratio = element.width / Math.max(element.height, 1e-6);
        const char = ratio > 0.2255 ? 'I' : 'l';
        return { char, confidence: 1.0, exactMatch: true };
      }
      return { char: this.model[pat], confidence: 1.0, exactMatch: true };
    }

    // Fuzzy match fallback
    let bestMatch = '?';
    let bestRatio = 0.0;
    for (const [knownPat, char] of Object.entries(this.model)) {
      const sim = stringSimilarity(pat, knownPat);
      if (sim > bestRatio) {
        bestRatio = sim;
        bestMatch = char;
      }
    }

    if (bestRatio >= 0.85) {
      return { char: bestMatch, confidence: Math.round(bestRatio * 1000) / 1000, exactMatch: false };
    }

    return { char: '?', confidence: 0.0, exactMatch: false };
  }

  /**
   * Analyze an SVG string and return detailed character information.
   * @param {string} svgContent
   * @returns {{ text: string, characters: Array<object> }}
   */
  analyze(svgContent) {
    const pathElements = parseSvg(svgContent);
    const characters = [];

    for (const p of pathElements) {
      const { char, confidence, exactMatch } = this.matchPattern(p);
      characters.push({
        char,
        confidence,
        exactMatch,
        bbox: {
          minX: p.minX,
          maxX: p.maxX,
          minY: p.minY,
          maxY: p.maxY,
          width: p.width,
          height: p.height
        },
        pattern: p.pattern
      });
    }

    const text = characters.map(c => c.char).join('');
    return { text, characters };
  }

  /**
   * Solve an SVG string directly to its text.
   * @param {string} svgContent
   * @returns {string}
   */
  solve(svgContent) {
    return this.analyze(svgContent).text;
  }

  /**
   * Read and solve an SVG file from disk.
   * @param {string} filePath
   * @returns {string}
   */
  solveFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    return this.solve(content);
  }
}

const defaultSolver = new SvgCaptchaSolver();

function solve(svgContent) {
  return defaultSolver.solve(svgContent);
}

function solveFile(filePath) {
  return defaultSolver.solveFile(filePath);
}

function analyze(svgContent) {
  return defaultSolver.analyze(svgContent);
}

module.exports = {
  SvgCaptchaSolver,
  solve,
  solveFile,
  analyze
};
