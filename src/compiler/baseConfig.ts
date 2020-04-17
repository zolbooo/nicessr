import path from 'path';
import webpack from 'webpack';

import TerserPlugin from 'terser-webpack-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';

const isProduction = process.env.NODE_ENV === 'production';

const baseConfig: webpack.Configuration = {
  mode: isProduction ? 'production' : 'development',
  stats: 'errors-warnings',
  watch: true,
  output: {
    filename: '[chunkhash].js',
  },
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
};

export default baseConfig;
