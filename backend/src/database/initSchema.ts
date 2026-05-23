import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from './prisma.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../');
const migrationPath = path.join(root, 'prisma/migrations/20260519061000_init_desktop/migration.sql');

export async function initializeDatabase() {
  const sql = await fs.readFile(migrationPath, 'utf8');
  const statements = sql
    .split(';')
    .map((statement) => makeIdempotent(statement.trim()))
    .filter(Boolean);

  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
  }
}

function makeIdempotent(statement: string) {
  const normalized = statement
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
    .trim();

  return normalized
    .replace(/^CREATE TABLE /i, 'CREATE TABLE IF NOT EXISTS ')
    .replace(/^CREATE UNIQUE INDEX /i, 'CREATE UNIQUE INDEX IF NOT EXISTS ')
    .replace(/^CREATE INDEX /i, 'CREATE INDEX IF NOT EXISTS ');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await initializeDatabase();
  await prisma.$disconnect();
  console.log('TaskList database schema is ready.');
}
