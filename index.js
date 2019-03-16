//dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const handlers = require('./lib/handlers');
const helpers = require('./lib/helpers');

const unifiedServer = (req, res) => {
  //parse the url
  const parsedUrl = url.parse(req.url, true);

  //get the path
  const path = parsedUrl.pathname;

  //trim the path
  const trimmedPath = path.replace(/^\/+|\/+$/g, '');

  //get the http method
  const method = req.method.toLowerCase();

  //get the query
  const queryObject = parsedUrl.query;

  //get the headers
  const headers = req.headers;

  //get the payload
  const decoder = new StringDecoder('utf-8');
  let buffer = '';

  req.on('data', data => {
    buffer += decoder.write(data);
  });

  req.on('end', () => {
    buffer += decoder.end();

    //choose the handler
    const chosenHandler = typeof (router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

    //construct the data object
    const data = {
      payload: helpers.parseJsonToObj(buffer),
      method,
      trimmedPath,
      queryObject,
      headers,
    };

    //call the router
    chosenHandler(data, (statusCode, payload) => {
      //set the status code
      statusCode = typeof (statusCode) == 'number' ? statusCode : 200;

      //set the payload
      payload = typeof (payload) == 'object' ? payload : {};

      //convert the payload to a string
      const payloadString = JSON.stringify(payload);

      //send the response
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(payloadString);

      // logging
      console.log(`responding with status code ${statusCode} and payload`, payloadString);
    });
  });
}

//create servers
const httpServer = http.createServer((req, res) => {
  unifiedServer(req, res);
});

const httpsServerOptions = {
  'key': fs.readFileSync('./https/key.pem'),
  'cert': fs.readFileSync('./https/cert.pem'),
}
const httpsServer = https.createServer(httpsServerOptions, (req, res) => {
  unifiedServer(req, res);
});


//start the servers and listen on the ports
httpServer.listen(config.httpPort, () => {
  console.log(`the http server is listening on port ${config.httpPort} in ${config.envName} mode`);
});

httpsServer.listen(config.httpsPort, () => {
  console.log(`the https server is listening on port ${config.httpsPort} in ${config.envName} mode`);
});

//define the router
const router = {
  'ping': handlers.ping,
  'users': handlers.users,
}