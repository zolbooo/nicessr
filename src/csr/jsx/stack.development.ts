import { handleError } from '../errors.development';

const stack = [];

export function push(fn: Function) {
  stack.push(fn.name ?? '(anonymous function)');
}

export function pop() {
  stack.pop();
}

export function createErrorHandler() {
  const currentStack = [...stack];
  return (err: Error) => {
    err.name += ' [check console for more information]';
    console.error(
      `The error has occurred:\n${currentStack
        .reverse()
        .map((stackEntry) => `\tat ${stackEntry}`)
        .join('\n')}`,
    );
    handleError(err);
  };
}
