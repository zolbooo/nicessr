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

const parsedClasses = new Map<string, [string, string]>();
export function getShortClassName(longName: string) {
  return parsedClasses.get(longName)?.[0] ?? longName;
}

export function renderStylesheets(root: Fiber | Fiber[]) {
  // Class names in usedClasses are very long, since they are SHA256 hashes,
  // So that we assign short names for them
  const usedClasses = findUsedClasses(root);

  usedClasses.forEach((classRef) => {
    if (!parsedClasses.has(classRef.className)) {
      const shortName = `nsr-sc--${chooseShortestName(
        classRef.className,
        (name) => parsedClasses.has(`nsr-sc--${name}`),
      )}`;
      parsedClasses.set(classRef.className, [
        shortName,
        lookupClass(classRef.className).replace(
          '__NICESSR__GENERATED_CLASS__',
          shortName,
        ),
      ]);
    }
    return parsedClasses.get(classRef.className);
  });

  return Array.from(
    new Set(usedClasses.map((classRef) => classRef.className)).values(),
  )
    .map((longName) => parsedClasses.get(longName)[1])
    .join('');
}
