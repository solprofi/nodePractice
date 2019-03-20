const readline = require('readline');
const util = require('util');

const debug = util.debuglog('cli');
const events = require('events');
const helpers = require('./helpers');

class _events extends events { }

const e = new _events();


const cli = {};

// input handlers
e.on('man', () => {
  cli.responders.help();
});

e.on('help', () => {
  cli.responders.help();
});

e.on('exit', () => {
  cli.responders.exit();
});

e.on('stats', () => {
  cli.responders.stats();
});

e.on('list users', () => {
  cli.responders.listUsers();
});

e.on('more users info', (str) => {
  cli.responders.moreUsersInfo(str);
});

e.on('list checks', (str) => {
  cli.responders.listChecks(str);
});

e.on('more checks info', (str) => {
  cli.responders.moreChecksInfo(str);
});

e.on('list logs', () => {
  cli.responders.listLogs();
});

e.on('more logs info', () => {
  cli.responders.moreLogsInfo();
});

// responders
cli.responders = {};

cli.responders.help = () => {
  const commands = {
    exit: 'Kill the app',
    man: 'Show this help page',
    help: 'Alias for man command',
    stats: 'Get the stats',
    'list users': 'Show  all the registered users',
    'more users info --<userId>': 'Show detaild of a specific user',
    'list checks --<up|down>': 'Show the list of all checks with optional flags',
    'more checks info --<checkId>': 'Show details for a specified check',
    'list logs': 'List all the log files',
    'more logs info --<filaname>': 'Show details for a specified file',
  };

  // show a header for the page
  cli.horizontalLine();
  cli.centered('CLI MANUAL');
  cli.horizontalLine();
  cli.vericalSpace(2);

  // show each command followed by its descriptipn

  Object.keys(commands).forEach((key) => {
    const val = commands[key];
    let str = `\x1b[34m${key}\x1b[0m`;
    const padding = 60 - str.length;

    const strToAdd = helpers.fillWithChars(' ', padding);

    str += strToAdd;

    console.log(str + val);
    cli.vericalSpace();
  });
  cli.horizontalLine();
};

cli.vericalSpace = (numOfLines) => {
  numOfLines = typeof (numOfLines) === 'number' && numOfLines > 0 ? numOfLines : 1;
  for (let i = 0; i < numOfLines; i++) {
    console.log('');
  }
};

cli.horizontalLine = () => {
  // get the screen width
  const width = process.stdout.columns;
  const line = helpers.fillWithChars('-', width);

  console.log(line);
};

cli.centered = (str) => {
  str = helpers.checkString(str);

  const width = process.stdout.columns;

  const leftPadding = Math.floor((width - str.length) / 2);
  const line = helpers.fillWithChars(' ', leftPadding);

  console.log(line + str);
};

cli.responders.exit = () => {
  process.exit(0);
};

cli.responders.stats = () => {
  console.log('You asked for stats');
};

cli.responders.listUsers = () => {
  console.log('You asked for listUsers');
};

cli.responders.moreUsersInfo = (str) => {
  console.log('You asked for moreUsersInfo', str);
};

cli.responders.moreChecksInfo = (str) => {
  console.log('You asked for moreChecksInfo', str);
};

cli.responders.listLogs = (str) => {
  console.log('You asked for listLogs', str);
};

cli.responders.moreLogsInfo = (str) => {
  console.log('You asked for moreLogsInfo', str);
};


cli.init = () => {
  console.log('\x1b[34m%s\x1b[0m', 'CLI is running');

  // start the interface
  const _interface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '->',
  });

  // create the prompt
  _interface.prompt();

  _interface.on('line', (str) => {
    cli.processInput(str);

    // re-initialize the prompt
    _interface.prompt();
  });

  // if user stops the cli
  _interface.on('close', () => {
    process.exit(0);
  });
};

// input processor
cli.processInput = (str) => {
  str = helpers.checkString(str);

  if (str) {
    // define the allowd inputs
    const inputs = [
      'man',
      'help',
      'exit',
      'stats',
      'list users',
      'more users info',
      'list checks',
      'more checks info',
      'list logs',
      'more logs info',
    ];

    let isMatchFound = false;
    const counter = 0;

    inputs.some((input) => {
      if (str.toLowerCase().includes(input)) {
        isMatchFound = true;
        e.emit(input, str);
        return true;
      }
    });

    if (!isMatchFound) {
      console.log('Sorry boi, try again');
    }
  }
};

module.exports = cli;
