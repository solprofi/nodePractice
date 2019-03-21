// API tests

// dependencies
const assert = require('assert');
const http = require('http');
const app = require('../index');
const config = require('../config');

const api = {};

const helpers = {};
helpers.makeGetRequest = (path, callback) => {
  const requestDetails = {
    path,
    method: 'GET',
    protocol: 'http:',
    hostname: 'localhost',
    port: config.httpPort,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // send request
  const req = http.request(requestDetails, (res) => {
    callback(res);
  });

  req.end();
};

api['Should start the app without throwing'] = (done) => {
  assert.doesNotThrow(() => {
    app.init((() => {
      done();
    }));
  }, TypeError);
};

api['/ping should respond with 200 to GET request'] = (done) => {
  helpers.makeGetRequest('/ping', (res) => {
    assert.equal(res.statusCode, 200);
    done();
  });
};

api['/users should respond with 400 to empty GET request'] = (done) => {
  helpers.makeGetRequest('/api/users', (res) => {
    assert.equal(res.statusCode, 400);
    done();
  });
};

api['/randomPath should respond with 404 to empty GET request'] = (done) => {
  helpers.makeGetRequest('/randomPathThatDoesn\'tExist', (res) => {
    assert.equal(res.statusCode, 404);
    done();
  });
};


module.exports = api;
