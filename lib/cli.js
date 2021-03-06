const readline = require('readline');
const util = require('util');

const debug = util.debuglog('cli');
const events = require('events');
const v8 = require('v8');
const os = require('os');
const helpers = require('./helpers');
const _data = require('./data');
const _logs = require('./logs');

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
  _data.list('checks', (err, checkIds) => {
    if (!err && checkIds && checkIds.length > 0) {
      cli.vericalSpace();

      checkIds.forEach((id) => {
        _data.read('checks', id, (err, checkData) => {
          if (!err) {
            const includeCheck = false;
            const lowerStr = str.toLowerCase();

            const {
              isDown,
              id,
              method,
              protocol,
              url,
            } = checkData;

            const state = typeof (isDown) === 'boolean' && isDown ? 'down' : 'up';

            if (lowerStr.includes(state) || (!lowerStr.includes('down') && !lowerStr.includes('up'))) {
              const line = `ID: ${id} ${method} ${protocol}://${url} isDown: ${typeof (isDown) === 'boolean' ? isDown : 'unknown'}`;
              console.log(line);
              cli.vericalSpace();
            }
          }
        });
      });
    } else {
      console.log('No Ids to show');
    }
  });
});

e.on('more checks info', (str) => {
  cli.responders.moreChecksInfo(str);
});

e.on('list logs', () => {
  cli.responders.listLogs();
});

e.on('more logs info', (str) => {
  cli.responders.moreLogsInfo(str);
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
    'list logs': 'List all the compressed log files',
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
    let str = `\x1b[33m${key}\x1b[0m`;
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
  // create an object with stats
  const stats = {
    'Load Average': os.loadavg().join(' '),
    'CPU count': os.cpus().length,
    'Free memory': os.freemem(),
    'Current Malloced memory': v8.getHeapStatistics().malloced_memory,
    'Peak Malloced memory': v8.getHeapStatistics().peak_malloced_memory,
    'Allocated Heap used (%)': Math.round((v8.getHeapStatistics().used_heap_size / v8.getHeapStatistics().total_heap_size) * 100),
    'Available Heap Allocated (%)': Math.round((v8.getHeapStatistics().total_heap_size / v8.getHeapStatistics().heap_size_limit) * 100),
    Uptime: `${os.uptime()}seconds`,
  };

  // show a header for the page
  cli.horizontalLine();
  cli.centered('SYSTEM STATISTICS');
  cli.horizontalLine();
  cli.vericalSpace(2);

  // show each command followed by its descriptipn
  Object.keys(stats).forEach((key) => {
    const val = stats[key];
    let str = `\x1b[33m${key}\x1b[0m`;
    const padding = 60 - str.length;

    const strToAdd = helpers.fillWithChars(' ', padding);

    str += strToAdd;

    console.log(str + val);
    cli.vericalSpace();
  });
  cli.horizontalLine();
};

cli.responders.listUsers = () => {
  _data.list('users', (err, userIds) => {
    if (!err && userIds && userIds.length > 0) {
      cli.vericalSpace();

      userIds.forEach((id) => {
        _data.read('users', id, (err, userData) => {
          if (!err && userData) {
            const line = `Name ${userData.firstName} ${userData.lastName} Phone: ${userData.phone} Number of Checks:`;
            const numOfChecks = typeof (userData.checks) === 'object' && userData.checks instanceof Array ? userData.checks.length : 0;

            console.log(line + numOfChecks);
            cli.vericalSpace();
          }
        });
      });
    } else {
      console.log('There are no users to list');
    }
  });
};

cli.listIdInfo = (str, dir) => {
  const arr = str.split('--');
  const id = typeof (arr[1]) === 'string' && arr[1].trim().length > 0 ? arr[1] : false;

  if (id) {
    _data.read(dir, id, (err, userData) => {
      if (!err && userData) {
        if (dir === 'users') {
          // remove the password from the user objecy
          delete userData.hashedPassword;
        }

        cli.vericalSpace();
        console.dir(userData, { colors: true });
        cli.vericalSpace();
      }
    });
  } else {
    console.log('Wrong id specified');
  }
};

cli.responders.moreUsersInfo = (str) => {
  cli.listIdInfo(str, 'users');
};

cli.responders.moreChecksInfo = (str) => {
  cli.listIdInfo(str, 'checks');
};

cli.responders.listLogs = () => {
  _logs.list(true, (err, logFiles) => {
    if (!err && logFiles && logFiles.length > 0) {
      cli.vericalSpace();

      logFiles.forEach((log) => {
        if (log.includes('-')) {
          console.log(log);
          cli.vericalSpace();
        }
      });
    }
  });
};

cli.responders.moreLogsInfo = (str) => {
  const arr = str.split('--');
  const filaname = typeof (arr[1]) === 'string' && arr[1].trim().length > 0 ? arr[1] : false;

  if (filaname) {
    _logs.decompress(filaname, (err, logData) => {
      if (!err && logData) {
        const arr = logData.split('\n');

        arr.forEach((line) => {
          const logObj = helpers.parseJsonToObj(line);

          if (logObj && JSON.stringify(logObj) !== '{}') {
            console.dir(logObj, { colors: true });
            cli.vericalSpace();
          }
        });
      }
    });
  }
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

    inputs.some((input) => {
      if (str.toLowerCase().includes(input)) {
        isMatchFound = true;
        e.emit(input, str);
        return true;
      }
      return false;
    });

    if (!isMatchFound) {
      console.log('Sorry boi, try again');
    }
  }
};

module.exports = cli;
