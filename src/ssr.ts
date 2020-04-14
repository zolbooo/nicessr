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
  for (let entrypointPath of entrypoint) {
    await fileEval(
      path.join(process.cwd(), '.nicessr', 'build', entrypointPath),
      { context: pageContext },
    );
  }

  if (typeof pageContext.window.default !== 'function') {
    console.error(`⛔️ Cannot render page ${page}: check default export`);
    return 'Error while SSR';
  }

  return vm.runInContext('window.default()', pageContext);
}
