import fs from 'fs';
import path from 'path';
import glob from 'glob';

// pagesRoot is webroot for pages
export const pagesRoot = path.join(process.cwd(), 'src', 'pages');
// resolveExtensions is array of file extensions resolvable as page entrypoint
export const resolveExtensions = ['.js', '.jsx'];

/** resolveExtension checks if filename ends with resolveExtensions and splits this part out
 * @example
 * resolveExtension('account/balance.jsx'); // ['account/balance', 'jsx']
 */
export function resolveExtension(fileName: string): [string, string] | null {
  for (let i = 0; i < resolveExtensions.length; i += 1) {
    const extension = resolveExtensions[i];
    if (fileName.endsWith(extension))
      return [
        fileName.slice(0, fileName.length - extension.length),
        // Exclude dot
        extension.slice(1),
      ];
  }
  return null;
}

const existsPromise = (fsPath: string) =>
  new Promise((resolve) => fs.exists(fsPath, resolve));

/**
 * Checks if entrypoint exists.
 * If file does not exist, function will check folder with this name.
 * @example
 * // Assuming that file src/pages/account/index.js exists
 * resolveEntrypoint('/account'); // /account/index.js
 * resolveEntrypoint('/account/index'); // /account/index.js
 * resolveEntrypoint('/account/nobalance'); // null
 */
export async function resolveEntrypoint(
  entrypoint: string,
): Promise<string | null> {
  if (!entrypoint.startsWith('/')) {
    throw Error(`Entrypoint should start with slash, got ${entrypoint}`);
  }
  if (entrypoint.startsWith('/_')) {
    // Prohibit special pages
    return null;
  }

  for (let i = 0; i < resolveExtensions.length; i += 1) {
    const extension = resolveExtensions[i];
    if (
      !entrypoint.endsWith('/') &&
      (await existsPromise(
        path.join(pagesRoot, entrypoint.slice(1) + extension),
      ))
    )
      return entrypoint + extension;
    if (
      await existsPromise(
        path.join(pagesRoot, entrypoint.slice(1), `index${extension}`),
      )
    )
      return `${
        entrypoint.endsWith('/') ? entrypoint : `${entrypoint}/`
      }index${extension}`;
  }

  return null;
}

/** allEntrypoints traverses src/pages folder recursively and returns all entrypoints */
export function allEntrypoints(): Promise<[string, string][]> {
  return new Promise((resolve, reject) =>
    glob(
      path.join(pagesRoot, '**', `*{${resolveExtensions.join(',')}}`),
      (err, matches) => {
        if (err) reject(err);
        resolve(
          matches
            .map((entrypoint) => entrypoint.slice(pagesRoot.length))
            .map(resolveExtension),
        );
      },
    ),
  );
}
