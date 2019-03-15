//container for all environments
const environments = {};

//create staging (default) env
environments.staging = {
  port: 3000,
  envName: 'staging',
};

//create production (default) env
environments.production = {
  port: 6000,
  envName: 'production',
};

//determine which env was passed into command line
const env = process.env.NODE_ENV;
const currentEnv = typeof (env) === 'string' ? env.toLowerCase() : '';


//check if environments object has the current env
const envToExport = typeof (environments[currentEnv]) === 'object' ? environments[currentEnv] : environments.staging;
module.exports = envToExport;