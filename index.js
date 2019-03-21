// dependencies
const server = require('./lib/server');
const workers = require('./lib/workers');
const cli = require('./lib/cli');

const app = {};

app.init = (callback) => {
  // start the server
  server.init();
  // start the workers
  workers.init();

  setTimeout(() => {
    cli.init();
    callback();
  }, 50);
};

// invoke only if called directly
if (require.main === module) {
  app.init(() => { });
}

module.exports = app;
