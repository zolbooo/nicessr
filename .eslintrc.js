const config = require('@nicepack/eslint-ts');

config.rules['@typescript-eslint/camelcase'] = 'off';
config.rules['import/no-dynamic-require'] = 'off';
config.rules['no-await-in-loop'] = 'off';

module.exports = config;
