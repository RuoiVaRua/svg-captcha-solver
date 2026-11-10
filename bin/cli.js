#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { SvgCaptchaSolver } = require('../lib');

function printHelp() {
  console.log(`Usage: svg-captcha-solver [options] <file|dir>

Options:
  -d, --detail   Display detailed analysis for each character
  -j, --json     Output results in JSON format
  -h, --help     Show help information
  -v, --version  Show version number
`);
}

function main() {
  const args = process.argv.slice(2);
  let detail = false;
  let jsonOutput = false;
  let targetPath = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-h' || arg === '--help') {
      printHelp();
      process.exit(0);
    } else if (arg === '-v' || arg === '--version') {
      const pkg = require('../package.json');
      console.log(pkg.version);
      process.exit(0);
    } else if (arg === '-d' || arg === '--detail') {
      detail = true;
    } else if (arg === '-j' || arg === '--json') {
      jsonOutput = true;
    } else if (!targetPath) {
      targetPath = arg;
    }
  }

  if (!targetPath) {
    printHelp();
    process.exit(1);
  }

  const resolvedPath = path.resolve(process.cwd(), targetPath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`Error: Path '${targetPath}' does not exist.`);
    process.exit(1);
  }

  const stat = fs.statSync(resolvedPath);
  let files = [];

  if (stat.isFile()) {
    files.push(resolvedPath);
  } else if (stat.isDirectory()) {
    const dirEntries = fs.readdirSync(resolvedPath);
    files = dirEntries
      .filter(f => f.endsWith('.svg'))
      .sort()
      .map(f => path.join(resolvedPath, f));

    if (files.length === 0) {
      console.error(`No .svg files found in directory '${targetPath}'.`);
      process.exit(0);
    }
  } else {
    console.error(`Error: Invalid file/directory path '${targetPath}'.`);
    process.exit(1);
  }

  const solver = new SvgCaptchaSolver();
  const results = [];

  for (const filePath of files) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const analysis = solver.analyze(content);
      const resEntry = {
        file: filePath,
        text: analysis.text,
        characters: analysis.characters.map(c => ({
          char: c.char,
          confidence: c.confidence,
          bbox: {
            minX: Number(c.bbox.minX.toFixed(2)),
            maxX: Number(c.bbox.maxX.toFixed(2)),
            minY: Number(c.bbox.minY.toFixed(2)),
            maxY: Number(c.bbox.maxY.toFixed(2))
          },
          exactMatch: c.exactMatch
        }))
      };
      results.push(resEntry);

      if (!jsonOutput) {
        if (files.length > 1) {
          console.log(`[${path.basename(filePath)}] => ${analysis.text}`);
        } else {
          console.log(`Captcha Result: ${analysis.text}`);
        }

        if (detail) {
          console.log('--------------------------------------------------');
          analysis.characters.forEach((c, i) => {
            console.log(`  Character ${i + 1}: '${c.char}' (Confidence: ${(c.confidence * 100).toFixed(1)}%)`);
            console.log(`    Bounding Box: X=[${c.bbox.minX.toFixed(2)}, ${c.bbox.maxX.toFixed(2)}], Y=[${c.bbox.minY.toFixed(2)}, ${c.bbox.maxY.toFixed(2)}]`);
            console.log(`    Path Pattern: ${c.pattern.slice(0, 35)}... (length=${c.pattern.length})`);
          });
          console.log('--------------------------------------------------');
        }
      }
    } catch (err) {
      console.error(`Error processing ${filePath}: ${err.message}`);
    }
  }

  if (jsonOutput) {
    if (results.length === 1 && stat.isFile()) {
      console.log(JSON.stringify(results[0], null, 2));
    } else {
      console.log(JSON.stringify(results, null, 2));
    }
  }
}

main();
