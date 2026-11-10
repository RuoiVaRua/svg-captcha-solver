import { SvgCaptchaSolver, solve, solveFile, analyze } from './solver.js';
import { parseSvg, extractCoordinates, isNoisePath } from './parser.js';
import { CHAR_MAP, I_L_PATTERN } from './models.js';

export {
  SvgCaptchaSolver,
  solve,
  solveFile,
  analyze,
  parseSvg,
  extractCoordinates,
  isNoisePath,
  CHAR_MAP,
  I_L_PATTERN
};

const pkg = {
  version: '1.0.0',
  SvgCaptchaSolver,
  solve,
  solveFile,
  analyze,
  parseSvg,
  extractCoordinates,
  isNoisePath,
  CHAR_MAP,
  I_L_PATTERN
};

export default pkg;
