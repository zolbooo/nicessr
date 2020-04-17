import fs from 'fs';
import path from 'path';
import webpack from 'webpack';

import { appContextBundleRef } from './bundles';
import { pagesRoot, resolveExtension } from '../entrypoints';

const activeEntrypoints = new Map<string, number>();

/**
 * Add entrypoint to build list.
 * If entrypoint was not referenced before, build will be trigerred.
 */
export function reference(entrypoint: string, watcher: webpack.Watching) {
  if (activeEntrypoints.has(entrypoint)) {
    activeEntrypoints.set(entrypoint, activeEntrypoints.get(entrypoint) + 1);
  } else {
    activeEntrypoints.set(entrypoint, 1);
    watcher.invalidate();
  }
}

/** Remove one reference to entrypoint in the build list */
export function unref(entrypoint: string) {
  if (activeEntrypoints.has(entrypoint)) {
    activeEntrypoints.set(entrypoint, activeEntrypoints.get(entrypoint) - 1);
  }
}

const getActiveEntrypoints = (prefix: string) => () =>
  Array.from(activeEntrypoints.entries())
    .filter((entry) => entry[1] > 0)
    .map(([page]) => page)
    .reduce(
      (entrypoints, entrypointFile) => ({
        ...entrypoints,
        [prefix + resolveExtension(entrypointFile)[0]]: path.join(
          pagesRoot,
          entrypointFile,
        ),
      }),
      {},
    );

export const getEntrypoints = (prefix: string) => () => {
  const entrypoints = getActiveEntrypoints(prefix)();

  if (prefix === 'ssr:') {
    if (fs.existsSync(path.join(pagesRoot, '_app.js'))) {
      entrypoints['ssr:_app'] = path.join(pagesRoot, '_app.js');
    } else appContextBundleRef.current = [];
  }

  return entrypoints;
};
