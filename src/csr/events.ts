import { Ref } from '.';
import { Fiber } from './jsx/vdom';

/** List of events mapped to according html elements */
const tagsForEvents: { [key: string]: string } = {
  select: 'input',
  change: 'input',
  submit: 'form',
  reset: 'form',
  error: 'img',
  load: 'img',
  abort: 'img',
};

export function isSupportedEvent(eventName: string) {
  let el: HTMLElement | null = document.createElement(
    tagsForEvents[eventName] || 'div',
  );
  let isSupported = `on${eventName}` in el;
  if (!isSupported) {
    el.setAttribute(eventName, 'return;');
    isSupported = typeof (el as any)[eventName] === 'function';
  }
  el = null;
  return isSupported;
}

export function attachEventHandlers(realRoot: Node, virtualRoot: Fiber) {
  Object.entries(virtualRoot.props as any).forEach(
    ([key, value]: [string, Function | Ref<typeof realRoot>]) => {
      if (key === 'ref') (value as Ref<typeof realRoot>).current = realRoot;

      if (typeof value !== 'function') return;
      if (key !== 'onMount') {
        if (process.env.NODE_ENV === 'development') {
          if (!isSupportedEvent(key)) {
            throw Error(
              `Unsupported event is being attached to element: ${key}`,
            );
          }
        }

        realRoot.addEventListener(key, value as () => void);
      }
    },
  );
}
