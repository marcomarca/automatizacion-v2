import type { DatabaseClient } from "../database";

export const initialMockLabMigration = {
  version: 1,
  name: "001-initial-mock-lab",
  up: async (db: DatabaseClient): Promise<void> => {
    // 9.1 app_meta
    await db.exec(`
      CREATE TABLE IF NOT EXISTS app_meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    // 9.2 scenarios
    await db.exec(`
      CREATE TABLE IF NOT EXISTS scenarios (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        schema_version INTEGER NOT NULL,
        parent_id TEXT NULL,
        timezone TEXT NOT NULL DEFAULT 'UTC',
        start_local_time TEXT NOT NULL DEFAULT '00:00',
        duration_seconds INTEGER NOT NULL DEFAULT 86400,
        default_step_seconds INTEGER NOT NULL DEFAULT 60,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    // 9.3 scenario_zones
    await db.exec(`
      CREATE TABLE IF NOT EXISTS scenario_zones (
        id TEXT PRIMARY KEY,
        scenario_id TEXT NOT NULL,
        zone_key TEXT NOT NULL,
        name TEXT NOT NULL,
        zone_type TEXT NOT NULL,
        config_json TEXT NOT NULL DEFAULT '{}'
      );
    `);

    // 9.4 profiles
    await db.exec(`
      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        scenario_id TEXT NOT NULL,
        zone_id TEXT NOT NULL,
        variable TEXT NOT NULL,
        unit TEXT NOT NULL,
        interpolation TEXT NOT NULL
      );
    `);

    // 9.5 profile_points
    await db.exec(`
      CREATE TABLE IF NOT EXISTS profile_points (
        id TEXT PRIMARY KEY,
        profile_id TEXT NOT NULL,
        time_offset_seconds INTEGER NOT NULL,
        value REAL NOT NULL
      );
    `);

    // 9.6 source_references
    await db.exec(`
      CREATE TABLE IF NOT EXISTS source_references (
        id TEXT PRIMARY KEY,
        source_kind TEXT NOT NULL,
        title TEXT NOT NULL,
        publisher TEXT NULL,
        url TEXT NULL,
        retrieved_at TEXT NULL,
        notes TEXT NOT NULL DEFAULT ''
      );
    `);

    // 9.7 device_profiles
    await db.exec(`
      CREATE TABLE IF NOT EXISTS device_profiles (
        id TEXT PRIMARY KEY,
        device_type TEXT NOT NULL,
        manufacturer TEXT NULL,
        model TEXT NULL,
        name TEXT NOT NULL,
        config_json TEXT NOT NULL DEFAULT '{}',
        source_reference_id TEXT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    // 9.8 curves
    await db.exec(`
      CREATE TABLE IF NOT EXISTS curves (
        id TEXT PRIMARY KEY,
        device_profile_id TEXT NULL,
        name TEXT NOT NULL,
        input_variable TEXT NOT NULL,
        input_unit TEXT NOT NULL,
        output_variable TEXT NOT NULL,
        output_unit TEXT NOT NULL,
        interpolation TEXT NOT NULL DEFAULT 'linear',
        extrapolation TEXT NOT NULL DEFAULT 'clamp',
        status TEXT NOT NULL,
        source_reference_id TEXT NULL,
        notes TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    // 9.9 curve_points
    await db.exec(`
      CREATE TABLE IF NOT EXISTS curve_points (
        id TEXT PRIMARY KEY,
        curve_id TEXT NOT NULL,
        x REAL NOT NULL,
        y REAL NOT NULL,
        source_kind TEXT NOT NULL,
        source_reference_id TEXT NULL,
        notes TEXT NOT NULL DEFAULT ''
      );
    `);

    // 9.10 scenario_device_bindings
    await db.exec(`
      CREATE TABLE IF NOT EXISTS scenario_device_bindings (
        id TEXT PRIMARY KEY,
        scenario_id TEXT NOT NULL,
        zone_id TEXT NOT NULL,
        role TEXT NOT NULL,
        device_profile_id TEXT NOT NULL,
        quantity REAL NOT NULL DEFAULT 1,
        config_json TEXT NOT NULL DEFAULT '{}'
      );
    `);

    // 9.11 simulation_runs
    await db.exec(`
      CREATE TABLE IF NOT EXISTS simulation_runs (
        id TEXT PRIMARY KEY,
        scenario_id TEXT NOT NULL,
        scenario_snapshot_json TEXT NOT NULL,
        engine_version TEXT NOT NULL,
        started_at TEXT NOT NULL,
        completed_at TEXT NULL,
        step_seconds INTEGER NOT NULL,
        status TEXT NOT NULL,
        result_summary_json TEXT NULL
      );
    `);

    // 9.12 simulation_samples
    await db.exec(`
      CREATE TABLE IF NOT EXISTS simulation_samples (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL,
        sim_time_seconds INTEGER NOT NULL,
        zone_key TEXT NOT NULL,
        occupied REAL NOT NULL,
        occupancy_count REAL NULL,
        temperature_c REAL NULL,
        daylight_lux REAL NULL,
        requested_brightness_pct REAL NULL,
        dimmer_voltage_v REAL NULL,
        driver_current_ma REAL NULL,
        fixture_power_w REAL NULL,
        artificial_lux REAL NULL,
        total_lux REAL NULL,
        baseline_power_w REAL NULL,
        energy_actual_kwh REAL NULL,
        energy_baseline_kwh REAL NULL
      );
    `);

    // 9.13 run_activities
    await db.exec(`
      CREATE TABLE IF NOT EXISTS run_activities (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL,
        sim_time_seconds INTEGER NOT NULL,
        zone_key TEXT NULL,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        reason TEXT NOT NULL,
        action TEXT NOT NULL,
        impact_json TEXT NULL
      );
    `);

    // Indexes
    await db.exec(
      "CREATE INDEX IF NOT EXISTS idx_samples_run_time ON simulation_samples (run_id, sim_time_seconds);",
    );
    await db.exec(
      "CREATE INDEX IF NOT EXISTS idx_samples_run_zone ON simulation_samples (run_id, zone_key, sim_time_seconds);",
    );

    // Set schema_version
    await db.exec("INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?);", [
      "schema_version",
      "1",
    ]);
  },
};
