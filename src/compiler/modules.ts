import path from 'path';
import webpack from 'webpack';

import babelConfig from './babel/config';

const modules: (isServer: boolean) => webpack.Module = (isServer) => ({
  rules: [
    {
      test: /\.(png|jpe?g|gif)$/i,
      use: path.join(__dirname, 'webpack', 'static-asset-loader'),
    },
    {
      test: /\.css$/,
      use: isServer
        ? path.join(__dirname, 'webpack', 'css-loader')
        : 'null-loader',
    },
    {
      test: /\.jsx?$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: babelConfig(isServer),
      },
    },
    ...(process.env.NODE_ENV === 'production'
      ? [
          {
            test: /\.dev(elopment)?\.js$/,
            use: 'null-loader',
          },
        ]
      : []),
  ],
});

export default modules;
