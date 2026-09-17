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

export interface SimulationInput {
  occupied?: boolean;
  daylightLux?: number;
  currentTemperature?: number;
  targetTemperature?: number;
  brightnessOverride?: number;
  mode?: "auto" | "manual";
  climateMode?: "auto" | "manual" | "off";
  absenceMinutes?: number;
}

export interface WitmindDataAdapter {
  // Building & Zones
  getBuilding(): Promise<Building>;
  getEnergyOverview(): Promise<OptimizationImpact>;
  getActivities(): Promise<SmartActivity[]>;
  getLightingZones(): Promise<Zone[]>;
  getClimateZones(): Promise<Zone[]>;
  applyScenario(id: string): Promise<void>;
  updateSimulationInput(zoneId: string, input: SimulationInput): Promise<void>;

  // Spaces
  getSpaces(): Promise<Space[]>;
  getSpace(id: string): Promise<Space | undefined>;

  // Devices
  getDevices(): Promise<MockDevice[]>;
  getDevice(id: string): Promise<MockDevice | undefined>;
  getDevicesBySpace(spaceId: string): Promise<MockDevice[]>;
  setDevicePower(deviceId: string, state: DevicePowerState): Promise<void>;
  toggleDevice(deviceId: string): Promise<void>;
  setDeviceBrightness(deviceId: string, brightnessPct: number): Promise<void>;
  turnAllLightsOn(): Promise<void>;
  turnAllLightsOff(): Promise<void>;
  turnSpaceOn(spaceId: string): Promise<void>;
  turnSpaceOff(spaceId: string): Promise<void>;

  // Scenes
  getScenes(): Promise<MockScene[]>;
  getScenesBySpace(spaceId: string): Promise<MockScene[]>;
  runScene(sceneId: string): Promise<void>;

  // Products
  getProducts(): Promise<Product[]>;
  getProductsBySpace(spaceId: string): Promise<Product[]>;

  // Automations
  getAutomations(): Promise<MockAutomation[]>;
  toggleAutomation(automationId: string): Promise<void>;
  runAutomation(automationId: string): Promise<void>;

  // Notifications
  getNotifications(): Promise<MockNotification[]>;
  markNotificationRead(notificationId: string): Promise<void>;
  clearNotifications(): Promise<void>;

  // Calendar
  getCalendar(): Promise<MockCalendarDay[]>;
  updateCalendarDay(day: MockCalendarDay): Promise<void>;

  // Print Jobs
  getPrintJobs(): Promise<MockPrintJob[]>;
  createPrintJob(documentName: string, pages: number, spaceId?: string): Promise<MockPrintJob>;
}
