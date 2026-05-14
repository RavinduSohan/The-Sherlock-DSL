const ora = require('ora');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs-extra');
const { execSync, spawn } = require('child_process');
const { EXIT_CODES } = require('./exit-codes');

// Check if FFmpeg is available
function checkFFmpeg() {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

async function render(sceneFile, options) {
  const jsonMode = !!options.json;

  function printJsonSummary(ok, extra = {}) {
    if (!jsonMode) return;
    const summary = {
      ok,
      scene: resolvedPath,
      output,
      width,
      height,
      fps,
      quality,
      duration: durationSeconds,
      ...extra,
    };
    console.log(JSON.stringify(summary));
  }

  // Check FFmpeg first
  if (!checkFFmpeg()) {
    console.error(chalk.red('\n❌ FFmpeg not found!\n'));
    console.log(chalk.yellow('FFmpeg is required for video export.\n'));
    console.log(chalk.cyan('Installation instructions:'));
    console.log(chalk.white('  • Windows: Download from https://ffmpeg.org/download.html'));
    console.log(chalk.white('  • macOS:   brew install ffmpeg'));
    console.log(chalk.white('  • Linux:   sudo apt install ffmpeg\n'));
    process.exit(EXIT_CODES.DEPENDENCY_MISSING);
  }

  // Validate .sherlock extension
  if (!sceneFile.endsWith('.sherlock')) {
    console.error(chalk.red('❌ Error: File must have .sherlock extension'));
    process.exit(EXIT_CODES.INPUT_VALIDATION);
  }

  // Check if file exists
  const resolvedPath = path.resolve(sceneFile);
  if (!fs.existsSync(resolvedPath)) {
    console.error(chalk.red(`❌ Error: File not found: ${sceneFile}`));
    console.log(chalk.gray(`Looked at: ${resolvedPath}`));
    process.exit(EXIT_CODES.INPUT_VALIDATION);
  }

  // Normalize output path. Bare filenames are placed inside output/.
  const outputFileName = `${path.basename(sceneFile, '.sherlock')}.mp4`;
  const normalizedOutput = options.output
    ? (path.isAbsolute(options.output) || path.dirname(options.output) !== '.'
      ? options.output
      : path.join('output', options.output))
    : path.join('output', outputFileName);
  const output = path.resolve(normalizedOutput);
  
  const width = parseInt(options.width);
  const height = parseInt(options.height);
  const fps = parseInt(options.fps);
  const quality = parseInt(options.quality);
  const durationSeconds = options.duration !== undefined ? parseFloat(options.duration) : undefined;

  // Validate inputs
  if (width <= 0 || height <= 0) {
    console.error(chalk.red('❌ Error: Width and height must be positive'));
    process.exit(EXIT_CODES.INPUT_VALIDATION);
  }

  if (width % 2 !== 0 || height % 2 !== 0) {
    console.error(chalk.red('❌ Error: Width and height must be even numbers (required by H.264/MP4 encoding)'));
    console.log(chalk.yellow('Try values like 1280x720, 1920x1080, or any even width/height pair.'));
    process.exit(EXIT_CODES.INPUT_VALIDATION);
  }
  
  if (fps <= 0 || fps > 120) {
    console.error(chalk.red('❌ Error: FPS must be between 1 and 120'));
    process.exit(EXIT_CODES.INPUT_VALIDATION);
  }
  
  if (quality < 0 || quality > 51) {
    console.error(chalk.red('❌ Error: Quality (CRF) must be between 0 and 51'));
    process.exit(EXIT_CODES.INPUT_VALIDATION);
  }

  if (durationSeconds !== undefined && (!Number.isFinite(durationSeconds) || durationSeconds <= 0)) {
    console.error(chalk.red('❌ Error: Duration must be a positive number of seconds'));
    process.exit(EXIT_CODES.INPUT_VALIDATION);
  }

  console.log(chalk.cyan('\n🎬 Starting video export...\n'));
  console.log(chalk.white(`📄 Scene:      ${sceneFile}`));
  console.log(chalk.white(`📹 Output:     ${output}`));
  console.log(chalk.white(`📐 Resolution: ${width}x${height}`));
  console.log(chalk.white(`🎞️  FPS:        ${fps}`));
  if (durationSeconds !== undefined) {
    console.log(chalk.white(`⏱️  Duration:   ${durationSeconds}s (override)`));
  }
  console.log(chalk.white(`💎 Quality:    CRF ${quality}\n`));

  // Ensure destination directory exists before export starts.
  await fs.ensureDir(path.dirname(output));

  // Create a wrapper script to run the export
  const projectRoot = path.resolve(__dirname, '../..');
  
  // Check for local tsx installation
  const localTsxPath = path.join(projectRoot, 'node_modules', '.bin', 'tsx.cmd'); // Windows
  const localTsxPathUnix = path.join(projectRoot, 'node_modules', '.bin', 'tsx'); // Unix
  const hasLocalTsx = fs.existsSync(localTsxPath) || fs.existsSync(localTsxPathUnix);
  
  const tsxExecutable = process.platform === 'win32' ? localTsxPath : localTsxPathUnix;
  
  return new Promise((resolve, reject) => {
    // Set environment variables
    const env = {
      ...process.env,
      SHERLOCK_EXPORT_MODE: 'true',
      SHERLOCK_SCENE_FILE: resolvedPath,
      SHERLOCK_OUTPUT_FILE: output,
      SHERLOCK_WIDTH: width.toString(),
      SHERLOCK_HEIGHT: height.toString(),
      SHERLOCK_FPS: fps.toString(),
      SHERLOCK_QUALITY: quality.toString(),
      ...(durationSeconds !== undefined ? { SHERLOCK_MAX_DURATION: durationSeconds.toString() } : {}),
    };

    // Create a temporary runner script
    const runnerScript = `
// Set environment flag BEFORE any imports
process.env.SHERLOCK_EXPORT_MODE = 'true';

// Change to the correct directory for imports
process.chdir(${JSON.stringify(path.join(projectRoot, 'lib', 'core'))});

const { setSilentMode } = require('./componentPackages');
const { setRuntimeSilentMode } = require('./sherlockRuntime');
const { setParserSilentMode } = require('./sherlockParser');
const { exportVideoV2 } = require('./videoExportV2');

setSilentMode(true);
setRuntimeSilentMode(true);
setParserSilentMode(true);

const sceneFile = process.env.SHERLOCK_SCENE_FILE;
const outputFile = process.env.SHERLOCK_OUTPUT_FILE;
const width = parseInt(process.env.SHERLOCK_WIDTH);
const height = parseInt(process.env.SHERLOCK_HEIGHT);
const fps = parseInt(process.env.SHERLOCK_FPS);
const quality = parseInt(process.env.SHERLOCK_QUALITY);
const maxDuration = process.env.SHERLOCK_MAX_DURATION ? parseFloat(process.env.SHERLOCK_MAX_DURATION) : undefined;

exportVideoV2({
  sceneFile,
  outputFile,
  width,
  height,
  fps,
  quality,
  maxDuration
}).then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Export failed:', error.message);
  process.exit(1);
});
`;

    const runnerPath = path.join(__dirname, '../core/_render_runner.js');
    fs.writeFileSync(runnerPath, runnerScript);
    
    // Try to find tsx CLI script location
    const tsxCliPath = path.join(projectRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs');
    
    let command, args;
    
    if (fs.existsSync(tsxCliPath)) {
      // Use node directly with tsx CLI module
      command = process.execPath; // node executable
      args = [tsxCliPath, runnerPath];
    } else {
      // Fallback: try tsx command from PATH (needs shell on Windows)
      if (process.platform === 'win32') {
        command = 'cmd';
        args = ['/c', 'tsx', runnerPath];
      } else {
        command = 'tsx';
        args = [runnerPath];
      }
    }
    
    const child = spawn(command, args, {
      env,
      stdio: 'inherit',
      shell: false
    });

    child.on('exit', (code) => {
      // Clean up runner file
      try {
        fs.unlinkSync(runnerPath);
      } catch (e) {
        // Ignore cleanup errors
      }

      if (code === 0) {
        const stats = fs.existsSync(output) ? fs.statSync(output) : null;
        printJsonSummary(true, {
          exitCode: EXIT_CODES.SUCCESS,
          sizeBytes: stats ? stats.size : null,
        });
        console.log(chalk.green(`\n✅ Video exported successfully: ${output}\n`));
        resolve();
      } else {
        console.error(chalk.red(`\n❌ Export failed with code ${code}\n`));
        printJsonSummary(false, {
          exitCode: EXIT_CODES.RUNTIME_FAILURE,
          reason: `Export process exited with code ${code}`,
        });
        const error = new Error(`Export process exited with code ${code}`);
        error.exitCode = EXIT_CODES.RUNTIME_FAILURE;
        error.handled = true;
        reject(error);
      }
    });

    child.on('error', (error) => {
      // Clean up runner file
      try {
        fs.unlinkSync(runnerPath);
      } catch (e) {
        // Ignore cleanup errors
      }

      if (error.message.includes('ENOENT')) {
        console.error(chalk.red('\n❌ Error: tsx not found'));
        console.log(chalk.yellow('\nPlease install tsx:'));
        console.log(chalk.white('  npm install -g tsx\n'));
        printJsonSummary(false, {
          exitCode: EXIT_CODES.DEPENDENCY_MISSING,
          reason: 'tsx not found',
        });
        error.exitCode = EXIT_CODES.DEPENDENCY_MISSING;
        error.handled = true;
      } else {
        console.error(chalk.red('\n❌ Export failed:'));
        console.error(chalk.red(error.message + '\n'));
        printJsonSummary(false, {
          exitCode: EXIT_CODES.RUNTIME_FAILURE,
          reason: error.message,
        });
        error.exitCode = EXIT_CODES.RUNTIME_FAILURE;
        error.handled = true;
      }
      reject(error);
    });
  });
}

module.exports = { render };
