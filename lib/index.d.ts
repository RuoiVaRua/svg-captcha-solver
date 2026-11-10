export interface PathElement {
  d: string;
  pattern: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  fill?: string;
  stroke?: string;
  bbox: [number, number, number, number];
}

export interface CharBoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
}

export interface CharRecognition {
  char: string;
  confidence: number;
  exactMatch: boolean;
  bbox: CharBoundingBox;
  pattern: string;
}

export interface SolveResult {
  text: string;
  characters: CharRecognition[];
}

export class SvgCaptchaSolver {
  constructor(charMap?: Record<string, string>, minConfidence?: number);
  solve(svgContent: string): string;
  solveFile(filePath: string): string;
  analyze(svgContent: string): SolveResult;
  matchPattern(element: PathElement): { char: string; confidence: number; exactMatch: boolean };
}

export function solve(svgContent: string): string;
export function solveFile(filePath: string): string;
export function analyze(svgContent: string): SolveResult;
export function parseSvg(svgContent: string): PathElement[];
export function extractCoordinates(d: string): [number, number][];
export function isNoisePath(element: PathElement, svgWidth?: number): boolean;

export const CHAR_MAP: Record<string, string>;
export const I_L_PATTERN: string;

declare const _default: {
  version: string;
  SvgCaptchaSolver: typeof SvgCaptchaSolver;
  solve: typeof solve;
  solveFile: typeof solveFile;
  analyze: typeof analyze;
  parseSvg: typeof parseSvg;
  extractCoordinates: typeof extractCoordinates;
  isNoisePath: typeof isNoisePath;
  CHAR_MAP: typeof CHAR_MAP;
  I_L_PATTERN: typeof I_L_PATTERN;
};

export default _default;
