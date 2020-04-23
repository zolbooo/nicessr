import escape from 'escape-html';

import { CSSReference } from '../csr/css';
import { Fiber, FiberNode, FiberProps, voidTags } from '../csr/jsx/vdom';

function renderClass(classRef: string | CSSReference) {
  const className =
    (classRef as CSSReference).className ?? (classRef as string);

  if (className.indexOf('"') !== -1) {
    throw Error(
      `Invariant violation: unexpected quote found in class name ${className}`,
    );
  }

  if (
    typeof classRef !== 'string' &&
    classRef.__css_reference !== '__nicessr_css_reference__'
  ) {
    throw Error(
      `Invariant violation: unexpected object recieved as class prop, got ${JSON.stringify(
        classRef,
      )}`,
    );
  }

  return className;
}

function renderProps({
  children,
  class: className,
  ...props
}: FiberProps): string {
  const propList = Object.entries(props).map(([propName, value]) => {
    if (typeof value === 'boolean') return propName;
    if (typeof value !== 'number' && typeof value !== 'string') return '';

    if (value.toString().indexOf('"') !== -1)
      throw Error('Invariant violation: prop values should not contain quotes');
    return `${propName}="${value}"`;
  });

  if (className) {
    const classes = new Set(
      Array.isArray(className)
        ? className.map(renderClass)
        : [renderClass(className)],
    );
    propList.push(`class="${Array.from(classes.values()).join(' ')}"`);
  }

  const propsString = propList.filter(Boolean).join(' ');
  return propsString ? ` ${propsString}` : '';
}

export function renderFiber(fiber: FiberNode | FiberNode[]): string {
  if (Array.isArray(fiber)) return fiber.map(renderFiber).join('');
  if (typeof fiber !== 'object') return escape(fiber.toString());

  if (fiber.elementName === '#text') {
    return escape(fiber.props.children[0]);
  }
  if (fiber.elementName === 'Fragment') {
    return (fiber.props.children as Fiber[]).map(renderFiber).join('');
  }
  if (fiber.elementName === 'br') {
    return '<br>';
  }

  if (voidTags.includes(fiber.elementName)) {
    return `<${fiber.elementName}${renderProps(fiber.props)}>`;
  }

  return `<${fiber.elementName}${renderProps(fiber.props)}>${(fiber.props
    .children as FiberNode[])
    .map(renderFiber)
    .join('')}</${fiber.elementName}>`;
}
