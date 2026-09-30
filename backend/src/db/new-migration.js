import { readdir, writeFile } from 'node:fs/promises';
const name = process.argv[2];
if (!name || !/^[a-z][a-z0-9_]*$/.test(name))
  throw new Error(
    'Provide a snake_case migration name: npm run db:new -- add_column',
  );
const directory = new URL('./migrations/', import.meta.url);
const numbers = (await readdir(directory)).map((file) =>
  Number(file.match(/^(\d+)_.*\.sql$/)?.[1] || 0),
);
const filename =
  String(Math.max(0, ...numbers) + 1).padStart(3, '0') + '_' + name + '.sql';
await writeFile(
  new URL(filename, directory),
  '-- Add transactional SQL here.\n',
  { flag: 'wx' },
);
console.log(filename);
