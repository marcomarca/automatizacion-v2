import type { DatabaseClient } from "../database";
import { initialMockLabMigration } from "./001-initial-mock-lab";

export async function runMigrations(db: DatabaseClient): Promise<void> {
  // Check if app_meta table exists and what version is present
  await db.exec(`
    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  const rows = await db.query<{ key: string; value: string }>(
    "SELECT key, value FROM app_meta WHERE key = ?",
    ["schema_version"],
  );

  const currentVersion = rows.length > 0 ? Number.parseInt(rows[0].value, 10) : 0;

  if (currentVersion < 1) {
    await initialMockLabMigration.up(db);
  }
}
