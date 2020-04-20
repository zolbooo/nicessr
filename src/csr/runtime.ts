import { isRef } from '.';
import { handleError } from './errors';
import { Fiber, FiberFn } from './jsx/vdom';
import { flattenFragments } from './jsx/jsx-runtime';
import { attachEventHandlers } from './events';

const onMountQueue: [Node, (element: Node) => void][] = [];
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
    onMountQueue.push([realRoot, virtualRoot.props.onMount]);
  }
  (virtualRoot.props.children as Fiber[]).forEach((fiber, i) =>
    attachProps(realRoot.childNodes[i], fiber),
  );
}

export function hydrate(rendererFn: FiberFn) {
  if (typeof document === 'undefined') return;
  try {
    const renderedTree = flattenFragments(
      rendererFn((window as any).__nicessr_initial_props__) as Fiber,
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

export function clientEntrypoint() {
  if (typeof document === 'undefined') return;

  const onLoad = () => {
    if (process.env.NODE_ENV === 'development') {
      require('./auto-reload').useAutoReload();
      const ssrError = (window as any).__nicessr_ssr_error__ ?? null;
      if (ssrError) throw Object.assign(new Error(), ssrError);
    }

    hydrate((window as any).default);
    setTimeout(() => {
      onMountQueue.forEach(([node, onMount]) => onMount(node));
    }, 0);
  };

  if (process.env.NODE_ENV === 'development') {
    const {
      error: registerErrorHandler,
      unhandledRejection: registerUnhandledRejectionHandler,
    } = require('@pmmmwh/react-refresh-webpack-plugin/src/runtime/errorEventHandlers');
    registerErrorHandler(handleError);
    registerUnhandledRejectionHandler(handleError);
  }
  if (
    document.readyState === 'complete' ||
    document.readyState === 'interactive'
  )
    setTimeout(onLoad, 0);
  else document.addEventListener('DOMContentLoaded', onLoad);
}
