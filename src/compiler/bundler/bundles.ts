import { Bundle, Entrypoint } from '.';

export const appContextBundleRef: { current: Entrypoint } = { current: [] };
export const clientBundles = new Map<string, Entrypoint>();
export const serverBundles = new Map<string, Entrypoint>();

export function getBundle(page: string): Bundle | null {
  if (!clientBundles.has(page) || !serverBundles.has(page)) return null;
  return {
    ssr: serverBundles.get(page),
    client: clientBundles.get(page),
    appContext: appContextBundleRef.current,
  };
}
