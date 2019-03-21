// test runner

// dependencies
const assert = require('assert');
const helpers = require('../lib/helpers');

const _app = {};

_app.tests = {
  unit: {},
};

// Assert getNumber returns 1
_app.tests.unit['helpers.getNumber should return 1'] = (done) => {
  const val = helpers.testNumber();

  assert.equal(val, 1);
  done();
};

// Assert getNumber returns a number
_app.tests.unit['helpers.getNumber should return a number'] = (done) => {
  const val = helpers.testNumber();

  assert.equal(typeof (val), 'number');
  done();
};

// Assert getNumber returns 2
_app.tests.unit['helpers.getNumber should return 2'] = (done) => {
  const val = helpers.testNumber();

  assert.equal(val, 2);
  done();
};

_app.countTests = () => {
  let counter = 0;

  Object.keys(_app.tests).forEach((key) => {
    const subTests = _app.tests[key];
    Object.keys(subTests).forEach(() => {
      counter++;
    });
  });

  return counter;
};

_app.produceTestReport = (limit, successes, errors) => {
  console.log('');
  console.log('-------------------BEGIN TEST REPORT-------------------');
  console.log('');
  console.log('Total tests:', limit);
  console.log('Total successes:', successes);
  console.log('Total errors:', errors);

  if (errors.length > 0) {
    console.log('-------------------BEGIN ERROR DETAILS-------------------');
    errors.forEach((err) => {
      console.log('');
      console.log('\x1b[32m%s\x1b[0m', err.name);
      console.log(err.error);
      console.log('');
    });

    console.log('-------------------END ERROR DETAILS-------------------');
  }
};

// run all the tests
_app.runTest = () => {
  const errors = [];
  let successes = 0;
  const limit = _app.countTests();
  let counter = 0;

  Object.keys(_app.tests).forEach((key) => {
    const subTests = _app.tests[key];
    Object.keys(subTests).forEach((testName) => {
      (() => {
        const tempTest = testName;
        const testValue = subTests[testName];

        try {
          testValue(() => {
            console.log('\x1b[32m%s\x1b[0m', tempTest);
            counter++;
            successes++;
            if (counter === limit) {
              _app.produceTestReport(limit, successes, errors);
            }
          });
        } catch (e) {
          errors.push({
            name: testName,
            error: e,
          });
          console.log('\x1b[31m%s\x1b[0m', tempTest);
          counter++;
          if (counter === limit) {
            _app.produceTestReport(limit, successes, errors);
          }
        }
      })();
    });
  });
};

// run the tests
_app.runTest();
