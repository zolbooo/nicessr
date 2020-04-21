import fs from 'fs';
import path from 'path';
import { interpolateName } from 'loader-utils';

export default function loader(content: Buffer) {
  const generatedFilename = interpolateName(this, '[contenthash:8].[ext]', {
    content,
    context: this.rootContext,
  });

  if (
    !fs.existsSync(
      path.join(process.cwd(), '.nicessr', 'static', generatedFilename),
    )
  )
    this.emitFile(path.join('..', 'static', generatedFilename), content);
  return `module.exports = "/.nicessr/static/${generatedFilename}";`;
}

module.exports.raw = true;
