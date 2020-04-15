import path from 'path';
import webpack from 'webpack';
import chokidar from 'chokidar';

import InjectPlugin, { ENTRY_ORDER } from 'webpack-inject-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';

import { pushPageUpdate } from './auto-reload';

function getPagePath(fsPath: string) {
  return fsPath.slice('src/pages'.length).split('.').slice(0, -1).join('.');
}

function hasUpdated(oldEntrypoint: string[], newEntrypoint: string[]) {
  if (oldEntrypoint?.length !== newEntrypoint?.length) return true;
  return oldEntrypoint.some((entrypoint, i) => entrypoint !== newEntrypoint[i]);
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
  devtool: 'inline-source-map',
  output: {
    path: path.join(process.cwd(), '.nicessr', 'ssr'),
    filename: '[chunkhash].js',
    libraryTarget: 'window',
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
            plugins: [
              [
                '@babel/plugin-transform-react-jsx',
                {
                  runtime: 'automatic',
                  importSource: 'nicessr/jsx',
                },
              ],
            ],
          },
        },
      },
    ],
  },
  optimization: {
    splitChunks: { chunks: 'all' },
    runtimeChunk: 'single',
  },
  resolve: {
    alias: {
      nicessr: path.join(__dirname, '..'),
    },
  },
  plugins: [
    new CleanWebpackPlugin(),
    new InjectPlugin(() => `require('nicessr/runtime').clientEntrypoint()`, {
      entryOrder: ENTRY_ORDER.First,
    }),
  ],
});
const watcher = compiler.watch({}, (err, stats) => {
  if (err) {
    console.error(`⛔️ ${err.message}`);
    return;
  }

  const entrypoints = Array.from(stats.compilation.entrypoints.entries());
  entrypoints.forEach(([pageName, entrypoint]) => {
    const newEntrypoint = entrypoint.chunks
      .map((chunk) => Array.from(chunk.files.values()))
      .flat();
    const oldEntrypoint = compiledPages.get(pageName);
    if (!hasUpdated(oldEntrypoint, newEntrypoint)) return;

    console.log(`⚡️ Built page ${pageName}`);
    compiledPages.set(pageName, newEntrypoint);
    pushPageUpdate(pageName);
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
