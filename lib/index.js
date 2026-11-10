'use strict';

const { SvgCaptchaSolver, solve, solveFile, analyze } = require('./solver');
const { parseSvg, extractCoordinates, isNoisePath } = require('./parser');
const { CHAR_MAP, I_L_PATTERN } = require('./models');

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

module.exports = pkg;
module.exports.default = pkg;
