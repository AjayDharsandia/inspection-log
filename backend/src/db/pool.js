import pg from 'pg';
import { config } from '../config/env.js';
pg.types.setTypeParser(1082, (value) => value);
export const pool = new pg.Pool({
  ...config().database,
  connectionTimeoutMillis: 5000,
  max: 10,
});
pool.on('error', (error) =>
  console.error('Database pool error:', error.message),
);
