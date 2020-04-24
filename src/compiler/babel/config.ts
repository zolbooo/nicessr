export default (isServer) => ({
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
      ? [require('./strip-dev-code')]
      : []),
    ...(isServer
      ? []
      : [
          require('./strip-server-side-functions'),
          require('./strip-get-initial-props'),
          require('./strip-css-on-client'),
        ]),
  ],
});
