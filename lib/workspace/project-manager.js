const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

const WORKSPACE_ROOT = process.cwd();
const SCENES_DIR = path.join(WORKSPACE_ROOT, 'scenes');
const OUTPUT_DIR = path.join(WORKSPACE_ROOT, 'output');
const DRAFTS_DIR = path.join(WORKSPACE_ROOT, '.sherlock-workspace', 'drafts');
const TEMPLATES_DIR = path.join(WORKSPACE_ROOT, 'templates');
const SETTINGS_FILE = path.join(WORKSPACE_ROOT, '.sherlock-settings.json');

/**
 * Initialize workspace directories
 */
async function initializeWorkspace() {
  try {
    await fs.ensureDir(SCENES_DIR);
    await fs.ensureDir(OUTPUT_DIR);
    await fs.ensureDir(DRAFTS_DIR);
    
    // Create default settings if doesn't exist
    if (!await fs.pathExists(SETTINGS_FILE)) {
      await saveSettings(getDefaultSettings());
    }
    
    return true;
  } catch (error) {
    console.error(chalk.red('Error initializing workspace:'), error.message);
    return false;
  }
}

/**
 * Get default settings
 */
function getDefaultSettings() {
  return {
    defaultWidth: 1920,
    defaultHeight: 1080,
    defaultFps: 60,
    defaultQuality: 18,
    previewPort: 3000,
    outputDir: 'output',
    editor: 'notepad',
    autoSave: true,
    syntaxGuide: 'split'
  };
}

/**
 * Load settings
 */
async function loadSettings() {
  try {
    if (await fs.pathExists(SETTINGS_FILE)) {
      return await fs.readJson(SETTINGS_FILE);
    }
    return getDefaultSettings();
  } catch (error) {
    return getDefaultSettings();
  }
}

/**
 * Save settings
 */
async function saveSettings(settings) {
  try {
    await fs.writeJson(SETTINGS_FILE, settings, { spaces: 2 });
    return true;
  } catch (error) {
    console.error(chalk.red('Error saving settings:'), error.message);
    return false;
  }
}

/**
 * Get all .sherlock files
 */
async function getSherlockFiles() {
  try {
    await fs.ensureDir(SCENES_DIR);
    const files = await fs.readdir(SCENES_DIR);
    const sherlockFiles = files.filter(f => f.endsWith('.sherlock'));
    
    const fileStats = await Promise.all(
      sherlockFiles.map(async (file) => {
        const filePath = path.join(SCENES_DIR, file);
        const stats = await fs.stat(filePath);
        return {
          name: file,
          path: filePath,
          size: formatFileSize(stats.size),
          modified: stats.mtime,
          bytes: stats.size
        };
      })
    );
    
    return fileStats.sort((a, b) => b.modified - a.modified);
  } catch (error) {
    console.error(chalk.red('Error getting files:'), error.message);
    return [];
  }
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Create new scene file
 */
async function createSceneFile(name, content = null) {
  try {
    await fs.ensureDir(SCENES_DIR);
    const fileName = name.endsWith('.sherlock') ? name : `${name}.sherlock`;
    const filePath = path.join(SCENES_DIR, fileName);
    
    if (await fs.pathExists(filePath)) {
      throw new Error('File already exists');
    }
    
    const defaultContent = content || `concept: "${name}"
emoji: "🎨"
total_duration: 10
background: "#0a0e1a"

subtitles:
  - ""
  - ""

phases:
  intro:
    duration: 5
    description: "Introduction"
    elements:
      my_text:
        type: primitive
        shape: text[text:"Hello Sherlock!" fontSize:48 fill:#00ff88 at:(0,100)] -> fadeIn(1s)
      my_circle:
        type: primitive
        shape: circle[r:50 fill:#ff0088 at:(0,-100)] -> fadeIn(1s, 0.5s) -> scale(1.2, 0.5s, 1.5s) -> scale(1.0, 0.5s)
`;
    
    await fs.writeFile(filePath, defaultContent, 'utf-8');
    return filePath;
  } catch (error) {
    throw error;
  }
}

/**
 * Get available templates
 */
async function getTemplates() {
  const templates = [
    {
      name: 'Basic Template',
      description: 'Simple circle and text animation',
      path: 'basic',
      content: `concept: "Basic Animation"
emoji: "🎨"
total_duration: 5
background: "#0a0e1a"

subtitles:
  - ""

phases:
  intro:
    duration: 5
    elements:
      circle:
        type: primitive
        shape: circle[r:50 fill:#ff0088 at:(0,0)] -> fadeIn(1s) -> scale(1.5, 1s, 1s)`
    },
    {
      name: 'Text Animation Template',
      description: 'Text with fade and movement',
      path: 'text',
      content: `concept: "Text Animation"
emoji: "📝"
total_duration: 5
background: "#0a0e1a"

subtitles:
  - ""

phases:
  intro:
    duration: 5
    elements:
      title:
        type: primitive
        shape: text[text:"Your Title Here" fontSize:64 fill:#00ff88 at:(0,0)] -> fadeIn(1s) -> moveTo((0,100), 1s, ease.out, 1s)`
    },
    {
      name: 'Function Graph Template',
      description: 'Mathematical function visualization',
      path: 'graph',
      content: `concept: "Function Graph"
emoji: "📈"
total_duration: 5
background: "#0a0e1a"

subtitles:
  - ""

phases:
  intro:
    duration: 5
    elements:
      curve:
        type: primitive
        shape: functionGraph[fn:"x*x" xStart:-3 xEnd:3 segments:50 stroke:#00ffff strokeWidth:2 at:(0,0)] -> fadeIn(2s)`
    }
  ];
  
  // Check for template files in scenes/ starting with "template_"
  try {
    const files = await fs.readdir(SCENES_DIR);
    const templateFiles = files.filter(f => f.startsWith('template_') && f.endsWith('.sherlock'));
    
    for (const file of templateFiles) {
      const filePath = path.join(SCENES_DIR, file);
      const content = await fs.readFile(filePath, 'utf-8');
      templates.push({
        name: file.replace('template_', '').replace('.sherlock', ''),
        description: 'Custom template',
        path: filePath,
        content
      });
    }
  } catch (error) {
    // Ignore errors reading templates
  }
  
  return templates;
}

/**
 * Auto-save draft
 */
async function autoSaveDraft(fileName, content) {
  try {
    await fs.ensureDir(DRAFTS_DIR);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const draftName = `${path.basename(fileName, '.sherlock')}-${timestamp}.sherlock`;
    const draftPath = path.join(DRAFTS_DIR, draftName);
    await fs.writeFile(draftPath, content, 'utf-8');
    return draftPath;
  } catch (error) {
    console.error(chalk.yellow('Warning: Auto-save failed'), error.message);
    return null;
  }
}

/**
 * Get recent drafts
 */
async function getRecentDrafts(limit = 10) {
  try {
    await fs.ensureDir(DRAFTS_DIR);
    const files = await fs.readdir(DRAFTS_DIR);
    const draftFiles = files.filter(f => f.endsWith('.sherlock'));
    
    const drafts = await Promise.all(
      draftFiles.map(async (file) => {
        const filePath = path.join(DRAFTS_DIR, file);
        const stats = await fs.stat(filePath);
        return {
          name: file,
          path: filePath,
          modified: stats.mtime
        };
      })
    );
    
    return drafts
      .sort((a, b) => b.modified - a.modified)
      .slice(0, limit);
  } catch (error) {
    return [];
  }
}

module.exports = {
  WORKSPACE_ROOT,
  SCENES_DIR,
  OUTPUT_DIR,
  DRAFTS_DIR,
  TEMPLATES_DIR,
  SETTINGS_FILE,
  initializeWorkspace,
  getDefaultSettings,
  loadSettings,
  saveSettings,
  getSherlockFiles,
  createSceneFile,
  getTemplates,
  autoSaveDraft,
  getRecentDrafts
};
