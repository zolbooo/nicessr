import { resolveURL } from '../util';
import { compiledPages } from './compiler';
import { RequestContext } from '../csr';
import { flattenFragments } from '../csr/jsx/jsx-runtime';

import { renderEntrypoint, renderFiber } from '.';

function getPageEntrypoint(url: string): string[] | null {
  return compiledPages.get(resolveURL(url)) ?? null;
}

const pageTemplate = `<!DOCTYPE html>
<html>
  <head></head>
  <body>
    <div id="__nicessr__root__">{{RENDERED_MARKUP}}</div>
    <script>window.__nicessr_initial_props__ = '{{INITIAL_PROPS}}'</script>
    {{ENTRYPOINTS}}
  </body>
</html>`;

export async function renderPage(
  url: string,
  ctx: RequestContext,
): Promise<string | null> {
  const pageEntrypoint = getPageEntrypoint(url);
  if (!pageEntrypoint) {
    return null;
  }

  const { root, initialProps } = await renderEntrypoint({
    ctx,
    page: url,
    entrypoint: pageEntrypoint,
  });
  const renderedTree = flattenFragments(root);

  return pageTemplate
    .replace(
      '{{ENTRYPOINTS}}',
      pageEntrypoint
        .map((entrypoint) => `<script src="/.nicessr/${entrypoint}"></script>`)
        .join('\n'),
    )
    .replace('{{INITIAL_PROPS}}', initialProps)
    .replace(
      '{{RENDERED_MARKUP}}',
      renderedTree ? renderFiber(renderedTree) : '',
    );
}
