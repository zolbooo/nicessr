import path from 'path';

import { css } from '../csr/css';
import { buildPathSSR } from '../compiler';
import { Fiber, isFiber } from '../csr/jsx/vdom';
import { RequestContext } from '../csr';

import { getAppContext } from './appContext';
import { loadEntrypoint } from './functions/load';

export type PageBundleInfo = {
  ctx: RequestContext;
  page: string;
  entrypoint: string[];
};

export async function renderEntrypoint({
  ctx,
  entrypoint,
}: PageBundleInfo): Promise<
  | { root: Fiber; globalStyles: string[]; initialProps: string }
  | { root: null; globalStyles: null; initialProps: Error }
> {
  try {
    if (entrypoint.length !== 1) {
      throw Error(
        `Invariant violation: expected single file as built bundle, got ${JSON.stringify(
          entrypoint,
        )}`,
      );
    }

    globalThis.css = css;
    const globalStyles = [];
    globalThis.globalCSS = (style) => globalStyles.push(style);

    const page = await loadEntrypoint(
      ctx.req.path,
      path.join(buildPathSSR, entrypoint[0]),
    );

    const initialProps =
      (await page.getInitialProps?.({
        ...ctx,
        ...(await getAppContext()),
      })) ?? {};

    if (process.env.NODE_ENV === 'development') {
      if ('functions' in initialProps) {
        throw Error(
          "Initial prop 'functions' is reserved by nicessr. Please use other name.",
        );
      }
    }

    const root = page.default(initialProps);
    if (!isFiber(root)) {
      throw Error(`Expected fiber to be rendered, got ${root.toString()}`);
    }

    return { root, globalStyles, initialProps: JSON.stringify(initialProps) };
  } catch (err) {
    console.error(`⛔️ ${err.message}`);
    console.error(err.stack);
    return { root: null, globalStyles: null, initialProps: err };
  }
}
