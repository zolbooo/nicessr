#!/usr/bin/env node
const args = require('args');

args
  .command('build', 'Create production build', ['b'])
  .command('serve', 'Start production server', ['s']);

const flags = args.parse(process.argv);

if (flags.build) {
  require('./dist/production');
} else if (flags.serve) {
  require('./dist/production/serve');
} else {
  // Bootstrap
  require('./dist');
}
