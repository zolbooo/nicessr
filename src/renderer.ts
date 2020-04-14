import { compiledPages } from './compiler';

function getPageEntrypoint(url: string): string[] | null {
  if (url[url.length - 1] === '/')
    return compiledPages.get(url + 'index') ?? null;
  return (compiledPages.get(url) || compiledPages.get(`${url}/index`)) ?? null;
}

const pageTemplate = (entrypoint: string[]) =>
  `<!doctype html><html><head></head><body>${entrypoint
    .map((file) => `<script src="/.nicessr/${file}"></script>`)
    .join('')}</body></html>`;

export function renderPage(url: string): string | null {
  const pageEntrypoint = getPageEntrypoint(url);
  if (!pageEntrypoint) {
    return null;
  }
  return pageTemplate(pageEntrypoint);
}
