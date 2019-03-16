const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

const lib = {};
lib.baseDir = path.join(__dirname, '/../.data/');

const getFilePath = (parentDir, dir, file) => `${parentDir}${dir}/${file}.json`;

//write data to a file
lib.create = (dir, filename, data, callback) => {
  fs.open(getFilePath(lib.baseDir, dir, filename), 'wx', (error, fileDescriptor) => {
    if (!error && fileDescriptor) {
      //convert data to a string
      const stringData = JSON.stringify(data);

      //write to file 
      fs.writeFile(fileDescriptor, stringData, error => {
        if (!error) {
          fs.close(fileDescriptor, error => {
            if (!error) {
              callback(false);
            } else {
              callback('Error closing new file');
            }
          });
        } else {
          callback('Error writing to new file');
        }
      });
    } else {
      callback('Could not create new file. It may exist already');
    }
  });
}

//read data from a file
lib.read = (dir, filename, callback) => {
  fs.readFile(getFilePath(lib.baseDir, dir, filename), 'utf8', (err, data) => {
    if (!err && data) {
      const parsedData = helpers.parseJsonToObj(data);
      callback(false, parsedData);
    } else {
      callback(err, data);
    }
  });
}

//update data
lib.update = (dir, filename, data, callback) => {
  //open for writing
  fs.open(getFilePath(lib.baseDir, dir, filename), 'r+', (error, fileDescriptor) => {
    if (!error && fileDescriptor) {
      //convert data to a string
      const stringData = JSON.stringify(data);

      //truncate the contents of the file
      fs.truncate(fileDescriptor, error => {
        if (!error) {
          //write to file and close it
          fs.writeFile(fileDescriptor, stringData, error => {
            if (!error) {
              fs.close(fileDescriptor, error => {
                if (!error) {
                  callback(false);
                } else {
                  callback('Error closing the file');
                }
              })
            } else {
              callback('Error writing to existing file');
            }
          })
        } else {
          callback('Error truncating the file');
        }
      })
    } else {
      callback('Can not open the file. It may not exist yet');
    }
  })
}

//delete file
lib.delete = (dir, filename, callback) => {
  //remove file from the file system
  fs.unlink(getFilePath(lib.baseDir, dir, filename), error => {
    if (!error) {
      callback(false);
    } else {
      callback(error);
    }
  });
}

module.exports = lib;