import path from 'path';
import webpack from 'webpack';

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
        options: {
          presets: [
            [
              '@babel/preset-env',
              {
                targets: isServer ? { node: '8' } : '>0.25%',
                modules: false,
                loose: true,
              },
            ],
          ],
          plugins: [
            '@babel/plugin-transform-runtime',
            [
              '@babel/plugin-transform-react-jsx',
              {
                runtime: 'automatic',
                importSource: 'nicessr/dist/csr/jsx',
              },
            ],
            ...(process.env.NODE_ENV === 'production'
              ? [require('./babel/strip-dev-code')]
              : []),
            ...(isServer
              ? []
              : [
                  require('./babel/strip-server-side-functions'),
                  require('./babel/strip-get-initial-props'),
                  require('./babel/strip-css-on-client'),
                ]),
          ],
        },
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
