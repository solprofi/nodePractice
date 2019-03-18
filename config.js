// container for all environments
const environments = {};

// create staging (default) env
environments.staging = {
  httpPort: 3005,
  httpsPort: 3006,
  envName: 'staging',
  hashingSecret: 'This is a hashing secret',
  maxChecks: 5,
  twilio: {
    accountSid: 'ACf3c2cd3bfaaa4ae25633d26dad52742e',
    authToken: '491eaae5a5a882824b6b260a14370058',
    sender: '+12013471874',
  },
};

// create production (default) env
environments.production = {
  httpPort: 6000,
  httpsPort: 6001,
  envName: 'production',
  hashingSecret: 'This is a hashing secret',
  maxChecks: 5,
  twilio: {
    accountSid: 'ACf3c2cd3bfaaa4ae25633d26dad52742e',
    authToken: '491eaae5a5a882824b6b260a14370058',
    sender: '+12013471874',
  },
};

// determine which env was passed into command line
const env = process.env.NODE_ENV;
const currentEnv = typeof env === 'string' ? env.toLowerCase() : '';

// check if environments object has the current env
const envToExport = typeof environments[currentEnv] === 'object' ? environments[currentEnv] : environments.staging;
module.exports = envToExport;
