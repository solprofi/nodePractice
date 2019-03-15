//dependencies
const http = require('http');
const url = require('url');

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

  //send the response
  res.end('response\n\n');

  //log the requested path
  console.log(`The server received a request for path ${trimmedPath} with method ${method} with query parameters`, queryObject);
  console.log(`The request headers: ${JSON.stringify(headers)}`);
});

//start the server and listen on port 3000
server.listen(3000, () => {
  console.log('the server is listening on port 3000');
})

