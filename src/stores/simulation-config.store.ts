import type {
  DeviceProfile,
  PhysicalCurve,
  RunActivity,
  RunSummary,
  ScenarioDefinition,
  SimulationRun,
  SimulationSample,
  SourceReference,
} from "../models/scenario";
import { type DatabaseClient, getDatabase } from "../persistence/database";
import { runMigrations } from "../persistence/migrations";
import {
  type CurveRepository,
  type DeviceRepository,
  type RunRepository,
  type ScenarioRepository,
  SqliteCurveRepository,
  SqliteDeviceRepository,
  SqliteRunRepository,
  SqliteScenarioRepository,
} from "../persistence/repositories";
import { seedDatabase } from "../persistence/seed";

export type ConfigStoreListener = () => void;

export class SimulationConfigStore {
  private scenarioRepo!: ScenarioRepository;
  private curveRepo!: CurveRepository;
  private deviceRepo!: DeviceRepository;
  private runRepo!: RunRepository;

  private scenarios: ScenarioDefinition[] = [];
  private selectedScenario: ScenarioDefinition | null = null;
  private curves: PhysicalCurve[] = [];
  private devices: DeviceProfile[] = [];
  private sources: SourceReference[] = [];
  private runs: SimulationRun[] = [];
  private comparisonRunIds: Set<string> = new Set();

  private isInitialized = false;
  private isLoading = false;
  private error: string | null = null;
  private listeners: Set<ConfigStoreListener> = new Set();

  public subscribe(listener: ConfigStoreListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;
    this.isLoading = true;
    this.notify();

    try {
      const db = await getDatabase();
      await runMigrations(db);
      await seedDatabase(db);

      this.scenarioRepo = new SqliteScenarioRepository(db);
      this.curveRepo = new SqliteCurveRepository(db);
      this.deviceRepo = new SqliteDeviceRepository(db);
      this.runRepo = new SqliteRunRepository(db);

      await this.refreshAll();
      this.isInitialized = true;
      this.error = null;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.error = `Failed to initialize Mock Lab persistence: ${msg}`;
      console.error(this.error, err);
    } finally {
      this.isLoading = false;
      this.notify();
    }
  }

  public async refreshAll(): Promise<void> {
    this.scenarios = await this.scenarioRepo.list();
    this.curves = await this.curveRepo.list();
    this.devices = await this.deviceRepo.listProfiles();
    this.sources = await this.deviceRepo.listSources();
    this.runs = await this.runRepo.list();

    if (!this.selectedScenario && this.scenarios.length > 0) {
      const pref =
        this.scenarios.find((s) => s.id === "reference-office-day-v2") || this.scenarios[0];
      this.selectedScenario = pref;
    } else if (this.selectedScenario) {
      const updated = this.scenarios.find((s) => s.id === this.selectedScenario?.id);
      if (updated) this.selectedScenario = updated;
    }
  }

  public getScenarios(): ScenarioDefinition[] {
    return [...this.scenarios];
  }

  public getSelectedScenario(): ScenarioDefinition | null {
    return this.selectedScenario;
  }

  public async selectScenario(id: string): Promise<ScenarioDefinition | null> {
    const found = this.scenarios.find((s) => s.id === id);
    if (found) {
      this.selectedScenario = found;
      this.notify();
      return found;
    }
    return null;
  }

  public async saveScenario(scenario: ScenarioDefinition): Promise<void> {
    await this.scenarioRepo.save(scenario);
    await this.refreshAll();
    this.selectedScenario = scenario;
    this.notify();
  }

  public async cloneScenario(id: string, newName: string): Promise<ScenarioDefinition> {
    const cloned = await this.scenarioRepo.clone(id, newName);
    await this.refreshAll();
    this.selectedScenario = cloned;
    this.notify();
    return cloned;
  }

  public async deleteScenario(id: string): Promise<void> {
    await this.scenarioRepo.delete(id);
    await this.refreshAll();
    if (this.selectedScenario?.id === id) {
      this.selectedScenario = this.scenarios[0] || null;
    }
    this.notify();
  }

  public getCurves(): PhysicalCurve[] {
    return [...this.curves];
  }

  public async saveCurve(curve: PhysicalCurve): Promise<void> {
    await this.curveRepo.save(curve);
    await this.refreshAll();
    this.notify();
  }

  public async deleteCurve(id: string): Promise<void> {
    await this.curveRepo.delete(id);
    await this.refreshAll();
    this.notify();
  }

  public getDevices(): DeviceProfile[] {
    return [...this.devices];
  }

  public getSources(): SourceReference[] {
    return [...this.sources];
  }

  public getRuns(): SimulationRun[] {
    return [...this.runs];
  }

  public async recordCompletedRun(
    scenario: ScenarioDefinition,
    samples: SimulationSample[],
    activities: RunActivity[],
    summary: RunSummary,
  ): Promise<SimulationRun> {
    const runId = `run_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();

    const run: SimulationRun = {
      id: runId,
      scenarioId: scenario.id,
      scenarioSnapshotJson: JSON.stringify(scenario),
      engineVersion: "2.0.0-witmind-lab",
      startedAt: now,
      completedAt: now,
      stepSeconds: scenario.time?.defaultStepSeconds || 60,
      status: "completed",
      resultSummaryJson: JSON.stringify(summary),
      summary,
    };

    await this.runRepo.create(run);
    await this.runRepo.appendSamples(runId, samples);
    await this.runRepo.appendActivities(runId, activities);
    await this.refreshAll();
    this.notify();
    return run;
  }

  public async getRunSamples(runId: string): Promise<SimulationSample[]> {
    return await this.runRepo.getSamples(runId);
  }

  public async getRunActivities(runId: string): Promise<RunActivity[]> {
    return await this.runRepo.getActivities(runId);
  }

  public async deleteRun(runId: string): Promise<void> {
    await this.runRepo.delete(runId);
    this.comparisonRunIds.delete(runId);
    await this.refreshAll();
    this.notify();
  }

  public toggleRunComparison(runId: string): void {
    if (this.comparisonRunIds.has(runId)) {
      this.comparisonRunIds.delete(runId);
    } else {
      if (this.comparisonRunIds.size >= 3) {
        const first = this.comparisonRunIds.values().next().value;
        if (first) this.comparisonRunIds.delete(first);
      }
      this.comparisonRunIds.add(runId);
    }
    this.notify();
  }

  public getComparisonRunIds(): string[] {
    return Array.from(this.comparisonRunIds);
  }

  public getComparisonRuns(): SimulationRun[] {
    return this.runs.filter((r) => this.comparisonRunIds.has(r.id));
  }

  public async resetDatabase(): Promise<void> {
    this.isLoading = true;
    this.notify();
    try {
      const db: DatabaseClient = await getDatabase();
      if ("reset" in db && typeof (db as { reset: () => void }).reset === "function") {
        (db as { reset: () => void }).reset();
      }
      await runMigrations(db);
      await seedDatabase(db, true);
      this.comparisonRunIds.clear();
      this.selectedScenario = null;
      await this.refreshAll();
    } finally {
      this.isLoading = false;
      this.notify();
    }
  }

  public getIsLoading(): boolean {
    return this.isLoading;
  }

  public getError(): string | null {
    return this.error;
  }
}

export const simulationConfigStore = new SimulationConfigStore();
