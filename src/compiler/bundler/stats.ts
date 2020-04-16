import webpack from 'webpack';

export const getEntrypointsFromStats = (stats: webpack.Stats) => {
  return Array.from(
    stats.compilation.entrypoints.entries(),
  ).map(([pageName, entrypoint]) => [
    pageName,
    entrypoint.chunks.map((chunk) => Array.from(chunk.files.values())).flat(),
  ]);
};
