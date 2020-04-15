import { h, Fiber } from './vdom';

export const jsx = h;
export const jsxs = h;
export const Fragment = 'Fragment';

export function flattenFragments(root: Fiber): Fiber | Fiber[] {
  if (root.elementName === '#text') return root;
  if (root.elementName === 'Fragment')
    return (root.props.children as Fiber[])
      .map((child) => ({ ...child, parent: root.parent }))
      .map(flattenFragments)
      .flat(Infinity);
  root.props.children = (root.props.children as Fiber[])
    .map(flattenFragments)
    .flat(Infinity);
  return root;
}
