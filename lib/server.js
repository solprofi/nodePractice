// dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const { StringDecoder } = require('string_decoder');
const path = require('path');
const util = require('util');

const config = require('../config');
const handlers = require('./handlers');
const helpers = require('./helpers');

const debug = util.debuglog('server');

const server = {};

server.unifiedServer = (req, res) => {
  // parse the url
  const parsedUrl = url.parse(req.url, true);

  // get the path
  const { pathname } = parsedUrl;

  // trim the path
  const trimmedPath = pathname.replace(/^\/+|\/+$/g, '');

  // get the http method
  const method = req.method.toLowerCase();

  // get the query
  const queryObject = parsedUrl.query;

  // get the headers
  const { headers } = req;

  // get the payload
  const decoder = new StringDecoder('utf-8');
  let buffer = '';

  req.on('data', (data) => {
    buffer += decoder.write(data);
  });

  req.on('end', () => {
    buffer += decoder.end();

    // choose the handler
    const chosenHandler = typeof server.router[trimmedPath] !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;
    // construct the data object
    const data = {
      payload: helpers.parseJsonToObj(buffer),
      method,
      trimmedPath,
      queryObject,
      headers,
    };

    // call the router
    chosenHandler(data, (statusCode, payload, contentType) => {
      // set the status code
      statusCode = typeof statusCode === 'number' ? statusCode : 200;

      // set the content type
      contentType = typeof (contentType) === 'string' ? contentType : 'json';

      // convert the payload to a string
      let payloadString = '';

      // unique response parts
      if (contentType === 'json') {
        res.setHeader('Content-Type', 'application/json');
        payload = typeof (payload) === 'object' ? payload : {};
        payloadString = JSON.stringify(payload);
      }
      if (contentType === 'html') {
        res.setHeader('Content-Type', 'text/html');
        payloadString = typeof (payload) === 'string' ? payload : '';
      }

      // common resposnse parts
      res.writeHead(statusCode);
      res.end(payloadString);

      // logging
      if (statusCode === 200) {
        debug('\x1b[32m%s\x1b[0m', `${method.toUpperCase()} /${trimmedPath}${statusCode}`);
      } else {
        debug('\x1b[31m%s\x1b[0m', `${method.toUpperCase()} /${trimmedPath}${statusCode}`);
      }
    });
  });
};

// create servers
server.httpServer = http.createServer((req, res) => {
  server.unifiedServer(req, res);
});

server.httpsServerOptions = {
  key: fs.readFileSync(path.join(__dirname, '../https/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '../https/cert.pem')),
};
server.httpsServer = https.createServer(server.httpsServerOptions, (req, res) => {
  server.unifiedServer(req, res);
});

// define the router
server.router = {
  '': handlers.index,
  'account/create': handlers.createAccount,
  'account/edit': handlers.editAccount,
  'account/deleted': handlers.deletedAccount,
  'session/create': handlers.createSession,
  'session/deleted': handlers.deletedSession,
  'checks/all': handlers.checksList,
  'checks/create': handlers.createCheck,
  'checks/edit': handlers.editCheck,
  ping: handlers.ping,
  'api/users': handlers.users,
  'api/tokens': handlers.tokens,
  'api/checks': handlers.checks,
};

server.init = () => {
  // start the http server and listen on the ports
  server.httpServer.listen(config.httpPort, () => {
    console.log('\x1b[36m%s\x1b[0m', `the http server is listening on port ${config.httpPort} in ${config.envName} mode`);
  });

  // start the https server and listen on the ports
  server.httpsServer.listen(config.httpsPort, () => {
    console.log('\x1b[35m%s\x1b[0m', `the http server is listening on port ${config.httpsPort} in ${config.envName} mode`);
  });
};

module.exports = server;
