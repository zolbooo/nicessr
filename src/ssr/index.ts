import vm from 'vm';
import path from 'path';
import fetch from 'node-fetch';
import escape from 'escape-html';
import fileEval from 'file-eval';

import { Fiber, isFiber, FiberNode, FiberProps } from '../csr/jsx/vdom';

export type PageBundleInfo = {
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
  page,
  entrypoint,
}: PageBundleInfo): Promise<{ root: Fiber; initialProps: string }> {
  const pageContext = vm.createContext({
    window: {},
    fetch,
    JSON,
  });
  try {
    for (let entrypointPath of entrypoint) {
      await fileEval(
        path.join(process.cwd(), '.nicessr', 'ssr', entrypointPath),
        { context: pageContext },
      );
    }

    if (typeof pageContext.window.default !== 'function') {
      throw Error(`Cannot render page ${page}: check default export`);
    }

    const initialProps = await vm.runInContext(
      'window.getInitialProps && window.getInitialProps() || {}',
      pageContext,
    );
    const result = vm.runInContext(
      `window.default(JSON.parse('${JSON.stringify(initialProps)}'))`,
      pageContext,
    );
    if (!isFiber(result)) {
      throw Error(`Expected fiber to be rendered, got ${result.toString()}`);
    }
    return { root: result, initialProps: JSON.stringify(initialProps) };
  } catch (err) {
    console.error(`⛔️ ${err.message}`);
    console.error(err.stack);
    return null;
  }
}
