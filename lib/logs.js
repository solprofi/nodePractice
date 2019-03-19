const path = require('path');
const fs = require('fs');
const zlib = require('zlib');


const lib = {};

lib.baseDir = path.join(__dirname, '../.logs/');

// append a string to a file. Create it if it doesn't exist
lib.append = (filename, string, callback) => {
  // open the file for appending
  fs.open(`${lib.baseDir + filename}.log`, 'a', (err, fileDescriptor) => {
    if (!err && fileDescriptor) {
      fs.appendFile(fileDescriptor, `${string}\n`, (err) => {
        if (!err) {
          fs.close(fileDescriptor, (err) => {
            if (!err) {
              callback(false);
            } else {
              callback('Error closing a file');
            }
          });
        } else {
          callback('Error appending data to a file');
        }
      });
    } else {
      callback('Error opening a file for appending');
    }
  });
};

lib.list = (includeCompressedFiles, callback) => {
  fs.readdir(lib.baseDir, (err, logFiles) => {
    if (!err && logFiles && logFiles.length > 0) {
      const fileNames = [];
      logFiles.forEach((filename) => {
        if (filename.includes('.log')) {
          fileNames.push(filename.replace('.log', ''));
        }

        // add .gz files
        if (includeCompressedFiles && filename.includes('.gz.b64')) {
          fileNames.push(filename.replace('.gz.b64', ''));
        }
      });
      callback(false, fileNames);
    } else {
      callback(err, logFiles);
    }
  });
};


lib.compress = (logId, newFileId, callback) => {
  const sourceFile = `${logId}.log`;
  const destFile = `${newFileId}.gz.b64`;

  fs.readFile(lib.baseDir + sourceFile, 'utf8', (err, inputString) => {
    if (!err && inputString) {
      zlib.gzip(inputString, (err, buffer) => {
        if (!err && buffer) {
          // send the data to dest file
          fs.open(lib.baseDir + destFile, 'wx', (err, fileDescriptor) => {
            if (!err && fileDescriptor) {
              fs.writeFile(fileDescriptor, buffer.toString('base64'), (err) => {
                if (!err) {
                  fs.close(fileDescriptor, (err) => {
                    if (!err) {
                      callback(false);
                    } else {
                      callback(err);
                    }
                  });
                } else {
                  callback(err);
                }
              });
            } else {
              callback(err);
            }
          });
        } else {
          callback(err);
        }
      });
    } else {
      callback(err);
    }
  });
};

lib.decompress = (fileId, callback) => {
  const filename = `${fileId}.gz.b64`;

  fs.readFile(lib.baseDir + filename, 'utf8', (err, str) => {
    if (!err && str) {
      const inputBuffer = Buffer.from(str, 'base64');

      zlib.unzip(inputBuffer, (err, outputBuffer) => {
        if (!err && outputBuffer) {
          const decompressedString = outputBuffer.toString();
          callback(false, decompressedString);
        } else {
          callback(err);
        }
      });
    } else {
      callback(err);
    }
  });
};

lib.truncate = (logId, callback) => {
  fs.truncate(`${lib.baseDir + logId}.log`, 0, (err) => {
    if (!err) {
      callback(false);
    } else {
      callback(err);
    }
  });
};

module.exports = lib;
