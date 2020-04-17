#!/usr/bin/env node
const args = require('args');

args.command('build', 'Create production build', ['b']);

const flags = args.parse(process.argv);

if (flags.build) {
  require('./dist/production');
} else {
  // Bootstrap
  require('./dist');
}
