import path from 'path';
import merge from 'lodash.merge';
import webpack from 'webpack';
import nodeExternals from 'webpack-node-externals';

import webpackModules from './modules';
import webpackBaseConfig from './baseConfig';

const isProduction = process.env.NODE_ENV === 'production';

export const buildPathSSR = path.join(process.cwd(), '.nicessr', 'ssr');
export const buildPathClient = path.join(process.cwd(), '.nicessr', 'build');
export const staticAssetsPath = path.join(process.cwd(), '.nicessr', 'static');

export const createCompiler = (
  getEntrypoints: (prefix: string) => () => { [key: string]: string },
) =>
  webpack([
    merge(
      {
        entry: getEntrypoints('ssr:'),
        devtool: isProduction ? false : ('inline-source-map' as any),
        output: {
          path: buildPathSSR,
          libraryTarget: 'commonjs2',
        },
        module: webpackModules(true),
        target: 'node',
        externals: [nodeExternals({ whitelist: [/\.css$/] })],
      },
      webpackBaseConfig,
    ),
    merge(
      {
        entry: getEntrypoints('client:'),
        devtool: isProduction ? false : ('source-map' as any),
        output: {
          path: buildPathClient,
        },
        module: webpackModules(false),
        target: 'web',
        optimization: {
          splitChunks: { chunks: 'all' },
          runtimeChunk: 'single',
        },
      },
      webpackBaseConfig,
    ),
  ]);
