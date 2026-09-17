import type { DatabaseClient } from "../database";
import type { RuntimeStateRepository } from "./runtime-state.repository";

export class SqliteRuntimeStateRepository implements RuntimeStateRepository {
  constructor(private db: DatabaseClient) {}

  async getState<T>(key: string): Promise<T | null> {
    const rows = await this.db.query<{ value_json: string }>(
      "SELECT value_json FROM mock_runtime_state WHERE key = ?",
      [key],
    );

    if (rows.length === 0) return null;

    try {
      return JSON.parse(rows[0].value_json) as T;
    } catch {
      return null;
    }
  }

  async setState<T>(key: string, value: T): Promise<void> {
    const json = JSON.stringify(value);
    const now = new Date().toISOString();

    await this.db.exec(
      "INSERT OR REPLACE INTO mock_runtime_state (key, value_json, updated_at) VALUES (?, ?, ?)",
      [key, json, now],
    );
  }

  async deleteState(key: string): Promise<void> {
    await this.db.exec("DELETE FROM mock_runtime_state WHERE key = ?", [key]);
  }

  async getAllKeys(): Promise<string[]> {
    const rows = await this.db.query<{ key: string }>("SELECT key FROM mock_runtime_state");
    return rows.map((r) => r.key);
  }
}
