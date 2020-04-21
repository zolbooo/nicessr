import { Ref } from '..';
import { CSSReference } from '../css';

const __fiber = 'NicessrFiber';

export type FiberProps<RefType = any> = {
  ref?: Ref<RefType>;
  class?: string | CSSReference | (string | CSSReference)[];
  children?: FiberNode | FiberNode[];
  onMount?: (node: Node) => void;
};

export type FiberNode = string | number | boolean | Fiber;
export type Fiber = {
  __fiber: typeof __fiber;
  props: FiberProps;
  parent: Fiber | null;
  elementName: '#text' | 'Fragment' | string;
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
      elementName: '#text',
    };
  }

  if (process.env.NODE_ENV === 'development') {
    if (!isFiber(node))
      throw Error(
        `Invariant violation: expected string, number, bool or Node, got ${typeof node}`,
      );
  }

  return node;
}

function unpackChildren(children?: FiberNode | FiberNode[]): FiberNode[] {
  if (children === null || children === undefined) return [];
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
