import { createApp } from './app.js';
import { pool } from './db/pool.js';
import { config } from './config/env.js';
const settings = config();
const server = createApp(pool, settings.origin).listen(settings.port, () =>
  console.log(`Quality Tracker API: http://localhost:${settings.port}`),
);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => {
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  });
