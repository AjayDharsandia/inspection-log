import { readdir, readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
export async function migrate(db, statusOnly = false) {
  const client = await db.connect();
  try {
    await client.query('SELECT pg_advisory_lock(781924)');
    await client.query(
      'CREATE TABLE IF NOT EXISTS schema_migrations (filename TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())',
    );
    const { rows } = await client.query(
      'SELECT filename FROM schema_migrations',
    );
    const applied = new Set(rows.map((row) => row.filename));
    const directory = new URL('./migrations/', import.meta.url);
    for (const filename of (await readdir(directory))
      .filter((name) => name.endsWith('.sql'))
      .sort()) {
      if (applied.has(filename) || statusOnly) {
        console.log(
          `${filename}: ${applied.has(filename) ? 'applied' : 'pending'}`,
        );
        continue;
      }
      await client.query('BEGIN');
      try {
        await client.query(
          await readFile(new URL(filename, directory), 'utf8'),
        );
        await client.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1)',
          [filename],
        );
        await client.query('COMMIT');
        console.log(`${filename}: applied`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock(781924)');
    client.release();
  }
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const { pool } = await import('./pool.js');
  try {
    await migrate(pool, process.argv.includes('--status'));
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
