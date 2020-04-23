import { __fiber, unpackChildren, toFiber } from './utils';
import { validateFiber, validateStringTag } from './validate.development';

import type { Fiber, FiberFn, FiberProps } from './utils';
export type { Fiber, FiberNode, FiberFn, FiberProps } from './utils';

export const voidTags = ['img', 'input'];

export function h<P = FiberProps>(
  element: string | FiberFn<P>,
  props: P | null,
): Fiber {
  if (typeof element === 'function') {
    const result = element({
      ...props,
      children: unpackChildren((props as FiberProps)?.children),
    });
    if (typeof result === 'object') {
      if (process.env.NODE_ENV === 'development') {
        validateFiber(result);
      }
      return result;
    }
    return toFiber(result, null);
  }

  if (process.env.NODE_ENV === 'development') {
    validateStringTag(element, props);
  }

  const fiber: Fiber = {
    __fiber,
    props: props ?? {},
    parent: null,
    elementName: element,
  };

  fiber.props.children =
    unpackChildren((props as FiberProps).children)
      .flat(Infinity)
      .map((child) => {
        if (typeof child === 'object') {
          child.parent = fiber;
          return child;
        }
        return toFiber(child, fiber);
      }) ?? [];

  return fiber;
}
