import vm from 'vm';
import path from 'path';
import fileEval from 'file-eval';

export async function renderToString(entrypoint: string[]): Promise<string> {
  const pageContext = vm.createContext({ window: {}, document: {} });
  for (let entrypointPath of entrypoint) {
    await fileEval(
      path.join(process.cwd(), '.nicessr', 'build', entrypointPath),
      { context: pageContext },
    );
  }
  return vm.runInContext('window.default()', pageContext);
}
