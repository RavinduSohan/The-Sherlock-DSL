const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { spawnSync } = require('child_process');

function runCommand(command, args) {
  const result = spawnSync(command, args, {
    shell: true,
    encoding: 'utf8'
  });

  return {
    ok: result.status === 0,
    status: result.status,
    stdout: (result.stdout || '').trim(),
    stderr: (result.stderr || '').trim(),
  };
}

function parseMajor(version) {
  const match = String(version || '').match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function checkNode() {
  const version = process.versions.node;
  const major = parseMajor(version);
  const ok = major >= 18;

  return {
    id: 'node',
    required: true,
    status: ok ? 'pass' : 'fail',
    detail: `Node.js ${version}`,
    recommendation: ok ? null : 'Install Node.js 18+ from https://nodejs.org/',
  };
}

function checkFfmpeg() {
  const result = runCommand('ffmpeg', ['-version']);
  const firstLine = (result.stdout || result.stderr || '').split(/\r?\n/)[0] || '';

  return {
    id: 'ffmpeg',
    required: true,
    status: result.ok ? 'pass' : 'fail',
    detail: result.ok ? firstLine : 'FFmpeg not found in PATH',
    recommendation: result.ok ? null : 'Install FFmpeg and ensure ffmpeg is available in PATH.',
  };
}

function checkTsx(projectRoot) {
  const localCli = path.join(projectRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs');
  const localBinWin = path.join(projectRoot, 'node_modules', '.bin', 'tsx.cmd');
  const localBinUnix = path.join(projectRoot, 'node_modules', '.bin', 'tsx');
  const hasLocal = fs.existsSync(localCli) || fs.existsSync(localBinWin) || fs.existsSync(localBinUnix);

  if (hasLocal) {
    return {
      id: 'tsx',
      required: true,
      status: 'pass',
      detail: 'Local tsx found in node_modules',
      recommendation: null,
    };
  }

  const globalCheck = runCommand('tsx', ['--version']);
  return {
    id: 'tsx',
    required: true,
    status: globalCheck.ok ? 'pass' : 'fail',
    detail: globalCheck.ok ? `Global tsx ${globalCheck.stdout || globalCheck.stderr}` : 'tsx not found',
    recommendation: globalCheck.ok ? null : 'Run npm install (local) or npm install -g tsx (global).',
  };
}

function checkNpm() {
  const result = runCommand('npm', ['--version']);

  return {
    id: 'npm',
    required: true,
    status: result.ok ? 'pass' : 'fail',
    detail: result.ok ? `npm ${result.stdout}` : 'npm not found',
    recommendation: result.ok ? null : 'Install Node.js/npm and retry.',
  };
}

function checkScenesDir(cwd) {
  const scenesDir = path.join(cwd, 'scenes');
  const exists = fs.existsSync(scenesDir);

  return {
    id: 'scenes_dir',
    required: false,
    status: exists ? 'pass' : 'warn',
    detail: exists ? `Found ${scenesDir}` : `Missing ${scenesDir}`,
    recommendation: exists ? null : 'Create scenes/ or run CLI in a Sherlock project root.',
  };
}

function checkOutputWrite(cwd) {
  const outputDir = path.join(cwd, 'output');
  const probeFile = path.join(outputDir, '.doctor-write-test');

  try {
    fs.ensureDirSync(outputDir);
    fs.writeFileSync(probeFile, 'ok');
    fs.removeSync(probeFile);

    return {
      id: 'output_write',
      required: true,
      status: 'pass',
      detail: `Writable ${outputDir}`,
      recommendation: null,
    };
  } catch (error) {
    return {
      id: 'output_write',
      required: true,
      status: 'fail',
      detail: `Cannot write to ${outputDir}`,
      recommendation: 'Fix filesystem permissions for the output directory.',
    };
  }
}

function printHumanReport(checks) {
  console.log(chalk.cyan.bold('\n🩺 Sherlock Doctor\n'));

  for (const check of checks) {
    const icon = check.status === 'pass' ? '✅' : check.status === 'warn' ? '⚠️ ' : '❌';
    const color = check.status === 'pass' ? chalk.green : check.status === 'warn' ? chalk.yellow : chalk.red;
    const label = check.id.replace(/_/g, ' ');

    console.log(color(`${icon} ${label}: ${check.detail}`));
    if (check.recommendation) {
      console.log(chalk.gray(`   → ${check.recommendation}`));
    }
  }

  const failures = checks.filter(c => c.status === 'fail' && c.required).length;
  const warnings = checks.filter(c => c.status === 'warn').length;

  console.log();
  if (failures === 0) {
    console.log(chalk.green('Environment looks good for Sherlock CLI.'));
  } else {
    console.log(chalk.red(`Found ${failures} required issue(s). Please fix them before release usage.`));
  }

  if (warnings > 0) {
    console.log(chalk.yellow(`Also found ${warnings} warning(s).`));
  }
  console.log();
}

async function doctor(options = {}) {
  const cwd = process.cwd();
  const projectRoot = path.resolve(__dirname, '../..');

  const checks = [
    checkNode(),
    checkNpm(),
    checkFfmpeg(),
    checkTsx(projectRoot),
    checkOutputWrite(cwd),
    checkScenesDir(cwd),
  ];

  const requiredFailures = checks.filter(c => c.required && c.status === 'fail').length;
  const warnings = checks.filter(c => c.status === 'warn').length;

  const summary = {
    ok: requiredFailures === 0,
    requiredFailures,
    warnings,
    checkedAt: new Date().toISOString(),
  };

  if (options.json) {
    console.log(JSON.stringify({ summary, checks }, null, 2));
  } else {
    printHumanReport(checks);
  }

  if (!summary.ok) {
    process.exitCode = 3;
  }
}

module.exports = { doctor };
