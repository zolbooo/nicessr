import path from 'path';
import webpack from 'webpack';
import nodeExternals from 'webpack-node-externals';

import TerserPlugin from 'terser-webpack-plugin';
import InjectPlugin, { ENTRY_ORDER } from 'webpack-inject-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';

import webpackModules from './modules';

const isProduction = process.env.NODE_ENV === 'production';

export const buildPathSSR = path.join(process.cwd(), '.nicessr', 'ssr');
export const buildPathClient = path.join(process.cwd(), '.nicessr', 'build');

export const createCompiler = (
  getEntrypoints: (prefix: string) => () => { [key: string]: string },
) =>
  webpack([
    {
      mode: isProduction ? 'production' : 'development',
      entry: getEntrypoints('ssr:'),
      stats: 'errors-warnings',
      watch: true,
      devtool: isProduction ? false : 'inline-source-map',
      output: {
        path: buildPathSSR,
        filename: '[chunkhash].js',
        libraryTarget: 'commonjs2',
      },
      module: webpackModules(true),
      target: 'node',
      externals: [nodeExternals()],
      resolve: {
        alias: {
          nicessr: path.join(__dirname, '..', '..'),
        },
        extensions: ['.js', '.jsx'],
      },
      optimization: {
        usedExports: true,
        minimize: isProduction,
        minimizer: [new TerserPlugin()],
      },
      plugins: [new CleanWebpackPlugin()],
    },
    {
      mode: isProduction ? 'production' : 'development',
      entry: getEntrypoints('client:'),
      watch: true,
      stats: 'errors-warnings',
      devtool: isProduction ? false : 'source-map',
      output: {
        path: buildPathClient,
        filename: '[chunkhash].js',
        libraryTarget: 'window',
      },
      module: webpackModules(false),
      optimization: {
        splitChunks: { chunks: 'all' },
        runtimeChunk: 'single',
        usedExports: true,
        minimize: isProduction,
        minimizer: [new TerserPlugin()],
      },
      resolve: {
        alias: {
          css: false as any,
          nicessr: path.join(__dirname, '..', '..'),
        },
        extensions: ['.js', '.jsx'],
      },
      plugins: [
        new InjectPlugin(
          () => `require('nicessr/dist/csr/runtime').clientEntrypoint()`,
          {
            entryOrder: ENTRY_ORDER.First,
          },
        ),
        new CleanWebpackPlugin(),
      ],
    },
  ]);
