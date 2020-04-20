import { RequestContext } from '../csr';
import { flattenFragments } from '../csr/jsx/jsx-runtime';

import { Bundle } from '../compiler/bundler';
import { renderFiber } from './fiber';
import { renderEntrypoint } from '.';
import { renderStylesheets } from './styles/render';

const pageTemplate = `<!DOCTYPE html>
<html>
  <head>{{STYLESHEETS}}</head>
  <body>
    <div id="__nicessr__root__">{{RENDERED_MARKUP}}</div>
    <script>window.__nicessr_initial_props__ = {{INITIAL_PROPS}}</script>
    {{ENTRYPOINTS}}
  </body>
</html>`;
const pageTemplateWithError = `<!DOCTYPE html>
<html>
  <head></head>
  <body>
    <div id="__nicessr__root__"></div>
    <script>window.__nicessr_ssr_error__ = {{SSR_ERROR}}</script>
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

  if (root === null) {
    const { name, stack, message } = initialProps as Error;
    return pageTemplateWithError
      .replace(
        '{{ENTRYPOINTS}}',
        bundle.client
          .map(
            (entrypoint) => `<script src="/.nicessr/${entrypoint}"></script>`,
          )
          .join('\n'),
      )
      .replace('{{SSR_ERROR}}', JSON.stringify({ name, stack, message }));
  }

  const renderedTree = flattenFragments(root);
  return pageTemplate
    .replace('{{STYLESHEETS}}', renderStylesheets(renderedTree))
    .replace(
      '{{ENTRYPOINTS}}',
      bundle.client
        .map((entrypoint) => `<script src="/.nicessr/${entrypoint}"></script>`)
        .join('\n'),
    )
    .replace('{{INITIAL_PROPS}}', initialProps as string)
    .replace('{{RENDERED_MARKUP}}', renderFiber(renderedTree));
}
