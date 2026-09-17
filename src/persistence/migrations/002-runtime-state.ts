import type { DatabaseClient } from "../database";

export const runtimeStateMigration = {
  version: 2,
  name: "002-runtime-state",
  async up(db: DatabaseClient): Promise<void> {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS mock_runtime_state (
        key TEXT PRIMARY KEY,
        value_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    await db.exec("INSERT OR REPLACE INTO app_meta (key, value) VALUES ('schema_version', '2')");
  },
};
