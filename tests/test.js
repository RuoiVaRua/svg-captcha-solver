'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { solve, solveFile, analyze, SvgCaptchaSolver } = require('../lib');

function runTests() {
  console.log('--- Running SVG Captcha Solver (Node.js) Test Suite ---');
  let passed = 0;
  let total = 0;

  // Test 1: sample.svg
  total++;
  const samplePath = path.join(__dirname, '..', 'sample.svg');
  if (fs.existsSync(samplePath)) {
    const sampleResult = solveFile(samplePath);
    assert.strictEqual(sampleResult, 'GFB4P5', `Expected 'GFB4P5' but got '${sampleResult}'`);
    console.log(`[PASS] Sample SVG test: ${sampleResult}`);
    passed++;
  } else {
    console.warn(`[WARN] sample.svg not found at ${samplePath}`);
  }

  // Test 1b: demo.svg (escaped quotes test)
  const demoPath = path.join(__dirname, '..', 'demo.svg');
  if (fs.existsSync(demoPath)) {
    total++;
    const demoResult = solveFile(demoPath);
    assert.strictEqual(demoResult, 'W7GAHQ', `Expected 'W7GAHQ' but got '${demoResult}'`);
    console.log(`[PASS] Demo SVG (escaped quotes) test: ${demoResult}`);
    passed++;
  }

  // Test 2: Generated test suite
  const manifestPath = path.join(__dirname, 'generated', 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    console.log(`\nTesting ${manifest.length} generated captchas...`);

    const startTime = Date.now();
    for (const item of manifest) {
      total++;
      const filePath = path.join(__dirname, 'generated', item.file);
      const content = fs.readFileSync(filePath, 'utf8');
      const predicted = solve(content);

      if (predicted === item.text) {
        passed++;
      } else {
        console.error(`[FAIL] ${item.file}: expected '${item.text}', got '${predicted}'`);
      }
    }
    const elapsed = Date.now() - startTime;
    console.log(`Generated captchas finished in ${elapsed}ms (${(elapsed / manifest.length).toFixed(2)}ms per captcha)`);
  }

  // Test 3: Analyze structure
  total++;
  const sampleContent = fs.readFileSync(samplePath, 'utf8');
  const analysis = analyze(sampleContent);
  assert.strictEqual(analysis.text, 'GFB4P5');
  assert.strictEqual(analysis.characters.length, 6);
  assert.strictEqual(analysis.characters[0].char, 'G');
  passed++;
  console.log(`[PASS] Detailed analysis structure verification.`);

  console.log(`\n========================================`);
  console.log(`Results: ${passed} / ${total} tests passed (${((passed / total) * 100).toFixed(1)}%)`);
  console.log(`========================================`);

  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
