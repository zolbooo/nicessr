import { lookupClass } from '../../csr/css/context';

import { CSSReference } from '../../csr/css';
import { Fiber, FiberNode } from '../../csr/jsx/vdom';

/** Extract all used CSSReference objects in tree */
export function findUsedClasses(
  fiber: FiberNode | FiberNode[],
): CSSReference[] {
  if (Array.isArray(fiber)) {
    return fiber.map((child) => findUsedClasses(child)).flat(Infinity);
  }

  if (typeof fiber !== 'object' || !('props' in fiber)) return [];

  const usedClasses = [];
  if (fiber.props.class) {
    if (Array.isArray(fiber.props.class)) {
      usedClasses.push(
        ...fiber.props.class.filter(
          (className) => typeof className === 'object',
        ),
      );
    } else if (typeof fiber.props.class === 'object') {
      usedClasses.push(fiber.props.class);
    }
  }

  if (fiber.props.children) {
    usedClasses.push(...findUsedClasses(fiber.props.children));
  }
  return usedClasses;
}

export function renderStylesheets(root: Fiber | Fiber[]) {
  // Class names in usedClasses are very long, since they are SHA256 hashes,
  // So that we assign short names for them
  const usedClasses = findUsedClasses(root);

  const fixedClasses = new Map<string, string>();
  usedClasses.forEach((classRef) => {
    const stylesheet = lookupClass(classRef.className);

    for (let i = 1; i < classRef.className.length; i += 1) {
      const shortClassName = classRef.className.slice(0, i);
      if (!fixedClasses.has(shortClassName)) {
        fixedClasses.set(
          shortClassName,
          stylesheet.replace('__NICESSR__GENERATED_CLASS__', shortClassName),
        );

        classRef.className = shortClassName;
        break;
      }
    }
  });

  if (fixedClasses.size === 0) return '';
  return `<style>${Array.from(fixedClasses.values()).join('')}</style>`;
}
