// dependencies
const crypto = require('crypto');
const https = require('https');
const querystring = require('querystring');
const config = require('../config');

// Container to export
const helpers = {};

// helpers
helpers.checkName = name => (typeof (name) === 'string' && name.trim().length > 0 ? name.trim() : false);

helpers.checkPhone = phone => (typeof (phone) === 'string' && phone.trim().length === 10 ? phone.trim() : false);

helpers.checkId = id => (typeof (id) === 'string' && id.trim().length === 20 ? id.trim() : false);

helpers.checkAgreement = agreement => (typeof (agreement) === 'boolean' && agreement === true ? agreement : false);

helpers.checkProtocol = protocol => (typeof (protocol) === 'string' && ['http', 'https'].indexOf(protocol) !== -1 ? protocol : false);

helpers.checkMethod = method => (typeof (method) === 'string' && ['get', 'set', 'put', 'post'].indexOf(method) !== -1 ? method : false);

helpers.checkUrl = url => (typeof (url) === 'string' && url.trim().length > 0 ? url : false);

helpers.checkSuccessCodes = successCodes => (typeof (successCodes) === 'object' && successCodes instanceof Array && successCodes.length > 0 ? successCodes : false);

helpers.checkTimeout = timeout => (typeof (timeout) === 'number' && timeout % 1 === 0 && timeout >= 1 && timeout <= 5 ? timeout : false);

helpers.checkMessage = message => (typeof (message) === 'string' && message.trim().length > 0 && message.trim().length <= 1600 ? message.trim() : false);

helpers.checkState = isDown => (typeof (isDown) === 'boolean' ? isDown : true);


helpers.hash = (str) => {
  if (typeof (str) === 'string' && str.length > 0) {
    return crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
  }
  return false;
};

helpers.parseJsonToObj = (payload) => {
  try {
    return JSON.parse(payload);
  } catch (err) {
    console.log(err);
    return {};
  }
};

helpers.createRandomString = (length) => {
  length = typeof (length) === 'number' && length > 0 ? length : false;

  if (length) {
    let randomString = '';
    const allowedChars = 'abcdefghijklmnofqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
      const randomChar = allowedChars.charAt(Math.floor(Math.random() * allowedChars.length));
      randomString += randomChar;
    }

    return randomString;
  }
  return false;
};

helpers.setExpiration = () => Date.now() + 1000 * 60 * 60;

helpers.sendTwilioSms = (phone, message, callback) => {
  phone = helpers.checkPhone(phone);
  message = helpers.checkMessage(message);

  if (message && phone) {
    // configure payload
    const payload = {
      From: config.twilio.sender,
      To: `+38${phone}`,
      Body: message,
    };

    const stringPayload = querystring.stringify(payload);

    const requestDetails = {
      protocol: 'https:',
      hostname: 'api.twilio.com',
      method: 'POST',
      path: `/2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`,
      auth: `${config.twilio.accountSid}:${config.twilio.authToken}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(stringPayload),
      },
    };

    // instantiate the request obj
    const request = https.request(requestDetails, (response) => {
      const { statusCode } = response;
      if (statusCode === 200 || statusCode === 201) {
        callback(false);
      } else {
        callback({ Error: `Status code returned: ${statusCode}` });
      }
    });

    // bind to error so it is not thrown

    request.on('error', (err) => {
      callback(err);
    });

    request.write(stringPayload);
    request.end();
  } else {
    callback({ Error: 'Invalid parameters' });
  }
};


module.exports = helpers;
