import path from 'path';
import chokidar from 'chokidar';
import { EventEmitter } from 'events';

import { createCompiler } from '../index';
import { getEntrypointsFromStats } from './stats';
import { reference, unref, getEntrypoints } from './entrypoints';
import { resolveEntrypoint, resolveExtension, pagesRoot } from '../entrypoints';
import {
  getBundle,
  clientBundles,
  serverBundles,
  appContextBundleRef,
} from './bundles';

/** Entrypoint is list of JS files used in bundle */
export type Entrypoint = string[];
/** Bundle has two entrypoints: for SSR and for client */
export type Bundle = {
  ssr: Entrypoint;
  client: Entrypoint;
  appContext: Entrypoint;
};

export type BuildEvent =
  | {
      status: 'success';
      bundle:
        | { ssr: Entrypoint }
        | { client: Entrypoint }
        | { appContext: Entrypoint };
    }
  | { status: 'error'; error: Error }
  | { status: 'not-found' };

export type BuildEventListener = (event: BuildEvent) => void;

/** Bundler is responsible of maintaining list of current bundles */
export class Bundler extends EventEmitter {
  private onBuild = (err, result) => {
    if (err) {
      console.error(`⛔️\t ${err.message}`);
      console.log(err.stack);
      return;
    }

    const { stats } = result;
    for (let i = 0; i < stats.length; i += 1) {
      const buildStats = stats[i];
      if (buildStats.compilation.errors?.length > 0) {
        console.error('⛔️\tThere are errors occurred during the build:');
        buildStats.compilation.errors.forEach((buildError) =>
          console.error(buildError),
        );
        return;
      }
    }

    const bundle = stats.map(getEntrypointsFromStats);
    bundle.forEach((entrypoints) => {
      entrypoints.forEach(([entrypointName, entrypoint]) => {
        if (entrypointName === 'ssr:_app') {
          if (entrypoint[0] === appContextBundleRef.current[0]) return;

          console.log('⚡️ [SSR]\tBuilt app context');
          appContextBundleRef.current = entrypoint ?? [];
          this.emit('appContext', {
            status: 'success',
            bundle: { appContext: entrypoint },
          });
          return;
        }

        const isSSR = entrypointName.startsWith('ssr:');
        const pageName = isSSR
          ? entrypointName.slice('ssr:'.length)
          : entrypointName.slice('client:'.length);

        const oldEntrypoint = isSSR
          ? serverBundles.get(pageName)
          : clientBundles.get(pageName);
        if (oldEntrypoint && oldEntrypoint.join(',') === entrypoint.join(','))
          return;

        if (isSSR) {
          console.log(`⚡️ [SSR]\tBuilt page ${pageName}`);
          serverBundles.set(pageName, entrypoint);
        } else {
          console.log(`⚡️ [Client]\tBuilt page ${pageName}`);
          clientBundles.set(pageName, entrypoint);
        }

        this.emit(pageName, {
          status: 'success',
          bundle: { [isSSR ? 'ssr' : 'client']: entrypoint },
        });
      });
    });
  };

  private $watcher = createCompiler(getEntrypoints).watch(
    {},
    this.onBuild as any,
  );

  constructor() {
    super();
    const appCtxWatcher = chokidar
      .watch(path.join(pagesRoot, '_app.js'))
      .on('add', () => this.$watcher.invalidate())
      .on('unlink', () => this.$watcher.invalidate());
    process.on('SIGINT', () => {
      this.$watcher.close(() => {});
      appCtxWatcher.close();
    });
  }

  async buildOnce(entrypoint: string): Promise<Bundle | null> {
    const entrypointFile = await resolveEntrypoint(entrypoint);
    if (!entrypointFile) {
      return null;
    }

    const [page] = resolveExtension(entrypointFile);
    reference(entrypointFile, this.$watcher);

    let bundle: Bundle = getBundle(page);
    if (bundle === null) {
      console.log(`🛠\tBuilding page ${page}`);
      while (bundle === null) {
        await new Promise((resolve) => this.once(page, resolve));
        bundle = getBundle(page);
      }
    }

    unref(entrypointFile);
    return bundle;
  }

  /**
   * Listens for build events on specific entrypoint.
   * If entrypoint was not found, handler will be called only once.
   */
  async subscribe(entrypoint: string, handler: BuildEventListener) {
    const entrypointFile = await resolveEntrypoint(entrypoint);
    if (!entrypointFile) {
      handler({ status: 'not-found' });
      return;
    }

    const [page] = resolveExtension(entrypointFile);
    reference(entrypointFile, this.$watcher);

    this.addListener(page, handler);
    this.addListener('appContext', handler);
  }

  async unsubscribe(entrypoint: string, handler: BuildEventListener) {
    const entrypointFile = await resolveEntrypoint(entrypoint);
    if (!entrypointFile) {
      console.warn(
        'Bundler: unsubscribe was called on non-existing entrypoint. This could lead to memory leak.',
      );
      return;
    }

    const [page] = resolveExtension(entrypointFile);
    unref(entrypoint);

    this.removeListener('appContext', handler);
    this.removeListener(page, handler);
  }
}
