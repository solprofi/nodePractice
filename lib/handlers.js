//dependencies
const _data = require('./data');
const helpers = require('./helpers');

//define the handlers
let handlers = {};

handlers.users = (data, callback) => {
  const allowedMethods = ['put', 'get', 'post', 'delete'];
  if (allowedMethods.indexOf(data.method) !== -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
}


handlers._users = {};
//users - get
handlers._users.get = (data, callback) => {
  const phone = helpers.checkPhone(data.queryObject.phone);
  if (phone) {
    _data.read('users', phone, (err, data) => {
      if (!err && data) {
        //remove the hashed password 
        delete data.hashedPassword;
        callback(200, data);
      } else {
        callback(404);
      }
    })
  } else {
    callback(400, { 'Error': 'Missing phone number' });
  }
}

//users - post
handlers._users.post = (data, callback) => {
  //check for all required fields
  let {
    firstName,
    lastName,
    phone,
    password,
    tosAgreement
  } = data.payload;

  firstName = helpers.checkName(firstName);
  lastName = helpers.checkName(lastName);
  //only check the length for now
  password = helpers.checkName(password);
  phone = helpers.checkPhone(phone);
  tosAgreement = helpers.checkAgreement(tosAgreement);

  if (firstName && lastName && password && phone && tosAgreement) {
    _data.read('users', phone, (error, data) => {
      if (error) {
        const hashedPassword = helpers.hash(password);

        if (hashedPassword) {
          //create the user obj
          const user = {
            firstName,
            lastName,
            phone,
            tosAgreement,
            hashedPassword,
          };

          _data.create('users', phone, user, error => {
            if (!error) {
              callback(200);
            } else {
              console.log(error)
              callback(500, { 'Error': 'Could not create the user' });
            }
          });
        } else {
          callback(500, { 'Error': 'Could not hash the password' });
        }
      } else {
        callback(400, { 'Error': 'A user with this phone number already exists' });
      }
    });
  } else {
    const errors = [];
    if (!firstName) errors.push('No first name');
    if (!lastName) errors.push('No last name');
    if (!password) errors.push('No password');
    if (!phone) errors.push('No phone');
    if (!tosAgreement) errors.push('No agreement');

    callback(400, { 'Error': errors });
  }

}

//users - put
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
      _data.read('users', phone, (err, userData) => {
        if (!err && userData) {
          if (firstName) userData.firstName = firstName;
          if (lastName) userData.lastName = lastName;
          if (password) userData.hashedPassword = helpers.hash(password);

          //store the updates
          _data.update('users', phone, userData, err => {
            if (!err) {
              callback(200);
            } else {
              console.log(err)
              callback(500, { 'Error': 'could not update the user' });
            }
          })
        } else {
          callback(400, { 'Error': 'User does not exist' });
        }
      })
    } else {
      callback(400, { 'Error': 'Missing fields to update' });
    }
  } else {
    callback(400, { 'Error': 'Missing phone field' });
  }
}

//users - delete
handlers._users.delete = (data, callback) => {
  const phone = helpers.checkPhone(data.queryObject.phone);
  if (phone) {
    _data.read('users', phone, (err, data) => {
      if (!err && data) {
        _data.delete('users', phone, err => {
          if (!err) {
            callback(200);
          } else {
            callback(500, { 'Error': 'Could not delete the user' });
          }
        });
      } else {
        callback(400, { 'Error': 'Could not find the user' });
      }
    });
  } else {
    callback(400, { 'Error': 'Missing phone number' });
  }
}

//Tokens
handlers.tokens = (data, callback) => {
  const allowedMethods = ['put', 'get', 'post', 'delete'];
  if (allowedMethods.indexOf(data.method) !== -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
}

//Create a container
handlers._tokens = {};

//tokens - PUT
//required data: id, extend
//optional data: none
handlers._tokens.put = (data, callback) => {
  const id = helpers.checkToken(data.payload.id);
  const extend = typeof (data.payload.extend) === 'boolean' && data.payload.extend === true ? true : false;

  if (id && extend) {
    _data.read('tokens', id, (err, tokenData) => {
      if (!err && tokenData) {
        //check if token is not expired
        if (tokenData.expires > Date.now()) {
          //set expiration an hour from now
          tokenData.expires = helpers.setExpiration();

          _data.update('tokens', id, tokenData, err => {
            if (!err) {
              callback(200);
            } else {
              callback(500, { 'Error': 'Could not update the token' });
            }
          });
        } else {
          callback(400, { 'Error': 'The token is already expired' });
        }
      } else {
        callback(400, { 'Error': 'Specified token does not exist' });
      }
    });
  } else {
    const errors = [];
    if (!id) errors.push('No id');
    if (!extend) errors.push('No extend');
    callback(400, { 'Error': errors });
  }
}

//tokens - GET
//required data: id
//optional data: none
handlers._tokens.get = (data, callback) => {
  const id = helpers.checkToken(data.queryObject.id);
  if (id) {
    _data.read('tokens', id, (err, tokenData) => {
      if (!err && tokenData) {
        callback(200, tokenData);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { 'Error': 'Missing id' });
  }
}

//tokens - POST
//required data: phone, password
//optional data: none
handlers._tokens.post = (data, callback) => {
  //check for all required fields
  let {
    phone,
    password,
  } = data.payload;

  password = helpers.checkName(password);
  phone = helpers.checkPhone(phone);

  if (phone && password) {
    //check if the user exists
    _data.read('users', phone, (err, userData) => {
      if (!err && userData) {
        //hash the password and compared it to the stored password
        const hashedPassword = helpers.hash(password);
        if (hashedPassword === userData.hashedPassword) {
          //if valid create a token object
          const id = helpers.createRandomString(20);
          if (id) {
            const expires = helpers.setExpiration();

            const tokenObject = {
              id,
              expires,
              phone,
            };

            _data.create('tokens', id, tokenObject, err => {
              if (!err) {
                callback(200, tokenObject);
              } else {
                callback(500, { 'Error': 'Could not create a new token file' });
              }
            });
          } else {
            callback(500, { 'Error': 'Wrong token length' });
          }

        } else {
          callback(400, { 'Error': 'The password doesn\'t match the stored password ' });
        }
      }
    })
  } else {
    const errors = [];
    if (!password) errors.push('No password');
    if (!phone) errors.push('No phone');
    callback(400, { 'Error': errors });
  }
}

//tokens - DELETE
//required data: id
//optional data: none
handlers._tokens.delete = (data, callback) => {
  const id = helpers.checkToken(data.queryObject.id);

  if (id) {
    _data.read('tokens', id, (err, tokenData) => {
      if (!err && tokenData) {
        _data.delete('tokens', id, err => {
          if (!err) {
            callback(200);
          } else {
            callback(500, { 'Error': 'Could not delete the token' });
          }
        });
      } else {
        callback(400, { 'Error': 'Could not find the token' });
      }
    });
  } else {
    callback(400, { 'Error': 'Missing id' });
  }
}


handlers.ping = (data, callback) => {
  callback(200);
}

//define the not found handler
handlers.notFound = (data, callback) => {
  callback(404);
}




module.exports = handlers;