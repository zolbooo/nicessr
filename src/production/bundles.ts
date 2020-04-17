import { Entrypoint } from '../compiler/bundler';

export function getBundles(
  ssrEntrypoints: [string, Entrypoint][],
  clientEntrypoints: [string, Entrypoint][],
): [Map<string, Entrypoint>, Map<string, Entrypoint>] {
  const ssrPages = new Map<string, Entrypoint>(
    ssrEntrypoints.filter(([page]) => page !== '/_app'),
  );
  const clientPages = new Map<string, Entrypoint>(
    clientEntrypoints.filter(([page]) => page !== '/_app'),
  );

  const ssrBundleList = JSON.stringify(Array.from(ssrPages.keys()).sort());
  const clientBundleList = JSON.stringify(
    Array.from(clientPages.keys()).sort(),
  );
  if (ssrBundleList !== clientBundleList) {
    throw Error(
      'Invariant violation: got different pages for client and SSR bundles. ' +
        `SSR: ${ssrBundleList}, ` +
        `client: ${clientBundleList}`,
    );
  }

  return [ssrPages, clientPages];
}
