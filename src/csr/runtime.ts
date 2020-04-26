import { handleError } from './errors.development';
import { checkForNestedForm } from './jsx/validate.development';

import { h } from './jsx/vdom';
import { isRef } from '.';
import { functionInvoker } from './functions';
import { flattenFragments } from './jsx/jsx-runtime';
import { attachEventHandlers } from './events';
import { Fiber, FiberFn, isFiber } from './jsx/utils';

export const effectQueue: [Node, (element: Node) => void][] = [];
function attachProps(realRoot: Node, virtualRoot: Fiber) {
  if (virtualRoot.elementName === 'head') return;

  if (process.env.NODE_ENV === 'development') {
    checkForNestedForm(virtualRoot);
    if (
      realRoot.nodeName.toLowerCase() !== virtualRoot.elementName.toLowerCase()
    ) {
      throw Error(
        `Invariant violation: invalid tree rendered, ${realRoot.nodeName.toLowerCase()} on server, ${virtualRoot.elementName.toLowerCase()} on client. Please raise the issue on https://github.com/zolbooo/nicessr`,
      );
    }
    if (virtualRoot.props.ref) {
      if (
        typeof virtualRoot.props.ref !== 'function' &&
        !isRef(virtualRoot.props.ref)
      )
        throw Error(
          'Invariant violation: invalid ref passed, use ref created by useRef function',
        );
    }
  }

  if (virtualRoot.props.onMount) {
    const { onMount } = virtualRoot.props;
    let mountHandler = onMount;

    if (process.env.NODE_ENV === 'development') {
      mountHandler = (node) => {
        try {
          const result: any = onMount(node);
          if (typeof result?.catch === 'function')
            result.catch((err) => virtualRoot.$$errorHandler(err));
        } catch (err) {
          virtualRoot.$$errorHandler(err);
        }
      };
    }

    effectQueue.push([realRoot, mountHandler]);
    delete virtualRoot.props.onMount;
  }

  attachEventHandlers(realRoot, virtualRoot);

  const domChildren = Array.from(realRoot.childNodes).filter(
    (node) => node.nodeName.toLowerCase() !== '#text',
  );
  (virtualRoot.props.children as Fiber[])
    .filter((fiber) => isFiber(fiber) && fiber.elementName !== '#text')
    .forEach((fiber, i) => attachProps(domChildren[i], fiber));
}

export function hydrate(rendererFn: FiberFn) {
  if (typeof document === 'undefined') return;
  try {
    const initialProps = JSON.parse(
      document.getElementById('__nicessr_initial_props__')?.innerHTML ?? 'null',
    );
    const renderedTree = flattenFragments(
      h(rendererFn, {
        ...initialProps,
        functions: Object.fromEntries(
          initialProps.functions.map((fnName) => [
            fnName,
            functionInvoker(fnName),
          ]),
        ),
      }),
    );
    const hydratedRoot = document.getElementById('__nicessr__root__');

    if (Array.isArray(renderedTree))
      renderedTree.forEach((fiber, i) =>
        attachProps(hydratedRoot.childNodes[i], fiber),
      );
    else attachProps(hydratedRoot.childNodes[0], renderedTree);
  } catch (err) {
    if (process.env.NODE_ENV === 'development') handleError(err);
  }
}
