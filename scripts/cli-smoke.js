#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const bin = path.join(root, 'bin', 'sherlock.js');
const tempWorkspace = path.join(root, 'output', 'cli_smoke_ci');
const withRender = process.env.SMOKE_RENDER === '1';

function runStep(name, command, args, options = {}) {
  const cwd = options.cwd || root;
  console.log(`\n[SMOKE] ${name}`);
  console.log(`  > ${command} ${args.join(' ')}`);

  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: false,
    env: process.env,
  });

  if (result.status !== 0) {
    throw new Error(`Step failed: ${name} (exit ${result.status})`);
  }
}

function assertExists(targetPath, label) {
  if (!fs.existsSync(targetPath)) {
    throw new Error(`Expected ${label} at ${targetPath}`);
  }
  console.log(`[SMOKE] OK: ${label}`);
}

async function main() {
  console.log('[SMOKE] Sherlock CLI smoke test started');

  // Core health
  runStep('Version', process.execPath, [bin, '--plain', '--version']);
  runStep('Guide index', process.execPath, [bin, '--plain', 'guide']);
  runStep('Guide syntax', process.execPath, [bin, '--plain', 'guide', 'syntax']);
  runStep('Examples list', process.execPath, [bin, '--plain', 'examples']);
  runStep('Doctor JSON', process.execPath, [bin, '--plain', 'doctor', '--json']);

  // Isolated temp workspace checks
  fs.removeSync(tempWorkspace);
  fs.ensureDirSync(tempWorkspace);

  runStep(
    'Examples copy',
    process.execPath,
    [bin, '--plain', 'examples', '--copy', 'debug_test'],
    { cwd: tempWorkspace }
  );
  assertExists(path.join(tempWorkspace, 'debug_test.sherlock'), 'copied example scene');

  runStep(
    'Init scaffold',
    process.execPath,
    [bin, '--plain', 'init', 'smoke_project'],
    { cwd: tempWorkspace }
  );
  const initProjectRoot = path.join(tempWorkspace, 'sherlock-workspace', 'smoke_project');
  assertExists(path.join(initProjectRoot, 'scenes', 'intro.sherlock'), 'init scene');
  assertExists(path.join(initProjectRoot, 'package.json'), 'init package file');

  runStep(
    'Config init',
    process.execPath,
    [bin, '--plain', 'config', '--init'],
    { cwd: tempWorkspace }
  );
  runStep(
    'Config show',
    process.execPath,
    [bin, '--plain', 'config', '--show'],
    { cwd: tempWorkspace }
  );
  assertExists(path.join(tempWorkspace, '.sherlockrc'), 'generated .sherlockrc');

  if (withRender) {
    runStep(
      'Minimal render',
      process.execPath,
      [
        bin,
        '--plain',
        'render',
        'scenes/test_all_components.sherlock',
        '--output',
        'output/cli_smoke_ci_render.mp4',
        '--width',
        '640',
        '--height',
        '360',
        '--fps',
        '12',
        '--quality',
        '28',
      ],
      { cwd: root }
    );
    assertExists(path.join(root, 'output', 'cli_smoke_ci_render.mp4'), 'smoke render video');
  } else {
    console.log('\n[SMOKE] Render step skipped (set SMOKE_RENDER=1 to include it)');
  }

  console.log('\n[SMOKE] All CLI smoke checks passed');
}

main().catch((error) => {
  console.error(`\n[SMOKE] FAILED: ${error.message}`);
  process.exit(1);
});
