import path from 'path';
import express from 'express';

import { renderPage } from '../ssr/renderer';

async function start() {
  const buildManifest = require(path.join(
    process.cwd(),
    '.nicessr',
    'build.manifest.json',
  ));
  if (!buildManifest) {
    console.error(
      `⛔️\tCannot find build manifest. Run ${process.argv[0]} build command to create production bundle.`,
    );
    process.exit(1);
  }

  const resolvePage = (path: string) => {
    if (path.endsWith('/')) return buildManifest[`${path}index`] ?? null;
    if (buildManifest[path]) return buildManifest[path] ?? null;
    return buildManifest[`${path}/index`] ?? null;
  };

  const port = Number(process.env.PORT) || 9000;
  const app = express();
  const server = app.listen(port, '0.0.0.0', () =>
    console.log(`🚀\tServer running on http://0.0.0.0:${port}`),
  );

  app.use(
    '/.nicessr',
    express.static(path.join(process.cwd(), '.nicessr', 'build')),
  );
  app.get('*', async (req, res, next) => {
    const bundle = resolvePage(req.path);
    if (bundle === null) return next();
    const markup = await renderPage(req.path, { req, res }, bundle);
    res.status(200).send(markup);
  });

  app.use(express.static(path.join(process.cwd(), 'public')));

  process.on('SIGINT', () => {
    console.log('\n👾\tExiting gracefully, please wait...');
    server.close();
    process.exit(0);
  });
}

start();
