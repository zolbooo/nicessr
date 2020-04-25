import path from 'path';
import express from 'express';
import { prepareUrls, choosePort } from 'react-dev-utils/WebpackDevServerUtils';

import { cleanup } from './utils/cleanup';
import { renderPage } from './ssr/render/markup';
import { Bundler, BuildEvent, Bundle } from './compiler/bundler';
import { handleRequest as handleFunctionInvocation } from './ssr/functions';

async function bootstrap() {
  const bundler = new Bundler();
  await cleanup();

  const host = process.env.host || '0.0.0.0';
  const port = await choosePort(host, parseInt(process.env.PORT, 10) || 9000);
  if (port === null) {
    console.error('⛔️\tCannot start development server.');
    process.exit(1);
  }

  const app = express();
  app.use(express.json());

  app.use('/.nicessr/auto-refresh', (req, res) => {
    let newBundle: Partial<Bundle> = {
      appContext: [],
      client: null,
      ssr: null,
    };
    const handleBuildEvent = (event: BuildEvent) => {
      if (event.status !== 'success') return;
      newBundle = { ...newBundle, ...event.bundle };
      if ((newBundle.client && newBundle.ssr) || 'appContext' in event.bundle) {
        res.write(`id: ${Math.random()}\n`);
        res.write('data: {"type": "update"}\n\n');
        newBundle = { client: null, ssr: null };
      }
    };

    bundler.subscribe(req.query.page?.toString(), handleBuildEvent);
    res.socket.setTimeout(1000 * 60 * 60 * 24);
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write('\n');
    req.on('close', () =>
      bundler.unsubscribe(req.query.page?.toString(), handleBuildEvent),
    );
  });

  app.use(
    '/.nicessr',
    express.static(path.join(process.cwd(), '.nicessr', 'build')),
  );
  app.use(
    '/.nicessr/static',
    express.static(path.join(process.cwd(), '.nicessr', 'static')),
  );

  app.get('*', async (req, res, next) => {
    const bundle = await bundler.buildOnce(req.path);
    if (bundle === null) return next();
    const markup = await renderPage(req.path, { req, res }, bundle);
    res.status(200).send(markup);
  });
  app.post('*', async (req, res) => {
    const bundle = await bundler.buildOnce(req.path);
    if (bundle) handleFunctionInvocation(req, res, bundle);
  });

  app.use(express.static(path.join(process.cwd(), 'public')));

  const server = app.listen(port, host, () => {
    const { lanUrlForTerminal, localUrlForTerminal } = prepareUrls(
      'http',
      host,
      port,
    );
    console.log('🚀\tServer has started!');
    console.log(`Local URL: ${localUrlForTerminal}`);
    console.log(`LAN URL: ${lanUrlForTerminal}`);
  });

  process.on('SIGINT', () => {
    console.log('\n👾\tExiting gracefully, please wait...');
    server.close();
    process.exit(0);
  });
}

bootstrap();
