import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
dotenv.config({
  path: fileURLToPath(new URL('../../.env', import.meta.url)),
  quiet: true,
});
function port(value, name) {
  if (
    typeof value !== 'string' ||
    !/^\d+$/.test(value) ||
    Number(value) < 1 ||
    Number(value) > 65535
  )
    throw new Error(name + ' must be an integer between 1 and 65535.');
  return Number(value);
}
export function databaseConfig(env = process.env) {
  for (const key of [
    'DB_HOST',
    'DB_USERNAME',
    'DB_PASSWORD',
    'DB_PORT',
    'DB_NAME',
  ]) {
    if (typeof env[key] !== 'string' || !env[key].trim())
      throw new Error(key + ' is required. Configure backend/.env.');
  }
  // Pass separate fields to pg: passwords never undergo URL interpolation.
  return {
    host: env.DB_HOST.trim(),
    user: env.DB_USERNAME.trim(),
    password: env.DB_PASSWORD,
    port: port(env.DB_PORT, 'DB_PORT'),
    database: env.DB_NAME.trim(),
  };
}
export function config(env = process.env) {
  return {
    database: databaseConfig(env),
    port: port(env.PORT || '3001', 'PORT'),
    origin: env.CORS_ORIGIN || 'http://localhost:5173',
  };
}
