import { shortenURL } from '../../utils/url';
import { requireNoCache } from '../../utils/require';
import { getRawAppContext } from '../appContext';

import type { Fiber } from '../../csr/jsx/vdom';
import type { FunctionMap } from './invoke';

export type PageModule = {
  default: (props: any) => Fiber;
  getInitialProps: (ctx: any) => Promise<any>;
  serverSideFunctions: () => FunctionMap;
};

export async function loadEntrypoint(
  url: string,
  ssrEntrypoint: string,
): Promise<PageModule> {
  const shortURL = shortenURL(url);
  const rawAppContext = await getRawAppContext();

  const pageModule: PageModule = requireNoCache(ssrEntrypoint);
  if (rawAppContext.functionEntrypoints[shortURL] !== ssrEntrypoint) {
    // Entrypoint has updated, reload functions
    rawAppContext.functionEntrypoints[shortURL] = ssrEntrypoint;
    rawAppContext.functions[shortURL] = pageModule.serverSideFunctions?.() ?? {};
  }

  if (typeof pageModule.default !== 'function') {
    throw Error(
      `Check default export of ${shortURL}: expected functional component, got ${
        (pageModule.default as any)?.toString?.() || pageModule.default
      }`,
    );
  }

  return pageModule;
}
