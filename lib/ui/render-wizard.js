const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');

/**
 * Configure render settings interactively
 */
async function configureRenderSettings(defaults = {}) {
  console.log(chalk.hex('#ff0088').bold('\n📹 RENDER SETTINGS\n'));
  
  // Resolution
  const { resolution } = await inquirer.prompt([
    {
      type: 'list',
      name: 'resolution',
      message: chalk.hex('#00d4ff').bold('Select resolution:'),
      default: defaults.resolution || '1920x1080',
      choices: [
        { name: chalk.white('1920x1080') + chalk.gray(' (Full HD)'), value: '1920x1080' },
        { name: chalk.white('1280x720') + chalk.gray(' (HD)'), value: '1280x720' },
        { name: chalk.white('3840x2160') + chalk.gray(' (4K)'), value: '3840x2160' },
        { name: chalk.white('2560x1440') + chalk.gray(' (2K)'), value: '2560x1440' },
        { name: chalk.hex('#ffd700')('Custom...'), value: 'custom' }
      ]
    }
  ]);
  
  let width, height;
  if (resolution === 'custom') {
    const custom = await inquirer.prompt([
      {
        type: 'number',
        name: 'width',
        message: 'Width (pixels):',
        default: 1920,
        validate: val => val > 0 && val <= 7680 || 'Enter a valid width (1-7680)'
      },
      {
        type: 'number',
        name: 'height',
        message: 'Height (pixels):',
        default: 1080,
        validate: val => val > 0 && val <= 4320 || 'Enter a valid height (1-4320)'
      }
    ]);
    width = custom.width;
    height = custom.height;
  } else {
    [width, height] = resolution.split('x').map(Number);
  }
  
  // Frame Rate
  const { fps } = await inquirer.prompt([
    {
      type: 'list',
      name: 'fps',
      message: chalk.hex('#00d4ff').bold('Select frame rate:'),
      default: defaults.fps || 60,
      choices: [
        { name: chalk.white('60 FPS') + chalk.gray(' (Smooth)'), value: 60 },
        { name: chalk.white('30 FPS') + chalk.gray(' (Standard)'), value: 30 },
        { name: chalk.white('24 FPS') + chalk.gray(' (Cinematic)'), value: 24 },
        { name: chalk.white('120 FPS') + chalk.gray(' (High FPS)'), value: 120 },
        { name: chalk.hex('#ffd700')('Custom...'), value: 'custom' }
      ]
    }
  ]);
  
  let finalFps = fps;
  if (fps === 'custom') {
    const { customFps } = await inquirer.prompt([
      {
        type: 'number',
        name: 'customFps',
        message: 'FPS:',
        default: 60,
        validate: val => val > 0 && val <= 240 || 'Enter FPS between 1-240'
      }
    ]);
    finalFps = customFps;
  }
  
  // Quality
  const { quality } = await inquirer.prompt([
    {
      type: 'list',
      name: 'quality',
      message: chalk.hex('#00d4ff').bold('Select quality (lower = better):'),
      default: defaults.quality || 18,
      choices: [
        { name: chalk.white('Ultra (12)') + chalk.gray(' - Maximum quality, very slow'), value: 12 },
        { name: chalk.white('High (18)') + chalk.gray(' - High quality, slower'), value: 18 },
        { name: chalk.white('Medium (23)') + chalk.gray(' - Good quality, balanced'), value: 23 },
        { name: chalk.white('Draft (28)') + chalk.gray(' - Fast rendering, testing'), value: 28 }
      ]
    }
  ]);
  
  // Duration
  const { durationType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'durationType',
      message: 'Duration to export:',
      choices: [
        { name: 'Full animation', value: 'full' },
        { name: 'Custom time range', value: 'custom' }
      ]
    }
  ]);
  
  let startTime, endTime;
  if (durationType === 'custom') {
    const customDuration = await inquirer.prompt([
      {
        type: 'number',
        name: 'start',
        message: 'Start time (seconds):',
        default: 0,
        validate: val => val >= 0 || 'Must be 0 or greater'
      },
      {
        type: 'number',
        name: 'end',
        message: 'End time (seconds):',
        validate: (val, answers) => {
          if (val <= answers.start) return 'End must be greater than start';
          return true;
        }
      }
    ]);
    startTime = customDuration.start;
    endTime = customDuration.end;
  }
  
  return {
    width,
    height,
    fps: finalFps,
    quality,
    durationType,
    startTime,
    endTime
  };
}

/**
 * Ask for output filename
 */
async function askOutputFilename(defaultName) {
  const { output } = await inquirer.prompt([
    {
      type: 'input',
      name: 'output',
      message: 'Output filename:',
      default: defaultName,
      validate: input => {
        if (!input.endsWith('.mp4')) {
          return 'Filename must end with .mp4';
        }
        if (input.trim().length === 0) {
          return 'Filename cannot be empty';
        }
        return true;
      }
    }
  ]);
  
  const { outputDir } = await inquirer.prompt([
    {
      type: 'list',
      name: 'outputDir',
      message: 'Save to:',
      choices: [
        { name: 'output/ (default)', value: 'output' },
        { name: 'Custom folder...', value: 'custom' }
      ]
    }
  ]);
  
  let dir = outputDir;
  if (outputDir === 'custom') {
    const { customDir } = await inquirer.prompt([
      {
        type: 'input',
        name: 'customDir',
        message: 'Output directory:',
        default: 'output'
      }
    ]);
    dir = customDir;
  }
  
  return { output, outputDir: dir };
}

/**
 * Show render confirmation
 */
async function confirmRender(settings, fileName, outputPath) {
  console.log(chalk.hex('#ff0088').bold('\n📋 RENDER SUMMARY\n'));
  console.log(chalk.hex('#00d4ff')(`Scene: ${chalk.white(fileName)}`));
  console.log(chalk.hex('#00d4ff')(`Output: ${chalk.white(outputPath)}`));
  console.log(chalk.hex('#00d4ff')(`Resolution: ${chalk.white(`${settings.width}x${settings.height}`)}`));
  console.log(chalk.hex('#00d4ff')(`Frame Rate: ${chalk.white(settings.fps + ' fps')}`));
  console.log(chalk.hex('#00d4ff')(`Quality: ${chalk.white(settings.quality)}`));
  if (settings.durationType === 'custom') {
    console.log(chalk.hex('#00d4ff')(`Duration: ${chalk.white(`${settings.startTime}s - ${settings.endTime}s`)}`));
  }
  console.log();
  
  const { confirmed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message: chalk.hex('#ffd700').bold('Start rendering?'),
      default: true
    }
  ]);
  
  return confirmed;
}

/**
 * Show render complete options
 */
async function showRenderComplete(outputPath, stats) {
  console.log();
  console.log(chalk.hex('#00ff88').bold('✓ RENDER COMPLETE!\n'));
  console.log(chalk.hex('#00d4ff')(`Output: ${chalk.white(outputPath)}`));
  if (stats.size) {
    console.log(chalk.hex('#00d4ff')(`Size: ${chalk.white(stats.size)}`));
  }
  if (stats.duration) {
    console.log(chalk.hex('#00d4ff')(`Duration: ${chalk.white(stats.duration)}`));
  }
  console.log();
  
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: chalk.hex('#ffd700').bold('What next?'),
      choices: [
        { name: chalk.hex('#00ff88')('🎬 Open Video'), value: 'play' },
        { name: chalk.hex('#00d4ff')('📂 Open Output Folder'), value: 'folder' },
        { name: chalk.hex('#ff0088')('📹 Render Another'), value: 'render' },
        { name: chalk.gray('🏠 Main Menu'), value: 'menu' }
      ]
    }
  ]);
  
  return action;
}

module.exports = {
  configureRenderSettings,
  askOutputFilename,
  confirmRender,
  showRenderComplete
};
