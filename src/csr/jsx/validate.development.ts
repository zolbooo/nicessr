import { Fiber, FiberProps, isFiber } from './utils';

const voidTags = ['img', 'input'];

export function validateFiber(fiber: Fiber): boolean {
  if (!isFiber(fiber)) {
    throw Error(
      `Invariant violation: expected Fiber, got ${fiber.toString?.() ?? fiber}`,
    );
  }
  return true;
}

export function validateStringTag(
  elementName: string,
  props: FiberProps,
): boolean {
  if (
    typeof elementName !== 'string' ||
    !/^(Fragment)|[a-z]([a-z0-9-]+)?$/.test(elementName)
  )
    throw Error(
      `Invariant violation: expected correct element name (alphanumeric charachers or -), got ${elementName}`,
    );

  if (elementName === 'style') {
    throw Error('<style> tag is prohibited. Use css`` syntax instead');
  }
  if (elementName === 'script') {
    throw Error('<script> tag is prohibited');
  }

  if (voidTags.includes(elementName) && 'children' in props) {
    throw Error(`${elementName} is void tag and cannot have children`);
  }

  if ('className' in props) {
    throw Error('"className" prop is not used. Use "class" prop instead.');
  }

  return true;
}
