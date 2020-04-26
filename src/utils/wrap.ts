export function wrapInArray<T>(element: T | T[]): T[] {
  if (Array.isArray(element)) return element;
  return [element];
}
