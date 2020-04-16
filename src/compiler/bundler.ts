import path from 'path';
import webpack from 'webpack';
import { EventEmitter } from 'events';

import { createCompiler } from './index';
import { resolveEntrypoint, resolveExtension, pagesRoot } from './entrypoints';

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
  /** List page entrypoints to be built */
  private $activeEntrypoints = new Map<string, number>();

  private $compilerBundlesSSR = new Map<string, Entrypoint>();
  private $compilerBundlesClient = new Map<string, Entrypoint>();

  private getEntrypointsFromStats = (stats: webpack.Stats) => {
    return Array.from(
      stats.compilation.entrypoints.entries(),
    ).map(([pageName, entrypoint]) => [
      pageName,
      entrypoint.chunks.map((chunk) => Array.from(chunk.files.values())).flat(),
    ]);
  };
  private onBuild = (err, { stats }) => {
    if (err) {
      console.error(`⛔️\t ${err.message}`);
      console.log(err.stack);
      return;
    }

    const bundle = stats.map(this.getEntrypointsFromStats);
    bundle.forEach((entrypoints) => {
      entrypoints.forEach(([pageNameWithPrefix, entrypoint]) => {
        const pageName = pageNameWithPrefix.startsWith('ssr:')
          ? pageNameWithPrefix.slice('ssr:'.length)
          : pageNameWithPrefix.slice('client:'.length);
        const isSSR = pageNameWithPrefix.startsWith('ssr:');

        const oldEntrypoint = isSSR
          ? this.$compilerBundlesSSR.get(pageName)
          : this.$compilerBundlesClient.get(pageName);
        if (oldEntrypoint && oldEntrypoint.join(',') === entrypoint.join(','))
          return;

        if (isSSR) {
          console.log(`⚡️ [SSR] \tBuilt page ${pageName}`);
          this.$compilerBundlesSSR.set(pageName, entrypoint);
        } else {
          console.log(`⚡️ [Client] \tBuilt page ${pageName}`);
          this.$compilerBundlesClient.set(pageName, entrypoint);
        }

        this.emit(pageName, {
          status: 'success',
          bundle: { [isSSR ? 'ssr' : 'client']: entrypoint },
        });
      });
    });
  };

  private getEntrypoints = (prefix: string) => () =>
    Array.from(this.$activeEntrypoints.entries())
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
  private $watcher = createCompiler(this.getEntrypoints).watch(
    {},
    this.onBuild as any,
  );

  constructor() {
    super();
    process.on('SIGINT', () => {
      this.$watcher.close(() => {});
      this.$watcher.close(() => {});
    });
  }

  private getBundle(page: string): Bundle | null {
    if (
      !this.$compilerBundlesSSR.has(page) ||
      !this.$compilerBundlesClient.has(page)
    )
      return null;
    return {
      ssr: this.$compilerBundlesSSR.get(page),
      client: this.$compilerBundlesClient.get(page),
    };
  }

  async buildOnce(entrypoint: string): Promise<Bundle | null> {
    const entrypointFile = await resolveEntrypoint(entrypoint);
    if (!entrypointFile) {
      return null;
    }

    const [page] = resolveExtension(entrypointFile);
    if (this.$activeEntrypoints.has(entrypointFile)) {
      this.$activeEntrypoints.set(
        entrypointFile,
        this.$activeEntrypoints.get(entrypointFile) + 1,
      );
    } else {
      this.$activeEntrypoints.set(entrypointFile, 1);
      this.$watcher.invalidate();
    }

    let bundle: Bundle = this.getBundle(page);
    if (bundle === null) {
      console.log(`🛠\tBuilding page ${page}`);
      while (bundle === null) {
        await new Promise((resolve) => this.once(page, resolve));
        bundle = this.getBundle(page);
      }
    }

    this.$activeEntrypoints.set(
      entrypointFile,
      this.$activeEntrypoints.get(entrypointFile) - 1,
    );
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
    if (this.$activeEntrypoints.has(entrypointFile)) {
      this.$activeEntrypoints.set(
        entrypointFile,
        this.$activeEntrypoints.get(entrypointFile) + 1,
      );
    } else {
      this.$activeEntrypoints.set(entrypointFile, 1);
      this.$watcher.invalidate();
    }

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
    this.$activeEntrypoints.set(
      entrypointFile,
      this.$activeEntrypoints.get(entrypointFile) - 1,
    );
    this.removeListener(page, handler);
  }
}
