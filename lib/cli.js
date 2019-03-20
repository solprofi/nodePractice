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
  console.log('You asked for help');
};

cli.responders.exit = () => {
  console.log('You asked for exit');
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
