// worker-related tasks

// dependencies
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const util = require('util');
const _url = require('url');
const _logs = require('./logs');
const _data = require('./data');
const helpers = require('./helpers');

const debug = util.debuglog('workers');


// Instantiate the container
const workers = {};

workers.loop = () => {
  setInterval(() => {
    workers.getAllChecks();
  }, 1000 * 10);
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
            debug('Error reading one of the checks');
          }
        });
      });
    } else {
      debug('Could not find any checks to process');
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
    debug('One of the checks is not properly formatted', checkData);
  }
};

workers.performCheck = (originalCheckData) => {
  const checkOutcome = {
    error: false,
    responseCode: false,
  };

  // eslint-disable-next-line
  let isOutcomeSent = false;

  const {
    protocol,
    url,
    method,
    timeoutSeconds,
  } = originalCheckData;

  const parsedUrl = _url.parse(`${protocol}://${url}`, true);
  const { hostname } = parsedUrl;
  const { path } = parsedUrl.path; // using path instead of pathname bc path also includes query string

  // construct the request
  const requestDetails = {
    protocol: `${protocol}:`,
    method: method.toUpperCase(),
    path,
    hostname,
    timeoutSeconds: timeoutSeconds * 1000,
  };

  const _module = protocol === 'http' ? http : https;
  const req = _module.request(requestDetails, (res) => {
    // get the status
    const { statusCode } = res;

    checkOutcome.responseCode = statusCode;
    if (!isOutcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      isOutcomeSent = true;
    }
  });

  req.on('error', (err) => {
    // update the check outcome
    checkOutcome.error = {
      error: true,
      value: err,
    };

    if (!isOutcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      isOutcomeSent = true;
    }
  });

  req.on('timeout', () => {
    // update the check outcome
    checkOutcome.error = {
      error: true,
      value: 'timeout',
    };

    if (!isOutcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      isOutcomeSent = true;
    }
  });

  // end the request
  req.end();
};

// process the check outcome and update the check data if needed
workers.processCheckOutcome = (originalCheckData, checkOutcome) => {
  const isDown = !(!checkOutcome.error && checkOutcome.responseCode && originalCheckData.successCodes.indexOf(checkOutcome.responseCode) !== -1);

  // decide if we need the alert
  const isAlertNeeded = originalCheckData.lastChecked && originalCheckData.isDown !== isDown;

  // log the outcome
  workers.log(originalCheckData, checkOutcome, isDown, isAlertNeeded, Date.now());

  // update the check data
  const newCheckData = {
    ...originalCheckData,
    isDown,
    lastChecked: Date.now(),
  };

  // save the updates
  _data.update('checks', newCheckData.id, newCheckData, (err) => {
    if (!err) {
      // send the alert
      if (isAlertNeeded) {
        workers.alertUser(newCheckData);
      } else {
        debug('Check outcome has not changed');
      }
    } else {
      debug('Error saving the updated check');
    }
  });
};

// alert a user about the change in the check status
workers.alertUser = (checkData) => {
  const message = `Alert: check status change. \nYour check for ${checkData.method.toUpperCase()} ${checkData.protocol}://${checkData.url} is currently ${checkData.isDown ? 'down' : 'up'}`;
  helpers.sendTwilioSms(checkData.phone, message, (err) => {
    if (!err) {
      debug('Succcess: user was alerted to a status change via sms');
      debug(message);
    } else {
      debug('Error. Could not send the sms', err);
    }
  });
};

workers.log = (check, outcome, isDown, isAlertNeeded, time) => {
  const logData = {
    check,
    outcome,
    isDown,
    isAlertNeeded,
    time,
  };

  // convert data to a string
  const logString = JSON.stringify(logData);

  // get file id
  const { id } = check;

  _logs.append(id, logString, (err) => {
    if (!err) {
      debug('Logging succeeded');
    } else {
      debug('Logging failed');
    }
  });
};

// compress the log files
workers.compressLogs = () => {
  // list all the log files
  _logs.list(false, (err, logs) => {
    if (!err && logs) {
      logs.forEach((logName) => {
        const newFileId = `${logName}-${Date.now()}`;

        _logs.compress(logName, newFileId, (err) => {
          if (!err) {
            // empty the log file
            _logs.truncate(logName, (err) => {
              if (!err) {
                debug('Success truncating the log file');
              } else {
                debug('Error truncating the log file ');
              }
            });
          } else {
            debug('Error compressing one of log files');
          }
        });
      });
    } else {
      debug('Could not find any files to compress');
    }
  });
};

// timer to execute the log rotation
workers.compressLoop = () => {
  setInterval(() => {
    workers.compressLogs();
  }, 1000 * 60 * 60 * 24);
};

workers.init = () => {
  // send to console in yellow
  console.log('\x1b[33m%s\x1b[0m', 'Background Workers are running');
  // execute all the checks
  workers.getAllChecks();

  // call the loop to execute checks
  workers.loop();

  // compress all the logs
  workers.compressLogs();

  // call compression loop
  workers.compressLoop();
};


module.exports = workers;
