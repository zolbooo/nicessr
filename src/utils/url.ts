export function shortenURL(url: string) {
  return url.endsWith('/index') ? url.slice(0, -'index'.length) : url;
}
