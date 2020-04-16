import escape from 'escape-html';

import { Fiber, FiberNode, FiberProps } from '../csr/jsx/vdom';

function renderProps({ children, ...props }: FiberProps): string {
  const propList = Object.entries(props)
    .map(([propName, value]) => {
      if (typeof value === 'boolean') return propName;
      if (typeof value !== 'number' && typeof value !== 'string') return '';

      if (value.toString().indexOf('"') !== -1)
        throw Error(
          `Invariant violation: prop values should not contain quotes`,
        );
      return `${propName}="${value}"`;
    })
    .filter(Boolean)
    .join(' ');
  return propList.length > 0 ? ' ' + propList : '';
}

export function renderFiber(fiber: FiberNode | FiberNode[]): string {
  if (Array.isArray(fiber)) return fiber.map(renderFiber).join('');
  if (typeof fiber !== 'object') return escape(fiber.toString());

  if (fiber.elementName === '#text') {
    return escape(fiber.props.children[0]);
  }
  if (fiber.elementName === 'Fragment') {
    return (fiber.props.children as Fiber[]).map(renderFiber).join('');
  }
  return `<${fiber.elementName}${renderProps(fiber.props)}>${(fiber.props
    .children as FiberNode[])
    .map(renderFiber)
    .join('')}</${fiber.elementName}>`;
}
