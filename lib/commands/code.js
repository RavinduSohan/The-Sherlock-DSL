const { spawn } = require('child_process');
const chalk = require('chalk');
const boxen = require('boxen');
const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');
const open = require('open');
const { EXIT_CODES } = require('./exit-codes');

async function code(sceneFile, options) {
  const absPath = path.resolve(sceneFile);
  
  if (!fs.existsSync(absPath)) {
    console.error(chalk.red(`❌ Error: File not found: ${sceneFile}`));
    console.log(chalk.gray(`Expected at: ${absPath}`));
    process.exit(EXIT_CODES.INPUT_VALIDATION);
  }

  console.clear();
  
  // Premium header
  console.log(
    boxen(
      chalk.hex('#00ff88').bold('⚡ LIVE CODING MODE\n\n') +
      chalk.white(`File: ${chalk.hex('#00d4ff')(path.basename(sceneFile))}\n`) +
      chalk.gray('Edit and save to see changes instantly in browser'),
      { 
        padding: 1, 
        borderStyle: 'double', 
        borderColor: '#00ff88',
        margin: 1
      }
    )
  );

  // Load guide content if available
  const guidePath = path.join(__dirname, `../../guides/${options.guide}.md`);
  if (fs.existsSync(guidePath)) {
    const guide = fs.readFileSync(guidePath, 'utf-8');
    console.log(chalk.hex('#ffd700')('\n═══ QUICK REFERENCE ═══'));
    console.log(chalk.gray(guide.split('\n').slice(0, 30).join('\n'))); // First 30 lines
    console.log(chalk.gray('... (scroll up for more)\n'));
  }

  console.log(chalk.cyan('🚀 Starting preview server...\n'));

  // Start preview with the scene
  const projectRoot = path.resolve(__dirname, '../..');
  const port = 3000;
  const env = {
    ...process.env,
    PORT: port.toString(),
    SHERLOCK_PREVIEW_FILE: absPath
  };

  let previewServer = spawn('npm', ['run', 'dev'], {
    cwd: projectRoot,
    env,
    shell: true,
    stdio: 'pipe'
  });

  let serverReady = false;

  previewServer.stdout?.on('data', (data) => {
    const msg = data.toString();
    if ((msg.includes('Ready') || msg.includes('started server') || msg.includes('Local:')) && !serverReady) {
      serverReady = true;
      const sceneName = path.basename(sceneFile, '.sherlock');
      const previewUrl = `http://localhost:${port}?scene=${encodeURIComponent(sceneName)}`;
      console.log(chalk.green(`✓ Preview ready: ${chalk.hex('#00d4ff')(previewUrl)}\n`));
      console.log(chalk.hex('#ffd700')('▶ Opening browser...\n'));
      open(previewUrl);
    }
  });

  previewServer.stderr?.on('data', (data) => {
    const msg = data.toString();
    // Filter webpack/next noise
    if (!msg.includes('webpack') && 
        !msg.includes('Attention:') && 
        !msg.includes('Compiled') &&
        msg.trim()) {
      console.error(chalk.yellow(msg));
    }
  });

  // Watch for file changes
  const watcher = chokidar.watch(absPath, {
    persistent: true,
    ignoreInitial: true
  });

  watcher.on('change', (filePath) => {
    const time = new Date().toLocaleTimeString();
    console.log(chalk.hex('#00ff88')(`\n[✓ ${time}] File updated: ${chalk.white(path.basename(filePath))}`));
    console.log(chalk.cyan('🔄 Preview will refresh automatically...\n'));
  });

  // Keep alive
  console.log(chalk.hex('#888888')('👀 Watching for changes... Press Ctrl+C to exit\n'));
  
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n\n👋 Shutting down live coding mode...'));
    watcher.close();
    if (previewServer) previewServer.kill();
    process.exit(EXIT_CODES.SUCCESS);
  });
  
  // Handle server errors
  previewServer.on('error', (error) => {
    console.error(chalk.red('❌ Server error:'), error.message);
    watcher.close();
    process.exit(EXIT_CODES.RUNTIME_FAILURE);
  });
}

module.exports = { code };
