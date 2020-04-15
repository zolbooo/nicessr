export type Ref<T> = { current: T };
export function createRef<T>(initialValue?: T): Ref<T> {
  return { current: initialValue };
}
