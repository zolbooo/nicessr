import { compiledPages } from './ssr/compiler';

export function resolveURL(url: string) {
  if (url.endsWith('/')) return url + 'index';
  if (compiledPages.has(url)) return url;
  return url + '/index';
}
