//dependencies
const crypto = require('crypto');
const config = require('../config');

//Container to export
const helpers = {};

//helpers
helpers.checkName = name => typeof (name) === 'string' && name.trim().length > 0 ? name.trim() : false;
helpers.checkPhone = phone => typeof (phone) === 'string' && phone.trim().length === 10 ? phone.trim() : false;
helpers.checkToken = phone => typeof (phone) === 'string' && phone.trim().length === 20 ? phone.trim() : false;
helpers.checkAgreement = agreement => typeof (agreement) === 'boolean' && agreement === true ? true : false;

helpers.checkProtocol = protocol => typeof (protocol) === 'string' && ['http', 'https'].indexOf(protocol) !== -1 ? protocol : false;
helpers.checkMethod = method => typeof (method) === 'string' && ['get', 'set', 'put', 'post'].indexOf(method) !== -1 ? method : false;
helpers.checkUrl = url => typeof (url) === 'string' && url.trim().length > 0 ? url : false;
helpers.checkSuccessCodes = successCodes => typeof (successCodes) === 'object' && successCodes instanceof Array && successCodes.length > 0 ? successCodes : false;
helpers.checkTimeout = timeout => typeof (timeout) === 'number' && timeout % 1 === 0 && timeout >= 1 && timeout <= 5 ? timeout : false;



helpers.hash = str => {
  if (typeof (str) === 'string' && str.length > 0) {
    return crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
  } else {
    return false;
  }
}

helpers.parseJsonToObj = payload => {
  try {
    return JSON.parse(payload);
  } catch (err) {
    console.log(err)
    return {};
  }
}

helpers.createRandomString = length => {
  length = typeof (length) === 'number' && length > 0 ? length : false;

  if (length) {
    let randomString = '';
    const allowedChars = 'abcdefghijklmnofqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
      const randomChar = allowedChars.charAt(Math.floor(Math.random() * allowedChars.length));
      randomString += randomChar;
    }

    return randomString;
  } else {
    return false;
  }
}

helpers.setExpiration = () => Date.now() + 1000 * 60 * 60;


module.exports = helpers;