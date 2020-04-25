import { RequestContext } from '../../csr';
import { flattenFragments } from '../../csr/jsx/jsx-runtime';

import { Bundle } from '../../compiler/bundler';
import { renderFiber } from './fiber';
import { renderEntrypoint } from '..';
import { renderStylesheets } from './styles';
import { pageTemplate, pageTemplateWithError } from './templates';

export async function renderPage(
  url: string,
  ctx: RequestContext | null,
  bundle: Bundle,
): Promise<string> {
  const { root, globalStyles: styles, initialProps } = await renderEntrypoint({
    ctx,
    page: url,
    entrypoint: bundle.ssr,
  });

  if (root === null) {
    const { name, stack, message } = initialProps as Error;
    return `<!DOCTYPE html>${renderFiber(
      pageTemplateWithError({
        entrypoints: bundle.client,
        errorData: JSON.stringify({ name, stack, message }),
      }),
    )}`;
  }

  const renderedTree = flattenFragments(root);
  const stylesheets = renderStylesheets(renderedTree);
  const renderedMarkup = renderFiber(renderedTree);

  const pageFiber = pageTemplate({
    styles,
    stylesheets,
    initialProps,
    renderedMarkup,
    entrypoints: bundle.client,
  });
  return `<!DOCTYPE html>${renderFiber(pageFiber)}`;
}
