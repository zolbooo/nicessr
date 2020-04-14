import { compiledPages } from './compiler';

function getPageEntrypoint(url: string): string[] | null {
  if (url[url.length - 1] === '/')
    return compiledPages.get(url + 'index') ?? null;
  return (compiledPages.get(url) || compiledPages.get(`${url}/index`)) ?? null;
}

const pageTemplate = `<!DOCTYPE html>
<html>
  <head></head>
  <body>
    {{ENTRYPOINTS}}
    <script>
      new EventSource(
        '/.nicessr/auto-refresh?page=' +
          encodeURIComponent(document.location.pathname),
      ).addEventListener(
        'message',
        (event) =>
          JSON.parse(event.data).type === 'update' &&
          document.location.reload(),
        false,
      );
    </script>
  </body>
</html>`;

export function renderPage(url: string): string | null {
  const pageEntrypoint = getPageEntrypoint(url);
  if (!pageEntrypoint) {
    return null;
  }
  return pageTemplate.replace(
    '{{ENTRYPOINTS}}',
    pageEntrypoint
      .map((entrypoint) => `<script src="/.nicessr/${entrypoint}"></script>`)
      .join('\n'),
  );
}
