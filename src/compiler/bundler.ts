import webpack from 'webpack';
import { EventEmitter } from 'events';

import { createCompilerSSR } from './index';
import { resolveEntrypoint, resolveExtension } from './entrypoints';

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
      bundle: Bundle;
    }
  | { status: 'error'; error: Error }
  | { status: 'not-found' };

export type BuildEventListener = (event: BuildEvent) => void;

/** Bundler is responsible of maintaining list of current bundles */
export class Bundler extends EventEmitter {
  /** List page entrypoints to be built */
  private $activeEntrypoints = new Map<string, number>();

  private $compilerBundlesSSR = new Map<string, Entrypoint>();
  private onBuild: webpack.ICompiler.Handler = (err, stats) => {
    if (err) {
      console.error(`⛔️\t${err.message}`);
      console.log(err.stack);
      return;
    }

    const entrypoints = Array.from(stats.compilation.entrypoints.entries());
    entrypoints.forEach(([pageName, entrypoint]) => {
      const newEntrypoint = entrypoint.chunks
        .map((chunk) => Array.from(chunk.files.values()))
        .flat();

      const oldEntrypoint = this.$compilerBundlesSSR.get(pageName);
      if (oldEntrypoint && oldEntrypoint.join(',') === newEntrypoint.join(','))
        return;

      console.log(`⚡️\tBuilt page ${pageName}`);
      this.$compilerBundlesSSR.set(pageName, newEntrypoint);
      this.emit(pageName, {
        status: 'success',
        bundle: { ssr: newEntrypoint },
      });
    });
  };

  private getEntrypoints = () => {
    return Array.from(this.$activeEntrypoints.entries())
      .filter(([_, count]) => count > 0)
      .map(([page]) => page)
      .reduce(
        (entrypoints, entrypointFile) => ({
          ...entrypoints,
          [resolveExtension(entrypointFile)[0]]: entrypointFile,
        }),
        {},
      );
  };
  private $ssrWatcher = createCompilerSSR(this.getEntrypoints).watch(
    {},
    this.onBuild,
  );

  constructor() {
    super();
    process.on('SIGINT', () => this.$ssrWatcher.close(() => {}));
  }

  private getBundle(page: string): Bundle | null {
    if (!this.$compilerBundlesSSR.has(page)) return null;
    return { ssr: this.$compilerBundlesSSR.get(page), client: [] };
  }

  async buildOnce(entrypoint: string): Promise<BuildEvent> {
    const entrypointFile = await resolveEntrypoint(entrypoint);
    if (!entrypointFile) {
      return { status: 'not-found' };
    }

    let result: BuildEvent;
    const [page] = resolveExtension(entrypointFile);
    if (this.$activeEntrypoints.has(entrypointFile)) {
      this.$activeEntrypoints.set(
        entrypointFile,
        this.$activeEntrypoints.get(entrypointFile) + 1,
      );
    } else {
      this.$activeEntrypoints.set(entrypointFile, 1);
      this.$ssrWatcher.invalidate();
    }

    const bundle = this.getBundle(page);
    if (bundle === null) {
      console.log(`🛠\tBuilding page ${page}`);
      result = await new Promise((resolve) => this.once(page, resolve));
    } else {
      result = {
        status: 'success',
        bundle,
      };
    }

    this.$activeEntrypoints.set(
      entrypointFile,
      this.$activeEntrypoints.get(entrypointFile) - 1,
    );
    return result;
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
      this.$ssrWatcher.invalidate();
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
