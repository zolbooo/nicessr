import { __fiber, unpackChildren, toFiber } from './utils';

import { pop, push, createErrorHandler } from './stack.development';
import { validateFiber, validateStringTag } from './validate.development';

import type { Fiber, FiberNode, FiberFn, FiberProps } from './utils';
export type { Fiber, FiberNode, FiberFn, FiberProps } from './utils';

export const voidTags = require('./voidTags.json');

export function h<P = FiberProps>(
  element: string | FiberFn<P>,
  props: P | null,
): Fiber {
  if (typeof element === 'function') {
    let result: FiberNode;
    let errHandler: (err: Error) => void;

    if (process.env.NODE_ENV === 'development') {
      push(element);
      errHandler = createErrorHandler();
      try {
        result = element({
          ...props,
          children: unpackChildren((props as FiberProps)?.children),
        });
      } catch (err) {
        errHandler(err);
      }
    }

    if (process.env.NODE_ENV !== 'development') {
      result = element({
        ...props,
        children: unpackChildren((props as FiberProps)?.children),
      });
    }

    if (typeof result === 'object') {
      if (process.env.NODE_ENV === 'development') {
        result.$$errorHandler = errHandler;
        try {
          validateFiber(result);
        } catch (err) {
          errHandler(err);
        }
        pop();
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
    unpackChildren((props as FiberProps)?.children ?? [])
      .filter((child) => child !== null && child !== false)
      .flat(Infinity)
      .map((child) => {
        const childFiber: Fiber =
          typeof child === 'object'
            ? Object.assign(child, { parent: fiber })
            : toFiber(child, fiber);

        if (process.env.NODE_ENV === 'development') {
          if (!childFiber.$$errorHandler) {
            childFiber.$$errorHandler = (err: Error) => {
              let currentNode = childFiber.parent;
              while (currentNode !== null) {
                if (currentNode.$$errorHandler) {
                  currentNode.$$errorHandler(err);
                  return;
                }
                currentNode = currentNode.parent;
              }
              throw Error(
                'Invariant violation: there is no fiber with error handler. Please report issue on https://github.com/zolbooo/nicessr',
              );
            };
          }
        }

        return childFiber;
      }) ?? [];

  if (process.env.NODE_ENV === 'development') {
    validateFiber(fiber);
  }

  return fiber;
}
