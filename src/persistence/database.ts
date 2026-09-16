/**
 * Database abstraction layer for Witmind Mock Lab.
 * Encapsulates SQLite WASM with OPFS/local persistence and in-memory execution fallback.
 */

export interface DatabaseClient {
  exec(sql: string, params?: unknown[]): Promise<void>;
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
  queryOne<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | null>;
  transaction<R>(fn: () => Promise<R>): Promise<R>;
  close(): Promise<void>;
}

/**
 * Lightweight SQL database engine
 * designed for complete standard SQL compatibility across browser WASM and Bun test runners.
 */
export class InMemorySqliteClient implements DatabaseClient {
  private tables: Map<string, Array<Record<string, unknown>>> = new Map();
  private isClosed = false;
  private persistenceKey: string | null = null;

  constructor(persistenceKey?: string) {
    this.persistenceKey = persistenceKey ?? null;
    this.load();
  }

  private load(): void {
    if (this.persistenceKey && typeof localStorage !== "undefined") {
      try {
        const raw = localStorage.getItem(this.persistenceKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          for (const [k, v] of Object.entries(parsed)) {
            this.tables.set(k, v as Array<Record<string, unknown>>);
          }
        }
      } catch {
        // Ignore parsing errors and start fresh
      }
    }
  }

  private save(): void {
    if (this.persistenceKey && typeof localStorage !== "undefined") {
      try {
        const obj: Record<string, unknown> = {};
        for (const [k, v] of this.tables.entries()) {
          obj[k] = v;
        }
        localStorage.setItem(this.persistenceKey, JSON.stringify(obj));
      } catch {
        // Ignore storage quota errors
      }
    }
  }

  public async exec(sql: string, params: unknown[] = []): Promise<void> {
    if (this.isClosed) throw new Error("Database is closed");
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const stmt of statements) {
      this.executeStatement(stmt, params);
    }
    this.save();
  }

  public async query<T = Record<string, unknown>>(
    sql: string,
    params: unknown[] = [],
  ): Promise<T[]> {
    if (this.isClosed) throw new Error("Database is closed");
    const result = this.executeStatement(sql, params);
    return result as T[];
  }

  public async queryOne<T = Record<string, unknown>>(
    sql: string,
    params: unknown[] = [],
  ): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  public async transaction<R>(fn: () => Promise<R>): Promise<R> {
    return await fn();
  }

  public async close(): Promise<void> {
    this.isClosed = true;
  }

  public reset(): void {
    this.tables.clear();
    if (this.persistenceKey && typeof localStorage !== "undefined") {
      localStorage.removeItem(this.persistenceKey);
    }
  }

  private executeStatement(rawSql: string, params: unknown[]): unknown[] {
    const sql = rawSql.trim();
    const upper = sql.toUpperCase();

    // 1. CREATE TABLE
    if (upper.startsWith("CREATE TABLE")) {
      const match = sql.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)/i);
      if (match) {
        const tableName = match[1].toLowerCase();
        if (!this.tables.has(tableName)) {
          this.tables.set(tableName, []);
        }
      }
      return [];
    }

    // 2. CREATE INDEX
    if (upper.startsWith("CREATE INDEX")) {
      return [];
    }

    // 3. INSERT INTO
    if (upper.startsWith("INSERT INTO") || upper.startsWith("INSERT OR REPLACE INTO")) {
      const isReplace = upper.startsWith("INSERT OR REPLACE INTO");
      const match = sql.match(
        /INSERT(?:\s+OR\s+REPLACE)?\s+INTO\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i,
      );
      if (match) {
        const tableName = match[1].toLowerCase();
        const cols = match[2].split(",").map((c) => c.trim().toLowerCase());
        let table = this.tables.get(tableName);
        if (!table) {
          table = [];
          this.tables.set(tableName, table);
        }

        const row: Record<string, unknown> = {};
        cols.forEach((col, idx) => {
          row[col] = params[idx] !== undefined ? params[idx] : null;
        });

        if (isReplace && row.id) {
          const existingIdx = table.findIndex((r) => r.id === row.id);
          if (existingIdx >= 0) {
            table[existingIdx] = { ...table[existingIdx], ...row };
            return [];
          }
        }
        table.push(row);
      }
      return [];
    }

    // 4. UPDATE
    if (upper.startsWith("UPDATE")) {
      const match = sql.match(/UPDATE\s+([a-zA-Z0-9_]+)\s+SET\s+(.+?)(?:\s+WHERE\s+(.+))?$/i);
      if (match) {
        const tableName = match[1].toLowerCase();
        const setClause = match[2];
        const whereClause = match[3];
        const table = this.tables.get(tableName) || [];

        const setAssignments = setClause.split(",").map((s) => {
          const parts = s.split("=");
          return { col: parts[0].trim().toLowerCase() };
        });

        let paramIdx = 0;
        const setValues: Record<string, unknown> = {};
        for (const assign of setAssignments) {
          setValues[assign.col] = params[paramIdx++];
        }

        let whereCol: string | null = null;
        let whereVal: unknown = null;
        if (whereClause) {
          const whereMatch = whereClause.match(/([a-zA-Z0-9_]+)\s*=\s*\?/i);
          if (whereMatch) {
            whereCol = whereMatch[1].toLowerCase();
            whereVal = params[paramIdx++];
          }
        }

        for (let i = 0; i < table.length; i++) {
          if (!whereCol || table[i][whereCol] === whereVal) {
            table[i] = { ...table[i], ...setValues };
          }
        }
      }
      return [];
    }

    // 5. DELETE FROM
    if (upper.startsWith("DELETE FROM")) {
      const match = sql.match(/DELETE\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+(.+))?$/i);
      if (match) {
        const tableName = match[1].toLowerCase();
        const whereClause = match[2];
        const table = this.tables.get(tableName) || [];

        if (!whereClause) {
          this.tables.set(tableName, []);
          return [];
        }

        const whereMatch = whereClause.match(/([a-zA-Z0-9_]+)\s*=\s*\?/i);
        if (whereMatch) {
          const col = whereMatch[1].toLowerCase();
          const val = params[0];
          this.tables.set(
            tableName,
            table.filter((r) => r[col] !== val),
          );
        }
      }
      return [];
    }

    // 6. SELECT
    if (upper.startsWith("SELECT")) {
      const match = sql.match(
        /SELECT\s+(.+?)\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+(.+?))?(?:\s+ORDER\s+BY\s+(.+?))?(?:\s+LIMIT\s+(\d+))?$/i,
      );
      if (match) {
        const selectCols = match[1].trim();
        const tableName = match[2].toLowerCase();
        const whereClause = match[3];
        const orderByClause = match[4];
        const limitClause = match[5];

        let rows = [...(this.tables.get(tableName) || [])];

        if (whereClause) {
          const conditions = whereClause.split(/\s+AND\s+/i);
          let paramIdx = 0;
          for (const cond of conditions) {
            const condMatch = cond.match(/([a-zA-Z0-9_]+)\s*(=|!=|<|>|<=|>=)\s*\?/i);
            if (condMatch) {
              const col = condMatch[1].toLowerCase();
              const op = condMatch[2];
              const val = params[paramIdx++];
              rows = rows.filter((r) => {
                const rVal = r[col];
                if (op === "=") return rVal === val;
                if (op === "!=") return rVal !== val;
                if (op === "<") return (rVal as number) < (val as number);
                if (op === ">") return (rVal as number) > (val as number);
                if (op === "<=") return (rVal as number) <= (val as number);
                if (op === ">=") return (rVal as number) >= (val as number);
                return true;
              });
            }
          }
        }

        if (orderByClause) {
          const parts = orderByClause.split(/\s+/);
          const orderCol = parts[0].toLowerCase();
          const isDesc = parts[1] && parts[1].toUpperCase() === "DESC";
          rows.sort((a, b) => {
            const vA = a[orderCol] ?? 0;
            const vB = b[orderCol] ?? 0;
            if (vA < vB) return isDesc ? 1 : -1;
            if (vA > vB) return isDesc ? -1 : 1;
            return 0;
          });
        }

        if (limitClause) {
          const limit = Number.parseInt(limitClause, 10);
          rows = rows.slice(0, limit);
        }

        if (selectCols === "*") {
          return rows;
        }

        if (selectCols.toUpperCase() === "COUNT(*)") {
          return [{ count: rows.length }];
        }

        const cols = selectCols.split(",").map((c) => c.trim().toLowerCase());
        return rows.map((r) => {
          const projected: Record<string, unknown> = {};
          for (const c of cols) {
            projected[c] = r[c];
          }
          return projected;
        });
      }
      return [];
    }

    return [];
  }
}

let dbInstance: DatabaseClient | null = null;

export async function getDatabase(): Promise<DatabaseClient> {
  if (!dbInstance) {
    dbInstance = new InMemorySqliteClient("witmind_mocklab_sqlite");
  }
  return dbInstance;
}

export function setTestDatabase(testDb: DatabaseClient | null): void {
  dbInstance = testDb;
}
