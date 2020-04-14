import vm from 'vm';
import path from 'path';
import fileEval from 'file-eval';

export type PageBundleInfo = {
  page: string;
  entrypoint: string[];
};

export async function renderToString({
  page,
  entrypoint,
}: PageBundleInfo): Promise<string> {
  const pageContext = vm.createContext({
    window: {},
    console: {},
    document: {},
  });
  try {
    for (let entrypointPath of entrypoint) {
      await fileEval(
        path.join(process.cwd(), '.nicessr', 'build', entrypointPath),
        { context: pageContext },
      );
    }

    if (typeof pageContext.window.default !== 'function') {
      throw Error(`Cannot render page ${page}: check default export`);
    }

    return vm.runInContext('window.default()', pageContext);
  } catch (err) {
    console.error(`⛔️ ${err.message}`);
    console.error(err.stack);
    return 'Cannot render page: check console for errors';
  }
}
