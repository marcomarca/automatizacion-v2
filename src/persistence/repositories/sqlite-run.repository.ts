import type {
  RunActivity,
  RunSummary,
  SimulationRun,
  SimulationSample,
} from "../../models/scenario";
import type { DatabaseClient } from "../database";
import type { RunRepository } from "./run.repository";

interface RunRow {
  id: string;
  scenario_id: string;
  scenario_snapshot_json: string;
  engine_version: string;
  started_at: string;
  completed_at: string | null;
  step_seconds: number;
  status: string;
  result_summary_json: string | null;
}

interface SampleRow {
  id: string | number;
  run_id: string;
  sim_time_seconds: number;
  zone_key: string;
  occupied: number;
  occupancy_count: number | null;
  temperature_c: number | null;
  daylight_lux: number | null;
  requested_brightness_pct: number | null;
  dimmer_voltage_v: number | null;
  driver_current_ma: number | null;
  fixture_power_w: number | null;
  artificial_lux: number | null;
  total_lux: number | null;
  baseline_power_w: number | null;
  energy_actual_kwh: number | null;
  energy_baseline_kwh: number | null;
}

interface ActivityRow {
  id: string;
  run_id: string;
  sim_time_seconds: number;
  zone_key: string | null;
  category: string;
  title: string;
  reason: string;
  action: string;
  impact_json: string | null;
}

export class SqliteRunRepository implements RunRepository {
  constructor(private db: DatabaseClient) {}

  public async create(run: SimulationRun): Promise<void> {
    await this.db.exec(
      `INSERT OR REPLACE INTO simulation_runs (
        id, scenario_id, scenario_snapshot_json, engine_version,
        started_at, completed_at, step_seconds, status, result_summary_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        run.id,
        run.scenarioId,
        run.scenarioSnapshotJson,
        run.engineVersion,
        run.startedAt,
        run.completedAt || null,
        run.stepSeconds,
        run.status,
        run.resultSummaryJson || null,
      ],
    );
  }

  public async appendSamples(runId: string, samples: SimulationSample[]): Promise<void> {
    if (samples.length === 0) return;
    await this.db.transaction(async () => {
      for (const s of samples) {
        const sampleId = s.id || `${runId}_${s.zoneKey}_${s.simTimeSeconds}`;
        await this.db.exec(
          `INSERT INTO simulation_samples (
            id, run_id, sim_time_seconds, zone_key, occupied, occupancy_count,
            temperature_c, daylight_lux, requested_brightness_pct, dimmer_voltage_v,
            driver_current_ma, fixture_power_w, artificial_lux, total_lux,
            baseline_power_w, energy_actual_kwh, energy_baseline_kwh
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            sampleId,
            runId,
            s.simTimeSeconds,
            s.zoneKey,
            s.occupied,
            s.occupancyCount ?? null,
            s.temperatureC ?? null,
            s.daylightLux ?? null,
            s.requestedBrightnessPct ?? null,
            s.dimmerVoltageV ?? null,
            s.driverCurrentMa ?? null,
            s.fixturePowerW ?? null,
            s.artificialLux ?? null,
            s.totalLux ?? null,
            s.baselinePowerW ?? null,
            s.energyActualKwh ?? null,
            s.energyBaselineKwh ?? null,
          ],
        );
      }
    });
  }

  public async appendActivities(runId: string, activities: RunActivity[]): Promise<void> {
    if (activities.length === 0) return;
    await this.db.transaction(async () => {
      for (const a of activities) {
        await this.db.exec(
          `INSERT INTO run_activities (
            id, run_id, sim_time_seconds, zone_key, category, title, reason, action, impact_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            a.id,
            runId,
            a.simTimeSeconds,
            a.zoneKey || null,
            a.category,
            a.title,
            a.reason,
            a.action,
            a.impactJson || null,
          ],
        );
      }
    });
  }

  public async complete(runId: string, summary: RunSummary): Promise<void> {
    const now = new Date().toISOString();
    await this.db.exec(
      "UPDATE simulation_runs SET status = ?, completed_at = ?, result_summary_json = ? WHERE id = ?",
      ["completed", now, JSON.stringify(summary), runId],
    );
  }

  public async list(): Promise<SimulationRun[]> {
    const rows = await this.db.query<RunRow>(
      "SELECT * FROM simulation_runs ORDER BY started_at DESC",
    );
    return rows.map((r) => ({
      id: r.id,
      scenarioId: r.scenario_id,
      scenarioSnapshotJson: r.scenario_snapshot_json,
      engineVersion: r.engine_version,
      startedAt: r.started_at,
      completedAt: r.completed_at,
      stepSeconds: r.step_seconds,
      status: r.status as SimulationRun["status"],
      resultSummaryJson: r.result_summary_json,
      summary: r.result_summary_json ? JSON.parse(r.result_summary_json) : null,
    }));
  }

  public async get(runId: string): Promise<SimulationRun | null> {
    const rows = await this.db.query<RunRow>("SELECT * FROM simulation_runs WHERE id = ?", [runId]);
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      scenarioId: r.scenario_id,
      scenarioSnapshotJson: r.scenario_snapshot_json,
      engineVersion: r.engine_version,
      startedAt: r.started_at,
      completedAt: r.completed_at,
      stepSeconds: r.step_seconds,
      status: r.status as SimulationRun["status"],
      resultSummaryJson: r.result_summary_json,
      summary: r.result_summary_json ? JSON.parse(r.result_summary_json) : null,
    };
  }

  public async getSamples(runId: string): Promise<SimulationSample[]> {
    const rows = await this.db.query<SampleRow>(
      "SELECT * FROM simulation_samples WHERE run_id = ? ORDER BY sim_time_seconds ASC",
      [runId],
    );
    return rows.map((r) => ({
      id: r.id,
      runId: r.run_id,
      simTimeSeconds: r.sim_time_seconds,
      zoneKey: r.zone_key,
      occupied: r.occupied,
      occupancyCount: r.occupancy_count,
      temperatureC: r.temperature_c,
      daylightLux: r.daylight_lux,
      requestedBrightnessPct: r.requested_brightness_pct,
      dimmerVoltageV: r.dimmer_voltage_v,
      driverCurrentMa: r.driver_current_ma,
      fixturePowerW: r.fixture_power_w,
      artificialLux: r.artificial_lux,
      totalLux: r.total_lux,
      baselinePowerW: r.baseline_power_w,
      energyActualKwh: r.energy_actual_kwh,
      energyBaselineKwh: r.energy_baseline_kwh,
    }));
  }

  public async getActivities(runId: string): Promise<RunActivity[]> {
    const rows = await this.db.query<ActivityRow>(
      "SELECT * FROM run_activities WHERE run_id = ? ORDER BY sim_time_seconds ASC",
      [runId],
    );
    return rows.map((r) => ({
      id: r.id,
      runId: r.run_id,
      simTimeSeconds: r.sim_time_seconds,
      zoneKey: r.zone_key,
      category: r.category,
      title: r.title,
      reason: r.reason,
      action: r.action,
      impactJson: r.impact_json,
    }));
  }

  public async delete(runId: string): Promise<void> {
    await this.db.transaction(async () => {
      await this.db.exec("DELETE FROM simulation_samples WHERE run_id = ?", [runId]);
      await this.db.exec("DELETE FROM run_activities WHERE run_id = ?", [runId]);
      await this.db.exec("DELETE FROM simulation_runs WHERE id = ?", [runId]);
    });
  }
}
