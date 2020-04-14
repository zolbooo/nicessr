import path from 'path';
import webpack from 'webpack';
import chokidar from 'chokidar';

function getPagePath(fsPath: string) {
  return fsPath.slice('src/pages'.length).split('.').slice(0, -1).join('.');
}

export const compiledPages = new Map<string, string>();

const pages: Set<string> = new Set();
function getEntrypoints() {
  return Array.from(pages.values()).reduce(
    (entrypoints, path) => ({
      ...entrypoints,
      [getPagePath(path)]: './' + path,
    }),
    {},
  );
}

const compiler = webpack({
  mode: 'development',
  entry: getEntrypoints,
  watch: true,
  devtool: 'source-map',
  output: {
    path: path.join(process.cwd(), '.nicessr', 'build'),
    filename: '[chunkhash].js',
  },
  optimization: {
    runtimeChunk: 'single',
  },
}).watch({}, (err, stats) => {
  if (err) {
    console.error(`⛔️ ${err.message}`);
    return;
  }

  const chunks = Array.from(stats.compilation.chunks.values());
  chunks.forEach((chunk) => {
    if (chunk.id.startsWith('/')) {
      console.log(`⚡️ Built page ${chunk.id}`);
      compiledPages.set(chunk.id, chunk.renderedHash + '.js');
    } else if (chunk.id === 'runtime') {
      compiledPages.set('runtime', chunk.renderedHash + '.js');
    } else console.log(`❓Unknown chunk: ${chunk.id}`);
  });
});

const pagesWatcher = chokidar
  .watch('./src/pages')
  .on('add', (path) => {
    pages.add(path);
    compiler.invalidate();
  })
  .on('unlink', (path) => pages.delete(path));

process.on('SIGINT', () => {
  pagesWatcher.close();
  compiler.close(() => {});
});
