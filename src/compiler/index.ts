import path from 'path';
import webpack from 'webpack';
import nodeExternals from 'webpack-node-externals';

import InjectPlugin, { ENTRY_ORDER } from 'webpack-inject-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';

import webpackModules from './modules';

export const buildPathSSR = path.join(process.cwd(), '.nicessr', 'ssr');
export const buildPathClient = path.join(process.cwd(), '.nicessr', 'build');

export const createCompiler = (
  getEntrypoints: (prefix: string) => () => { [key: string]: string },
) =>
  webpack([
    {
      mode:
        process.env.NODE_ENV === 'production' ? 'production' : 'development',
      entry: getEntrypoints('ssr:'),
      watch: true,
      devtool: 'inline-source-map',
      output: {
        path: buildPathSSR,
        filename: '[chunkhash].js',
        libraryTarget: 'commonjs2',
      },
      module: webpackModules,
      target: 'node',
      externals: [nodeExternals()],
      plugins: [new CleanWebpackPlugin()],
    },
    {
      mode:
        process.env.NODE_ENV === 'production' ? 'production' : 'development',
      entry: getEntrypoints('client:'),
      watch: true,
      devtool: 'source-map',
      output: {
        path: buildPathClient,
        filename: '[chunkhash].js',
        libraryTarget: 'window',
      },
      module: webpackModules,
      optimization: {
        splitChunks: { chunks: 'all' },
        runtimeChunk: 'single',
      },
      plugins: [
        new CleanWebpackPlugin(),
        new InjectPlugin(
          () => `require('nicessr/runtime').clientEntrypoint()`,
          {
            entryOrder: ENTRY_ORDER.First,
          },
        ),
      ],
    },
  ]);
