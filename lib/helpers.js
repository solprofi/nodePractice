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