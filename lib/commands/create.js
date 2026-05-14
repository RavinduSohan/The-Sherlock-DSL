const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { EXIT_CODES } = require('./exit-codes');

function normalizeSceneName(name) {
  const trimmed = String(name || '').trim();
  if (!trimmed) return null;
  if (trimmed.includes('/') || trimmed.includes('\\')) return null;
  return trimmed.endsWith('.sherlock') ? trimmed : `${trimmed}.sherlock`;
}

function toConceptTitle(sceneName) {
  const base = path.basename(sceneName, '.sherlock');
  const title = base.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!title) return 'New Sherlock Scene';
  return title.charAt(0).toUpperCase() + title.slice(1);
}

function buildStarterContent(sceneName, template) {
  if (template === 'blank') {
    return '';
  }

  const concept = toConceptTitle(sceneName);
  const idBase = path.basename(sceneName, '.sherlock').replace(/[^a-zA-Z0-9_]/g, '_') || 'title';
  const id = /^\d/.test(idBase) ? `scene_${idBase}` : idBase;

  return `concept: "${concept}"
emoji: "🎬"
total_duration: 6
background: "#0a0e1a"

subtitles:
  - "${concept}"

phases:
  intro:
    duration: 6
    description: "Introduction"
    elements:
      ${id}:
        type: primitive
        shape: text[text:"${concept}" fontSize:52 fill:#3B82F6 at:(0,0)]
`;
}

async function create(sceneNames, options) {
  const names = Array.isArray(sceneNames) ? sceneNames : [sceneNames];
  if (!names.length) {
    console.error(chalk.red('❌ Error: At least one scene name is required'));
    process.exit(EXIT_CODES.INPUT_VALIDATION);
  }

  const invalidName = names.find((n) => !normalizeSceneName(n));
  if (invalidName) {
    console.error(chalk.red(`❌ Error: Invalid scene name "${invalidName}"`));
    console.error(chalk.gray('Use simple names without path separators, for example: intro_scene'));
    process.exit(EXIT_CODES.INPUT_VALIDATION);
  }

  const sceneFileNames = names.map(normalizeSceneName);
  const uniqueNames = [...new Set(sceneFileNames)];
  const sceneDir = path.resolve(options.dir || 'scenes');

  const templateType = String(options.template || 'starter').toLowerCase();
  if (!['starter', 'blank'].includes(templateType)) {
    console.error(chalk.red(`❌ Error: Invalid template "${options.template}"`));
    console.error(chalk.gray('Valid templates: starter, blank'));
    process.exit(EXIT_CODES.INPUT_VALIDATION);
  }

  let sharedContent = null;
  if (options.from) {
    const sourcePath = path.resolve(options.from);
    if (!fs.existsSync(sourcePath)) {
      console.error(chalk.red(`❌ Error: Source file not found: ${options.from}`));
      console.error(chalk.gray(`Looked at: ${sourcePath}`));
      process.exit(EXIT_CODES.INPUT_VALIDATION);
    }
    sharedContent = await fs.readFile(sourcePath, 'utf8');
  }

  await fs.ensureDir(sceneDir);

  const targetPaths = uniqueNames.map((fileName) => path.join(sceneDir, fileName));
  const existingTargets = targetPaths.filter((targetPath) => fs.existsSync(targetPath));

  if (existingTargets.length && !options.force) {
    console.error(chalk.red('❌ Error: One or more target scene files already exist:'));
    for (const existingPath of existingTargets) {
      console.error(chalk.white(`  - ${path.relative(process.cwd(), existingPath) || existingPath}`));
    }
    console.error(chalk.gray('Use --force to overwrite existing files.'));
    process.exit(EXIT_CODES.INPUT_VALIDATION);
  }

  const created = [];
  for (let i = 0; i < uniqueNames.length; i += 1) {
    const sceneName = uniqueNames[i];
    const targetPath = targetPaths[i];
    const content = sharedContent !== null ? sharedContent : buildStarterContent(sceneName, templateType);
    await fs.writeFile(targetPath, content, 'utf8');
    created.push(targetPath);
  }

  console.log(chalk.green(`\n✅ Created ${created.length} scene file${created.length > 1 ? 's' : ''}:\n`));
  for (const createdPath of created) {
    console.log(chalk.white(`  ${path.relative(process.cwd(), createdPath) || createdPath}`));
  }

  const firstScene = path.relative(process.cwd(), created[0]) || created[0];
  console.log(chalk.cyan('\nNext steps:'));
  console.log(chalk.white(`  sherlock preview ${firstScene}`));
  console.log(chalk.white(`  sherlock render ${firstScene} --output output/${path.basename(firstScene, '.sherlock')}.mp4\n`));
}

module.exports = { create };
