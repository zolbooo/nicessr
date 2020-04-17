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
