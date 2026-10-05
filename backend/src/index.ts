import { createApp } from './app';
const { app, db } = createApp();
const port = Number(process.env.PORT || 3000);
const server = app.listen(port, '0.0.0.0', () =>
  console.log(`Stock API: http://localhost:${port}`),
);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () =>
    server.close(() => {
      db.close();
      process.exit(0);
    }),
  );
