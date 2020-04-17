#!/usr/bin/env node
const args = require('args');

args
  .command(
    'build',
    'Create production build',
    () => require('./dist/production/index'),
    ['b'],
  )
  .command('serve', 'Start production server', () =>
    require('./dist/production/serve'),
  )
  .command('start', 'Start development server', () => require('./dist/index'));

args.parse(process.argv);
