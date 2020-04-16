import path from 'path';

import { buildPathSSR } from '../compiler';
import { appContextBundleRef } from '../compiler/bundler/bundles';

export type AppContextData = {
  module: any;
  context: any;
  entrypoint: string | null;
};

let appContext: AppContextData = {
  entrypoint: null,
  context: null,
  module: {},
};

export async function getAppContext(): Promise<any> {
  if (appContext.entrypoint !== appContextBundleRef.current[0]) {
    await appContext.module?.dispose?.();
    appContext.entrypoint = appContextBundleRef.current[0];
    if (appContext.entrypoint)
      appContext.module = require(path.join(
        buildPathSSR,
        appContext.entrypoint,
      ));
    appContext.context = (await appContext.module?.default?.()) ?? {};
  }
  return appContext.context;
}
