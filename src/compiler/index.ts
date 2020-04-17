import path from 'path';
import merge from 'lodash.merge';
import webpack from 'webpack';
import nodeExternals from 'webpack-node-externals';

import InjectPlugin, { ENTRY_ORDER } from 'webpack-inject-plugin';

import webpackModules from './modules';
import webpackBaseConfig from './baseConfig';

const isProduction = process.env.NODE_ENV === 'production';

export const buildPathSSR = path.join(process.cwd(), '.nicessr', 'ssr');
export const buildPathClient = path.join(process.cwd(), '.nicessr', 'build');

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
        externals: [nodeExternals()],
      },
      webpackBaseConfig,
    ),
    merge(
      {
        entry: getEntrypoints('client:'),
        devtool: isProduction ? false : ('source-map' as any),
        output: {
          path: buildPathClient,
          libraryTarget: 'window' as any,
        },
        module: webpackModules(false),
        optimization: {
          splitChunks: { chunks: 'all' },
          runtimeChunk: 'single',
        },
        resolve: {
          alias: {
            css: false as any,
          },
        },
        plugins: [
          new InjectPlugin(
            () => "require('nicessr/dist/csr/runtime').clientEntrypoint()",
            {
              entryOrder: ENTRY_ORDER.First,
            },
          ),
        ],
      },
      webpackBaseConfig,
    ),
  ]);
