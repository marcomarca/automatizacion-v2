import type {
  ScenarioDefinition,
  ScenarioDeviceBinding,
  ScenarioProfileDefinition,
  ScenarioZoneDefinition,
} from "../../models/scenario";
import type { ZoneType } from "../../models/zone";
import type { DatabaseClient } from "../database";
import type { ScenarioRepository } from "./scenario.repository";

interface ScenarioRow {
  id: string;
  name: string;
  description: string;
  schema_version: number;
  parent_id: string | null;
  timezone: string;
  start_local_time: string;
  duration_seconds: number;
  default_step_seconds: number;
  created_at: string;
  updated_at: string;
}

interface ZoneRow {
  id: string;
  scenario_id: string;
  zone_key: string;
  name: string;
  zone_type: string;
  config_json: string;
}

interface ProfileRow {
  id: string;
  scenario_id: string;
  zone_id: string;
  variable: string;
  unit: string;
  interpolation: string;
}

interface ProfilePointRow {
  id: string;
  profile_id: string;
  time_offset_seconds: number;
  value: number;
}

interface DeviceBindingRow {
  id: string;
  scenario_id: string;
  zone_id: string;
  role: string;
  device_profile_id: string;
  quantity: number;
  config_json: string;
}

export class SqliteScenarioRepository implements ScenarioRepository {
  constructor(private db: DatabaseClient) {}

  public async list(): Promise<ScenarioDefinition[]> {
    const rows = await this.db.query<ScenarioRow>("SELECT * FROM scenarios ORDER BY name ASC");
    const scenarios: ScenarioDefinition[] = [];
    for (const row of rows) {
      const scenario = await this.get(row.id);
      if (scenario) scenarios.push(scenario);
    }
    return scenarios;
  }

  public async get(id: string): Promise<ScenarioDefinition | null> {
    const sRows = await this.db.query<ScenarioRow>("SELECT * FROM scenarios WHERE id = ?", [id]);
    if (sRows.length === 0) return null;
    const s = sRows[0];

    // 1. Fetch zones
    const zRows = await this.db.query<ZoneRow>(
      "SELECT * FROM scenario_zones WHERE scenario_id = ?",
      [id],
    );
    const zones: ScenarioZoneDefinition[] = zRows.map((z) => ({
      id: z.id,
      zoneKey: z.zone_key,
      name: z.name,
      type: z.zone_type as ZoneType,
      config: JSON.parse(z.config_json || "{}"),
    }));

    // 2. Fetch profiles
    const pRows = await this.db.query<ProfileRow>("SELECT * FROM profiles WHERE scenario_id = ?", [
      id,
    ]);
    const profiles: ScenarioProfileDefinition[] = [];
    for (const p of pRows) {
      const ptRows = await this.db.query<ProfilePointRow>(
        "SELECT * FROM profile_points WHERE profile_id = ? ORDER BY time_offset_seconds ASC",
        [p.id],
      );
      profiles.push({
        id: p.id,
        zoneId: p.zone_id,
        variable: p.variable,
        unit: p.unit,
        interpolation: p.interpolation as "step" | "linear",
        points: ptRows.map((pt) => ({
          timeOffsetSeconds: pt.time_offset_seconds,
          value: pt.value,
        })),
      });
    }

    // 3. Fetch device bindings
    const bRows = await this.db.query<DeviceBindingRow>(
      "SELECT * FROM scenario_device_bindings WHERE scenario_id = ?",
      [id],
    );
    const deviceBindings: ScenarioDeviceBinding[] = bRows.map((b) => ({
      id: b.id,
      zoneId: b.zone_id,
      role: b.role,
      deviceProfileId: b.device_profile_id,
      quantity: b.quantity,
      config: JSON.parse(b.config_json || "{}"),
    }));

    return {
      schemaVersion: 2,
      id: s.id,
      name: s.name,
      description: s.description,
      parentId: s.parent_id,
      time: {
        timezone: s.timezone,
        startLocalTime: s.start_local_time,
        durationSeconds: s.duration_seconds,
        defaultStepSeconds: s.default_step_seconds,
      },
      zones,
      profiles,
      events: [],
      deviceBindings,
      controllerConfig: {
        daylightHarvestingEnabled: true,
        absenceShutdownMinutes: 10,
        comfortBandMinC: 21,
        comfortBandMaxC: 25,
        preconditioningLeadMinutes: 30,
      },
    };
  }

  public async save(scenario: ScenarioDefinition): Promise<void> {
    const now = new Date().toISOString();
    await this.db.transaction(async () => {
      // 1. Upsert scenario
      await this.db.exec(
        `INSERT OR REPLACE INTO scenarios (
          id, name, description, schema_version, parent_id,
          timezone, start_local_time, duration_seconds, default_step_seconds,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          scenario.id,
          scenario.name,
          scenario.description || "",
          scenario.schemaVersion || 2,
          scenario.parentId || null,
          scenario.time.timezone,
          scenario.time.startLocalTime,
          scenario.time.durationSeconds,
          scenario.time.defaultStepSeconds,
          now,
          now,
        ],
      );

      // 2. Upsert zones
      await this.db.exec("DELETE FROM scenario_zones WHERE scenario_id = ?", [scenario.id]);
      for (const z of scenario.zones) {
        await this.db.exec(
          `INSERT INTO scenario_zones (
            id, scenario_id, zone_key, name, zone_type, config_json
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [z.id, scenario.id, z.zoneKey, z.name, z.type, JSON.stringify(z.config || {})],
        );
      }

      // 3. Upsert profiles
      await this.db.exec("DELETE FROM profiles WHERE scenario_id = ?", [scenario.id]);
      for (const p of scenario.profiles) {
        await this.db.exec(
          `INSERT INTO profiles (
            id, scenario_id, zone_id, variable, unit, interpolation
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [p.id, scenario.id, p.zoneId, p.variable, p.unit, p.interpolation],
        );

        for (const pt of p.points) {
          const ptId = `${p.id}_${pt.timeOffsetSeconds}`;
          await this.db.exec(
            `INSERT INTO profile_points (
              id, profile_id, time_offset_seconds, value
            ) VALUES (?, ?, ?, ?)`,
            [ptId, p.id, pt.timeOffsetSeconds, pt.value],
          );
        }
      }

      // 4. Upsert device bindings
      await this.db.exec("DELETE FROM scenario_device_bindings WHERE scenario_id = ?", [
        scenario.id,
      ]);
      for (const b of scenario.deviceBindings) {
        await this.db.exec(
          `INSERT INTO scenario_device_bindings (
            id, scenario_id, zone_id, role, device_profile_id, quantity, config_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            b.id,
            scenario.id,
            b.zoneId,
            b.role,
            b.deviceProfileId,
            b.quantity,
            JSON.stringify(b.config || {}),
          ],
        );
      }
    });
  }

  public async clone(id: string, newName: string): Promise<ScenarioDefinition> {
    const original = await this.get(id);
    if (!original) {
      throw new Error(`Scenario not found: ${id}`);
    }

    const clonedId = `${id}-clone-${Date.now().toString(36)}`;
    const cloned: ScenarioDefinition = {
      ...original,
      id: clonedId,
      name: newName,
      parentId: original.id,
      zones: original.zones.map((z) => ({
        ...z,
        id: `${z.id}-c-${Math.random().toString(36).slice(2, 6)}`,
      })),
      profiles: original.profiles.map((p) => ({
        ...p,
        id: `${p.id}-c-${Math.random().toString(36).slice(2, 6)}`,
        points: p.points.map((pt) => ({ ...pt })),
      })),
      deviceBindings: original.deviceBindings.map((b) => ({
        ...b,
        id: `${b.id}-c-${Math.random().toString(36).slice(2, 6)}`,
      })),
    };

    await this.save(cloned);
    return cloned;
  }

  public async delete(id: string): Promise<void> {
    await this.db.transaction(async () => {
      await this.db.exec("DELETE FROM scenario_zones WHERE scenario_id = ?", [id]);
      await this.db.exec("DELETE FROM profiles WHERE scenario_id = ?", [id]);
      await this.db.exec("DELETE FROM scenario_device_bindings WHERE scenario_id = ?", [id]);
      await this.db.exec("DELETE FROM scenarios WHERE id = ?", [id]);
    });
  }
}
