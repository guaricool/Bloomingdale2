/**
 * Apply pending SQL migrations in db/migrations/.
 *
 * Migration files must be named NNNN_*.sql (4+ digit prefix, ascending).
 * Already-applied migrations are tracked in the `_migrations` table.
 *
 * Usage:
 *   tsx scripts/db-migrate.ts
 *   npm run db:migrate
 */
import * as fs from "node:fs";
import * as path from "node:path";
import Database from "better-sqlite3";

const MIGRATIONS_DIR = path.resolve(process.cwd(), "db/migrations");
const DEFAULT_DB_PATH = path.resolve(process.cwd(), "data/bloomingdale.db");

function resolveDbPath(): string {
  const raw = process.env.DATABASE_URL ?? "./data/bloomingdale.db";
  const cleaned = raw.replace(/^sqlite:\/\//, "").replace(/^file:/, "");
  return path.isAbsolute(cleaned) ? cleaned : path.resolve(process.cwd(), cleaned);
}

function ensureMigrationsTable(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      name      TEXT NOT NULL UNIQUE,
      appliedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

function listMigrations(): { name: string; sql: string }[] {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return [];
  }
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^\d{3,}_.+\.sql$/.test(f))
    .sort()
    .map((name) => ({
      name,
      sql: fs.readFileSync(path.join(MIGRATIONS_DIR, name), "utf8"),
    }));
}

function appliedSet(db: Database.Database): Set<string> {
  const rows = db.prepare("SELECT name FROM _migrations").all() as { name: string }[];
  return new Set(rows.map((r) => r.name));
}

function main(): void {
  const dbPath = resolveDbPath();
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  console.log(`[migrate] DB: ${dbPath}`);
  const db = new Database(dbPath);
  db.pragma("foreign_keys = ON");

  ensureMigrationsTable(db);
  const applied = appliedSet(db);
  const migrations = listMigrations();

  let appliedCount = 0;
  for (const m of migrations) {
    if (applied.has(m.name)) {
      console.log(`[migrate]   skip ${m.name} (already applied)`);
      continue;
    }
    console.log(`[migrate]   apply ${m.name}`);
    const tx = db.transaction(() => {
      db.exec(m.sql);
      db.prepare("INSERT INTO _migrations (name) VALUES (?)").run(m.name);
    });
    try {
      tx();
      appliedCount += 1;
    } catch (err) {
      console.error(`[migrate]   FAIL on ${m.name}:`, err);
      db.close();
      process.exit(1);
    }
  }

  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    .all() as { name: string }[];
  console.log(`[migrate] done. ${appliedCount} new migration(s) applied.`);
  console.log(`[migrate] tables (${tables.length}): ${tables.map((t) => t.name).join(", ")}`);

  // Sync db/schema.sql from the current schema
  syncSchemaFile(db);

  db.close();
}

/**
 * Generate db/schema.sql from the current DB schema (DDL only).
 * This is for human reference; the migration files are the source of truth.
 */
function syncSchemaFile(db: Database.Database): void {
  const outPath = path.resolve(process.cwd(), "db/schema.sql");
  const schema = (db
    .prepare(
      `SELECT sql FROM sqlite_master
       WHERE type IN ('table', 'index') AND name NOT LIKE 'sqlite_%'
         AND sql IS NOT NULL
       ORDER BY type DESC, name`,
    )
    .all() as { sql: string }[])
    .map((row) => row.sql + ";")
    .join("\n\n");

  const banner = `-- db/schema.sql
-- Snapshot of the current database schema.
-- Generated automatically by scripts/db-migrate.ts.
-- DO NOT EDIT BY HAND — edit db/migrations/*.sql and run \`npm run db:migrate\`.
-- Generated at: ${new Date().toISOString()}

PRAGMA foreign_keys = ON;

`;
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, banner + schema + "\n", "utf8");
  console.log(`[migrate] wrote ${outPath}`);
}

main();
