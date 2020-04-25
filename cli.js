#!/usr/bin/env node
const fs = require('fs');
const args = require('args');
const path = require('path');

if (!fs.existsSync(path.join(process.cwd(), 'src', 'pages'))) {
  console.error(
    '⛔️\tCannot find src/pages/ folder. Make sure that you are running nicessr from project root.',
  );
  process.exit(1);
}

args
  .command(
    'build',
    'Create production build',
    () => {
      process.env.NODE_ENV = 'production';
      require('./dist/production/index');
    },
    ['b'],
  )
  .command('export', 'Export static assets and markup', () => {
    process.env.NODE_ENV = 'production';
    require('./dist/production/export');
  })
  .command('serve', 'Start production server', () => {
    process.env.NODE_ENV = 'production';
    require('./dist/production/serve');
  })
  .command('start', 'Start development server', () => require('./dist/index'));

args.parse(process.argv);
