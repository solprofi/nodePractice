//container for all environments
const environments = {};

//create staging (default) env
environments.staging = {
  httpPort: 3000,
  httpsPort: 3001,
  envName: 'staging',
  hashingSecret: 'This is a hashing secret',
};

//create production (default) env
environments.production = {
  httpPort: 6000,
  httpsPort: 6001,
  envName: 'production',
  hashingSecret: 'This is a hashing secret',
};

//determine which env was passed into command line
const env = process.env.NODE_ENV;
const currentEnv = typeof (env) === 'string' ? env.toLowerCase() : '';

//check if environments object has the current env
const envToExport = typeof (environments[currentEnv]) === 'object' ? environments[currentEnv] : environments.staging;
module.exports = envToExport;