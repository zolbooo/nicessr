import path from 'path';

import { buildPathSSR } from '../compiler';
import { RequestContext } from '../csr';
import { Fiber, isFiber } from '../csr/jsx/vdom';

export type PageBundleInfo = {
  ctx: RequestContext;
  page: string;
  entrypoint: string[];
};

export async function renderEntrypoint({
  ctx,
  page,
  entrypoint,
}: PageBundleInfo): Promise<{ root: Fiber; initialProps: string }> {
  try {
    if (entrypoint.length !== 1) {
      throw Error(
        `Invariant violation: expected single file as built bundle, got [${entrypoint
          .map((str) => `'${str}'`)
          .join(',')}]`,
      );
    }

    const page = require(path.join(buildPathSSR, entrypoint[0]));

    const initialProps =
      page.getInitialProps && (await page.getInitialProps(ctx));
    const root = page.default(initialProps);
    if (!isFiber(root)) {
      throw Error(`Expected fiber to be rendered, got ${root.toString()}`);
    }

    return { root, initialProps: JSON.stringify(initialProps) };
  } catch (err) {
    console.error(`⛔️ ${err.message}`);
    console.error(err.stack);
    return null;
  }
}
