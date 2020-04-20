import path from 'path';

import { buildPathSSR } from '../compiler';
import { requireNoCache } from '../utils/require';
import { appContextBundleRef } from '../compiler/bundler/bundles';

export type AppContextData = {
  module: any;
  context: any;
  entrypoint: string | null;
};

const appContext: AppContextData = {
  entrypoint: null,
  context: null,
  module: {},
};

export async function getAppContext(): Promise<any> {
  if (appContext.entrypoint !== appContextBundleRef.current[0]) {
    await appContext.module?.dispose?.(appContext.context);
    [appContext.entrypoint] = appContextBundleRef.current;
    if (appContext.entrypoint)
      appContext.module = requireNoCache(
        path.join(buildPathSSR, appContext.entrypoint),
      );
    appContext.context = (await appContext.module?.default?.()) ?? {};

    if (process.env.NODE === 'development') {
      if ('req' in appContext.context || 'res' in appContext.context) {
        console.warn(
          '⚠️\tWarning: app context has req or res props. They will be overriden by request objects in getInitialProps function.',
        );
      }
    }
  }
  return appContext.context;
}
