const { spawn } = require('child_process');
const ora = require('ora');
const chalk = require('chalk');
const open = require('open');
const path = require('path');
const fs = require('fs-extra');
const { EXIT_CODES } = require('./exit-codes');

async function preview(sceneFile, options) {
  const port = options.port;
  const projectRoot = path.resolve(__dirname, '../..');
  const getPreviewUrl = () => {
    if (!sceneFile) return `http://localhost:${port}`;
    const sceneName = path.basename(sceneFile, '.sherlock');
    return `http://localhost:${port}?scene=${encodeURIComponent(sceneName)}`;
  };
  
  // If scene file provided, validate and set environment variable
  const env = { ...process.env, PORT: port };
  if (sceneFile) {
    const absPath = path.resolve(sceneFile);
    if (!fs.existsSync(absPath)) {
      console.error(chalk.red(`❌ Error: File not found: ${sceneFile}`));
      console.error(chalk.gray(`Expected at: ${absPath}`));
      process.exit(EXIT_CODES.INPUT_VALIDATION);
    }
    env.SHERLOCK_PREVIEW_FILE = absPath;
    console.log(chalk.hex('#00d4ff')(`📄 Loading: ${chalk.white(path.basename(sceneFile))}\n`));
  } else {
    console.log(chalk.hex('#00ff88')('🌐 Launching full preview environment\n'));
    console.log(chalk.gray('All scenes will be accessible from the web interface\n'));
  }

  const spinner = ora({
    text: 'Starting preview server...',
    color: 'cyan'
  }).start();

  const server = spawn('npm', ['run', 'dev'], {
    cwd: projectRoot,
    env,
    shell: true,
    stdio: 'pipe'
  });

  let serverReady = false;

  server.stdout?.on('data', (data) => {
    const msg = data.toString();
    if (msg.includes('Ready') || msg.includes('started server') || msg.includes('Local:')) {
      if (!serverReady) {
        serverReady = true;
        spinner.succeed(chalk.green('Preview server running'));
        console.log(chalk.hex('#00d4ff').bold(`\n🌐 Preview: ${chalk.white(getPreviewUrl())}`));
        console.log(chalk.gray('Press Ctrl+C to stop\n'));
        
        if (options.open) {
          console.log(chalk.hex('#ffd700')('▶ Opening browser...\n'));
          open(getPreviewUrl());
        }
      }
    }
  });

  server.stderr?.on('data', (data) => {
    const msg = data.toString();
    // Filter out webpack/next.js noise
    if (!msg.includes('webpack') && 
        !msg.includes('Attention:') && 
        !msg.includes('Compiled') &&
        msg.trim()) {
      console.error(chalk.red(msg));
    }
  });

  server.on('error', (error) => {
    spinner.fail(chalk.red('Failed to start server'));
    console.error(error);
    process.exit(EXIT_CODES.RUNTIME_FAILURE);
  });

  // Keep alive
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n\n👋 Shutting down...'));
    server.kill();
    process.exit(EXIT_CODES.SUCCESS);
  });
}

module.exports = { preview };
