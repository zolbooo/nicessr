import { parse, stringify } from 'css';

import { assignClass } from './context';

function renderStyles(styleParts: string[], tags: StyledTag[]) {
  return styleParts.reduce(
    (stylesheet: string, part: string, index: number) => {
      return stylesheet + part + (tags[index]?.toString() ?? '');
    },
    '',
  );
}

const __css_reference = '__nicessr_css_reference__';

export type StyledTag = string | number;
export const css = (styleParts: string[], ...tags: StyledTag[]) => {
  const rawStyles = stringify(
    parse(`.__NICESSR__GENERATED_CLASS__ {
      ${renderStyles(styleParts, tags)}
    }`),
    { compress: true },
  );

  return { __css_reference, className: assignClass(rawStyles) };
};
