import sha256 from 'sha256';

const styles = new Map<string, string>();

export function assignClass(css: string): string {
  const hash: string = sha256(css).replace(/[0-9]/g, (digit) =>
    String.fromCharCode(
      digit.charCodeAt(0) - '0'.charCodeAt(0) + 'a'.charCodeAt(0),
    ),
  );
  styles.set(hash, css);
  return hash;
}

export function lookupClass(className: string): string {
  return styles.get(className);
}
