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
    await appContext.module?.dispose?.(appContext.context);
    appContext.entrypoint = appContextBundleRef.current[0];
    if (appContext.entrypoint)
      appContext.module = require(path.join(
        buildPathSSR,
        appContext.entrypoint,
      ));
    appContext.context = (await appContext.module?.default?.()) ?? {};

    if ('req' in appContext.context || 'res' in appContext.context) {
      console.warn(
        '⚠️\tWarning: app context has req or res props. They will be overriden by request objects in getInitialProps function.',
      );
    }
  }
  return appContext.context;
}
