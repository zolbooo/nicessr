import sha256 from 'sha256';

const styles = new Map<string, string>();

export function assignClass(css: string): string {
  const hash = sha256(css);
  styles.set(hash, css.replace('__NICESSR__GENERATED_CLASS__', hash));
  return hash;
}

export function lookupClass(className: string): string {
  return styles.get(className);
}
