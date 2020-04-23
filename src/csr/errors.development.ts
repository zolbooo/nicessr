import { handleRuntimeError } from '@pmmmwh/react-refresh-webpack-plugin/src/overlay';

export function handleError(err: Error) {
  handleRuntimeError(err);
}
