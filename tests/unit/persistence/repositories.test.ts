import { beforeEach, describe, expect, it } from "bun:test";
import type {
  PhysicalCurve,
  ScenarioDefinition,
  SimulationRun,
} from "../../../src/models/scenario";
import { InMemorySqliteClient } from "../../../src/persistence/database";
import { runMigrations } from "../../../src/persistence/migrations";
import {
  SqliteCurveRepository,
  SqliteDeviceRepository,
  SqliteRunRepository,
  SqliteScenarioRepository,
} from "../../../src/persistence/repositories";

describe("Persistence Layer — SQLite Repositories", () => {
  let db: InMemorySqliteClient;
  let scenarioRepo: SqliteScenarioRepository;
  let curveRepo: SqliteCurveRepository;
  let deviceRepo: SqliteDeviceRepository;
  let runRepo: SqliteRunRepository;

  beforeEach(async () => {
    db = new InMemorySqliteClient();
    await runMigrations(db);
    scenarioRepo = new SqliteScenarioRepository(db);
    curveRepo = new SqliteCurveRepository(db);
    deviceRepo = new SqliteDeviceRepository(db);
    runRepo = new SqliteRunRepository(db);
  });

  it("performs CRUD and cloning on ScenarioRepository preserving lineage", async () => {
    const sc: ScenarioDefinition = {
      schemaVersion: 2,
      id: "test-scenario-1",
      name: "Test Scenario",
      description: "Testing persistence",
      parentId: null,
      time: {
        timezone: "UTC",
        startLocalTime: "08:00",
        durationSeconds: 86400,
        defaultStepSeconds: 60,
      },
      zones: [
        {
          id: "zone-1",
          zoneKey: "zone-1",
          name: "Zone 1",
          type: "office",
          config: { targetLux: 500, targetTemperature: 23.0 },
        },
      ],
      profiles: [
        {
          id: "prof-1",
          zoneId: "zone-1",
          variable: "occupancy",
          unit: "count",
          interpolation: "step",
          points: [
            { timeOffsetSeconds: 0, value: 0 },
            { timeOffsetSeconds: 28800, value: 1 },
          ],
        },
      ],
      events: [],
      deviceBindings: [
        {
          id: "bind-1",
          zoneId: "zone-1",
          role: "lighting",
          deviceProfileId: "dev-panel-1",
          quantity: 2,
        },
      ],
      controllerConfig: {
        daylightHarvestingEnabled: true,
        absenceShutdownMinutes: 10,
        comfortBandMinC: 21,
        comfortBandMaxC: 25,
        preconditioningLeadMinutes: 30,
      },
    };

    await scenarioRepo.save(sc);
    const loaded = await scenarioRepo.get("test-scenario-1");
    expect(loaded).not.toBeNull();
    expect(loaded?.name).toBe("Test Scenario");
    expect(loaded?.zones.length).toBe(1);
    expect(loaded?.profiles.length).toBe(1);
    expect(loaded?.profiles[0].points.length).toBe(2);
    expect(loaded?.deviceBindings.length).toBe(1);

    // Clone
    const cloned = await scenarioRepo.clone("test-scenario-1", "Cloned Hypothesis");
    expect(cloned.name).toBe("Cloned Hypothesis");
    expect(cloned.parentId).toBe("test-scenario-1");
    expect(cloned.id).not.toBe("test-scenario-1");

    // List
    const all = await scenarioRepo.list();
    expect(all.length).toBe(2);

    // Delete
    await scenarioRepo.delete("test-scenario-1");
    const remaining = await scenarioRepo.list();
    expect(remaining.length).toBe(1);
    expect(remaining[0].id).toBe(cloned.id);
  });

  it("performs CRUD on CurveRepository and preserves point metadata", async () => {
    const curve: PhysicalCurve = {
      id: "curve-test-01",
      deviceProfileId: null,
      name: "Test Calibration Curve",
      inputVariable: "voltage",
      inputUnit: "V",
      outputVariable: "current",
      outputUnit: "mA",
      interpolation: "linear",
      extrapolation: "clamp",
      status: "measured",
      notes: "Measured in test rig",
      points: [
        { x: 0, y: 0, sourceKind: "user_measured", notes: "zero" },
        { x: 10, y: 300, sourceKind: "user_measured", notes: "max" },
      ],
    };

    await curveRepo.save(curve);
    const loaded = await curveRepo.get("curve-test-01");
    expect(loaded).not.toBeNull();
    expect(loaded?.status).toBe("measured");
    expect(loaded?.points.length).toBe(2);
    expect(loaded?.points[1].y).toBe(300);
  });

  it("persists and queries simulation runs, batch samples, and summaries", async () => {
    const run: SimulationRun = {
      id: "run-001",
      scenarioId: "test-scenario-1",
      scenarioSnapshotJson: "{}",
      engineVersion: "2.0.0",
      startedAt: new Date().toISOString(),
      stepSeconds: 60,
      status: "running",
    };

    await runRepo.create(run);

    await runRepo.appendSamples("run-001", [
      {
        runId: "run-001",
        simTimeSeconds: 60,
        zoneKey: "zone-1",
        occupied: 1,
        daylightLux: 300,
        dimmerVoltageV: 5.5,
        driverCurrentMa: 165,
        fixturePowerW: 72,
        totalLux: 480,
      },
    ]);

    await runRepo.complete("run-001", {
      actualEnergyKwh: 12.5,
      baselineEnergyKwh: 18.0,
      savedEnergyKwh: 5.5,
      savingsPercent: 30.5,
      averageOccupiedLux: 500,
      minutesBelowLuxTarget: 0,
      peakPowerW: 144,
      occupiedComfortPercent: 100,
      automatedActions: 10,
    });

    const loadedRun = await runRepo.get("run-001");
    expect(loadedRun?.status).toBe("completed");
    expect(loadedRun?.summary?.savedEnergyKwh).toBe(5.5);

    const samples = await runRepo.getSamples("run-001");
    expect(samples.length).toBe(1);
    expect(samples[0].dimmerVoltageV).toBe(5.5);
  });

  it("performs CRUD on DeviceRepository", async () => {
    await deviceRepo.saveProfile({
      id: "test-dev-1",
      deviceType: "led_panel",
      name: "Test Panel 48W",
      config: { nominalPowerW: 48 },
    });
    const loaded = await deviceRepo.getProfile("test-dev-1");
    expect(loaded).not.toBeNull();
    expect(loaded?.name).toBe("Test Panel 48W");

    const all = await deviceRepo.listProfiles();
    expect(all.length).toBe(1);
  });

  it("performs get, set, delete, and list keys on SqliteRuntimeStateRepository", async () => {
    const { SqliteRuntimeStateRepository } = await import(
      "../../../src/persistence/repositories/sqlite-runtime-state.repository"
    );
    const runtimeRepo = new SqliteRuntimeStateRepository(db);

    await runtimeRepo.setState("showroom.active_scene", { sceneId: "scene-presentation" });
    await runtimeRepo.setState("automations.eco_mode", { enabled: true });

    const sceneState = await runtimeRepo.getState<{ sceneId: string }>("showroom.active_scene");
    expect(sceneState).toEqual({ sceneId: "scene-presentation" });

    const keys = await runtimeRepo.getAllKeys();
    expect(keys).toContain("showroom.active_scene");
    expect(keys).toContain("automations.eco_mode");

    await runtimeRepo.deleteState("showroom.active_scene");
    const afterDelete = await runtimeRepo.getState("showroom.active_scene");
    expect(afterDelete).toBeNull();
  });
});
