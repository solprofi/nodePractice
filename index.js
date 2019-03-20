// dependencies
const server = require('./lib/server');
const workers = require('./lib/workers');
const cli = require('./lib/cli');

const app = {};

app.init = () => {
  // start the server
  server.init();
  // start the workers
  workers.init();

  setTimeout(() => {
    cli.init();
  }, 50);
};

app.init();

module.exports = app;
