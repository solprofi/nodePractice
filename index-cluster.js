// dependencies
const os = require('os');
const cluster = require('cluster');

const server = require('./lib/server');
const workers = require('./lib/workers');
const cli = require('./lib/cli');

const app = {};

app.init = (callback) => {
  if (cluster.isMaster) {
    // start the workers
    workers.init();

    setTimeout(() => {
      cli.init();
      callback();
    }, 50);

    // fork the processes
    for (let i = 0; i < os.cpus().length; i++) {
      cluster.fork();
    }
  } else {
    // start the server
    server.init();
  }
};

// invoke only if called directly
if (require.main === module) {
  app.init(() => { });
}

module.exports = app;
