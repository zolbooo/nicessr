import fs from 'fs';
import path from 'path';
import webpack from 'webpack';

import { pagesRoot, resolveExtension, resolveExtensions } from '../entrypoints';
import { appContextBundleRef } from './bundles';

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
    .filter(([_, count]) => count > 0)
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

  const appContextExtension = resolveExtensions.find((extension) =>
    fs.existsSync(path.join(pagesRoot, '_app' + extension)),
  );
  if (appContextExtension) {
    entrypoints['ssr:_app'] = path.join(
      pagesRoot,
      '_app' + appContextExtension,
    );
  } else {
    appContextBundleRef.current = [];
  }

  return entrypoints;
};
