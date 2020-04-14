import path from 'path';
import webpack from 'webpack';
import chokidar from 'chokidar';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';

function getPagePath(fsPath: string) {
  return fsPath.slice('src/pages'.length).split('.').slice(0, -1).join('.');
}

export const compiledPages = new Map<string, string[]>();

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
  plugins: [new CleanWebpackPlugin()],
});
const watcher = compiler.watch({}, (err, stats) => {
  if (err) {
    console.error(`⛔️ ${err.message}`);
    return;
  }

  const entrypoints = Array.from(stats.compilation.entrypoints.entries());
  entrypoints.forEach(([pageName, entrypoint]) => {
    compiledPages.set(
      pageName,
      entrypoint.chunks.map((chunk) => Array.from(chunk.files.values())).flat(),
    );
  });
});

const pagesWatcher = chokidar
  .watch('./src/pages')
  .on('add', (path) => {
    pages.add(path);
    watcher.invalidate();
  })
  .on('unlink', (path) => pages.delete(path));

process.on('SIGINT', () => {
  pagesWatcher.close();
  watcher.close(() => {});
});

export default compiler;
