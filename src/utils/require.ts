/** Works like require function, but without caching. */
export function requireNoCache(id: string) {
  delete require.cache[require.resolve(id)];
  return require(id);
}
