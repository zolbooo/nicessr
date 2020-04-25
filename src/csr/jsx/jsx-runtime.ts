import { h as createVirtualDOMNode, Fiber } from './vdom';
import { FiberFn, FiberNode, FiberProps } from './utils';

export const jsx = createVirtualDOMNode;
export const jsxs = createVirtualDOMNode;
export const Fragment = 'Fragment';

// This legacy JSX transformer plugin entrypoint
export function h<P = FiberProps>(
  element: string | FiberFn<P>,
  props: P | null,
  ...children: FiberNode[]
) {
  return createVirtualDOMNode(element, { ...props, children });
}

export function flattenFragments(root: Fiber): Fiber | Fiber[] {
  if (root.elementName === '#text') return root;
  if (root.elementName === 'Fragment')
    return (
      (root.props.children as Fiber[])
        ?.map((child) => ({ ...child, parent: root.parent }))
        ?.map(flattenFragments)
        ?.flat(Infinity) ?? []
    );
  root.props.children =
    (root.props.children as Fiber[])?.map(flattenFragments)?.flat(Infinity) ??
    [];
  return root;
}
