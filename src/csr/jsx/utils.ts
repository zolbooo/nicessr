import { Ref } from '..';
import { CSSReference } from '../css';

export const __fiber = 'NicessrFiber';

export type FiberProps<RefType = any> = {
  ref?: Ref<RefType> | ((node: RefType) => void);
  class?: string | CSSReference | (string | CSSReference)[];
  children?: FiberNode | FiberNode[];
  onMount?: (node: Node) => void;
  dangerouslySetInnerHTML?: string;
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

export function toFiber(node: FiberNode, parent: Fiber | null): Fiber {
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

export function unpackChildren(
  children?: FiberNode | FiberNode[],
): FiberNode[] {
  if (children === null || children === undefined) return [];
  if (!Array.isArray(children)) return [toFiber(children, null)];
  return children;
}

export type FiberFn<P = any> = (props: P) => FiberNode;
