import { describe, expect, it } from "bun:test";
import { InMemorySqliteClient } from "../../../src/persistence/database";
import { runMigrations } from "../../../src/persistence/migrations";
import { SqliteScenarioRepository } from "../../../src/persistence/repositories";
import { seedDatabase } from "../../../src/persistence/seed";

describe("Database Migrations & Idempotent Seeding", () => {
  it("initializes schema and seeds legacy scenarios plus reference-office-day-v2", async () => {
    const db = new InMemorySqliteClient();
    await runMigrations(db);
    await seedDatabase(db);

    const scenarioRepo = new SqliteScenarioRepository(db);
    const scenarios = await scenarioRepo.list();

    // 5 legacy scenarios + 1 v2 reference scenario = 6 scenarios
    expect(scenarios.length).toBeGreaterThanOrEqual(6);

    const legacyKeys = ["normal-day", "high-daylight", "empty-office", "meeting", "after-hours"];
    for (const key of legacyKeys) {
      const found = scenarios.find((s) => s.id === key);
      expect(found).toBeDefined();
    }

    const refV2 = scenarios.find((s) => s.id === "reference-office-day-v2");
    expect(refV2).toBeDefined();
    expect(refV2?.profiles.length).toBeGreaterThan(0);
  });

  it("does not duplicate seeds when seeded repeatedly (idempotency)", async () => {
    const db = new InMemorySqliteClient();
    await runMigrations(db);
    await seedDatabase(db);
    const countFirst = (await new SqliteScenarioRepository(db).list()).length;

    // Run seeder again
    await seedDatabase(db);
    const countSecond = (await new SqliteScenarioRepository(db).list()).length;

    expect(countSecond).toBe(countFirst);
  });
});
