import path from 'path';

import { css } from '../csr/css';
import { buildPathSSR } from '../compiler';
import { Fiber, isFiber } from '../csr/jsx/vdom';
import { RequestContext } from '../csr';

import { getAppContext } from './appContext';

export type PageBundleInfo = {
  ctx: RequestContext;
  page: string;
  entrypoint: string[];
};

export async function renderEntrypoint({
  ctx,
  entrypoint,
}: PageBundleInfo): Promise<
  { root: Fiber; initialProps: string } | { root: null; initialProps: Error }
> {
  try {
    if (entrypoint.length !== 1) {
      throw Error(
        `Invariant violation: expected single file as built bundle, got [${entrypoint
          .map((str) => `'${str}'`)
          .join(',')}]`,
      );
    }

    globalThis.css = css;

    const pageModule = path.join(buildPathSSR, entrypoint[0]);
    delete require.cache[require.resolve(pageModule)];
    const page = require(pageModule);

    const initialProps =
      (await page.getInitialProps?.({
        ...ctx,
        ...(await getAppContext()),
      })) ?? {};

    if (typeof page.default !== 'function') {
      throw Error(
        `Check default export of ${
          ctx.req.path
        }: expected functional component, got ${
          page.default?.toString?.() || page.default
        }`,
      );
    }

    const root = page.default(initialProps);
    if (!isFiber(root)) {
      throw Error(`Expected fiber to be rendered, got ${root.toString()}`);
    }

    return { root, initialProps: JSON.stringify(initialProps) };
  } catch (err) {
    console.error(`⛔️ ${err.message}`);
    console.error(err.stack);
    return { root: null, initialProps: err };
  }
}
