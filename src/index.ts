import 'module-alias/register';
import path from 'path';
import express from 'express';

import './compiler';
import { renderPage } from './renderer';

async function bootstrap() {
  const port = Number(process.env.PORT) || 9000;
  const app = express();
  const server = app.listen(port, '0.0.0.0', () =>
    console.log(`🚀 Server running on http://0.0.0.0:${port}`),
  );

  app.use(
    '/.nicessr',
    express.static(path.join(process.cwd(), '.nicessr', 'build')),
  );
  app.get('*', (req, res, next) => {
    const markup = renderPage(req.url);
    if (markup === null) {
      next();
      return;
    }
    res.send(markup);
  });
  app.use(express.static(path.join(process.cwd(), 'public')));

  process.on('SIGINT', () => {
    console.log('\n👾 Exiting gracefully, please wait...');
    server.close();
    process.exit(0);
  });
}

bootstrap();
