import path from 'path';
import express from 'express';

import { resolveURL } from './util';
import { renderPage } from './ssr/renderer';
import { compiledPages } from './ssr/compiler';
import { unsubscribe, subscribeForPageUpdates } from './ssr/auto-reload';

async function bootstrap() {
  const port = Number(process.env.PORT) || 9000;
  const app = express();
  const server = app.listen(port, '0.0.0.0', () =>
    console.log(`🚀 Server running on http://0.0.0.0:${port}`),
  );

  app.use('/.nicessr/auto-refresh', (req, res) => {
    const page = resolveURL(req.query.page.toString());
    if (!compiledPages.get(page)) {
      res.status(404).send('Page not found');
      return;
    }

    res.socket.setTimeout(1000 * 60 * 60 * 24);
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write('\n');

    subscribeForPageUpdates(page, res);
    req.on('close', () => unsubscribe(page, res));
  });
  app.use(
    '/.nicessr',
    express.static(path.join(process.cwd(), '.nicessr', 'ssr')),
  );
  app.get('*', async (req, res, next) => {
    const markup = await renderPage(req.url, { req, res });
    if (markup === null) {
      next();
      return;
    }
    res.status(200).send(markup);
  });
  app.use(express.static(path.join(process.cwd(), 'public')));

  process.on('SIGINT', () => {
    console.log('\n👾 Exiting gracefully, please wait...');
    server.close();
    process.exit(0);
  });
}

bootstrap();
