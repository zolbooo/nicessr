import 'module-alias/register';
import express from 'express';

async function bootstrap() {
  const port = Number(process.env.PORT) || 9000;
  const app = express();
  app.listen(port, '0.0.0.0', () =>
    console.log(`🚀 Server running on http://0.0.0.0:${port}`),
  );

  app.get('/', (req) => {
    console.log(req.url);
  });
}

bootstrap();
