import { lookupClass } from '../../csr/css/context';

import { CSSReference } from '../../csr/css';
import { Fiber, FiberNode } from '../../csr/jsx/vdom';
import { chooseShortestName } from '../../utils/name';

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

  // Long class names mapped to short and unique ones
  const fixedClasses = new Map<string, string>();
  usedClasses.forEach((classRef) => {
    if (!fixedClasses.has(classRef.className)) {
      fixedClasses.set(
        classRef.className,
        `nsr-sc--${chooseShortestName(classRef.className, (name) =>
          fixedClasses.has(name),
        )}`,
      );
    }

    classRef.className = fixedClasses.get(classRef.className);
  });

  return fixedClasses.size === 0
    ? ''
    : `<style>${Array.from(fixedClasses.entries())
        .map(([longName, shortName]) =>
          lookupClass(longName).replace(
            '__NICESSR__GENERATED_CLASS__',
            shortName,
          ),
        )
        .join('')}</style>`;
}
