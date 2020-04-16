import { EventEmitter } from 'events';

import { createCompiler } from '../index';
import { getEntrypointsFromStats } from './stats';
import { reference, unref, getEntrypoints } from './entrypoints';
import { resolveEntrypoint, resolveExtension } from '../entrypoints';
import { getBundle, clientBundles, serverBundles } from './bundles';

/** Entrypoint is list of JS files used in bundle */
export type Entrypoint = string[];
/** Bundle has two entrypoints: for SSR and for client */
export type Bundle = {
  ssr: Entrypoint;
  client: Entrypoint;
};

export type BuildEvent =
  | {
      status: 'success';
      bundle: { ssr: Entrypoint } | { client: Entrypoint };
    }
  | { status: 'error'; error: Error }
  | { status: 'not-found' };

export type BuildEventListener = (event: BuildEvent) => void;

/** Bundler is responsible of maintaining list of current bundles */
export class Bundler extends EventEmitter {
  private onBuild = (err, { stats }) => {
    if (err) {
      console.error(`⛔️\t ${err.message}`);
      console.log(err.stack);
      return;
    }

    const bundle = stats.map(getEntrypointsFromStats);
    bundle.forEach((entrypoints) => {
      entrypoints.forEach(([pageNameWithPrefix, entrypoint]) => {
        const isSSR = pageNameWithPrefix.startsWith('ssr:');
        const pageName = isSSR
          ? pageNameWithPrefix.slice('ssr:'.length)
          : pageNameWithPrefix.slice('client:'.length);

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
    process.on('SIGINT', () => this.$watcher.close(() => {}));
  }

  async buildOnce(entrypoint: string): Promise<Bundle | null> {
    const entrypointFile = await resolveEntrypoint(entrypoint);
    if (!entrypointFile) {
      return null;
    }

    const [page] = resolveExtension(entrypointFile);
    reference(entrypoint, this.$watcher);

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
    reference(entrypoint, this.$watcher);

    this.addListener(page, handler);
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

    this.removeListener(page, handler);
  }
}
