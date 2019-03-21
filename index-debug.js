// dependencies
const server = require('./lib/server');
const workers = require('./lib/workers');
const cli = require('./lib/cli');
const errExample = require('./lib/exampleProblem');

const app = {};

app.init = () => {
  debugger;
  // start the server
  server.init();

  debugger;
  // start the workers
  workers.init();

  debugger;
  // call init that will throw

  debugger;
  let a = 1;
  console.log('Assigned 1 to a');
  debugger;
  a++;
  console.log('Incremented a');
  debugger;
  a *= 2;
  debugger;
  a = a.toString();

  errExample.init();
  console.log('Called the library');

  setTimeout(() => {
    cli.init();
    debugger;
  }, 50);
};

app.init();

module.exports = app;
