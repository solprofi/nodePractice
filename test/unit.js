// unit tests

// dependencies
const assert = require('assert');
const helpers = require('../lib/helpers');
const logs = require('../lib/logs');
const exampleProblem = require('../lib/exampleProblem');

//container
const unit = {};

// Assert getNumber returns 1
unit['helpers.getNumber should return 1'] = (done) => {
  const val = helpers.testNumber();

  assert.equal(val, 1);
  done();
};

// Assert getNumber returns a number
unit['helpers.getNumber should return a number'] = (done) => {
  const val = helpers.testNumber();

  assert.equal(typeof (val), 'number');
  done();
};

// Assert getNumber returns 2
unit['helpers.getNumber should return 2'] = (done) => {
  const val = helpers.testNumber();

  assert.equal(val, 2);
  done();
};

unit['logs.list should callback false and an array of log names'] = (done) => {
  logs.list(true, (err, logFiles) => {
    assert.equal(err, false);
    assert.ok(logFiles instanceof Array);
    assert.ok(logFiles.length > 1);
    done();
  })
}

unit['logs.truncate should not throw if  the log id does not exist'] = (done) => {
  assert.doesNotThrow(() => {
    logs.truncate('Nonexisting id', (err) => {
      assert.ok(err);
      done();
    });
  }, TypeError);
}

unit['exampleProblem.init should not throw (but it does for example purposes)'] = (done) => {
  assert.doesNotThrow(() => {
    exampleProblem.init();
    done();
  }, TypeError);
}

module.exports = unit;