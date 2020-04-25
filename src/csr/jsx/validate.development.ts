import { Fiber, FiberProps, isFiber } from './utils';

const voidTags = ['img', 'input'];

export function checkForNestedForm(fiber: Fiber) {
  if (fiber.elementName !== 'form') return;

  let parentFiber: Fiber = fiber.parent;
  while (parentFiber !== null) {
    if (parentFiber.elementName === 'form') {
      throw Error('Invariant violation: nested <form> tags are not allowed');
    }
    parentFiber = parentFiber.parent;
  }
}

export function validateFiber(fiber: Fiber): boolean {
  if (!isFiber(fiber)) {
    throw Error(
      `Invariant violation: expected Fiber, got ${fiber.toString?.() ?? fiber}`,
    );
  }

  if (fiber.props.dangerouslySetInnerHTML) {
    const hasArrayChildren =
      Array.isArray(fiber.props.children) && fiber.props.children.length > 0;
    const isSingleChild =
      fiber.props.children && !Array.isArray(fiber.props.children);

    if (hasArrayChildren || isSingleChild)
      throw Error(
        'Invariant violation: node with dangerouslySetInnerHTML cannot have children',
      );
  }

  if ('className' in fiber.props) {
    throw Error('"className" prop is not used. Use "class" prop instead.');
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

  return true;
}
