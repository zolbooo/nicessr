import path from 'path';
import express from 'express';

import { renderPage } from './ssr/renderer';
import { Bundler, BuildEvent, Bundle } from './compiler/bundler';

async function bootstrap() {
  const port = Number(process.env.PORT) || 9000;
  const app = express();
  const server = app.listen(port, '0.0.0.0', () =>
    console.log(`🚀\tServer running on http://0.0.0.0:${port}`),
  );

  const bundler = new Bundler();
  app.use('/.nicessr/auto-refresh', (req, res) => {
    let newBundle: Partial<Bundle> = { client: null, ssr: null };
    const handleBuildEvent = (event: BuildEvent) => {
      if (event.status !== 'success') return;
      newBundle = { ...newBundle, ...event.bundle };
      if (newBundle.client && newBundle.ssr) {
        res.write(`id: ${newBundle.client[0]}${newBundle.ssr[0]}`);
        res.write(`data: update`);
        newBundle = { client: null, ssr: null };
      }
    };

    bundler.subscribe(req.path, handleBuildEvent);
    res.socket.setTimeout(1000 * 60 * 60 * 24);
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write('\n');
    req.on('close', () => bundler.unsubscribe(req.path, handleBuildEvent));
  });

  app.use(
    '/.nicessr',
    express.static(path.join(process.cwd(), '.nicessr', 'build')),
  );
  app.get('*', async (req, res, next) => {
    const bundle = await bundler.buildOnce(req.path);
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

bootstrap();
