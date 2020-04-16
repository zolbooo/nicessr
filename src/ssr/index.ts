import path from 'path';
import escape from 'escape-html';

import { buildPathSSR } from '../compiler';
import { RequestContext } from '../csr';
import { Fiber, isFiber, FiberNode, FiberProps } from '../csr/jsx/vdom';

export type PageBundleInfo = {
  ctx: RequestContext;
  page: string;
  entrypoint: string[];
};

function renderProps({ children, ...props }: FiberProps): string {
  const propList = Object.entries(props)
    .map(([propName, value]) => {
      if (typeof value === 'boolean') return propName;
      if (typeof value !== 'number' && typeof value !== 'string') return '';

      if (value.toString().indexOf('"') !== -1)
        throw Error(
          `Invariant violation: prop values should not contain quotes`,
        );
      return `${propName}="${value}"`;
    })
    .filter(Boolean)
    .join(' ');
  return propList.length > 0 ? ' ' + propList : '';
}

export function renderFiber(fiber: FiberNode | FiberNode[]): string {
  if (Array.isArray(fiber)) return fiber.map(renderFiber).join('');
  if (typeof fiber !== 'object') return escape(fiber.toString());

  if (fiber.elementName === '#text') {
    return escape(fiber.props.children[0]);
  }
  if (fiber.elementName === 'Fragment') {
    return (fiber.props.children as Fiber[]).map(renderFiber).join('');
  }
  return `<${fiber.elementName}${renderProps(fiber.props)}>${(fiber.props
    .children as FiberNode[])
    .map(renderFiber)
    .join('')}</${fiber.elementName}>`;
}

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
