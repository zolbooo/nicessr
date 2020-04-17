import webpack from 'webpack';

const modules: (isServer: boolean) => webpack.Module = (isServer) => ({
  rules: [
    {
      test: /\.jsx?$/,
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
                importSource: 'nicessr/dist/csr/jsx',
              },
            ],
            ...(isServer
              ? []
              : [
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
