const __fiber = 'NicessrFiber';

export type FiberProps = {
  class?: string | string[];
  children?: FiberNode | FiberNode[];
};

export type FiberNode = string | number | boolean | Fiber;
export type Fiber = {
  __fiber: typeof __fiber;
  props: FiberProps;
  parent: Fiber | null;
  elementName: 'Text' | 'Fragment' | string;
};

export function isFiber(node: FiberNode) {
  return typeof node === 'object' && node.__fiber === __fiber;
}

function toFiber(node: FiberNode, parent: Fiber | null): Fiber {
  if (
    typeof node === 'string' ||
    typeof node === 'number' ||
    typeof node === 'boolean'
  ) {
    return {
      __fiber,
      parent,
      props: {
        children: [node.toString()],
      },
      elementName: 'Text',
    };
  }

  if (!isFiber(node))
    throw Error(
      `Invariant violation: expected string, number, bool or Node, got ${typeof node}`,
    );

  return node;
}

function unpackChildren(children?: FiberNode | FiberNode[]): FiberNode[] {
  if (!children) return [];
  if (!Array.isArray(children)) return [toFiber(children, null)];
  return children;
}

export type FiberFn<P = any> = (props: P) => FiberNode;
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
      if (!isFiber(result)) {
        throw Error(`Invariant violation: expected Fiber, got ${result}`);
      }
      return result;
    }
    return toFiber(result, null);
  }

  if (typeof element !== 'string' || !/^(Fragment)|[a-z]+$/.test(element))
    throw Error(
      `Invariant violation: expected lowercase string as element name, got ${element.toString()}`,
    );

  if (element === 'script') {
    throw Error('<script> tag is prohibited');
  }

  const fiber: Fiber = {
    __fiber,
    props: props ?? {},
    parent: null,
    elementName: element,
  };
  fiber.props.children =
    unpackChildren((props as FiberProps).children).map((child) => {
      if (typeof child === 'object') {
        if (!isFiber(child)) {
          throw Error(`Invariant violation: expected Fiber, got ${child}`);
        }
        return { ...child, parent: fiber };
      }
      return toFiber(child, fiber);
    }) ?? [];

  return fiber;
}
