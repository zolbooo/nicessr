import fs from 'fs';
import path from 'path';

import { pagesRoot, resolveExtension, resolveEntrypoint } from './entrypoints';

describe('resolveExtension should work properly', () => {
  it('should split out extension', () => {
    expect(resolveExtension('account/balance.jsx')).toStrictEqual([
      'account/balance',
      'jsx',
    ]);
    expect(resolveExtension('account/info.js')).toStrictEqual([
      'account/info',
      'js',
    ]);
  });
  it('should return null on unsupported extension', () => {
    expect(resolveExtension('account/balance.cpp')).toBe(null);
  });
});

describe('resolveEntrypoint should work properly', () => {
  it('should handle new file properly', async () => {
    await new Promise((resolve) =>
      fs.writeFile(path.join(pagesRoot, 'test-entrypoint.js'), '', resolve),
    );

    expect(await resolveEntrypoint('/test-entrypoint')).toBe(
      '/test-entrypoint.js',
    );
    expect(await resolveEntrypoint('/test-entrypoint1')).toBe(null);

    await new Promise((resolve) =>
      fs.unlink(path.join(pagesRoot, 'test-entrypoint.js'), resolve),
    );
  });

  it('should handle file in directory properly', async () => {
    await new Promise((resolve) =>
      fs.mkdir(path.join(pagesRoot, 'testing'), resolve),
    );
    await new Promise((resolve) =>
      fs.writeFile(
        path.join(pagesRoot, 'testing', 'test-entrypoint.js'),
        '',
        resolve,
      ),
    );

    expect(await resolveEntrypoint('/testing/test-entrypoint')).toBe(
      '/testing/test-entrypoint.js',
    );
    expect(await resolveEntrypoint('/testing/test-entrypoint1')).toBe(null);

    await new Promise((resolve) =>
      fs.unlink(path.join(pagesRoot, 'testing', 'test-entrypoint.js'), resolve),
    );

    await new Promise((resolve) =>
      fs.writeFile(path.join(pagesRoot, 'testing', 'index.jsx'), '', resolve),
    );

    expect(await resolveEntrypoint('/testing')).toBe('/testing/index.jsx');
    expect(await resolveEntrypoint('/testing/')).toBe('/testing/index.jsx');
    expect(await resolveEntrypoint('/testing/index')).toBe(
      '/testing/index.jsx',
    );

    await new Promise((resolve) =>
      fs.unlink(path.join(pagesRoot, 'testing', 'index.jsx'), resolve),
    );
    await new Promise((resolve) =>
      fs.rmdir(path.join(pagesRoot, 'testing'), resolve),
    );
  });
});
