import vm from 'vm';
import path from 'path';
import escape from 'escape-html';
import fileEval from 'file-eval';

import { Fiber, isFiber, FiberNode } from './jsx/vdom';

export type PageBundleInfo = {
  page: string;
  entrypoint: string[];
};

export function renderFiber(fiber: Fiber): string {
  if (fiber.elementName === 'Text') {
    return escape(fiber.props.children[0]);
  }
  if (fiber.elementName === 'Fragment') {
    return (fiber.props.children as FiberNode[]).map(renderFiber).join('');
  }
  return `<${fiber.elementName}>${(fiber.props.children as FiberNode[])
    .map(renderFiber)
    .join('')}</${fiber.elementName}>`;
}

export async function renderEntrypoint({
  page,
  entrypoint,
}: PageBundleInfo): Promise<Fiber> {
  const pageContext = vm.createContext({
    window: {},
    document: {},
  });
  try {
    for (let entrypointPath of entrypoint) {
      await fileEval(
        path.join(process.cwd(), '.nicessr', 'build', entrypointPath),
        { context: pageContext },
      );
    }

    if (typeof pageContext.window.default !== 'function') {
      throw Error(`Cannot render page ${page}: check default export`);
    }

    const result = vm.runInContext('window.default()', pageContext);
    if (!isFiber(result)) {
      throw Error(`Expected fiber to be rendered, got ${result.toString()}`);
    }
    return result;
  } catch (err) {
    console.error(`⛔️ ${err.message}`);
    console.error(err.stack);
    return null;
  }
}
