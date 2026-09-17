import type { DemoEngine, TelemetrySnapshot } from "../../engine/demo-engine";
import type {
  Building,
  DevicePowerState,
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
    const building = await this.getBuilding();
    return building.zones.filter((z) => z.lighting !== undefined);
  }

  public async getClimateZones(): Promise<Zone[]> {
    const building = await this.getBuilding();
    return building.zones.filter((z) => z.climate !== undefined);
  }

  public async getTelemetryHistory(): Promise<TelemetrySnapshot[]> {
    return this.engine.getHistory();
  }

  public async applyScenario(id: string): Promise<void> {
    this.engine.loadScenario(id);
  }

  public async updateSimulationInput(zoneId: string, input: SimulationInput): Promise<void> {
    this.engine.updateZoneInput(zoneId, input);
  }

  public setSimulatedError(error: boolean): void {
    this.engine.setSimulatedError(error);
  }

  public isSimulatedError(): boolean {
    return this.engine.isSimulatedError();
  }

  // Spaces
  public async getSpaces(): Promise<Space[]> {
    return this.engine.getSpaces();
  }

  public async getSpace(id: string): Promise<Space | undefined> {
    return this.engine.getSpace(id);
  }

  // Devices
  public async getDevices(): Promise<MockDevice[]> {
    return this.engine.getDevices();
  }

  public async getDevice(id: string): Promise<MockDevice | undefined> {
    return this.engine.getDevice(id);
  }

  public async getDevicesBySpace(spaceId: string): Promise<MockDevice[]> {
    return this.engine.getDevicesBySpace(spaceId);
  }

  public async setDevicePower(deviceId: string, state: DevicePowerState): Promise<void> {
    this.engine.setDevicePower(deviceId, state);
  }

  public async toggleDevice(deviceId: string): Promise<void> {
    this.engine.toggleDevice(deviceId);
  }

  public async setDeviceBrightness(deviceId: string, brightnessPct: number): Promise<void> {
    this.engine.setDeviceBrightness(deviceId, brightnessPct);
  }

  public async turnAllLightsOn(): Promise<void> {
    this.engine.turnAllLightsOn();
  }

  public async turnAllLightsOff(): Promise<void> {
    this.engine.turnAllLightsOff();
  }

  public async turnSpaceOn(spaceId: string): Promise<void> {
    this.engine.turnSpaceOn(spaceId);
  }

  public async turnSpaceOff(spaceId: string): Promise<void> {
    this.engine.turnSpaceOff(spaceId);
  }

  // Scenes
  public async getScenes(): Promise<MockScene[]> {
    return this.engine.getScenes();
  }

  public async getScenesBySpace(spaceId: string): Promise<MockScene[]> {
    return this.engine.getScenesBySpace(spaceId);
  }

  public async runScene(sceneId: string): Promise<void> {
    this.engine.runScene(sceneId);
  }

  // Products
  public async getProducts(): Promise<Product[]> {
    return this.engine.getProducts();
  }

  public async getProductsBySpace(spaceId: string): Promise<Product[]> {
    return this.engine.getProductsBySpace(spaceId);
  }

  // Automations
  public async getAutomations(): Promise<MockAutomation[]> {
    return this.engine.getAutomations();
  }

  public async toggleAutomation(automationId: string): Promise<void> {
    this.engine.toggleAutomation(automationId);
  }

  public async runAutomation(automationId: string): Promise<void> {
    this.engine.runAutomation(automationId);
  }

  // Notifications
  public async getNotifications(): Promise<MockNotification[]> {
    return this.engine.getNotifications();
  }

  public async markNotificationRead(notificationId: string): Promise<void> {
    this.engine.markNotificationRead(notificationId);
  }

  public async clearNotifications(): Promise<void> {
    this.engine.clearNotifications();
  }

  // Calendar
  public async getCalendar(): Promise<MockCalendarDay[]> {
    return this.engine.getCalendar();
  }

  public async updateCalendarDay(day: MockCalendarDay): Promise<void> {
    this.engine.updateCalendarDay(day);
  }

  // Print Jobs
  public async getPrintJobs(): Promise<MockPrintJob[]> {
    return this.engine.getPrintJobs();
  }

  public async createPrintJob(
    documentName: string,
    pages: number,
    spaceId?: string,
  ): Promise<MockPrintJob> {
    return this.engine.createPrintJob(documentName, pages, spaceId);
  }
}
