import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
// Development-only dummy data. Kept outside migrations so it never reaches
// other environments. Skips when seeded rows exist to avoid duplicates.
export async function seed(db) {
  const client = await db.connect();
  try {
    const { rowCount } = await client.query(
      "SELECT 1 FROM inspections WHERE remarks LIKE 'Dummy remark%' LIMIT 1",
    );
    if (rowCount) {
      console.log('Dummy inspections already exist; seed skipped.');
      return;
    }
    await client.query('BEGIN');
    try {
      const result = await client.query(
        await readFile(
          new URL('./seeds/dummy_inspections.sql', import.meta.url),
          'utf8',
        ),
      );
      await client.query('COMMIT');
      console.log(`Seeded ${result.rowCount} dummy inspections.`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  } finally {
    client.release();
  }
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const { pool } = await import('./pool.js');
  try {
    await seed(pool);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
