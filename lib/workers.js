// worker-related tasks

// dependencies
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const url = require('url');
const _data = require('./data');
const helpers = require('./helpers');

// Instantiate the container
const workers = {};

workers.loop = () => {
  setInterval(() => {
    workers.getAllChecks();
  }, 1000 * 60);
};

workers.getAllChecks = () => {
  // get all the ckecks in the system
  _data.list('checks', (err, checks) => {
    if (!err && checks && checks.length > 0) {
      checks.forEach((check) => {
        // read the check data
        _data.read('checks', check, (err, originalCheckData) => {
          if (!err && originalCheckData) {
            // pass it to the check validator
            workers.validateCheckData(originalCheckData);
          } else {
            console.log('Error reading one of the checks');
          }
        });
      });
    } else {
      console.log('Could not find any checks to process');
    }
  });
};

workers.validateCheckData = (checkData) => {
  checkData = typeof (checkData) === 'object' && checkData !== null ? checkData : {};
  checkData.id = helpers.checkId(checkData.id);
  checkData.phone = helpers.checkPhone(checkData.phone);
  checkData.protocol = helpers.checkProtocol(checkData.protocol);
  checkData.url = helpers.checkUrl(checkData.url);
  checkData.method = helpers.checkMethod(checkData.method);
  checkData.successCodes = helpers.checkSuccessCodes(checkData.successCodes);
  checkData.timeoutSeconds = helpers.checkTimeout(checkData.timeoutSeconds);

  // set the keys that may not be set
  checkData.isDown = helpers.checkState(checkData.isDown);
  checkData.lastChecked = typeof (checkData.lastChecked) === 'number' && checkData.lastChecked > 0 ? checkData.lastChecked : false;

  if (checkData && Object.keys(checkData).every(key => !!key)) {
    workers.performCheck(checkData);
  } else {
    console.log('One of the checks is not properly formatted', checkData);
  }
};


workers.init = () => {
  // execute all the checks
  workers.getAllChecks();

  // call the loop to execute checks
  workers.loop();
};


module.exports = workers;
