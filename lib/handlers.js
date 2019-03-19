// dependencies
const _data = require('./data');
const helpers = require('./helpers');
const config = require('../config');

// define the handlers
const handlers = {};

// HTML handlers
handlers.index = (data, callback) => {
  if (data.method === 'get') {
    helpers.getTemplate('index', (err, data) => {
      if (!err && data) {
        callback(200, data, 'html');
      } else {
        callback(500, undefined, 'html');
      }
    });
  } else {
    callback(405, undefined, 'html');
  }
};

// JSON API handlers
handlers.users = (data, callback) => {
  const allowedMethods = ['put', 'get', 'post', 'delete'];
  if (allowedMethods.indexOf(data.method) !== -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

handlers._users = {};

// users - get
handlers._users.get = (data, callback) => {
  const phone = helpers.checkPhone(data.queryObject.phone);

  if (phone) {
    // get the token
    let { token } = data.headers;
    token = typeof (token) === 'string' ? token : false;

    // verify the token
    handlers._tokens.verifyToken(token, phone, (isValid) => {
      if (isValid) {
        _data.read('users', phone, (err, data) => {
          if (!err && data) {
            // remove the hashed password
            delete data.hashedPassword;
            callback(200, data);
          } else {
            callback(404);
          }
        });
      } else {
        callback(403, { Error: 'Missing required token in header or token is invalid' });
      }
    });
  } else {
    callback(400, { Error: 'Missing phone number' });
  }
};

// users - post
handlers._users.post = (data, callback) => {
  // check for all required fields
  let {
    firstName,
    lastName,
    phone,
    password,
    tosAgreement,
  } = data.payload;

  firstName = helpers.checkName(firstName);
  lastName = helpers.checkName(lastName);
  // only check the length for now
  password = helpers.checkName(password);
  phone = helpers.checkPhone(phone);
  tosAgreement = helpers.checkAgreement(tosAgreement);

  if (firstName && lastName && password && phone && tosAgreement) {
    _data.read('users', phone, (error, data) => {
      if (error) {
        const hashedPassword = helpers.hash(password);

        if (hashedPassword) {
          // create the user obj
          const user = {
            firstName,
            lastName,
            phone,
            tosAgreement,
            hashedPassword,
          };

          _data.create('users', phone, user, (error) => {
            if (!error) {
              callback(200);
            } else {
              console.log(error);
              callback(500, { Error: 'Could not create the user' });
            }
          });
        } else {
          callback(500, { Error: 'Could not hash the password' });
        }
      } else {
        callback(400, { Error: 'A user with this phone number already exists' });
      }
    });
  } else {
    const errors = [];
    if (!firstName) errors.push('No first name');
    if (!lastName) errors.push('No last name');
    if (!password) errors.push('No password');
    if (!phone) errors.push('No phone');
    if (!tosAgreement) errors.push('No agreement');

    callback(400, { Error: errors });
  }
};

// users - put
handlers._users.put = (data, callback) => {
  let {
    firstName,
    lastName,
    phone,
    password,
  } = data.payload;

  phone = helpers.checkPhone(phone);

  if (phone) {
    firstName = helpers.checkName(firstName);
    lastName = helpers.checkName(lastName);
    password = helpers.checkName(password);

    if (firstName || lastName || password) {
      // get the token
      let { token } = data.headers;
      token = typeof (token) === 'string' ? token : false;

      // verify the token
      handlers._tokens.verifyToken(token, phone, (isValid) => {
        if (isValid) {
          _data.read('users', phone, (err, userData) => {
            if (!err && userData) {
              if (firstName) userData.firstName = firstName;
              if (lastName) userData.lastName = lastName;
              if (password) userData.hashedPassword = helpers.hash(password);

              // store the updates
              _data.update('users', phone, userData, (err) => {
                if (!err) {
                  callback(200);
                } else {
                  console.log(err);
                  callback(500, { Error: 'could not update the user' });
                }
              });
            } else {
              callback(400, { Error: 'User does not exist' });
            }
          });
        } else {
          callback(403, { Error: 'Missing required token in header or token is invalid' });
        }
      });
    } else {
      callback(400, { Error: 'Missing fields to update' });
    }
  } else {
    callback(400, { Error: 'Missing phone field' });
  }
};

// users - delete
handlers._users.delete = (data, callback) => {
  const phone = helpers.checkPhone(data.queryObject.phone);
  if (phone) {
    // get the token
    let { token } = data.headers;
    token = typeof (token) === 'string' ? token : false;

    // verify the token
    handlers._tokens.verifyToken(token, phone, (isValid) => {
      if (isValid) {
        _data.read('users', phone, (err, userData) => {
          if (!err && userData) {
            _data.delete('users', phone, (err) => {
              if (!err) {
                let { checks } = userData;
                checks = typeof (checks) === 'object' && checks instanceof Array ? checks : [];

                if (checks.length > 0) {
                  let deletionErrorsCount = 0;

                  checks.forEach((checkId) => {
                    _data.delete('checks', checkId, (err) => {
                      if (err) {
                        deletionErrorsCount++;
                      }
                    });
                  });

                  if (!deletionErrorsCount) {
                    callback(200);
                  } else {
                    callback(500, { Error: `${deletionErrorsCount} errors trying to delete the checks` });
                  }
                } else {
                  callback(200);
                }
              } else {
                callback(500, { Error: 'Could not delete the user' });
              }
            });
          } else {
            callback(400, { Error: 'Could not find the user' });
          }
        });
      } else {
        callback(403, { Error: 'Missing required token in header or token is invalid' });
      }
    });
  } else {
    callback(400, { Error: 'Missing phone number' });
  }
};

// Tokens
handlers.tokens = (data, callback) => {
  const allowedMethods = ['put', 'get', 'post', 'delete'];
  if (allowedMethods.indexOf(data.method) !== -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Create a container
handlers._tokens = {};

// tokens - PUT
// required data: id, extend
// optional data: none
handlers._tokens.put = (data, callback) => {
  const id = helpers.checkId(data.payload.id);
  const extend = !!(typeof (data.payload.extend) === 'boolean' && data.payload.extend === true);

  if (id && extend) {
    _data.read('tokens', id, (err, tokenData) => {
      if (!err && tokenData) {
        // check if token is not expired
        if (tokenData.expires > Date.now()) {
          // set expiration an hour from now
          tokenData.expires = helpers.setExpiration();

          _data.update('tokens', id, tokenData, (err) => {
            if (!err) {
              callback(200);
            } else {
              callback(500, { Error: 'Could not update the token' });
            }
          });
        } else {
          callback(400, { Error: 'The token is already expired' });
        }
      } else {
        callback(400, { Error: 'Specified token does not exist' });
      }
    });
  } else {
    const errors = [];
    if (!id) errors.push('No id');
    if (!extend) errors.push('No extend');
    callback(400, { Error: errors });
  }
};

// tokens - GET
// required data: id
// optional data: none
handlers._tokens.get = (data, callback) => {
  const id = helpers.checkId(data.queryObject.id);
  if (id) {
    _data.read('tokens', id, (err, tokenData) => {
      if (!err && tokenData) {
        callback(200, tokenData);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { Error: 'Missing id' });
  }
};

// tokens - POST
// required data: phone, password
// optional data: none
handlers._tokens.post = (data, callback) => {
  // check for all required fields
  let {
    phone,
    password,
  } = data.payload;

  password = helpers.checkName(password);
  phone = helpers.checkPhone(phone);

  if (phone && password) {
    // check if the user exists
    _data.read('users', phone, (err, userData) => {
      if (!err && userData) {
        // hash the password and compared it to the stored password
        const hashedPassword = helpers.hash(password);
        if (hashedPassword === userData.hashedPassword) {
          // if valid create a token object
          const id = helpers.createRandomString(20);
          if (id) {
            const expires = helpers.setExpiration();

            const tokenObject = {
              id,
              expires,
              phone,
            };

            _data.create('tokens', id, tokenObject, (err) => {
              if (!err) {
                callback(200, tokenObject);
              } else {
                callback(500, { Error: 'Could not create a new token file' });
              }
            });
          } else {
            callback(500, { Error: 'Wrong token length' });
          }
        } else {
          callback(400, { Error: 'The password doesn\'t match the stored password ' });
        }
      }
    });
  } else {
    const errors = [];
    if (!password) errors.push('No password');
    if (!phone) errors.push('No phone');
    callback(400, { Error: errors });
  }
};

// tokens - DELETE
// required data: id
// optional data: none
handlers._tokens.delete = (data, callback) => {
  const id = helpers.checkId(data.queryObject.id);

  if (id) {
    _data.read('tokens', id, (err, tokenData) => {
      if (!err && tokenData) {
        _data.delete('tokens', id, (err) => {
          if (!err) {
            callback(200);
          } else {
            callback(500, { Error: 'Could not delete the token' });
          }
        });
      } else {
        callback(400, { Error: 'Could not find the token' });
      }
    });
  } else {
    callback(400, { Error: 'Missing id' });
  }
};

handlers._tokens.verifyToken = (id, phone, callback) => {
  _data.read('tokens', id, (err, tokenData) => {
    if (!err && tokenData) {
      if (tokenData.phone === phone && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

handlers.ping = (data, callback) => {
  callback(200);
};

// define the not found handler
handlers.notFound = (data, callback) => {
  callback(404);
};

// Checks
handlers.checks = (data, callback) => {
  const allowedMethods = ['put', 'get', 'post', 'delete'];
  if (allowedMethods.indexOf(data.method) !== -1) {
    handlers._checks[data.method](data, callback);
  } else {
    callback(405);
  }
};

handlers._checks = {};

// checks - POST
// required data: protocol, method, url, successCodes, timeoutSeconds
// optional data: none
handlers._checks.post = (data, callback) => {
  // validate inputs
  let {
    protocol,
    method,
    url,
    successCodes,
    timeoutSeconds,
  } = data.payload;

  protocol = helpers.checkProtocol(protocol);
  method = helpers.checkMethod(method);
  url = helpers.checkUrl(url);
  successCodes = helpers.checkSuccessCodes(successCodes);
  timeoutSeconds = helpers.checkTimeout(timeoutSeconds);

  if (protocol && method && url && successCodes && timeoutSeconds) {
    // get the token
    let { token } = data.headers;
    token = typeof (token) === 'string' ? token : false;

    // get the user by the token
    _data.read('tokens', token, (err, tokenData) => {
      if (!err && tokenData) {
        const { phone } = tokenData;

        _data.read('users', phone, (err, userData) => {
          if (!err && userData) {
            // get the stored checks
            let { checks } = userData;
            checks = typeof (checks) === 'object' && checks instanceof Array ? checks : [];

            if (checks.length < config.maxChecks) {
              // create  an id for the check
              const id = helpers.createRandomString(20);

              const checkObject = {
                id,
                phone,
                protocol,
                url,
                method,
                successCodes,
                timeoutSeconds,
              };

              // store the check
              _data.create('checks', id, checkObject, (err) => {
                if (!err) {
                  userData.checks = checks;
                  userData.checks.push(id);

                  // update the user checks array
                  _data.update('users', phone, userData, (err) => {
                    if (!err) {
                      callback(200, checkObject);
                    } else {
                      callback(500, { Error: 'Error updating user data' });
                    }
                  });
                } else {
                  callback(500, { Error: 'Error storing check data' });
                }
              });
            } else {
              callback(400, { Error: `Max number of checks is reached (${config.maxChecks})` });
            }
          } else {
            callback(403);
          }
        });
      } else {
        callback(403);
      }
    });
  } else {
    const errors = [];
    if (!protocol) errors.push('No protocol');
    if (!method) errors.push('No method');
    if (!url) errors.push('No url');
    if (!successCodes) errors.push('No successCodes');
    if (!timeoutSeconds) errors.push('No timeoutSeconds');
    callback(400, errors);
  }
};

// checks - GET
// required data - id
// optional data - none
handlers._checks.get = (data, callback) => {
  const id = helpers.checkId(data.queryObject.id);

  if (id) {
    // get the user that created the check
    _data.read('checks', id, (err, checkData) => {
      if (!err && checkData) {
        // get the token
        let { token } = data.headers;
        token = typeof (token) === 'string' ? token : false;

        // verify the token
        handlers._tokens.verifyToken(token, checkData.phone, (isValid) => {
          if (isValid) {
            callback(200, checkData);
          } else {
            callback(403);
          }
        });
      } else {
        callback(400, { Error: 'Could not find the check file' });
      }
    });
  } else {
    callback(400, { Error: 'Missing checks id' });
  }
};

// checks - PUT
// required data - id
// optional data - protocol, method, url, successCodes, timeoutSeconds
handlers._checks.put = (data, callback) => {
  let {
    protocol,
    method,
    url,
    successCodes,
    timeoutSeconds,
    id,
  } = data.payload;

  id = helpers.checkId(id);

  if (id) {
    protocol = helpers.checkProtocol(protocol);
    method = helpers.checkMethod(method);
    url = helpers.checkUrl(url);
    successCodes = helpers.checkSuccessCodes(successCodes);
    timeoutSeconds = helpers.checkTimeout(timeoutSeconds);

    if (protocol || method || url || successCodes || timeoutSeconds) {
      _data.read('checks', id, (err, checkData) => {
        if (!err && checkData) {
          // get the token
          let { token } = data.headers;
          token = typeof (token) === 'string' ? token : false;

          // verify the token
          handlers._tokens.verifyToken(token, checkData.phone, (isValid) => {
            if (isValid) {
              // update the check
              if (protocol) checkData.protocol = protocol;
              if (url) checkData.url = url;
              if (method) checkData.method = method;
              if (successCodes) checkData.successCodes = successCodes;
              if (timeoutSeconds) checkData.timeoutSeconds = timeoutSeconds;

              // store the update
              _data.update('checks', id, checkData, (err) => {
                if (!err) {
                  callback(200);
                } else {
                  callback(500, { Error: 'Could not update the check' });
                }
              });
            } else {
              callback(403);
            }
          });
        } else {
          callback(400, { Error: 'Check Id does not exist' });
        }
      });
    } else {
      callback(400, { Error: 'Missing fields to update' });
    }
  } else {
    callback(400, { Error: 'Missing id field' });
  }
};

// checks - DELETE
// required data - id
// optional data - none
handlers._checks.delete = (data, callback) => {
  const id = helpers.checkId(data.queryObject.id);

  if (id) {
    // lookup the check
    _data.read('checks', id, (err, checkData) => {
      if (!err && checkData) {
        // get the token
        let { token } = data.headers;
        token = typeof (token) === 'string' ? token : false;

        // verify the token
        handlers._tokens.verifyToken(token, checkData.phone, (isValid) => {
          if (isValid) {
            // delete the check
            _data.delete('checks', id, (err) => {
              if (!err) {
                // lookup the user to modify the checks array
                _data.read('users', checkData.phone, (err, userData) => {
                  if (!err && userData) {
                    let { checks } = userData;
                    checks = typeof (checks) === 'object' && checks instanceof Array ? checks : [];

                    const indexToRemove = checks.indexOf(id);
                    if (indexToRemove !== -1) {
                      checks.splice(indexToRemove, 1);
                      userData.checks = checks;

                      _data.update('users', checkData.phone, userData, (err) => {
                        if (!err) {
                          callback(200);
                        } else {
                          callback(500, { Error: 'Could not update the user' });
                        }
                      });
                    } else {
                      callback(500, { Error: 'Could not find the check in the checks array' });
                    }
                  } else {
                    callback(500, { Error: 'Could not find the user who created the check' });
                  }
                });
              } else {
                callback(500, { Error: 'Could not delete the check data' });
              }
            });
          } else {
            callback(403, { Error: 'Missing required token in header or token is invalid' });
          }
        });
      } else {
        callback(404, { Error: 'Could not find the check with a specified id' });
      }
    });
  } else {
    callback(400, { Error: 'Missing id' });
  }
};

module.exports = handlers;
