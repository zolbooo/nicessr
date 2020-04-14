import 'module-alias/register';
import express from 'express';

import './compiler';
import { renderPage } from './renderer';

async function bootstrap() {
  const port = Number(process.env.PORT) || 9000;
  const app = express();
  const server = app.listen(port, '0.0.0.0', () =>
    console.log(`🚀 Server running on http://0.0.0.0:${port}`),
  );

  app.get('*', (req, res) => {
    const markup = renderPage(req.url);
    if (markup === null) {
      // TODO: Render static assets
      res.status(404).send('Not found');
      return;
    }
    res.send(markup);
  });

  process.on('SIGINT', () => {
    console.log('\n👾 Exiting gracefully, please wait...');
    server.close();
    process.exit(0);
  });
}

bootstrap();
