// dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const { StringDecoder } = require('string_decoder');
const path = require('path');
const config = require('../config');
const handlers = require('./handlers');
const helpers = require('./helpers');

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
    chosenHandler(data, (statusCode, payload) => {
      // set the status code
      statusCode = typeof statusCode === 'number' ? statusCode : 200;

      // set the payload
      payload = typeof payload === 'object' ? payload : {};

      // convert the payload to a string
      const payloadString = JSON.stringify(payload);

      // send the response
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(payloadString);

      // logging
      console.log(`responding with status code ${statusCode} and payload`, payloadString);
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
  ping: handlers.ping,
  users: handlers.users,
  tokens: handlers.tokens,
  checks: handlers.checks,
};

server.init = () => {
  // start the http server and listen on the ports
  server.httpServer.listen(config.httpPort, () => {
    console.log(`the http server is listening on port ${config.httpPort} in ${config.envName} mode`);
  });

  // start the https server and listen on the ports
  server.httpsServer.listen(config.httpsPort, () => {
    console.log(`the https server is listening on port ${config.httpsPort} in ${config.envName} mode`);
  });
};

module.exports = server;
