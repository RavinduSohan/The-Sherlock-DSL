const fs = require('fs-extra');
const ora = require('ora');
const chalk = require('chalk');
const path = require('path');
const { EXIT_CODES } = require('./exit-codes');

const WORKSPACE_DIR_NAME = 'sherlock-workspace';

const DEFAULT_INTRO_SCENE = `# My First Sherlock Animation
concept: "Welcome to Sherlock"
emoji: "🎬"
total_duration: 6
background: "#0a0e1a"

subtitles:
  - "Welcome to Sherlock"

phases:
  intro:
    duration: 6
    description: "Starter scene"
    elements:
      title:
        type: primitive
        shape: text[text:"Welcome to Sherlock!" fontSize:56 fill:#3B82F6 at:(0,1)]

      subtitle:
        type: primitive
        shape: text[text:"Create animations with code" fontSize:24 fill:#8B5CF6 at:(0,-0.5)]

      dot:
        type: primitive
        shape: circle[r:0.8 fill:#10B981 at:(0,-2)]
`;

async function init(projectName) {
  const normalizedProjectName = String(projectName || '').trim();
  const spinner = ora(`Creating ${normalizedProjectName}...`).start();

  try {
    if (!normalizedProjectName) {
      spinner.fail(chalk.red('Project name is required'));
      process.exit(EXIT_CODES.INPUT_VALIDATION);
    }

    if (path.basename(normalizedProjectName) !== normalizedProjectName || normalizedProjectName.includes('/') || normalizedProjectName.includes('\\')) {
      spinner.fail(chalk.red('Project name must be a folder name (no path separators)'));
      process.exit(EXIT_CODES.INPUT_VALIDATION);
    }

    const cwd = process.cwd();
    const workspaceRoot = path.basename(cwd).toLowerCase() === WORKSPACE_DIR_NAME
      ? cwd
      : path.join(cwd, WORKSPACE_DIR_NAME);
    const projectPath = path.join(workspaceRoot, normalizedProjectName);
    const displayPath = path.relative(cwd, projectPath) || projectPath;

    await fs.ensureDir(workspaceRoot);

    // Check if exists
    if (fs.existsSync(projectPath)) {
      spinner.fail(chalk.red('Directory already exists'));
      process.exit(EXIT_CODES.INPUT_VALIDATION);
    }

    // Copy template
    const templatePath = path.join(__dirname, '../../templates/basic');
    
    if (!fs.existsSync(templatePath)) {
      spinner.warn(chalk.yellow('Template not found, creating minimal project'));
      
      // Create minimal structure
      await fs.mkdirp(path.join(projectPath, 'scenes'));
      
      // Create basic scene
      await fs.writeFile(
        path.join(projectPath, 'scenes', 'intro.sherlock'),
        DEFAULT_INTRO_SCENE
      );
      
      // Create basic package.json
      const pkg = {
        name: normalizedProjectName.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'sherlock-project',
        version: '1.0.0',
        description: 'Sherlock animation project',
        scripts: {
          preview: 'sherlock preview scenes/intro.sherlock',
          render: 'sherlock render scenes/intro.sherlock'
        }
      };
      
      await fs.writeJson(path.join(projectPath, 'package.json'), pkg, { spaces: 2 });
      
      // Create README
      const readme = `# ${normalizedProjectName}

Created with [Sherlock](https://github.com/yourusername/sherlock-lang)

## Quick Start

\`\`\`bash
# Preview your animation
sherlock preview scenes/intro.sherlock

# Export to video
sherlock render scenes/intro.sherlock -o output.mp4
\`\`\`

## Learn More

\`\`\`bash
# View documentation
sherlock guide primitives

# See examples
sherlock examples
\`\`\`
`;
      
      await fs.writeFile(path.join(projectPath, 'README.md'), readme);
    } else {
      await fs.copy(templatePath, projectPath);
      
      // Update package.json
      const pkgPath = path.join(projectPath, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = await fs.readJson(pkgPath);
        pkg.name = normalizedProjectName.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'sherlock-project';
        await fs.writeJson(pkgPath, pkg, { spaces: 2 });
      }
    }

    spinner.succeed(chalk.green(`Created ${displayPath}`));

    console.log(chalk.cyan('\n🎬 Next steps:\n'));
    console.log(chalk.white(`  cd ${displayPath}`));
    console.log(chalk.white(`  sherlock preview scenes/intro.sherlock`));
    console.log(chalk.white(`  sherlock render scenes/intro.sherlock -o output/intro.mp4\n`));
    console.log(chalk.gray('📚 Learn more: sherlock guide\n'));
  } catch (error) {
    spinner.fail('Failed to create project');
    console.error(error);
    process.exit(EXIT_CODES.RUNTIME_FAILURE);
  }
}

module.exports = { init };
