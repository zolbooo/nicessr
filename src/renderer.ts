import { compiledPages } from './compiler';

function getPageEntrypoint(url: string): string | null {
  if (url[url.length - 1] === '/')
    return compiledPages.get(url + 'index') ?? null;
  return (compiledPages.get(url) || compiledPages.get(`${url}/index`)) ?? null;
}

export function renderPage(url: string): string|null {
  return getPageEntrypoint(url);
}
