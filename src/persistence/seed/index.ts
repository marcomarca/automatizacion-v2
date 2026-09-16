import type { DatabaseClient } from "../database";
import {
  SqliteCurveRepository,
  SqliteDeviceRepository,
  SqliteScenarioRepository,
} from "../repositories";
import { referenceCurvesSeed, referenceDeviceProfiles } from "./dimming-reference.seed";
import { legacyScenariosSeed } from "./legacy-scenarios.seed";
import { physicalSourcesSeed } from "./physical-sources.seed";
import { referenceOfficeDayV2Seed } from "./reference-office-day-v2.seed";

export async function seedDatabase(db: DatabaseClient, force = false): Promise<void> {
  // Check seed version
  const metaRows = await db.query<{ key: string; value: string }>(
    "SELECT key, value FROM app_meta WHERE key = ?",
    ["seed_version"],
  );

  const currentSeedVersion = metaRows.length > 0 ? Number.parseInt(metaRows[0].value, 10) : 0;
  if (!force && currentSeedVersion >= 2) {
    return; // Already seeded
  }

  const deviceRepo = new SqliteDeviceRepository(db);
  const curveRepo = new SqliteCurveRepository(db);
  const scenarioRepo = new SqliteScenarioRepository(db);

  // 1. Seed physical sources
  for (const src of physicalSourcesSeed) {
    await deviceRepo.saveSource(src);
  }

  // 2. Seed device profiles
  for (const dev of referenceDeviceProfiles) {
    await deviceRepo.saveProfile(dev);
  }

  // 3. Seed curves
  for (const curve of referenceCurvesSeed) {
    await curveRepo.save(curve);
  }

  // 4. Seed legacy scenarios
  for (const scenario of legacyScenariosSeed) {
    await scenarioRepo.save(scenario);
  }

  // 5. Seed reference office v2 scenario
  await scenarioRepo.save(referenceOfficeDayV2Seed);

  // Update seed_version in app_meta
  await db.exec("INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?);", [
    "seed_version",
    "2",
  ]);
}
