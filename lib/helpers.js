//dependencies
const crypto = require('crypto');
const config = require('../config');

//Container to export
const helpers = {};

//helpers
helpers.checkName = name => typeof (name) === 'string' && name.trim().length > 0 ? name.trim() : false;

helpers.checkPhone = phone => typeof (phone) === 'string' && phone.trim().length === 10 ? phone.trim() : false;

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

module.exports = helpers;