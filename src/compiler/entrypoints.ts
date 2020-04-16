import path from 'path';
import chokidar from 'chokidar';

// pagesRoot is webroot for pages
export const pagesRoot = path.join(process.cwd(), 'src', 'pages');
// resolveExtensions is array of file extensions resolvable as page entrypoint
const resolveExtensions = ['.js', '.jsx'];

/** resolveExtension checks if filename ends with resolveExtensions and splits this part out
 * @example
 * resolveExtension('account/balance.jsx'); // ['account/balance', 'jsx']
 */
export function resolveExtension(path: string): [string, string] | null {
  for (let extension of resolveExtensions) {
    if (path.endsWith(extension))
      return [
        path.slice(0, path.length - extension.length),
        // Exclude dot
        extension.slice(1),
      ];
  }
  return null;
}

/** availableEntrypoints is map of available files in format {[entrypointName] => extension} */
const availableEntrypoints = new Map<string, string>();

/**
 * @example
 * // Assuming that file src/pages/account/balance.js exists
 * resolveEntrypoint('/account/balance'); // /account/balance.js
 * resolveEntrypoint('/account/nobalance'); // null
 */
export function resolveEntrypoint(entrypoint: string): string {
  if (!entrypoint.startsWith('/')) {
    throw Error(`Entrypoint should start with slash, got ${entrypoint}`);
  }

  return availableEntrypoints.has(entrypoint)
    ? `${entrypoint}.${availableEntrypoints.get(entrypoint)}`
    : null;
}

export default function watchPages() {
  const pagesWatcher = chokidar
    .watch(pagesRoot)
    .on('add', (path) => {
      const entrypoint = resolveExtension(path.slice(pagesRoot.length));
      if (entrypoint === null) return;

      const [filename, extension] = entrypoint;
      if (availableEntrypoints.has(filename)) {
        throw Error(
          `Invariant violation: you cannot create two entrypoints with same name, check ${filename}`,
        );
      }
      availableEntrypoints.set(filename, extension);
    })
    .on('unlink', (path) => {
      const entrypoint = resolveExtension(path);
      if (entrypoint === null) return;

      const [filename] = entrypoint;
      availableEntrypoints.delete(filename);
    });
  process.on('SIGINT', () => {
    pagesWatcher.close();
  });

  return pagesWatcher;
}
