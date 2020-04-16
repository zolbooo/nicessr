import path from 'path';
import webpack from 'webpack';

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

export const getEntrypoints = (prefix: string) => () =>
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
