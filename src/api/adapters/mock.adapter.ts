import type { DemoEngine } from "../../engine/demo-engine";
import type { Building, OptimizationImpact, SmartActivity, Zone } from "../../models";
import type { SimulationInput, WitmindDataAdapter } from "../contracts/data-adapter";

export class MockAdapter implements WitmindDataAdapter {
  private engine: DemoEngine;

  constructor(engine: DemoEngine) {
    this.engine = engine;
  }

  public async getBuilding(): Promise<Building> {
    return this.engine.getBuilding();
  }

  public async getEnergyOverview(): Promise<OptimizationImpact> {
    return this.engine.getEnergy();
  }

  public async getActivities(): Promise<SmartActivity[]> {
    return this.engine.getActivities();
  }

  public async getLightingZones(): Promise<Zone[]> {
    const building = this.engine.getBuilding();
    return building.zones.filter((z) => z.lighting !== undefined);
  }

  public async getClimateZones(): Promise<Zone[]> {
    const building = this.engine.getBuilding();
    return building.zones.filter((z) => z.climate !== undefined);
  }

  public async applyScenario(id: string): Promise<void> {
    this.engine.loadScenario(id);
  }

  public async updateSimulationInput(zoneId: string, input: SimulationInput): Promise<void> {
    this.engine.updateZoneInput(zoneId, input);
  }
}
