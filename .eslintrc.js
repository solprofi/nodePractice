module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true
  },
  extends: 'airbnb-base',
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  parserOptions: {
    ecmaVersion: 2018
  },
  rules: {
    'linebreak-style': ['error', 'windows'],
    'no-underscore-dangle': 0,
    'no-shadow': 0,
    'no-param-reassign': 0,
    'no-plusplus': 0
  }
};
