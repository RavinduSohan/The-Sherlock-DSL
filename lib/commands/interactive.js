const { spawn, execSync } = require('child_process');
const chalk = require('chalk');
const open = require('open');
const fs = require('fs-extra');
const path = require('path');
const menus = require('../ui/menus');
const renderWizard = require('../ui/render-wizard');
const projectManager = require('../workspace/project-manager');

let lastCreatedScenePath = null;

function buildPreviewUrl(port, filePath = null) {
  const baseUrl = `http://localhost:${port}`;
  if (!filePath) return baseUrl;

  const sceneName = path.basename(filePath, '.sherlock');
  return `${baseUrl}?scene=${encodeURIComponent(sceneName)}`;
}

/**
 * Main interactive mode entry point
 */
async function interactive(startMode = null) {
  // Initialize workspace
  const initialized = await projectManager.initializeWorkspace();
  if (!initialized) {
    console.log(chalk.red('Failed to initialize workspace'));
    return;
  }
  
  // Load settings
  const settings = await projectManager.loadSettings();
  
  let running = true;
  let currentMode = startMode;
  
  while (running) {
    try {
      // Show main menu if no mode specified
      if (!currentMode) {
        const action = await menus.showMainMenu();
        currentMode = action;
      }
      
      switch (currentMode) {
        case 'code':
          await handleCodeWorkflow(settings);
          currentMode = null;
          break;
          
        case 'preview':
          await handlePreviewWorkflow(settings);
          currentMode = null;
          break;
          
        case 'render':
          await handleRenderWorkflow(settings);
          currentMode = null;
          break;
          
        case 'guide':
          await handleGuideWorkflow();
          currentMode = null;
          break;
          
        case 'settings':
          await handleSettingsWorkflow(settings);
          currentMode = null;
          break;
          
        case 'exit':
          running = false;
          console.log(
            chalk.hex('#7b2cbf')('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
          );
          console.log(chalk.hex('#00d4ff').bold('  Thank you for using SHERLOCK Studio'));
          console.log(chalk.gray('  Create. Animate. Inspire.'));
          console.log(
            chalk.hex('#7b2cbf')('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
          );
          break;
          
        default:
          currentMode = null;
      }
    } catch (error) {
      if (error.message === 'User force closed the prompt') {
        console.log(chalk.yellow('\n\nOperation cancelled by user'));
        currentMode = null;
      } else {
        console.error(chalk.red('\nError:'), error.message);
        await menus.confirm('Press Enter to continue...');
        currentMode = null;
      }
    }
  }
}

/**
 * Handle Code Workflow
 */
async function handleCodeWorkflow(settings) {
  menus.showHeader();
  console.log(chalk.hex('#00ff88').bold('⚡ CODE NEW ANIMATION\n'));
  
  // Ask for animation name
  const name = await menus.askAnimationName();
  
  // Choose coding method
  const method = await menus.chooseCodingMethod();
  
  if (method === 'back') return;
  
  let filePath;
  
  switch (method) {
    case 'editor':
      filePath = await handleEditorCoding(name);
      break;
    case 'paste':
      filePath = await handlePasteCoding(name);
      break;
    case 'template':
      filePath = await handleTemplateCoding(name);
      break;
  }
  
  if (!filePath) return;

  lastCreatedScenePath = filePath;
  
  // Ask what to do next
  let nextAction = await menus.chooseNextAction(path.basename(filePath));
  
  while (nextAction && nextAction !== 'menu') {
    switch (nextAction) {
      case 'preview':
        await launchPreview(filePath);
        nextAction = await menus.chooseNextAction(path.basename(filePath));
        break;
      case 'render':
        await launchRender(filePath, settings);
        nextAction = await menus.chooseNextAction(path.basename(filePath));
        break;
      case 'edit':
        await openInEditor(filePath);
        nextAction = await menus.chooseNextAction(path.basename(filePath));
        break;
      case 'new':
        await handleCodeWorkflow(settings);
        return;
      default:
        nextAction = 'menu';
    }
  }
}

/**
 * Handle editor coding
 */
async function handleEditorCoding(name) {
  const spinner = menus.showLoading('Creating file...');
  
  try {
    const starterContent = '# Paste your full .sherlock code here, then save this file\n';
    const filePath = await projectManager.createSceneFile(name, starterContent);
    const initialStats = await fs.stat(filePath);
    spinner.succeed(chalk.hex('#00ff88')(`Created ${chalk.white(path.basename(filePath))}`));

    console.log(chalk.hex('#00d4ff')('\nOpening Notepad. Paste full .sherlock code and save.\n'));
    await openInEditor(filePath, { preferNotepad: true });

    const saved = await waitForFileSave(filePath, initialStats, 300000);
    if (!saved) {
      const continueWithoutSave = await menus.confirm(
        'No save detected yet. Continue anyway?',
        false
      );
      if (!continueWithoutSave) {
        console.log(chalk.yellow('Reopening editor...'));
        await openInEditor(filePath, { preferNotepad: true });
      }
    } else {
      menus.showSuccess(`${chalk.white(path.basename(filePath))} updated and saved`);
    }
    
    return filePath;
  } catch (error) {
    spinner.fail(chalk.red('Failed to create file'));
    throw error;
  }
}

/**
 * Handle paste coding
 */
async function handlePasteCoding(name) {
  console.log(chalk.hex('#00d4ff')('\nPaste your YAML code below.'));
  console.log(chalk.gray('When done, type') + chalk.hex('#ffd700')(' "END" ') + chalk.gray('on a new line and press Enter:\n'));
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  let lines = [];
  
  return new Promise((resolve, reject) => {
    rl.on('line', (line) => {
      if (line.trim() === 'END') {
        rl.close();
      } else {
        lines.push(line);
      }
    });
    
    rl.on('close', async () => {
      if (lines.length === 0) {
        console.log(chalk.yellow('\n⚠️  No content provided'));
        resolve(null);
        return;
      }
      
      try {
        const content = lines.join('\n');
        const filePath = await projectManager.createSceneFile(name, content);
        menus.showSuccess(`Created ${chalk.white(path.basename(filePath))}`);
        resolve(filePath);
      } catch (error) {
        menus.showError('Failed to create file: ' + error.message);
        resolve(null);
      }
    });
  });
}

/**
 * Handle template coding
 */
async function handleTemplateCoding(name) {
  const templates = await projectManager.getTemplates();
  const templateChoice = await menus.chooseTemplate(templates);
  
  if (templateChoice === 'back') return null;
  
  const template = templates.find(t => t.path === templateChoice);
  if (!template) return null;
  
  const spinner = menus.showLoading('Creating from template...');
  
  try {
    const filePath = await projectManager.createSceneFile(name, template.content);
    spinner.succeed(chalk.hex('#00ff88')(`Created ${chalk.white(path.basename(filePath))} from template`));
    
    console.log(chalk.hex('#00d4ff')('\nOpening in default editor...\n'));
    await openInEditor(filePath);
    
    return filePath;
  } catch (error) {
    spinner.fail(chalk.red('Failed to create file'));
    throw error;
  }
}

/**
 * Handle Preview Workflow
 */
async function handlePreviewWorkflow(settings) {
  menus.showHeader();
  console.log(chalk.cyan.bold('🌐 LIVE PREVIEW STUDIO\n'));

  if (lastCreatedScenePath && await fs.pathExists(lastCreatedScenePath)) {
    const useLatest = await menus.confirm(
      `Preview latest scene now (${path.basename(lastCreatedScenePath)})?`,
      true
    );
    if (useLatest) {
      await launchPreview(lastCreatedScenePath);
      return;
    }
  }
  
  console.log(chalk.hex('#00d4ff')('Starting full preview environment...'));
  console.log(chalk.gray('The web app will launch with all scenes available\n'));
  
  const proceed = await menus.confirm('Launch preview server?', true);
  
  if (!proceed) return;
  
  await launchFullPreview(settings);
}

/**
 * Handle Render Workflow
 */
async function handleRenderWorkflow(settings) {
  menus.showHeader();
  console.log(chalk.hex('#ff0088').bold('📹 RENDER TO VIDEO\n'));
  
  const files = await projectManager.getSherlockFiles();
  const filePath = await menus.selectSherlockFile(files, 'Select scene to render:');
  
  if (!filePath || filePath === 'back') return;
  
  await launchRender(filePath, settings);
}

/**
 * Handle Guide Workflow
 */
async function handleGuideWorkflow() {
  await menus.displaySyntaxGuide();
}

/**
 * Handle Settings Workflow
 */
async function handleSettingsWorkflow(settings) {
  menus.showHeader();
  console.log(chalk.hex('#888888').bold('⚙️  CONFIGURATION\n'));
  
  console.log(chalk.white('Current settings:'));
  console.log(chalk.hex('#00d4ff')(`  Resolution: ${chalk.white(settings.defaultWidth + 'x' + settings.defaultHeight)}`));
  console.log(chalk.hex('#00d4ff')(`  Frame Rate: ${chalk.white(settings.defaultFps + ' FPS')}`));
  console.log(chalk.hex('#00d4ff')(`  Quality: ${chalk.white(settings.defaultQuality)}`));
  console.log(chalk.hex('#00d4ff')(`  Preview Port: ${chalk.white(settings.previewPort)}`));
  console.log(chalk.hex('#00d4ff')(`  Output Dir: ${chalk.white(settings.outputDir)}`));
  console.log();
  
  const edit = await menus.confirm(chalk.hex('#ffd700')('Edit settings file?'), false);
  
  if (edit) {
    const settingsPath = projectManager.SETTINGS_FILE;
    await openInEditor(settingsPath);
    menus.showInfo('Settings updated! Restart if needed.');
  }
}

/**
 * Launch full preview (all scenes available)
 */
async function launchFullPreview(settings) {
  console.log(chalk.cyan('\n🌐 Launching Preview Studio...\n'));
  
  const port = settings.previewPort || 3000;
  
  console.log(chalk.gray(`Starting development server on port ${port}...`));
  console.log(chalk.hex('#00ff88')('All scenes will be accessible from the web interface'));
  console.log(chalk.yellow('\nPress Ctrl+C in this window to stop the server\n'));
  
  const projectRoot = path.resolve(__dirname, '../..');
  
  // Launch dev server without specifying a file
  const server = spawn('npm', ['run', 'dev'], {
    cwd: projectRoot,
    env: { ...process.env, PORT: port },
    shell: true,
    stdio: 'inherit'
  });
  
  // Wait a bit then open browser
  setTimeout(() => {
    open(buildPreviewUrl(port));
  }, 5000);
  
  // Wait for server to close
  await new Promise((resolve) => {
    server.on('close', resolve);
  });
}

/**
 * Launch preview for specific file (legacy support)
 */
async function launchPreview(filePath) {
  console.log(chalk.cyan(`\n🌐 Starting preview for ${path.basename(filePath)}...\n`));
  
  const settings = await projectManager.loadSettings();
  const port = settings.previewPort || 3000;
  
  console.log(chalk.gray(`Starting server on port ${port}...`));
  console.log(chalk.yellow('Press Ctrl+C to stop\n'));
  
  const projectRoot = path.resolve(__dirname, '../..');
  
  // Check if file exists before launching
  if (!await fs.pathExists(filePath)) {
    menus.showError(`File not found: ${path.basename(filePath)}`);
    await menus.confirm('Press Enter to continue...');
    return;
  }
  
  const server = spawn('npm', ['run', 'dev'], {
    cwd: projectRoot,
    env: { 
      ...process.env, 
      PORT: port,
      SHERLOCK_PREVIEW_FILE: path.resolve(filePath)
    },
    shell: true,
    stdio: 'inherit'
  });
  
  setTimeout(() => {
    open(buildPreviewUrl(port, filePath));
  }, 5000);
  
  await new Promise((resolve) => {
    server.on('close', resolve);
  });
}

/**
 * Launch render
 */
async function launchRender(filePath, settings) {
  try {
    // Check FFmpeg availability first
    try {
      execSync('ffmpeg -version', { stdio: 'ignore' });
    } catch (error) {
      console.log(chalk.red('\n❌ FFmpeg not found!\n'));
      console.log(chalk.yellow('FFmpeg is required for video export.\n'));
      console.log(chalk.cyan('Installation instructions:'));
      console.log(chalk.white('  • Windows: Download from https://ffmpeg.org/download.html'));
      console.log(chalk.white('  • macOS:   brew install ffmpeg'));
      console.log(chalk.white('  • Linux:   sudo apt install ffmpeg\n'));
      await menus.confirm('Press Enter to return to menu...');
      return;
    }
    
    const renderSettings = await renderWizard.configureRenderSettings(settings);
    
    const defaultOutput = path.basename(filePath, '.sherlock') + '.mp4';
    const { output, outputDir } = await renderWizard.askOutputFilename(defaultOutput);
    
    // Ensure outputDir is absolute
    const absOutputDir = path.isAbsolute(outputDir) 
      ? outputDir 
      : path.join(process.cwd(), outputDir);
    
    // Create output directory if it doesn't exist
    await fs.ensureDir(absOutputDir);
    
    const outputPath = path.join(absOutputDir, output);
    
    const confirmed = await renderWizard.confirmRender(renderSettings, path.basename(filePath), outputPath);
    
    if (!confirmed) {
      console.log(chalk.yellow('Render cancelled'));
      return;
    }
    
    console.log(chalk.hex('#ff0088').bold('\n📹 Starting render...'));
    console.log(chalk.gray(`Scene: ${filePath}`));
    console.log(chalk.gray(`Output: ${outputPath}\n`));
    
    const projectRoot = path.resolve(__dirname, '../..');
    
    // Build command args - don't use shell:true to properly handle spaces
    const args = [
      'bin/sherlock.js',
      'render',
      filePath,
      '--output',
      outputPath,
      '--width',
      String(renderSettings.width),
      '--height',
      String(renderSettings.height),
      '--fps',
      String(renderSettings.fps),
      '--quality',
      String(renderSettings.quality)
    ];
    
    const render = spawn('node', args, {
      cwd: projectRoot,
      stdio: 'inherit'
    });
    
    await new Promise((resolve) => {
      render.on('close', resolve);
    });
    
    if (await fs.pathExists(outputPath)) {
      const stats = await fs.stat(outputPath);
      const action = await renderWizard.showRenderComplete(outputPath, {
        size: (stats.size / (1024 * 1024)).toFixed(2) + ' MB'
      });
      
      if (action === 'play') {
        open(outputPath);
      } else if (action === 'folder') {
        open(path.dirname(outputPath));
      }
    } else {
      console.log(chalk.red('\n⚠️  Render failed or output file not found'));
      await menus.confirm('Press Enter to continue...');
    }
  } catch (error) {
    console.error(chalk.red('\n❌ Render error:'), error.message);
    console.log(chalk.gray(error.stack));
    await menus.confirm('Press Enter to continue...');
  }
}

/**
 * Open file in editor
 */
async function openInEditor(filePath, options = {}) {
  const { preferNotepad = false } = options;

  try {
    if (preferNotepad && process.platform === 'win32') {
      const editor = spawn('notepad', [filePath], {
        detached: true,
        stdio: 'ignore',
        shell: false
      });
      editor.unref();
      console.log(chalk.gray('Opened in Notepad'));
      return;
    }

    await open(filePath);
    console.log(chalk.gray('Opened in default editor'));
  } catch (error) {
    console.log(chalk.yellow('Could not open editor automatically'));
    console.log(chalk.gray(`Please open: ${filePath}`));
  }
}

async function waitForFileSave(filePath, initialStats, timeoutMs) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, 750));

    try {
      const current = await fs.stat(filePath);
      const changed =
        current.mtimeMs > initialStats.mtimeMs ||
        current.size !== initialStats.size;

      if (changed && current.size > 0) {
        return true;
      }
    } catch (error) {
      // Ignore transient file access issues while editor is saving
    }
  }

  return false;
}

module.exports = { interactive };
