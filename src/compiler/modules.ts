import path from 'path';
import webpack from 'webpack';

const modules: (isServer: boolean) => webpack.Module = (isServer) => ({
  rules: [
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
              { targets: isServer ? { node: '8' } : '>0.25%' },
            ],
          ],
          plugins: [
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
  ],
});

export default modules;
