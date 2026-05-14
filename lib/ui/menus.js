const inquirer = require('inquirer');
const chalk = require('chalk');
const boxen = require('boxen');
const figlet = require('figlet');
const gradient = require('gradient-string');

/**
 * Display the main Sherlock header
 */
function showHeader() {
  console.clear();
  
  // Premium cinematic header
  const header = figlet.textSync('SHERLOCK', {
    font: 'ANSI Shadow',
    horizontalLayout: 'default'
  });
  
  console.log(gradient(['#00d4ff', '#0066ff', '#7b2cbf']).multiline(header));
  console.log(
    boxen(
      chalk.hex('#00d4ff').bold('━━━ PROFESSIONAL ANIMATION STUDIO ━━━\n') +
      chalk.white('🎯 Precision Animation Engine  •  🎬 STEM Visualization  •  ⚡ Production Ready\n') +
      chalk.gray('Transform .sherlock scripts into cinematic educational content'),
      {
        padding: 1,
        margin: { top: 1, bottom: 1, left: 2, right: 2 },
        borderStyle: 'double',
        borderColor: '#7b2cbf',
        dimBorder: false
      }
    )
  );
}

/**
 * Show the main menu
 */
async function showMainMenu() {
  showHeader();
  
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: chalk.hex('#00d4ff').bold('▶ Select Action:'),
      choices: [
        {
          name: chalk.hex('#00ff88')('⚡ Code New Animation') + chalk.gray(' → Create fresh content'),
          value: 'code'
        },
        {
          name: chalk.hex('#00d4ff')('🌐 Live Preview Studio') + chalk.gray(' → Launch preview environment'),
          value: 'preview'
        },
        {
          name: chalk.hex('#ff0088')('📹 Export to Video') + chalk.gray(' → Render production output'),
          value: 'render'
        },
        {
          name: chalk.hex('#ffd700')('📚 Syntax Reference') + chalk.gray(' → View primitives & components'),
          value: 'guide'
        },
        {
          name: chalk.hex('#888888')('⚙️  Configuration') + chalk.gray(' → Adjust settings'),
          value: 'settings'
        },
        new inquirer.Separator(),
        {
          name: chalk.gray('🚪 Exit Studio'),
          value: 'exit'
        }
      ],
      pageSize: 10
    }
  ]);
  
  return action;
}

/**
 * Ask for animation name
 */
async function askAnimationName(defaultName = 'my-animation') {
  const { name } = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: chalk.hex('#ffd700').bold('Animation name:'),
      default: defaultName,
      validate: (input) => {
        if (input.trim().length === 0) {
          return chalk.red('Name cannot be empty');
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(input)) {
          return chalk.red('Name can only contain letters, numbers, hyphens, and underscores');
        }
        return true;
      },
      transformer: (input) => {
        return chalk.hex('#00d4ff')(input);
      }
    }
  ]);
  
  return name;
}

/**
 * Choose coding method
 */
async function chooseCodingMethod() {
  const { method } = await inquirer.prompt([
    {
      type: 'list',
      name: 'method',
      message: chalk.hex('#00d4ff').bold('Select coding method:'),
      choices: [
        {
          name: chalk.hex('#00ff88')('✍️  Text Editor') + chalk.gray(' → Open in your default editor (Recommended)'),
          value: 'editor'
        },
        {
          name: chalk.hex('#00d4ff')('📋 Paste Code') + chalk.gray(' → Paste YAML directly in terminal'),
          value: 'paste'
        },
        {
          name: chalk.hex('#ff0088')('📂 From Template') + chalk.gray(' → Start with example code'),
          value: 'template'
        },
        new inquirer.Separator(),
        {
          name: chalk.gray('🔙 Back to Main Menu'),
          value: 'back'
        }
      ]
    }
  ]);
  
  return method;
}

/**
 * Choose action after coding
 */
async function chooseNextAction(fileName) {
  console.log(chalk.hex('#00ff88')(`\n✓ ${chalk.white(fileName)} ${chalk.gray('saved successfully!')}\n`));
  
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: chalk.hex('#00d4ff').bold('What would you like to do next?'),
      choices: [
        {
          name: chalk.hex('#00ff88')('👁️  Live Preview') + chalk.gray(' → Launch in browser'),
          value: 'preview'
        },
        {
          name: chalk.hex('#ff0088')('📹 Render Video') + chalk.gray(' → Export to MP4'),
          value: 'render'
        },
        {
          name: chalk.hex('#ffd700')('✏️  Edit Again') + chalk.gray(' → Continue editing'),
          value: 'edit'
        },
        {
          name: chalk.hex('#00d4ff')('📋 Create Another') + chalk.gray(' → New animation'),
          value: 'new'
        },
        new inquirer.Separator(),
        {
          name: chalk.gray('🏠 Return to Main Menu'),
          value: 'menu'
        }
      ]
    }
  ]);
  
  return action;
}

/**
 * Select a .sherlock file with search/filter
 */
async function selectSherlockFile(files, message = 'Select a .sherlock file:') {
  if (files.length === 0) {
    console.log(chalk.yellow('\n⚠️  No .sherlock files found in scenes/ directory'));
    console.log(chalk.gray('Create one by choosing "Code New Animation" from the main menu\n'));
    return null;
  }
  
  // Ask if user wants to search or browse
  const { method } = await inquirer.prompt([
    {
      type: 'list',
      name: 'method',
      message: chalk.hex('#00d4ff').bold('How would you like to select?'),
      choices: [
        {
          name: chalk.hex('#00ff88')('🔍 Type to Search') + chalk.gray(' → Filter by name'),
          value: 'search'
        },
        {
          name: chalk.hex('#00d4ff')('📋 Browse List') + chalk.gray(` → View all ${files.length} files`),
          value: 'browse'
        },
        new inquirer.Separator(),
        {
          name: chalk.gray('🔙 Back'),
          value: 'back'
        }
      ]
    }
  ]);
  
  if (method === 'back') return 'back';
  
  if (method === 'search') {
    const { searchTerm } = await inquirer.prompt([
      {
        type: 'input',
        name: 'searchTerm',
        message: chalk.hex('#ffd700')('🔍 Type scene name or keyword:'),
        validate: (input) => input.trim().length > 0 || 'Please enter a search term'
      }
    ]);
    
    const filtered = files.filter(f => 
      f.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (filtered.length === 0) {
      console.log(chalk.yellow(`\n⚠️  No files matching "${searchTerm}" found`));
      const { retry } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'retry',
          message: 'Try another search?',
          default: true
        }
      ]);
      
      if (retry) {
        return selectSherlockFile(files, message);
      }
      return 'back';
    }
    
    files = filtered;
    console.log(chalk.green(`\n✓ Found ${filtered.length} matching file${filtered.length > 1 ? 's' : ''}\n`));
  }
  
  const choices = files.map(file => ({
    name: chalk.hex('#00d4ff')(`▸ ${file.name}`) + chalk.gray(`  (${file.size})`),
    value: file.path,
    short: file.name
  }));
  
  choices.push(new inquirer.Separator());
  choices.push({
    name: chalk.gray('🔙 Back to Main Menu'),
    value: 'back'
  });
  
  const { file } = await inquirer.prompt([
    {
      type: 'list',
      name: 'file',
      message: chalk.hex('#00d4ff').bold(message),
      choices,
      pageSize: 15
    }
  ]);
  
  return file;
}

/**
 * Choose preview mode
 */
async function choosePreviewMode() {
  const { mode } = await inquirer.prompt([
    {
      type: 'list',
      name: 'mode',
      message: chalk.hex('#00d4ff').bold('Preview Mode:'),
      choices: [
        {
          name: chalk.hex('#00ff88')('🌐 Browser Preview') + chalk.gray(' → Live preview with controls'),
          value: 'browser'
        },
        {
          name: chalk.hex('#ffd700')('✏️  Edit & Preview') + chalk.gray(' → Split view mode'),
          value: 'edit'
        },
        new inquirer.Separator(),
        {
          name: chalk.gray('🔙 Back'),
          value: 'back'
        }
      ]
    }
  ]);
  
  return mode;
}

/**
 * Choose template
 */
async function chooseTemplate(templates) {
  const choices = templates.map((t, i) => ({
    name: `${i + 1}. ${t.name} ${chalk.gray(`- ${t.description}`)}`,
    value: t.path,
    short: t.name
  }));
  
  choices.push(new inquirer.Separator());
  choices.push({
    name: '🔙 Back',
    value: 'back'
  });
  
  const { template } = await inquirer.prompt([
    {
      type: 'list',
      name: 'template',
      message: 'Choose a template:',
      choices,
      pageSize: 10
    }
  ]);
  
  return template;
}

/**
 * Confirm action
 */
async function confirm(message, defaultValue = true) {
  const { confirmed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message,
      default: defaultValue
    }
  ]);
  
  return confirmed;
}

/**
 * Show loading message with spinner
 */
function showLoading(message) {
  const ora = require('ora');
  return ora(message).start();
}

/**
 * Show success box
 */
function showSuccess(message) {
  console.log(
    boxen(chalk.green('✓ ' + message), {
      padding: 1,
      borderStyle: 'round',
      borderColor: 'green'
    })
  );
}

/**
 * Show error box
 */
function showError(message) {
  console.log(
    boxen(chalk.red('✗ ' + message), {
      padding: 1,
      borderStyle: 'round',
      borderColor: 'red'
    })
  );
}

/**
 * Show info box
 */
function showInfo(message) {
  console.log(
    boxen(chalk.cyan('ℹ ' + message), {
      padding: 1,
      borderStyle: 'round',
      borderColor: 'cyan'
    })
  );
}

/**
 * Display syntax guide in terminal
 */
async function displaySyntaxGuide() {
  console.clear();
  
  console.log(
    boxen(
      chalk.hex('#ffd700').bold('📚 SHERLOCK SYNTAX REFERENCE') + '\n' +
      chalk.gray('Quick reference for primitives and components'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'double',
        borderColor: '#ffd700'
      }
    )
  );
  
  const exampleCode = 'phases:\\n  intro:\\n    duration: 5\\n    elements:\\n      my_circle:\\n        type: primitive\\n        shape: circle[r:50 fill:#ff0088 at:(0,0)] -> fadeIn(1s) -> scale(1.5, 1s, ease.out, 1s)\\n      \\n      my_text:\\n        type: primitive\\n        shape: text[text:"Hello!" fontSize:64 fill:#00ff88 at:(0,100)] -> fadeIn(1s, 0.5s)';
  
  const guide = `
${chalk.hex('#00ff88').bold('═══ CORE PRIMITIVES ═══')}

${chalk.hex('#00d4ff').bold('• Text')}
  ${chalk.white('text[text:"Hello" fontSize:48 fill:#00ff88 at:(0,100)]')}
  ${chalk.gray('Properties:')} text, fontSize, fill, stroke, at:(x,y)

${chalk.hex('#00d4ff').bold('• Circle')}
  ${chalk.white('circle[r:50 fill:#ff0088 at:(0,0)]')}
  ${chalk.gray('Properties:')} r (radius), fill, stroke, strokeWidth, at:(x,y)

${chalk.hex('#00d4ff').bold('• Rectangle')}
  ${chalk.white('rect[w:100 h:60 fill:#0088ff at:(0,0)]')}
  ${chalk.gray('Properties:')} w (width), h (height), fill, stroke, cornerRadius, at:(x,y)

${chalk.hex('#00d4ff').bold('• Line')}
  ${chalk.white('line[from:(-100,0) to:(100,0) stroke:#ffffff strokeWidth:2]')}
  ${chalk.gray('Properties:')} from:(x,y), to:(x,y), stroke, strokeWidth

${chalk.hex('#00d4ff').bold('• Arrow')}
  ${chalk.white('arrow[from:(0,0) to:(100,100) stroke:#ff0088 arrowSize:10]')}
  ${chalk.gray('Properties:')} from:(x,y), to:(x,y), stroke, arrowSize

${chalk.hex('#00d4ff').bold('• Path')}
  ${chalk.white('path[points:[(0,0),(50,100),(100,0)] stroke:#00ff88 strokeWidth:2]')}
  ${chalk.gray('Properties:')} points:[(x,y),...], stroke, strokeWidth, fill, closed:true/false

${chalk.hex('#00d4ff').bold('• Function Graph')}
  ${chalk.white('functionGraph[fn:"x*x" xStart:-3 xEnd:3 segments:50 stroke:#00ffff]')}
  ${chalk.gray('Properties:')} fn (formula), xStart, xEnd, segments, stroke, strokeWidth

${chalk.hex('#00ff88').bold('═══ TRANSFORMATIONS ═══')}

${chalk.white('-> fadeIn(duration)')}               ${chalk.gray('Fade in element')}
${chalk.white('-> fadeOut(duration, delay)')}       ${chalk.gray('Fade out with delay')}
${chalk.white('-> moveTo((x,y), duration)')}        ${chalk.gray('Move to position')}
${chalk.white('-> scale(factor, duration, delay)')} ${chalk.gray('Scale element')}
${chalk.white('-> rotate(degrees, duration)')}      ${chalk.gray('Rotate element')}
${chalk.white('-> morphTo(shape, duration)')}       ${chalk.gray('Morph between shapes')}

${chalk.hex('#00ff88').bold('═══ EASING FUNCTIONS ═══')}

${chalk.white('ease.in')}    ${chalk.white('ease.out')}   ${chalk.white('ease.inOut')}
${chalk.white('ease.linear')} ${chalk.white('ease.bounce')} ${chalk.white('ease.elastic')}

${chalk.hex('#00ff88').bold('═══ EXAMPLE USAGE ═══')}

${chalk.white(exampleCode)}

${chalk.hex('#ffd700').bold('═══ TIPS ═══')}

${chalk.gray('•')} Use ${chalk.white('at:(x,y)')} to position elements (0,0 is center)
${chalk.gray('•')} Chain animations with ${chalk.white('->')} operator
${chalk.gray('•')} Add delays: ${chalk.white('-> fadeIn(1s, 0.5s)')} (0.5s delay)
${chalk.gray('•')} Colors: hex ${chalk.white('#00ff88')} or names ${chalk.white('red')}
${chalk.gray('•')} Check examples: Browse existing .sherlock files

${chalk.hex('#00d4ff')('For detailed docs:')} guides/primitives.md, guides/components.md
`;

  console.log(guide);
  
  await confirm(chalk.gray('\\nPress Enter to return to main menu...'));
}

module.exports = {
  showHeader,
  showMainMenu,
  askAnimationName,
  chooseCodingMethod,
  chooseNextAction,
  selectSherlockFile,
  choosePreviewMode,
  chooseTemplate,
  confirm,
  showLoading,
  showSuccess,
  showError,
  showInfo,
  displaySyntaxGuide
};
