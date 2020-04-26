import { wrapInArray } from '../../utils/wrap';
import { Fiber, FiberNode } from '../../csr/jsx/vdom';

export function extractHeadChildren(
  fiber: FiberNode | FiberNode[],
): FiberNode[] {
  if (Array.isArray(fiber)) {
    return fiber.map(extractHeadChildren).flat(Infinity);
  }

  if (typeof fiber !== 'object' || !('props' in fiber)) return [];
  const { children } = fiber.props;

  if ((fiber as Fiber).elementName === 'head') {
    if (fiber.parent) {
      fiber.parent.props.children = wrapInArray(
        fiber.parent.props.children,
      ).filter((node) => {
        if (typeof node !== 'object') return true;
        return node.elementName !== 'head';
      });
    }

    if (!children) return [];
    return wrapInArray(children);
  }

  if (!children) return [];
  if (Array.isArray(children))
    return children.map(extractHeadChildren).flat(Infinity);
  return [children];
}
