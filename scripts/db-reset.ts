/**
 * Reset the local SQLite database: delete the file, then re-run migrations + seed.
 *
 * Useful during development when you want to nuke the DB and start fresh.
 * NEVER run in production.
 *
 * Usage:
 *   tsx scripts/db-reset.ts
 *   npm run db:reset
 */
import * as fs from "node:fs";
import * as path from "node:path";

function resolveDbPath(): string {
  const raw = process.env.DATABASE_URL ?? "./data/bloomingdale.db";
  const cleaned = raw.replace(/^sqlite:\/\//, "").replace(/^file:/, "");
  return path.isAbsolute(cleaned) ? cleaned : path.resolve(process.cwd(), cleaned);
}

function main(): void {
  const dbPath = resolveDbPath();
  const dir = path.dirname(dbPath);

  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log(`[reset] deleted ${dbPath}`);
  } else {
    console.log(`[reset] no DB at ${dbPath}, nothing to delete`);
  }

  // Also nuke WAL/SHM sidecars if they exist (better-sqlite3 leaves them behind)
  for (const suffix of ["-wal", "-shm", "-journal"]) {
    const side = dbPath + suffix;
    if (fs.existsSync(side)) {
      fs.unlinkSync(side);
      console.log(`[reset] deleted ${side}`);
    }
  }

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Delegate to the existing migrate + seed scripts so we keep a single source of truth.
  // Using tsx spawn avoids duplicating the logic in this file.
  const { spawnSync } = require("node:child_process") as typeof import("node:child_process");

  console.log("[reset] running migrations...");
  const migrate = spawnSync("npx", ["tsx", "scripts/db-migrate.ts"], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (migrate.status !== 0) {
    console.error("[reset] migrate failed");
    process.exit(migrate.status ?? 1);
  }

  console.log("[reset] running seed...");
  const seed = spawnSync("npx", ["tsx", "scripts/db-seed.ts"], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (seed.status !== 0) {
    console.error("[reset] seed failed");
    process.exit(seed.status ?? 1);
  }

  console.log("[reset] done. fresh DB at " + dbPath);
}

main();
