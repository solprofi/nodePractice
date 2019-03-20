// dependencies
const crypto = require('crypto');
const https = require('https');
const querystring = require('querystring');
const path = require('path');
const fs = require('fs');

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

helpers.checkString = str => (typeof (str) === 'string' && str.trim().length > 0 ? str : false);

helpers.checkSuccessCodes = successCodes => (typeof (successCodes) === 'object' && successCodes instanceof Array && successCodes.length > 0 ? successCodes : false);

helpers.checkTimeout = timeout => (typeof (timeout) === 'number' && timeout % 1 === 0 && timeout >= 1 && timeout <= 5 ? timeout : false);

helpers.checkMessage = message => (typeof (message) === 'string' && message.trim().length > 0 && message.trim().length <= 1600 ? message.trim() : false);

helpers.checkState = isDown => (typeof (isDown) === 'boolean' ? isDown : true);

helpers.checkTemplate = template => (typeof (template) === 'string' && template.length > 0 ? template : false);

helpers.checkObject = obj => (typeof (obj) === 'object' && obj !== null ? obj : {});

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
      To: '+380955056206',
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

// get string content of a template
helpers.getTemplate = (templateName, data, callback) => {
  templateName = helpers.checkTemplate(templateName);
  data = helpers.checkObject(data);

  if (templateName) {
    const templateDir = path.join(__dirname, '/../templates/');

    fs.readFile(`${templateDir + templateName}.html`, 'utf8', (err, str) => {
      if (!err && str && str.length > 0) {
        const finalString = helpers.interpolate(str, data);
        callback(false, finalString);
      } else {
        callback('No template could be found');
      }
    });
  } else {
    callback('A valid template name was not specified');
  }
};

// take a string and replace all the keys in it
helpers.interpolate = (str, data) => {
  str = helpers.checkString(str);
  data = helpers.checkObject(data);

  Object.keys(config.templateGlobals).forEach((key) => {
    data[`global.${key}`] = config.templateGlobals[key];
  });

  Object.keys(data).forEach((key) => {
    if (typeof (data[key]) === 'string') {
      const replacement = data[key];
      const find = `{${key}}`;
      str = str.replace(find, replacement);
    }
  });

  return str;
};

// add the header and footer to a string
helpers.addUniversalTemplates = (str, data, callback) => {
  str = helpers.checkString(str);
  data = helpers.checkObject(data);

  // get header
  helpers.getTemplate('_header', data, (err, headerStr) => {
    if (!err && headerStr) {
      // get footer
      helpers.getTemplate('_footer', data, (err, footerStr) => {
        if (!err && footerStr) {
          const finalStr = headerStr + str + footerStr;
          callback(false, finalStr);
        } else {
          callback('Could not get the footer String');
        }
      });
    } else {
      callback('Could not get the header');
    }
  });
};

// get the contents of the static asset
helpers.getStaticAsset = (filename, callback) => {
  filename = helpers.checkString(filename);

  if (filename) {
    const publicDir = path.join(__dirname, '/../public/');

    fs.readFile(publicDir + filename, (err, data) => {
      if (!err && data) {
        callback(false, data);
      } else {
        callback('No file could be found');
      }
    });
  } else {
    callback('A filename was not specified');
  }
};


module.exports = helpers;
