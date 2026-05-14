const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const chalk = require('chalk');

// Default configuration
const defaultConfig = {
  defaultWidth: 1920,
  defaultHeight: 1080,
  defaultFps: 30,
  defaultQuality: 18,
  defaultPort: 3000,
  scenesDir: 'scenes',
  outputDir: 'output',
};

/**
 * Load .sherlockrc configuration file
 */
function loadConfig() {
  const configPaths = [
    path.join(process.cwd(), '.sherlockrc'),
    path.join(process.cwd(), '.sherlockrc.json'),
    path.join(os.homedir(), '.sherlockrc'),
    path.join(os.homedir(), '.sherlockrc.json'),
  ];

  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      try {
        const content = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(content);
        return { ...defaultConfig, ...config };
      } catch (error) {
        console.error(chalk.yellow(`Warning: Could not parse config file: ${configPath}`));
      }
    }
  }

  return defaultConfig;
}

/**
 * Get configuration value with fallback
 */
function getConfig(key, fallback) {
  const config = loadConfig();
  return config[key] !== undefined ? config[key] : fallback;
}

/**
 * Create a sample .sherlockrc file
 */
function createSampleConfig(outputPath) {
  const sampleConfig = {
    ...defaultConfig,
    // Comments in JSON5 format (for documentation)
    _comment1: 'Sherlock CLI Configuration',
    _comment2: 'Default video export settings',
    _comment3: 'You can override these with command-line options',
  };

  const content = JSON.stringify(sampleConfig, null, 2);
  fs.writeFileSync(outputPath, content);
  
  console.log(chalk.green(`✅ Created config file: ${outputPath}`));
  console.log(chalk.gray('\nEdit this file to customize your defaults\n'));
}

module.exports = {
  loadConfig,
  getConfig,
  createSampleConfig,
  defaultConfig,
};
