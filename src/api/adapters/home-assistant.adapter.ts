import type {
  Building,
  MockAutomation,
  MockCalendarDay,
  MockDevice,
  MockNotification,
  MockPrintJob,
  MockScene,
  OptimizationImpact,
  Product,
  SmartActivity,
  Space,
  Zone,
} from "../../models";
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

  // Domain spaces
  public async getSpaces(): Promise<Space[]> {
    throw new Error("HomeAssistantAdapter not active.");
  }
  public async getSpace(_id: string): Promise<Space | undefined> {
    throw new Error("HomeAssistantAdapter not active.");
  }

  // Domain devices
  public async getDevices(): Promise<MockDevice[]> {
    throw new Error("HomeAssistantAdapter not active.");
  }
  public async getDevice(_id: string): Promise<MockDevice | undefined> {
    throw new Error("HomeAssistantAdapter not active.");
  }
  public async getDevicesBySpace(_spaceId: string): Promise<MockDevice[]> {
    throw new Error("HomeAssistantAdapter not active.");
  }
  public async setDevicePower(_deviceId: string, _powerState: "on" | "off"): Promise<void> {
    throw new Error("HomeAssistantAdapter not active.");
  }
  public async setDeviceBrightness(_deviceId: string, _brightnessPct: number): Promise<void> {
    throw new Error("HomeAssistantAdapter not active.");
  }
  public async toggleDevice(_deviceId: string): Promise<void> {
    throw new Error("HomeAssistantAdapter not active.");
  }
  public async turnAllLightsOn(): Promise<void> {
    throw new Error("HomeAssistantAdapter not active.");
  }
  public async turnAllLightsOff(): Promise<void> {
    throw new Error("HomeAssistantAdapter not active.");
  }
  public async turnSpaceOn(_spaceId: string): Promise<void> {
    throw new Error("HomeAssistantAdapter not active.");
  }
  public async turnSpaceOff(_spaceId: string): Promise<void> {
    throw new Error("HomeAssistantAdapter not active.");
  }

  // Domain scenes
  public async getScenes(): Promise<MockScene[]> {
    throw new Error("HomeAssistantAdapter not active.");
  }
  public async getScenesBySpace(_spaceId: string): Promise<MockScene[]> {
    throw new Error("HomeAssistantAdapter not active.");
  }
  public async runScene(_sceneId: string): Promise<void> {
    throw new Error("HomeAssistantAdapter not active.");
  }

  // Domain products
  public async getProducts(): Promise<Product[]> {
    throw new Error("HomeAssistantAdapter not active.");
  }
  public async getProductsBySpace(_spaceId: string): Promise<Product[]> {
    throw new Error("HomeAssistantAdapter not active.");
  }

  // Domain automations
  public async getAutomations(): Promise<MockAutomation[]> {
    throw new Error("HomeAssistantAdapter not active.");
  }
  public async toggleAutomation(_automationId: string): Promise<void> {
    throw new Error("HomeAssistantAdapter not active.");
  }
  public async runAutomation(_automationId: string): Promise<void> {
    throw new Error("HomeAssistantAdapter not active.");
  }

  // Domain notifications
  public async getNotifications(): Promise<MockNotification[]> {
    throw new Error("HomeAssistantAdapter not active.");
  }
  public async markNotificationRead(_id: string): Promise<void> {
    throw new Error("HomeAssistantAdapter not active.");
  }
  public async clearNotifications(): Promise<void> {
    throw new Error("HomeAssistantAdapter not active.");
  }

  // Domain calendar
  public async getCalendar(): Promise<MockCalendarDay[]> {
    throw new Error("HomeAssistantAdapter not active.");
  }
  public async updateCalendarDay(_day: MockCalendarDay): Promise<void> {
    throw new Error("HomeAssistantAdapter not active.");
  }

  // Domain print jobs
  public async getPrintJobs(): Promise<MockPrintJob[]> {
    throw new Error("HomeAssistantAdapter not active.");
  }
  public async createPrintJob(
    _documentName: string,
    _pages: number,
    _spaceId?: string,
  ): Promise<MockPrintJob> {
    throw new Error("HomeAssistantAdapter not active.");
  }
}
