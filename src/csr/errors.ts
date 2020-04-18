export function handleError(err: Error) {
  if (process.env.NODE_ENV === 'development') {
    require('@pmmmwh/react-refresh-webpack-plugin/src/overlay').handleRuntimeError(
      err,
    );
  }
}

export type AnyFunction = (...args: any[]) => void;
export function injectErrorHandler(fn: AnyFunction): AnyFunction {
  if (process.env.NODE_ENV === 'development') {
    return (...args) => {
      try {
        fn(...args);
      } catch (err) {
        handleError(err);
      }
    };
  }
  return fn;
}
