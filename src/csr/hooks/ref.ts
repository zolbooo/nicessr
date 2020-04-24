const __ref = '__nicessr_ref__';

export type Ref<T> = { current: T; __ref: typeof __ref };
export function useRef<T>(initialValue?: T): Ref<T> {
  return { __ref, current: initialValue };
}

export function isRef(ref: Ref<any>) {
  return ref.__ref === __ref;
}
