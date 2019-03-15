//dependencies
const http = require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');

//the server responds to all requests with a string
const server = http.createServer((req, res) => {
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
      'payload': buffer,
      'method': method,
      'trimmedPath': trimmedPath,
      'queryObject': queryObject,
      'headers': headers,
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
});

//start the server and listen on port 3000
server.listen(config.port, () => {
  console.log(`the server is listening on port ${config.port} in ${config.envName} mode`);
});

//define the handlers
let handlers = {};

handlers.sample = (data, callback) => {
  //callback the http status code and a payload
  callback(406, { name: 'Roman' });
}

//define the not found handler
handlers.notFound = (data, callback) => {
  callback(404);
}

//define the router
const router = {
  'sample': handlers.sample
}