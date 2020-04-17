#!/usr/bin/env node
const args = require('args');

args
  .command(
    'build',
    'Create production build',
    () => require('./dist/production/index'),
    ['b'],
  )
  .command(
    'serve',
    'Start production server',
    () => require('./dist/production/serve'),
    ['s'],
  );

const flags = args.parse(process.argv);
require('./dist');
