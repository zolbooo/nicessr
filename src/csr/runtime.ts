import { isRef } from '.';
import { handleError } from './errors';
import { Fiber, FiberFn } from './jsx/vdom';
import { functionInvoker } from './functions';
import { flattenFragments } from './jsx/jsx-runtime';
import { attachEventHandlers } from './events';

export const effectQueue: [Node, (element: Node) => void][] = [];
function attachProps(realRoot: Node, virtualRoot: Fiber) {
  if (process.env.NODE_ENV === 'development') {
    if (
      realRoot.nodeName.toLowerCase() !== virtualRoot.elementName.toLowerCase()
    ) {
      throw Error(
        `Invariant violation: invalid tree rendered, ${realRoot.nodeName} on server, ${virtualRoot.elementName} on client`,
      );
    }
    if (virtualRoot.props.ref && !isRef(virtualRoot.props.ref)) {
      throw Error(
        'Invariant violation: invalid ref passed, use ref created by useRef function',
      );
    }
  }
  if (virtualRoot.elementName === '#text') return;

  attachEventHandlers(realRoot, virtualRoot);

  if (virtualRoot.props.onMount) {
    effectQueue.push([realRoot, virtualRoot.props.onMount]);
  }
  (virtualRoot.props.children as Fiber[]).forEach((fiber, i) =>
    attachProps(realRoot.childNodes[i], fiber),
  );
}

export function hydrate(rendererFn: FiberFn) {
  if (typeof document === 'undefined') return;
  try {
    const initialProps = (window as any).__nicessr_initial_props__;
    const renderedTree = flattenFragments(
      rendererFn({
        ...initialProps,
        functions: Object.fromEntries(
          initialProps.functions.map((fnName) => [
            fnName,
            functionInvoker(fnName),
          ]),
        ),
      }) as Fiber,
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
