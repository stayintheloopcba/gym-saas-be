#!/usr/bin/env node
/**
 * Coverage Ratchet Script
 *
 * Ensures code coverage never decreases from the baseline.
 * - Runs Jest with coverage
 * - Compares results with saved baseline
 * - Fails if any metric decreased
 * - Updates baseline if all metrics are equal or better
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASELINE_PATH = path.join(__dirname, '..', '.coverage-baseline.json');
const COVERAGE_SUMMARY_PATH = path.join(__dirname, '..', 'coverage', 'coverage-summary.json');

const METRICS = ['lines', 'statements', 'functions', 'branches'];

function toNumber(val) {
  if (typeof val === 'number') return val;
  if (val === 'Unknown' || val === undefined || val === null) return 0;
  return parseFloat(val) || 0;
}

function formatPct(val) {
  const num = toNumber(val);
  return num.toFixed(2);
}

function runJestCoverage() {
  console.log('Running Jest with coverage...\n');

  // Pass through any additional arguments (e.g., --runInBand)
  const extraArgs = process.argv.slice(2).join(' ');
  const command = extraArgs ? `npm run test:cov -- ${extraArgs}` : 'npm run test:cov';

  try {
    execSync(command, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    });
    return true;
  } catch {
    console.error('\nJest coverage run failed.');
    return false;
  }
}

function readCoverageSummary() {
  if (!fs.existsSync(COVERAGE_SUMMARY_PATH)) {
    console.error(`Coverage summary not found at: ${COVERAGE_SUMMARY_PATH}`);
    process.exit(1);
  }

  const summary = JSON.parse(fs.readFileSync(COVERAGE_SUMMARY_PATH, 'utf-8'));
  const total = summary.total;

  return {
    lines: total.lines.pct,
    statements: total.statements.pct,
    functions: total.functions.pct,
    branches: total.branches.pct,
  };
}

function readBaseline() {
  if (!fs.existsSync(BASELINE_PATH)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf-8'));
}

function saveBaseline(coverage) {
  const baseline = {
    ...coverage,
    timestamp: new Date().toISOString(),
  };
  fs.writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + '\n');
}

function formatDiff(oldVal, newVal) {
  const oldNum = toNumber(oldVal);
  const newNum = toNumber(newVal);
  const diff = newNum - oldNum;
  if (diff === 0) return '(=)';
  const sign = diff > 0 ? '+' : '';
  return `(${sign}${diff.toFixed(2)}%)`;
}

function compareCoverage(baseline, current) {
  const results = [];
  let hasRegression = false;
  const TOLERANCE = 0.05; // allow small fluctuations (0.05%) to avoid noise

  for (const metric of METRICS) {
    const oldVal = toNumber(baseline[metric]);
    const newVal = toNumber(current[metric]);
    const diff = newVal - oldVal;
    // Only treat as regression if drop is greater than tolerance
    const failed = diff < -TOLERANCE;

    if (failed) hasRegression = true;

    results.push({
      metric,
      oldVal,
      newVal,
      diff,
      failed,
    });
  }

  return { results, hasRegression };
}

function printResults(results, hasRegression, isNewBaseline) {
  console.log('\n' + '='.repeat(50));

  if (isNewBaseline) {
    console.log('Coverage baseline created:\n');
    for (const r of results) {
      console.log(`  ${r.metric.padEnd(12)}: ${formatPct(r.newVal)}%`);
    }
    console.log('\nBaseline saved to .coverage-baseline.json');
    return;
  }

  if (hasRegression) {
    console.log('Coverage regression detected!\n');
  } else {
    console.log('Coverage ratchet passed\n');
  }

  for (const r of results) {
    const arrow = `${formatPct(r.oldVal)}% -> ${formatPct(r.newVal)}%`;
    const diffStr = formatDiff(r.oldVal, r.newVal);
    const status = r.failed ? ' <- FAILED' : '';
    console.log(`  ${r.metric.padEnd(12)}: ${arrow} ${diffStr}${status}`);
  }

  if (hasRegression) {
    console.log('\nCoverage cannot decrease. Add more tests to fix.');
  } else {
    console.log('\nBaseline updated.');
  }

  console.log('='.repeat(50) + '\n');
}

function main() {
  // Run Jest coverage
  const jestSuccess = runJestCoverage();
  if (!jestSuccess) {
    process.exit(1);
  }

  // Read current coverage
  const current = readCoverageSummary();

  // Read baseline (may not exist)
  const baseline = readBaseline();

  if (!baseline) {
    // First run - create baseline
    const results = METRICS.map((m) => ({ metric: m, newVal: toNumber(current[m]) }));
    printResults(results, false, true);
    saveBaseline(current);
    process.exit(0);
  }

  // Compare coverage
  const { results, hasRegression } = compareCoverage(baseline, current);
  printResults(results, hasRegression, false);

  if (hasRegression) {
    process.exit(1);
  }

  // Update baseline
  saveBaseline(current);
  process.exit(0);
}

main();
