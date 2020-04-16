import fs from 'fs';
import path from 'path';

import {
  pagesRoot,
  resolveExtension,
  resolveEntrypoint,
  allEntrypoints,
} from './entrypoints';

const createFile = (filename: string) =>
  new Promise((resolve) => fs.writeFile(filename, '', resolve));
const deleteFile = (filename: string) =>
  new Promise((resolve) => fs.unlink(filename, resolve));

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
    await createFile(path.join(pagesRoot, 'test-entrypoint.js'));
    expect(await resolveEntrypoint('/test-entrypoint')).toBe(
      '/test-entrypoint.js',
    );
    expect(await resolveEntrypoint('/test-entrypoint1')).toBe(null);
    await deleteFile(path.join(pagesRoot, 'test-entrypoint.js'));
  });

  it('should handle file in directory properly', async () => {
    await new Promise((resolve) =>
      fs.mkdir(path.join(pagesRoot, 'testing'), resolve),
    );
    await createFile(path.join(pagesRoot, 'testing', 'test-entrypoint.js'));

    expect(await resolveEntrypoint('/testing/test-entrypoint')).toBe(
      '/testing/test-entrypoint.js',
    );
    expect(await resolveEntrypoint('/testing/test-entrypoint1')).toBe(null);

    await deleteFile(path.join(pagesRoot, 'testing', 'test-entrypoint.js'));

    await createFile(path.join(pagesRoot, 'testing', 'index.jsx'));

    expect(await resolveEntrypoint('/testing')).toBe('/testing/index.jsx');
    expect(await resolveEntrypoint('/testing/')).toBe('/testing/index.jsx');
    expect(await resolveEntrypoint('/testing/index')).toBe(
      '/testing/index.jsx',
    );

    await deleteFile(path.join(pagesRoot, 'testing', 'index.jsx'));
    await new Promise((resolve) =>
      fs.rmdir(path.join(pagesRoot, 'testing'), resolve),
    );
  });
});

describe('allEntrypoints should work properly', () => {
  it('should handle files in pages/ folder properly', async () => {
    await createFile(path.join(pagesRoot, 'test1.jsx'));
    await createFile(path.join(pagesRoot, 'test2.js'));
    await new Promise((resolve) =>
      fs.mkdir(path.join(pagesRoot, 'testing'), resolve),
    );
    await createFile(path.join(pagesRoot, 'testing', 'x.jsx'));

    const entrypoints = new Set(
      (await allEntrypoints()).map(
        ([entrypoint, extension]) => `${entrypoint}.${extension}`,
      ),
    );
    ['/test1.jsx', '/test2.js', '/testing/x.jsx'].forEach((entrypoint) =>
      expect(entrypoints).toContain(entrypoint),
    );

    await deleteFile(path.join(pagesRoot, 'test1.jsx'));
    await deleteFile(path.join(pagesRoot, 'test2.js'));
    await deleteFile(path.join(pagesRoot, 'testing', 'x.jsx'));
    await new Promise((resolve) =>
      fs.rmdir(path.join(pagesRoot, 'testing'), resolve),
    );
  });
});
