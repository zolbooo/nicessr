import webpack from 'webpack';

const modules: webpack.Module = {
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
                importSource: 'nicessr/dist/csr/jsx',
              },
            ],
          ],
        },
      },
    },
  ],
};

export default modules;
