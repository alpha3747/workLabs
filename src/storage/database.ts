/**
 * SQLite connection + schema migrations (op-sqlite).
 *
 * The schema version is tracked with SQLite's built-in `PRAGMA user_version`.
 * To change the schema, append a new entry to MIGRATIONS — never edit an
 * existing one, because devices that already ran it won't run it again.
 */
import {open, type DB} from '@op-engineering/op-sqlite';

export const DATABASE_NAME = 'worklabs.sqlite';

const MIGRATIONS: string[][] = [
  // v1 — initial schema
  [
    `CREATE TABLE IF NOT EXISTS tasks (
      id           TEXT PRIMARY KEY NOT NULL,
      title        TEXT NOT NULL,
      notes        TEXT NOT NULL DEFAULT '',
      priority     TEXT NOT NULL DEFAULT 'none'
                   CHECK (priority IN ('none', 'low', 'medium', 'high')),
      completed    INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
      created_at   TEXT NOT NULL,
      updated_at   TEXT NOT NULL,
      completed_at TEXT,
      due_date     TEXT
    )`,
    'CREATE INDEX IF NOT EXISTS idx_tasks_completed_due ON tasks (completed, due_date)',
    `CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    )`,
  ],
];

export const SCHEMA_VERSION = MIGRATIONS.length;

async function migrate(db: DB): Promise<void> {
  const {rows} = await db.execute('PRAGMA user_version');
  const current = Number(rows[0]?.user_version ?? 0);

  for (let version = current; version < MIGRATIONS.length; version++) {
    await db.transaction(async tx => {
      for (const statement of MIGRATIONS[version]) {
        await tx.execute(statement);
      }
      await tx.execute(`PRAGMA user_version = ${version + 1}`);
    });
  }
}

let databasePromise: Promise<DB> | null = null;

/**
 * Returns the shared, migrated database connection. Safe to call from
 * anywhere (including the headless notification handler); it opens once.
 */
export function getDatabase(): Promise<DB> {
  if (!databasePromise) {
    databasePromise = (async () => {
      const db = open({name: DATABASE_NAME});
      await db.execute('PRAGMA journal_mode = WAL');
      await migrate(db);
      return db;
    })().catch(error => {
      databasePromise = null;
      throw error;
    });
  }
  return databasePromise;
}
