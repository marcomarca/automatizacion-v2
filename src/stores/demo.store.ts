import { MockAdapter } from "../api/adapters/mock.adapter";
import type { SimulationInput } from "../api/contracts/data-adapter";
import { DemoEngine, type EngineStatus, type TelemetrySnapshot } from "../engine/demo-engine";
import type { DemoScenario } from "../engine/scenario";
import { normalDayScenario } from "../mocks/scenarios";
import type { Building, OptimizationImpact, SmartActivity, Zone } from "../models";
import type { ScenarioDefinition, SimulationSample } from "../models/scenario";

export class DemoStore {
  private static instance: DemoStore;
  public engine: DemoEngine;
  public adapter: MockAdapter;
  private listeners: Set<() => void> = new Set();

  private constructor() {
    this.engine = new DemoEngine(normalDayScenario);
    this.adapter = new MockAdapter(this.engine);

    this.engine.subscribe({
      onStateChanged: () => this.notify(),
      onActivityAdded: () => this.notify(),
    });
  }

  public static getInstance(): DemoStore {
    if (!DemoStore.instance) {
      DemoStore.instance = new DemoStore();
    }
    return DemoStore.instance;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  // Getters
  public getBuilding(): Building {
    return this.engine.getBuilding();
  }

  public getEnergy(): OptimizationImpact {
    return this.engine.getEnergy();
  }

  public getActivities(): SmartActivity[] {
    return this.engine.getActivities();
  }

  public getRecommendation() {
    return this.engine.getRecommendation();
  }

  public getHistory(): TelemetrySnapshot[] {
    return this.engine.getHistory();
  }

  public getStatus(): EngineStatus {
    return this.engine.getStatus();
  }

  public getSpeed(): number {
    return this.engine.getSpeed();
  }

  public getCurrentScenario(): DemoScenario | ScenarioDefinition {
    return this.engine.getCurrentScenario();
  }

  public getClockTime(): string {
    return this.engine.clock.formatTime();
  }

  public getLightingZones(): Zone[] {
    try {
      return this.engine.getBuilding().zones.filter((z) => z.lighting !== undefined);
    } catch {
      return [];
    }
  }

  public getClimateZones(): Zone[] {
    try {
      return this.engine.getBuilding().zones.filter((z) => z.climate !== undefined);
    } catch {
      return [];
    }
  }

  public isSimulatedError(): boolean {
    return this.engine.isSimulatedError();
  }

  // Actions
  public start(): void {
    this.engine.start();
  }

  public pause(): void {
    this.engine.pause();
  }

  public reset(): void {
    this.engine.reset();
  }

  public step(deltaSeconds?: number): void {
    this.engine.tick(deltaSeconds ?? 1);
  }

  public setSpeed(speed: number): void {
    this.engine.setSpeed(speed);
  }

  public selectScenario(scenarioOrId: ScenarioDefinition | DemoScenario | string): void {
    this.engine.loadScenario(scenarioOrId);
  }

  public updateZoneInput(zoneId: string, input: SimulationInput): void {
    this.adapter.updateSimulationInput(zoneId, input);
  }

  public async runFullDayFast(stepSeconds?: number): Promise<SimulationSample[]> {
    return await this.engine.runFullDayFast(stepSeconds);
  }

  public acceptRecommendation(): void {
    const rec = this.engine.getRecommendation();
    if (rec) {
      this.engine.acceptRecommendation(rec.id);
    }
  }

  public dismissRecommendation(): void {
    this.engine.dismissRecommendation();
  }

  public setSimulatedError(error: boolean): void {
    this.engine.setSimulatedError(error);
  }
}

export const demoStore = DemoStore.getInstance();
