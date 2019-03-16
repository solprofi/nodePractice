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


handlers.ping = (data, callback) => {
  callback(200);
}

//define the not found handler
handlers.notFound = (data, callback) => {
  callback(404);
}




module.exports = handlers;