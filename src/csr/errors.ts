export function handleError(err: Error) {
  if (process.env.NODE_ENV === 'production') return;
  require('@pmmmwh/react-refresh-webpack-plugin/src/overlay').handleRuntimeError(
    err,
  );
}

export type AnyFunction = (...args: any[]) => void;
export function injectErrorHandler(fn: AnyFunction): AnyFunction {
  if (process.env.NODE_ENV === 'production') return fn;
  return (...args) => {
    try {
      fn(...args);
    } catch (err) {
      handleError(err);
    }
  };
}

export class SSRError extends Error {
  constructor(data: { name: string; message: string; stack: string }) {
    super();
    Object.assign(this, data);
  }
}
