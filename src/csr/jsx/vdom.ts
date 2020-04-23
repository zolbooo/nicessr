import { __fiber, unpackChildren, toFiber, isFiber } from './utils';

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
        if (!isFiber(result)) {
          throw Error(`Invariant violation: expected Fiber, got ${result}`);
        }
      }
      return result;
    }
    return toFiber(result, null);
  }

  if (process.env.NODE_ENV === 'development') {
    if (
      typeof element !== 'string' ||
      !/^(Fragment)|[a-z]([a-z0-9-]+)?$/.test(element)
    )
      throw Error(
        `Invariant violation: expected correct element name (alphanumeric charachers or -), got ${element.toString()}`,
      );

    if (element === 'style') {
      throw Error('<style> tag is prohibited. Use css`` syntax instead');
    }
    if (element === 'script') {
      throw Error('<script> tag is prohibited');
    }

    if (voidTags.includes(element) && 'children' in props) {
      throw Error(`${element} is void tag and cannot have children`);
    }
  }

  const fiber: Fiber = {
    __fiber,
    props: props ?? {},
    parent: null,
    elementName: element,
  };

  if (process.env.NODE_ENV === 'development') {
    if ('className' in fiber.props) {
      throw Error('"className" prop is not used. Use "class" prop instead.');
    }
  }

  fiber.props.children =
    unpackChildren((props as FiberProps).children)
      .flat(Infinity)
      .map((child) => {
        if (typeof child === 'object') {
          if (process.env.NODE_ENV === 'development') {
            if (!isFiber(child)) {
              throw Error(`Invariant violation: expected Fiber, got ${child}`);
            }
          }
          return { ...child, parent: fiber };
        }
        return toFiber(child, fiber);
      }) ?? [];

  return fiber;
}
