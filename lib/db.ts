/**
 * Database connection helper.
 *
 * Resolves the SQLite database path from DATABASE_URL (default: ./data/bloomingdale.db).
 * Singleton across the Node.js process so HMR / re-imports in dev don't open multiple handles.
 */
import Database from "better-sqlite3";
import * as path from "node:path";
import * as fs from "node:fs";

let _db: Database.Database | null = null;

function resolveDbPath(): string {
  const raw = process.env.DATABASE_URL ?? "./data/bloomingdale.db";
  // strip optional sqlite:// or file: prefix
  const cleaned = raw.replace(/^sqlite:\/\//, "").replace(/^file:/, "");
  return path.isAbsolute(cleaned) ? cleaned : path.resolve(process.cwd(), cleaned);
}

export function getDb(): Database.Database {
  if (_db) return _db;
  const dbPath = resolveDbPath();
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  _db = new Database(dbPath);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  return _db;
}

export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}
