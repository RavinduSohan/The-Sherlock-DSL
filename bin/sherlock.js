#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const gradient = require('gradient-string');
const figlet = require('figlet');
const boxen = require('boxen');
const { EXIT_CODES } = require('../lib/commands/exit-codes');

const program = new Command();

function runAction(handler) {
  return async (...args) => {
    try {
      await handler(...args);
    } catch (error) {
      if (!error?.handled) {
        const message = error?.message || 'Command failed';
        console.error(chalk.red(`\n❌ ${message}\n`));
      }
      process.exit(error?.exitCode || EXIT_CODES.RUNTIME_FAILURE);
    }
  };
}

function shouldShowBanner(argv) {
  const isTTY = !!process.stdout.isTTY;
  const plainMode = argv.includes('--plain');
  const noBanner = argv.includes('--no-banner');
  return isTTY && !plainMode && !noBanner;
}

if (shouldShowBanner(process.argv.slice(2))) {
  // Beautiful header
  console.log(
    gradient.pastel.multiline(
      figlet.textSync('SHERLOCK', {
        font: 'ANSI Shadow',
        horizontalLayout: 'fitted'
      })
    )
  );

  console.log(
    boxen(
      chalk.white('🎬 STEM Animation Framework\n') +
      chalk.gray('Create stunning educational videos with .sherlock files'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'cyan'
      }
    )
  );
}

program
  .name('sherlock')
  .description('Beautiful STEM animation framework')
  .version('1.0.0')
  .option('--plain', 'Plain output mode (no decorative banner)')
  .option('--no-banner', 'Disable decorative banner/header');

// Commands
program
  .command('init <project-name>')
  .description('Create new Sherlock project')
  .addHelpText('after', '\nExamples:\n  sherlock init my-project\n')
  .action(runAction(async (projectName) => {
    const { init } = require('../lib/commands/init');
    await init(projectName);
  }));

program
  .command('create <scene-names...>')
  .alias('new')
  .description('Create one or more .sherlock scene files')
  .option('--dir <path>', 'Directory for scene files', 'scenes')
  .option('--template <type>', 'Template type: starter|blank', 'starter')
  .option('--from <file>', 'Use content from an existing file')
  .option('--force', 'Overwrite scene files if they already exist')
  .addHelpText('after', '\nExamples:\n  sherlock create intro\n  sherlock create intro outro\n  sherlock new lesson1 --template blank\n  sherlock create scene2 --from scenes/intro.sherlock --force\n')
  .action(runAction(async (sceneNames, options) => {
    const { create } = require('../lib/commands/create');
    await create(sceneNames, options);
  }));

program
  .command('config')
  .description('Manage configuration')
  .option('--init', 'Create a .sherlockrc config file')
  .option('--show', 'Show current configuration')
  .addHelpText('after', '\nExamples:\n  sherlock config --init\n  sherlock config --show\n')
  .action(runAction(async (options) => {
    const { loadConfig, createSampleConfig } = require('../lib/commands/config');
    if (options.init) {
      createSampleConfig('.sherlockrc');
    } else if (options.show) {
      console.log(chalk.cyan('\n📋 Current Configuration:\n'));
      const config = loadConfig();
      console.log(JSON.stringify(config, null, 2));
      console.log();
    } else {
      console.log(chalk.yellow('\nUse --init to create config or --show to view current config\n'));
    }
  }));

program
  .command('render <scene-file>')
  .alias('r')
  .description('Export scene to video')
  .option('-o, --output <file>', 'Output file path')
  .option('-w, --width <pixels>', 'Video width')
  .option('-h, --height <pixels>', 'Video height')
  .option('--fps <number>', 'Frames per second')
  .option('-q, --quality <number>', 'CRF quality 0-51')
  .option('--duration <seconds>', 'Maximum export duration override (seconds)')
  .option('--json', 'Output render summary as JSON')
  .addHelpText('after', '\nExamples:\n  sherlock render scenes/demo.sherlock --output output/demo.mp4\n  sherlock r scenes/demo.sherlock --fps 60 --quality 18\n  sherlock render scenes/demo.sherlock --duration 10\n  sherlock render scenes/demo.sherlock --json\n')
  .action(runAction(async (sceneFile, options) => {
    const { loadConfig } = require('../lib/commands/config');
    const config = loadConfig();
    const { render } = require('../lib/commands/render');
    await render(sceneFile, {
      ...options,
      width: String(options.width ?? config.defaultWidth),
      height: String(options.height ?? config.defaultHeight),
      fps: String(options.fps ?? config.defaultFps),
      quality: String(options.quality ?? config.defaultQuality),
    });
  }));

program
  .command('preview [scene-file]')
  .alias('p')
  .description('Launch live preview with hot reload')
  .option('-p, --port <number>', 'Port number')
  .option('--open', 'Auto-open browser')
  .addHelpText('after', '\nExamples:\n  sherlock preview scenes/demo.sherlock --open\n  sherlock p scenes/demo.sherlock --port 3010\n')
  .action(runAction(async (sceneFile, options) => {
    const { loadConfig } = require('../lib/commands/config');
    const config = loadConfig();
    const { preview } = require('../lib/commands/preview');
    await preview(sceneFile, {
      ...options,
      port: String(options.port ?? config.defaultPort),
    });
  }));

program
  .command('code <scene-file>')
  .description('Live coding mode with guide panel')
  .option('--guide <topic>', 'Guide topic', 'primitives')
  .addHelpText('after', '\nExamples:\n  sherlock code scenes/demo.sherlock --guide syntax\n')
  .action(runAction(async (sceneFile, options) => {
    const { code } = require('../lib/commands/code');
    await code(sceneFile, options);
  }));

program
  .command('guide [topic]')
  .alias('g')
  .description('Show documentation (primitives, components, syntax)')
  .addHelpText('after', '\nExamples:\n  sherlock guide\n  sherlock g syntax\n')
  .action(runAction(async (topic) => {
    const { guide } = require('../lib/commands/guide');
    await guide(topic);
  }));

program
  .command('examples')
  .alias('ex')
  .description('List example scenes')
  .option('--copy <scene>', 'Copy example to current directory')
  .addHelpText('after', '\nExamples:\n  sherlock examples\n  sherlock ex --copy debug_test\n')
  .action(runAction(async (options) => {
    const { examples } = require('../lib/commands/examples');
    await examples(options);
  }));

program
  .command('interactive [mode]')
  .description('Launch interactive TUI mode (code, preview, render)')
  .addHelpText('after', '\nExamples:\n  sherlock interactive\n  sherlock interactive render\n')
  .action(runAction(async (mode) => {
    const { interactive } = require('../lib/commands/interactive');
    await interactive(mode);
  }));

program
  .command('doctor')
  .description('Run environment and setup diagnostics')
  .option('--json', 'Output diagnostics as JSON')
  .addHelpText('after', '\nExamples:\n  sherlock doctor\n  sherlock doctor --json\n')
  .action(runAction(async (options) => {
    const { doctor } = require('../lib/commands/doctor');
    await doctor(options);
  }));

program.parse(process.argv);
