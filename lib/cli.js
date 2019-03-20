const readline = require('readline');
const util = require('util');

const debug = util.debuglog('cli');
const events = require('events');
const helpers = require('./helpers');

class _events extends events { }

const e = new _events();


const cli = {};

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
