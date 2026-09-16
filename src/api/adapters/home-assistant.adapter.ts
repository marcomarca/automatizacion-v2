import type { Building, OptimizationImpact, SmartActivity, Zone } from "../../models";
import type { SimulationInput, WitmindDataAdapter } from "../contracts/data-adapter";

/**
 * HomeAssistantAdapter (Future Integration Stub)
 *
 * This adapter serves as the extension seam for connecting to a real Home Assistant
 * instance via WebSocket/REST API without modifying the UI or domain services.
 */
export class HomeAssistantAdapter implements WitmindDataAdapter {
  private wsUrl: string;

  constructor(wsUrl = "ws://homeassistant.local:8123/api/websocket") {
    this.wsUrl = wsUrl;
  }

  public async getBuilding(): Promise<Building> {
    throw new Error(
      `HomeAssistantAdapter not active. Connecting to ${this.wsUrl} is slated for v0.2+`,
    );
  }

  public async getEnergyOverview(): Promise<OptimizationImpact> {
    throw new Error("HomeAssistantAdapter not active.");
  }

  public async getActivities(): Promise<SmartActivity[]> {
    throw new Error("HomeAssistantAdapter not active.");
  }

  public async getLightingZones(): Promise<Zone[]> {
    throw new Error("HomeAssistantAdapter not active.");
  }

  public async getClimateZones(): Promise<Zone[]> {
    throw new Error("HomeAssistantAdapter not active.");
  }

  public async applyScenario(_id: string): Promise<void> {
    throw new Error("HomeAssistantAdapter not active.");
  }

  public async updateSimulationInput(_zoneId: string, _input: SimulationInput): Promise<void> {
    throw new Error("HomeAssistantAdapter not active.");
  }
}
