import { isRef, Ref } from '.';
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
    setTimeout(useAutoReload, 500);
  });
}

export function hydrate(rendererFn: FiberFn) {
  if (typeof document === 'undefined') return;
  const renderedTree = flattenFragments(
    rendererFn(JSON.parse((window as any).__nicessr_initial_props__)) as Fiber,
  );
  const hydratedRoot = document.getElementById('__nicessr__root__');

  if (Array.isArray(renderedTree))
    renderedTree.forEach((fiber, i) =>
      attachProps(hydratedRoot.childNodes[i], fiber),
    );
  else attachProps(hydratedRoot.childNodes[0], renderedTree);
}

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

  Object.entries(virtualRoot.props as any).forEach(
    ([key, value]: [string, Function | Ref<typeof realRoot>]) => {
      if (key === 'ref') (value as Ref<typeof realRoot>).current = realRoot;

      if (typeof value !== 'function') return;
      if (key === 'onMount')
        onMountQueue.push([realRoot, value as (node: Node) => void]);
      else realRoot.addEventListener(key, value as () => void);
    },
  );

  const childNodes = (virtualRoot.props.children as Fiber[]).filter(
    (child) => child.elementName !== '#text',
  );
  childNodes.forEach((fiber, i) => attachProps(realRoot.childNodes[i], fiber));
}

export function clientEntrypoint() {
  if (typeof document === 'undefined') return;
  (window as any).css = () => {};

  const onLoad = () => {
    if (process.env.NODE_ENV === 'development') useAutoReload();

    hydrate((window as any).default);
    setTimeout(() => {
      onMountQueue.forEach(([node, onMount]) => onMount(node));
    }, 0);
  };

  if (
    document.readyState === 'complete' ||
    document.readyState === 'interactive'
  )
    setTimeout(onLoad, 0);
  else document.addEventListener('DOMContentLoaded', onLoad);
}
