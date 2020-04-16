import { RequestContext } from '../csr';
import { flattenFragments } from '../csr/jsx/jsx-runtime';

import { Bundle } from '../compiler/bundler';
import { renderEntrypoint, renderFiber } from '.';

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
  bundle: Bundle,
): Promise<string> {
  const { root, initialProps } = await renderEntrypoint({
    ctx,
    page: url,
    entrypoint: bundle.ssr,
  });
  const renderedTree = flattenFragments(root);

  return pageTemplate
    .replace(
      '{{ENTRYPOINTS}}',
      bundle.client
        .map((entrypoint) => `<script src="/.nicessr/${entrypoint}"></script>`)
        .join('\n'),
    )
    .replace('{{INITIAL_PROPS}}', initialProps)
    .replace(
      '{{RENDERED_MARKUP}}',
      renderedTree ? renderFiber(renderedTree) : '',
    );
}
