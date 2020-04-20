import fs from 'fs';
import path from 'path';
import sha256 from 'sha256';
import { parse, stringify } from 'css';
import { stringifyRequest } from 'loader-utils';

function extractPath(importStatement: string) {
  // This is an import in format @import url('some-file.css')
  if (importStatement.startsWith('url('))
    return importStatement.slice('url('.length + 1, -2);
  // Import in format @import 'some-file.css'
  return importStatement.slice(1, -1);
}

export default function loader(content: Buffer) {
  const cssSyntaxTree = parse(content.toString('utf-8'));
  const imports = cssSyntaxTree.stylesheet.rules.filter(
    (rule) => rule.type === 'import',
  );

  cssSyntaxTree.stylesheet.rules = cssSyntaxTree.stylesheet.rules.filter(
    (rule) => rule.type !== 'import',
  );

  const importsToBeInjected = imports
    .map(
      (importStatement) =>
        `require(${stringifyRequest(
          this,
          extractPath(importStatement.import),
        )});`,
    )
    .join('');

  const minifiedCSS = stringify(cssSyntaxTree, { compress: true });
  const generatedFilename = `${sha256(minifiedCSS)}.css`;

  if (
    !fs.existsSync(
      path.join(process.cwd(), '.nicessr', 'static', generatedFilename),
    )
  )
    this.emitFile(path.join('..', 'static', generatedFilename), minifiedCSS);
  return `${importsToBeInjected}globalCSS("${generatedFilename}")`;
}

module.exports.raw = true;
