import { Fiber, FiberFn } from './jsx/vdom';
import { flattenFragments } from './jsx/jsx-runtime';

export function useAutoReload() {
  const updateHandler = (event) =>
    JSON.parse(event.data).type === 'update' && document.location.reload();
  const eventSource = new EventSource(
    '/.nicessr/auto-refresh?page=' +
      encodeURIComponent(document.location.pathname),
  );

  eventSource.addEventListener('message', updateHandler, false);
  eventSource.addEventListener('error', () => {
    eventSource.removeEventListener('message', updateHandler);
    eventSource.close();
    useAutoReload();
  });
}

export function hydrate(rendererFn: FiberFn) {
  if (typeof document === 'undefined') return;
  useAutoReload();

  const renderedTree = flattenFragments(rendererFn({}) as Fiber);
  const hydratedRoot = document.getElementById('__nicessr__root__');

  if (Array.isArray(renderedTree)) {
    renderedTree.forEach((fiber, i) =>
      attachFunctionalProps(hydratedRoot.childNodes[i], fiber),
    );
    return;
  }

  attachFunctionalProps(hydratedRoot.childNodes[0], renderedTree);
}

function attachFunctionalProps(realRoot: Node, virtualRoot: Fiber) {
  if (process.env.NODE_ENV === 'development') {
    if (
      realRoot.nodeName.toLowerCase() !== virtualRoot.elementName.toLowerCase()
    ) {
      throw Error(
        `Invariant violation: invalid tree rendered, ${realRoot.nodeName} on server, ${virtualRoot.elementName} on client`,
      );
    }
    if (virtualRoot.elementName === '#text') {
      if (realRoot.textContent !== virtualRoot.props.children[0])
        throw Error(
          `Invariant violation: invalid tree rendered, ${realRoot.textContent} on server, ${virtualRoot.props.children[0]} on client`,
        );
      return;
    }
  }

  Object.entries(virtualRoot.props as any).forEach(
    ([key, value]: [string, () => void]) => {
      if (typeof value !== 'function') return;
      if (key === 'onMount') value();
      else realRoot.addEventListener(key, value);
    },
  );

  const childNodes = virtualRoot.props.children as Fiber[];
  childNodes.forEach((fiber, i) =>
    attachFunctionalProps(realRoot.childNodes[i], fiber),
  );
}
