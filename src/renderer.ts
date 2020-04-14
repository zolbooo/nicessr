import flatted from 'flatted';

import { resolveURL } from './util';
import { compiledPages } from './compiler';
import { renderEntrypoint, renderFiber } from './ssr';

function getPageEntrypoint(url: string): string[] | null {
  return compiledPages.get(resolveURL(url)) ?? null;
}

const pageTemplate = `<!DOCTYPE html>
<html>
  <head></head>
  <body>
    {{RENDERED_MARKUP}}
    <script>window.__nicessr__vdom__ = '{{RENDERED_VDOM}}'</script>
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

export async function renderPage(url: string): Promise<string | null> {
  const pageEntrypoint = getPageEntrypoint(url);
  if (!pageEntrypoint) {
    return null;
  }

  const renderedTree = await renderEntrypoint({
    page: url,
    entrypoint: pageEntrypoint,
  });

  return pageTemplate
    .replace(
      '{{ENTRYPOINTS}}',
      pageEntrypoint
        .map((entrypoint) => `<script src="/.nicessr/${entrypoint}"></script>`)
        .join('\n'),
    )
    .replace('{{RENDERED_VDOM}}', flatted.stringify(renderedTree))
    .replace(
      '{{RENDERED_MARKUP}}',
      renderedTree ? renderFiber(renderedTree) : '',
    );
}
