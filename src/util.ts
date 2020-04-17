import path from 'path';
import rimraf from 'rimraf';

export function cleanup() {
  return new Promise((resolve) =>
    rimraf(path.join(process.cwd(), '.nicessr', '*'), () => resolve()),
  );
}
