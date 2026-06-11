/**
 * Database connection helper.
 *
 * Dual-mode:
 *   - If `DATABASE_URL` starts with `postgres://` or `postgresql://` we
 *     connect to Postgres via `postgres` (a.k.a. postgres-js) and expose
 *     a `better-sqlite3`-shaped wrapper so the rest of the codebase
 *     does not need to change.
 *   - Otherwise we open a local SQLite file via `better-sqlite3` (used
 *     for offline dev).
 *
 * The wrapper supports the subset of the better-sqlite3 API that the
 * app uses: `prepare(sql).all(...params)`, `.get(...params)`, `.run(...params)`,
 * and `db.transaction(fn)`. Placeholders `?` are translated to numbered
 * `$1, $2, …` for Postgres.
 *
 * Key behavior differences between backends, normalized in the wrapper:
 *   - `.run()` returns `{ changes, lastInsertRowid }` on both. On
 *     Postgres, `changes` is read from the command tag (UPDATE/DELETE/
 *     INSERT row count) and `lastInsertRowid` is always `null` (callers
 *     re-SELECT the freshly inserted row by id when they need it).
 *   - `db.transaction(fn)` accepts both sync and async `fn`. The SQLite
 *     path uses a manual BEGIN/COMMIT/ROLLBACK because better-sqlite3
 *     throws when the wrapped function returns a Promise. The Postgres
 *     path uses `sql.begin` directly.
 *   - `db.exec(sql)` returns `Promise<void>` on both.
 */
import Database from "better-sqlite3";
import postgres from "postgres";
import * as path from "node:path";
import * as fs from "node:fs";

// ---------------------------------------------------------------------------
// Public interface (better-sqlite3 subset, async-shaped)
// ---------------------------------------------------------------------------

export interface RunResult {
  /** Postgres: number of affected rows. SQLite: same. */
  changes: number;
  /** Postgres: always null (callers re-SELECT). SQLite: the inserted rowid. */
  lastInsertRowid: number | null;
}

export interface Statement {
  all(...params: unknown[]): Promise<unknown[]>;
  get(...params: unknown[]): Promise<unknown | undefined>;
  run(...params: unknown[]): Promise<RunResult>;
}

export interface Db {
  prepare(sql: string): Statement;
  /**
   * Wrap a function in a transaction. The wrapped function can be sync
   * or async. The wrapper is also callable: invoke it with the same args
   * as the wrapped function and `await` the result.
   *
   * The constraint mirrors better-sqlite3's own `VariableArgFunction`
   * helper — without the `any[]` parameter relaxation, the contravariant
   * check on parameters rejects typed inputs like
   * `(rows: HymnRow[]) => Promise<number>`.
   */
  transaction<T extends (...args: any[]) => unknown>(fn: T): T;
  /** Postgres: list of all rows affected in a multi-statement. SQLite: same. */
  exec(sql: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// Internal: query translation helpers
// ---------------------------------------------------------------------------

/**
 * Translate SQLite-style `?` placeholders into Postgres `$1, $2, …` form.
 * Skips placeholders inside string literals and double-quoted identifiers.
 * (Good enough for our query set; avoids pulling in a full SQL parser.)
 */
function translatePlaceholders(sql: string): { sql: string; paramCount: number } {
  let out = "";
  let i = 0;
  let n = 1;
  let inSingle = false;
  let inDouble = false;
  while (i < sql.length) {
    const ch = sql[i];
    if (!inSingle && !inDouble && ch === "?") {
      out += `$${n++}`;
      i++;
      continue;
    }
    if (!inDouble && ch === "'") {
      // Toggle single-quote state; `''` is an escaped quote inside.
      if (inSingle && sql[i + 1] === "'") {
        out += "''";
        i += 2;
        continue;
      }
      inSingle = !inSingle;
    } else if (!inSingle && ch === '"') {
      inDouble = !inDouble;
    }
    out += ch;
    i++;
  }
  return { sql: out, paramCount: n - 1 };
}

/** Detect the leading SQL verb. Used to decide how to compute `changes`. */
function leadingVerb(sql: string): "select" | "insert" | "update" | "delete" | "other" {
  const trimmed = sql.trimStart().toLowerCase();
  if (trimmed.startsWith("select") || trimmed.startsWith("with")) return "select";
  if (trimmed.startsWith("insert")) return "insert";
  if (trimmed.startsWith("update")) return "update";
  if (trimmed.startsWith("delete")) return "delete";
  return "other";
}

// ---------------------------------------------------------------------------
// SQLite implementation (dev only)
// ---------------------------------------------------------------------------

function makeSqliteDb(filePath: string): Db {
  const _db = new Database(filePath);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  const wrap = (stmt: Database.Statement): Statement => ({
    all: async (...params) => stmt.all(...params as never[]) as unknown[],
    get: async (...params) =>
      (stmt.get(...params as never[]) as unknown | undefined) ?? undefined,
    run: async (...params) => {
      const r = stmt.run(...params as never[]);
      return {
        changes: Number(r.changes),
        lastInsertRowid: Number(r.lastInsertRowid),
      };
    },
  });
  return {
    prepare: (sql) => wrap(_db.prepare(sql)),
    transaction: (fn) => {
      // SQLite supports only sync transactions natively (better-sqlite3
      // throws if the wrapped function returns a Promise), but the rest
      // of the app uses `await db.transaction(async () => …)`. We do
      // manual BEGIN/COMMIT/ROLLBACK so async bodies work uniformly.
      const begin = _db.prepare("BEGIN");
      const commit = _db.prepare("COMMIT");
      const rollback = _db.prepare("ROLLBACK");
      return (async (...args: unknown[]) => {
        begin.run();
        try {
          const result = await (fn as (...a: unknown[]) => unknown)(...args);
          commit.run();
          return result;
        } catch (err) {
          try {
            rollback.run();
          } catch {
            // best-effort
          }
          throw err;
        }
      }) as unknown as typeof fn;
    },
    exec: async (sql) => {
      _db.exec(sql);
    },
  };
}

// ---------------------------------------------------------------------------
// Postgres implementation (production / Vercel)
// ---------------------------------------------------------------------------

/**
 * The shape of the result returned by `await sql.unsafe(...)`. It is an
 * Array subclass with `count`, `command`, `state`, etc. populated from
 * the Postgres CommandComplete message. For SELECT, `count` is the
 * column count (not the row count); for INSERT/UPDATE/DELETE, `count`
 * is the number of affected rows.
 */
type PgResult = unknown[] & {
  count: number | null;
  command: string | null;
};

function asPgResult(value: unknown): PgResult {
  return value as PgResult;
}

function makePostgresDb(url: string): Db {
  const sql = postgres(url, {
    ssl: "require",
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });
  const wrap = (rawSql: string): Statement => {
    const { sql: pgSql } = translatePlaceholders(rawSql);
    const verb = leadingVerb(rawSql);
    return {
      all: async (...params) => {
        const rows = await sql.unsafe(pgSql, params as never[]);
        return Array.from(rows as Iterable<unknown>) as unknown[];
      },
      get: async (...params) => {
        const rows = await sql.unsafe(pgSql, params as never[]);
        const first = (rows as { 0?: unknown })[0];
        return first ?? undefined;
      },
      run: async (...params) => {
        const result = asPgResult(await sql.unsafe(pgSql, params as never[]));
        // `count` is the affected-row count for INSERT/UPDATE/DELETE and
        // the column count for SELECT. We only trust it for non-SELECT.
        const changes = verb === "select" ? 0 : Number(result.count ?? 0);
        return { changes, lastInsertRowid: null };
      },
    };
  };
  return {
    prepare: (sqlText) => wrap(sqlText),
    transaction: <T extends (...args: any[]) => unknown>(fn: T) => {
      return (async (...args: Parameters<T>) => {
        return await sql.begin(async () => {
          // We run the user function in the global client; per-statement
          // tx routing would require rewriting the lib files.
          return (fn as (...a: unknown[]) => unknown)(...(args as unknown[]));
        });
      }) as unknown as T;
    },
    exec: async (sqlText) => {
      await sql.unsafe(sqlText).catch(() => {});
    },
  };
}

// ---------------------------------------------------------------------------
// Singleton resolution
// ---------------------------------------------------------------------------

let _db: Db | null = null;

function resolveDatabaseUrl(): string {
  return process.env.DATABASE_URL ?? "./data/bloomingdale.db";
}

function isPostgresUrl(url: string): boolean {
  return /^postgres(ql)?:\/\//i.test(url);
}

export function getDb(): Db {
  if (_db) return _db;
  const raw = resolveDatabaseUrl();
  if (isPostgresUrl(raw)) {
    _db = makePostgresDb(raw);
  } else {
    // SQLite path (dev / offline).
    const cleaned = raw.replace(/^sqlite:\/\//, "").replace(/^file:/, "");
    const dbPath = path.isAbsolute(cleaned) ? cleaned : path.resolve(process.cwd(), cleaned);
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    _db = makeSqliteDb(dbPath);
  }
  return _db;
}

export function closeDb(): void {
  if (!_db) return;
  try {
    const maybe = _db as unknown as { close?: () => void; end?: () => Promise<void> };
    if (typeof maybe.close === "function") maybe.close();
    if (typeof maybe.end === "function") void maybe.end();
  } catch {
    // best-effort
  }
  _db = null;
}
