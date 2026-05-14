const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const Table = require('cli-table3');
const { EXIT_CODES } = require('./exit-codes');

// Categorize examples for better organization
const categories = {
  'Basics': ['abc', 'abc_commented', 'component_package', 'simple_test', 'debug'],
  'Mathematics': ['auto_xy', 'coordinate', 'dot_product', 'gradient', 'bell_curve'],
  'Vectors & Matrices': ['vector', 'matrix', 'grid_transform', 'enhanced_vector'],
  'Algorithms': ['algorithm', 'atlantic_pacific', 'alien_dictionary'],
  'Neural Networks': ['neural_network', 'atomic_seed'],
  'Animation': ['animation_gallery', 'primitives_showcase', 'parametric', 'morph', 'path_follower'],
  'Creative': ['christmas', 'emoji_story', 'hope', 'detective_wisdom'],
  'Advanced': ['image_card', 'dsl_technical']
};

function categorizeScene(filename) {
  const name = filename.toLowerCase();
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => name.includes(keyword))) {
      return category;
    }
  }
  return 'Other';
}

async function examples(options) {
  const examplesPath = path.join(__dirname, '../../scenes');
  
  if (!fs.existsSync(examplesPath)) {
    console.error(chalk.red('❌ Examples directory not found'));
    process.exit(EXIT_CODES.RUNTIME_FAILURE);
  }

  const files = fs.readdirSync(examplesPath)
    .filter(f => f.endsWith('.sherlock'))
    .sort();

  if (options.copy) {
    // Copy example to current directory
    const sourceFile = files.find(f => 
      f.includes(options.copy) || 
      f === `${options.copy}.sherlock` ||
      f.replace('.sherlock', '').toLowerCase() === options.copy.toLowerCase()
    );
    
    if (!sourceFile) {
      console.error(chalk.red(`❌ Example not found: ${options.copy}`));
      console.log(chalk.yellow('\n💡 Run "sherlock examples" to see all available examples'));
      console.log(chalk.gray('   Tip: Use partial names like "neural" instead of full name\n'));
      process.exit(EXIT_CODES.INPUT_VALIDATION);
    }

    const source = path.join(examplesPath, sourceFile);
    const dest = path.join(process.cwd(), sourceFile);
    
    if (fs.existsSync(dest)) {
      console.error(chalk.red(`❌ File already exists: ${sourceFile}`));
      console.log(chalk.yellow(`\n💡 Remove the existing file first or use a different name\n`));
      process.exit(EXIT_CODES.INPUT_VALIDATION);
    }

    await fs.copy(source, dest);
    console.log(chalk.green(`\n✅ Copied: ${sourceFile}\n`));
    console.log(chalk.cyan(`🎬 Preview: sherlock preview ${sourceFile}`));
    console.log(chalk.cyan(`📹 Render:  sherlock render ${sourceFile} -o output.mp4\n`));
    return;
  }

  // List examples with categories
  console.log(chalk.cyan.bold('\n🎬 Sherlock Example Scenes\n'));
  console.log(chalk.gray(`Found ${files.length} example scenes\n`));

  // Group by category
  const grouped = {};
  for (const file of files) {
    const category = categorizeScene(file);
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push(file);
  }

  // Display by category
  for (const [category, categoryFiles] of Object.entries(grouped).sort()) {
    console.log(chalk.yellow(`\n${category}:`));
    
    const table = new Table({
      head: ['Scene', 'Description'],
      style: { head: ['cyan'], border: ['gray'] },
      colWidths: [40, 50],
      chars: {
        'top': '─', 'top-mid': '┬', 'top-left': '┌', 'top-right': '┐',
        'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '└', 'bottom-right': '┘',
        'left': '│', 'left-mid': '├', 'mid': '─', 'mid-mid': '┼',
        'right': '│', 'right-mid': '┤', 'middle': '│'
      }
    });

    for (const file of categoryFiles.slice(0, 5)) {
      const name = file.replace('.sherlock', '');
      try {
        const content = fs.readFileSync(path.join(examplesPath, file), 'utf-8');
        const conceptMatch = content.match(/concept:\s*["'](.+?)["']/);
        const concept = conceptMatch ? conceptMatch[1] : 'Demo scene';
        
        table.push([
          chalk.white(name),
          chalk.gray(concept.length > 45 ? concept.substring(0, 45) + '...' : concept)
        ]);
      } catch (error) {
        table.push([
          chalk.white(name),
          chalk.gray('Demo scene')
        ]);
      }
    }

    console.log(table.toString());
    
    if (categoryFiles.length > 5) {
      console.log(chalk.dim(`   ... and ${categoryFiles.length - 5} more in this category`));
    }
  }
  
  console.log(chalk.cyan('\n📖 Usage:'));
  console.log(chalk.white('  sherlock examples --copy <name>     Copy an example to current directory'));
  console.log(chalk.white('  sherlock preview scenes/<file>      Preview an example'));
  console.log(chalk.white('  sherlock render scenes/<file>       Render an example to video'));
  
  console.log(chalk.gray('\n💡 Tips:'));
  console.log(chalk.dim('  • Start with "abc_commented" for a guided introduction'));
  console.log(chalk.dim('  • Use partial names: --copy neural (not full neural_network_demo.sherlock)'));
  console.log(chalk.dim('  • Check scenes/README.md for detailed categorization\n'));
}

module.exports = { examples };
