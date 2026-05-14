const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const Table = require('cli-table3');
const { EXIT_CODES } = require('./exit-codes');

function guide(topic) {
  const guidesPath = path.join(__dirname, '../../guides');
  
  if (!topic) {
    // List available guides
    console.log(chalk.cyan.bold('\n📚 Available Guides:\n'));
    
    const table = new Table({
      head: ['Topic', 'Command'],
      style: { head: ['cyan'] }
    });

    table.push(
      ['Primitives', 'sherlock guide primitives'],
      ['Components', 'sherlock guide components'],
      ['Syntax', 'sherlock guide syntax'],
      ['Examples', 'sherlock examples']
    );

    console.log(table.toString());
    console.log(chalk.gray('\n💡 Tip: Use "sherlock guide <topic>" to view specific documentation\n'));
    return;
  }

  // Show specific guide
  const guidePath = path.join(guidesPath, `${topic}.md`);
  
  if (!fs.existsSync(guidePath)) {
    console.error(chalk.red(`❌ Guide not found: ${topic}`));
    console.log(chalk.yellow('\n📚 Available guides: primitives, components, syntax'));
    console.log(chalk.gray('Run "sherlock guide" to see all options\n'));
    process.exit(EXIT_CODES.INPUT_VALIDATION);
  }

  const content = fs.readFileSync(guidePath, 'utf-8');
  console.log(content);
}

module.exports = { guide };
