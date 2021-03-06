import { handleError } from './errors.development';
import { useAutoReload } from './auto-reload.development';

import { hydrate, effectQueue } from './runtime';

import type { FiberFn } from './jsx/vdom';

export function clientEntrypoint(PageComponent: FiberFn) {
  if (typeof document === 'undefined') return;

  const onLoad = () => {
    if (process.env.NODE_ENV === 'development') {
      useAutoReload();
      const ssrError =
        JSON.parse(
          document.getElementById('__nicessr_ssr_error__')?.innerHTML ?? 'null',
        ) ?? null;
      if (ssrError) throw Object.assign(new Error(), ssrError);
    }

    hydrate(PageComponent);
    setTimeout(() => {
      effectQueue.forEach(([node, onMount]) => onMount(node));
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
