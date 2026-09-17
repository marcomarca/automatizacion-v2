import type { SimulationInput } from "../api/contracts/data-adapter";
import { allMockAutomations } from "../mocks/automations";
import { mockSpaces } from "../mocks/building/spaces";
import { defaultMockCalendar } from "../mocks/calendar/default-calendar";
import { allMockDevices } from "../mocks/devices";
import { allMockNotifications } from "../mocks/notifications";
import { allMockProducts } from "../mocks/products";
import { allScenarios, normalDayScenario } from "../mocks/scenarios";
import { allMockScenes } from "../mocks/scenes";
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
} from "../models";
import type {
  PhysicalCurve,
  ScenarioDefinition,
  ScenarioZoneDefinition,
  SimulationSample,
} from "../models/scenario";
import { createSmartActivity } from "../services/activity.service";
import { AutomationService } from "../services/automation.service";
import { calculateClimateState, stepTemperatureTowardsTarget } from "../services/climate.service";
import { DeviceService } from "../services/device.service";
import { calculateBuildingDevicePower, calculateSavingsPercent } from "../services/energy.service";
import { calculateLightingState } from "../services/lighting.service";
import { PrintService } from "../services/print.service";
import { SceneService } from "../services/scene.service";
import { ProfileSampler } from "../simulation/profile-sampler";
import { DemoClock } from "./clock";
import type { DemoScenario } from "./scenario";

export type EngineStatus = "idle" | "running" | "paused";

export interface TelemetrySnapshot {
  time: string;
  baselineKwh: number;
  actualKwh: number;
  daylightLux: number;
  brightness: number;
  temperature: number;
  dimmerVoltageV?: number;
  driverCurrentMa?: number;
  fixturePowerW?: number;
  totalLux?: number;
}

export interface DemoEngineListener {
  onStateChanged?: () => void;
  onActivityAdded?: (activity: SmartActivity) => void;
}

export class DemoEngine {
  public clock: DemoClock;
  private currentScenario: DemoScenario | ScenarioDefinition;
  private status: EngineStatus = "idle";
  private speed = 1; // 1x, 10x, 60x, 360x
  private stepSeconds = 60; // Default live simulation step: 60s
  private elapsedSeconds = 0;
  private intervalTimer: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<DemoEngineListener> = new Set();
  private simulatedError = false;

  // Active physical curves map for curve-based plant evaluations
  private activeCurves: Map<string, PhysicalCurve> = new Map();

  // Internal domain entities
  private spacesMap: Map<string, Space> = new Map();
  private devicesMap: Map<string, MockDevice> = new Map();
  private scenesMap: Map<string, MockScene> = new Map();
  private productsMap: Map<string, Product> = new Map();
  private automationsMap: Map<string, MockAutomation> = new Map();
  private notificationsList: MockNotification[] = [];
  private calendarMap: Map<string, MockCalendarDay> = new Map();
  private printJobsList: MockPrintJob[] = [];

  // Internal state
  private buildingState: Building;
  private energyState: OptimizationImpact;
  private activities: SmartActivity[] = [];
  private history: TelemetrySnapshot[] = [];
  private recordedSamples: SimulationSample[] = [];
  private isRecording = false;
  private currentRunId: string | null = null;

  private recommendation: {
    id: string;
    title: string;
    description: string;
    actionLabel: string;
    skipLabel: string;
    zoneId: string;
    targetTemp: number;
  } | null = null;

  constructor(initialScenario: DemoScenario | ScenarioDefinition = normalDayScenario) {
    this.currentScenario = initialScenario;
    const initialTime =
      "initialClockTime" in initialScenario
        ? initialScenario.initialClockTime
        : initialScenario.time?.startLocalTime
          ? `2026-09-16T${initialScenario.time.startLocalTime.padStart(5, "0")}:00Z`
          : "2026-09-16T08:00:00Z";

    this.clock = new DemoClock(initialTime);
    this.initDomainEntities();
    this.buildingState = this.buildInitialBuilding(initialScenario);
    this.energyState = this.buildInitialEnergy(initialScenario);
    this.activities = this.buildInitialActivities();
    this.checkInitialRecommendation(initialScenario);
    this.initHistory();
  }

  private initDomainEntities(): void {
    this.spacesMap.clear();
    for (const s of mockSpaces) {
      this.spacesMap.set(s.id, { ...s });
    }

    this.devicesMap.clear();
    for (const d of allMockDevices) {
      this.devicesMap.set(d.id, { ...d });
    }

    this.scenesMap.clear();
    for (const sc of allMockScenes) {
      this.scenesMap.set(sc.id, { ...sc });
    }

    this.productsMap.clear();
    for (const p of allMockProducts) {
      this.productsMap.set(p.id, { ...p });
    }

    this.automationsMap.clear();
    for (const a of allMockAutomations) {
      this.automationsMap.set(a.id, { ...a });
    }

    this.notificationsList = allMockNotifications.map((n) => ({ ...n }));

    this.calendarMap.clear();
    for (const c of defaultMockCalendar) {
      this.calendarMap.set(c.date, { ...c });
    }

    this.printJobsList = [];
  }

  public setCurves(curves: PhysicalCurve[]): void {
    this.activeCurves.clear();
    for (const c of curves) {
      this.activeCurves.set(c.id, c);
    }
  }

  public subscribe(listener: DemoEngineListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener.onStateChanged?.();
    }
  }

  private notifyActivity(act: SmartActivity): void {
    for (const listener of this.listeners) {
      listener.onActivityAdded?.(act);
      listener.onStateChanged?.();
    }
  }

  public getStatus(): EngineStatus {
    return this.status;
  }

  public getSpeed(): number {
    return this.speed;
  }

  public setSpeed(speed: number): void {
    this.speed = speed;
    if (this.status === "running") {
      this.pause();
      this.start();
    }
  }

  public getStepSeconds(): number {
    return this.stepSeconds;
  }

  public setStepSeconds(step: number): void {
    this.stepSeconds = Math.max(1, step);
  }

  public getCurrentScenario(): DemoScenario | ScenarioDefinition {
    return this.currentScenario;
  }

  public getBuilding(): Building {
    if (this.simulatedError) {
      throw new Error("Simulated Connection Failure (Demo Error Mode)");
    }
    return this.buildingState;
  }

  public getEnergy(): OptimizationImpact {
    if (this.simulatedError) {
      throw new Error("Simulated Energy Service Unavailable (Demo Error Mode)");
    }
    return this.energyState;
  }

  public getActivities(): SmartActivity[] {
    return [...this.activities];
  }

  public getRecommendation() {
    return this.recommendation;
  }

  public getHistory(): TelemetrySnapshot[] {
    return [...this.history];
  }

  public setSimulatedError(error: boolean): void {
    this.simulatedError = error;
    this.notify();
  }

  public isSimulatedError(): boolean {
    return this.simulatedError;
  }

  public startRecording(runId: string): void {
    this.isRecording = true;
    this.currentRunId = runId;
    this.recordedSamples = [];
  }

  public stopRecording(): SimulationSample[] {
    this.isRecording = false;
    const samples = [...this.recordedSamples];
    this.currentRunId = null;
    return samples;
  }

  // ==========================================
  // SPACES DOMAIN METHODS
  // ==========================================

  public getSpaces(): Space[] {
    return Array.from(this.spacesMap.values());
  }

  public getSpace(id: string): Space | undefined {
    return this.spacesMap.get(id);
  }

  // ==========================================
  // DEVICES DOMAIN METHODS
  // ==========================================

  public getDevices(): MockDevice[] {
    return Array.from(this.devicesMap.values());
  }

  public getDevice(id: string): MockDevice | undefined {
    return this.devicesMap.get(id);
  }

  public getDevicesBySpace(spaceId: string): MockDevice[] {
    return Array.from(this.devicesMap.values()).filter((d) => d.spaceId === spaceId);
  }

  public setDevicePower(deviceId: string, state: DevicePowerState): void {
    const device = this.devicesMap.get(deviceId);
    if (!device) return;

    const changes = DeviceService.setPowerState(device, state, device.brightnessPct);
    const updated: MockDevice = { ...device, ...changes };
    this.devicesMap.set(deviceId, updated);

    // Sync zone state if mapped
    this.syncDeviceToZone(updated);

    // Record activity
    const actionLabel = state === "on" ? "Encendido manual" : "Apagado manual";
    const act = createSmartActivity({
      timestamp: this.clock.formatTime(),
      category: "lighting",
      title: `${device.name}: ${state === "on" ? "ON" : "OFF"}`,
      reason: `Acción del usuario en espacio ${device.spaceId}.`,
      action: actionLabel,
      source: "manual",
      spaceId: device.spaceId,
      deviceId: device.id,
      impact: state === "off" ? { wattsSaved: device.nominalPowerW } : undefined,
    });
    this.activities.unshift(act);
    this.notifyActivity(act);

    // Recalculate energy
    this.recalculateBuildingEnergy(1);
    this.notify();
  }

  public toggleDevice(deviceId: string): void {
    const device = this.devicesMap.get(deviceId);
    if (!device) return;
    const nextState: DevicePowerState = device.powerState === "on" ? "off" : "on";
    this.setDevicePower(deviceId, nextState);
  }

  public setDeviceBrightness(deviceId: string, brightnessPct: number): void {
    const device = this.devicesMap.get(deviceId);
    if (!device) return;

    const changes = DeviceService.setBrightness(device, brightnessPct);
    const updated: MockDevice = { ...device, ...changes };
    this.devicesMap.set(deviceId, updated);

    this.syncDeviceToZone(updated);

    const act = createSmartActivity({
      timestamp: this.clock.formatTime(),
      category: "lighting",
      title: `${device.name}: ${brightnessPct}%`,
      reason: `Regulación de intensidad en espacio ${device.spaceId}.`,
      action: `Ajuste de brillo a ${brightnessPct}%.`,
      source: "manual",
      spaceId: device.spaceId,
      deviceId: device.id,
    });
    this.activities.unshift(act);
    this.notifyActivity(act);

    this.recalculateBuildingEnergy(1);
    this.notify();
  }

  public turnAllLightsOn(): void {
    for (const [id, dev] of this.devicesMap.entries()) {
      if (dev.kind === "light" || dev.kind === "switch" || dev.kind === "relay") {
        const changes = DeviceService.setPowerState(dev, "on", 100);
        this.devicesMap.set(id, { ...dev, ...changes });
      }
    }

    const act = createSmartActivity({
      timestamp: this.clock.formatTime(),
      category: "lighting",
      title: "Encendido General de Edificio",
      reason: "Comando global ejecutado.",
      action: "Todas las luces encendidas.",
      source: "manual",
    });
    this.activities.unshift(act);
    this.notifyActivity(act);

    this.recalculateBuildingEnergy(1);
    this.notify();
  }

  public turnAllLightsOff(): void {
    for (const [id, dev] of this.devicesMap.entries()) {
      if (dev.kind === "light" || dev.kind === "switch" || dev.kind === "relay") {
        const changes = DeviceService.setPowerState(dev, "off", 0);
        this.devicesMap.set(id, { ...dev, ...changes });
      }
    }

    const act = createSmartActivity({
      timestamp: this.clock.formatTime(),
      category: "lighting",
      title: "Apagado General de Edificio",
      reason: "Comando global ejecutado.",
      action: "Todas las luces apagadas.",
      source: "manual",
    });
    this.activities.unshift(act);
    this.notifyActivity(act);

    this.recalculateBuildingEnergy(1);
    this.notify();
  }

  public turnSpaceOn(spaceId: string): void {
    const space = this.spacesMap.get(spaceId);
    if (!space) return;

    for (const [id, dev] of this.devicesMap.entries()) {
      if (dev.spaceId === spaceId) {
        const changes = DeviceService.setPowerState(dev, "on", 100);
        this.devicesMap.set(id, { ...dev, ...changes });
      }
    }

    const act = createSmartActivity({
      timestamp: this.clock.formatTime(),
      category: "lighting",
      title: `Encendido de Espacio: ${space.name}`,
      reason: `Comando de espacio para ${space.name}.`,
      action: "Dispositivos del espacio encendidos.",
      source: "manual",
      spaceId,
    });
    this.activities.unshift(act);
    this.notifyActivity(act);

    this.recalculateBuildingEnergy(1);
    this.notify();
  }

  public turnSpaceOff(spaceId: string): void {
    const space = this.spacesMap.get(spaceId);
    if (!space) return;

    for (const [id, dev] of this.devicesMap.entries()) {
      if (dev.spaceId === spaceId) {
        const changes = DeviceService.setPowerState(dev, "off", 0);
        this.devicesMap.set(id, { ...dev, ...changes });
      }
    }

    const act = createSmartActivity({
      timestamp: this.clock.formatTime(),
      category: "lighting",
      title: `Apagado de Espacio: ${space.name}`,
      reason: `Comando de espacio para ${space.name}.`,
      action: "Dispositivos del espacio apagados.",
      source: "manual",
      spaceId,
    });
    this.activities.unshift(act);
    this.notifyActivity(act);

    this.recalculateBuildingEnergy(1);
    this.notify();
  }

  // ==========================================
  // SCENES DOMAIN METHODS
  // ==========================================

  public getScenes(): MockScene[] {
    return Array.from(this.scenesMap.values());
  }

  public getScenesBySpace(spaceId: string): MockScene[] {
    return Array.from(this.scenesMap.values()).filter((s) => s.spaceId === spaceId);
  }

  public runScene(sceneId: string): void {
    const scene = this.scenesMap.get(sceneId);
    if (!scene) return;

    const result = SceneService.applyScene(scene, this.devicesMap);
    for (const dev of result.updatedDevices) {
      this.devicesMap.set(dev.id, dev);
      this.syncDeviceToZone(dev);
    }

    const space = this.spacesMap.get(scene.spaceId);
    const spaceName = space ? space.name : scene.spaceId;

    const act = createSmartActivity({
      timestamp: this.clock.formatTime(),
      category: "scene",
      title: `Escena "${scene.name}" aplicada`,
      reason: `Espacio ${spaceName}: ${result.turnedOnCount} encendidos, ${result.turnedOffCount} apagados.`,
      action: "Transacción de escena ejecutada.",
      source: "scene",
      spaceId: scene.spaceId,
    });
    this.activities.unshift(act);
    this.notifyActivity(act);

    this.recalculateBuildingEnergy(1);
    this.notify();
  }

  // ==========================================
  // PRODUCTS DOMAIN METHODS
  // ==========================================

  public getProducts(): Product[] {
    return Array.from(this.productsMap.values());
  }

  public getProductsBySpace(spaceId: string): Product[] {
    return Array.from(this.productsMap.values()).filter((p) => p.spaceId === spaceId);
  }

  // ==========================================
  // AUTOMATIONS DOMAIN METHODS
  // ==========================================

  public getAutomations(): MockAutomation[] {
    return Array.from(this.automationsMap.values());
  }

  public toggleAutomation(automationId: string): void {
    const auto = this.automationsMap.get(automationId);
    if (!auto) return;

    const updated = AutomationService.toggleEnabled(auto);
    this.automationsMap.set(automationId, updated);

    const act = createSmartActivity({
      timestamp: this.clock.formatTime(),
      category: "automation",
      title: `Automatización "${auto.name}": ${updated.enabled ? "Habilitada" : "Deshabilitada"}`,
      reason: "Cambio de configuración por el usuario.",
      action: updated.enabled ? "enable" : "disable",
      source: "user",
    });
    this.activities.unshift(act);
    this.notifyActivity(act);
    this.notify();
  }

  public runAutomation(automationId: string): void {
    const auto = this.automationsMap.get(automationId);
    if (!auto) return;

    const execResult = AutomationService.execute(auto, this.clock.formatTime());
    auto.lastTriggeredAt = `Hoy a las ${this.clock.formatTime()}`;

    // Apply actions
    for (const action of auto.actions) {
      if (action.target === "device" && action.deviceId) {
        if (action.powerState) this.setDevicePower(action.deviceId, action.powerState);
        if (action.brightnessPct !== undefined)
          this.setDeviceBrightness(action.deviceId, action.brightnessPct);
      } else if (action.target === "scene" && action.sceneId) {
        this.runScene(action.sceneId);
      } else if (action.target === "notification" && action.message) {
        this.notificationsList.unshift({
          id: `notif-${Date.now().toString(36)}`,
          timestamp: this.clock.formatTime(),
          level: "info",
          title: auto.name,
          message: action.message,
          read: false,
          category: "automation",
        });
      }
    }

    const act = createSmartActivity({
      timestamp: this.clock.formatTime(),
      category: "automation",
      title: `Automatización manual: ${auto.name}`,
      reason: execResult.message || "Ejecución manual solicitada.",
      action: "automation_run",
      source: "user",
    });
    this.activities.unshift(act);
    this.notifyActivity(act);
    this.notify();
  }

  // ==========================================
  // NOTIFICATIONS DOMAIN METHODS
  // ==========================================

  public getNotifications(): MockNotification[] {
    return [...this.notificationsList];
  }

  public markNotificationRead(notificationId: string): void {
    const item = this.notificationsList.find((n) => n.id === notificationId);
    if (item) {
      item.read = true;
      this.notify();
    }
  }

  public clearNotifications(): void {
    this.notificationsList = [];
    this.notify();
  }

  // ==========================================
  // CALENDAR DOMAIN METHODS
  // ==========================================

  public getCalendar(): MockCalendarDay[] {
    return Array.from(this.calendarMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  public updateCalendarDay(day: MockCalendarDay): void {
    this.calendarMap.set(day.date, { ...day });

    const act = createSmartActivity({
      timestamp: this.clock.formatTime(),
      category: "system",
      title: `Calendario actualizado: ${day.date}`,
      reason: `Día marcado como ${day.workingDay ? "Laboral" : "No Laboral"} (${day.description || ""}).`,
      action: "calendar_update",
      source: "user",
    });
    this.activities.unshift(act);
    this.notifyActivity(act);
    this.notify();
  }

  // ==========================================
  // PRINT JOBS DOMAIN METHODS
  // ==========================================

  public getPrintJobs(): MockPrintJob[] {
    return [...this.printJobsList];
  }

  public createPrintJob(documentName: string, pages: number, spaceId = "showroom"): MockPrintJob {
    const job = PrintService.createJob(documentName, pages, "HP LaserJet Showroom", spaceId);
    this.printJobsList.unshift(job);

    const act = createSmartActivity({
      timestamp: this.clock.formatTime(),
      category: "system",
      title: `Impresión en cola: ${documentName}`,
      reason: `${pages} páginas enviadas a ${job.printerName}.`,
      action: "print_queued",
      source: "user",
      spaceId,
    });
    this.activities.unshift(act);
    this.notifyActivity(act);
    this.notify();
    return job;
  }

  private syncDeviceToZone(device: MockDevice): void {
    if (!device.zoneId) return;
    const zoneIndex = this.buildingState.zones.findIndex((z) => z.id === device.zoneId);
    if (zoneIndex === -1) return;

    const currentZone = this.buildingState.zones[zoneIndex];
    if (currentZone.lighting) {
      currentZone.lighting = {
        ...currentZone.lighting,
        mode: "manual",
        brightness: device.powerState === "on" ? (device.brightnessPct ?? 100) : 0,
        actualPowerW: device.actualPowerW ?? 0,
      };
    }
  }

  public loadScenario(scenarioOrId: ScenarioDefinition | DemoScenario | string): void {
    this.pause();
    if (typeof scenarioOrId === "string") {
      const found = allScenarios[scenarioOrId];
      if (!found) {
        console.warn(`Scenario ${scenarioOrId} not found in fallback dictionary`);
        return;
      }
      this.currentScenario = found;
    } else {
      this.currentScenario = scenarioOrId;
    }
    this.reset();
  }

  public reset(): void {
    this.pause();
    this.elapsedSeconds = 0;
    const initialTime =
      "initialClockTime" in this.currentScenario
        ? this.currentScenario.initialClockTime
        : this.currentScenario.time?.startLocalTime
          ? `2026-09-16T${this.currentScenario.time.startLocalTime.padStart(5, "0")}:00Z`
          : "2026-09-16T08:00:00Z";

    this.clock.set(initialTime);
    this.initDomainEntities();
    this.buildingState = this.buildInitialBuilding(this.currentScenario);
    this.energyState = this.buildInitialEnergy(this.currentScenario);
    this.activities = this.buildInitialActivities();
    this.checkInitialRecommendation(this.currentScenario);
    this.initHistory();
    this.recordedSamples = [];
    this.notify();
  }

  public start(): void {
    if (this.status === "running") return;
    this.status = "running";
    const intervalMs = Math.max(50, Math.round(1000 / this.speed));
    this.intervalTimer = setInterval(() => {
      this.tick(this.stepSeconds);
    }, intervalMs);
    this.notify();
  }

  public pause(): void {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    this.status = "paused";
    this.notify();
  }

  /**
   * Deterministic per-step execution order
   */
  public tick(deltaSeconds = 1): void {
    // 1. Advance simulation clock
    this.elapsedSeconds += deltaSeconds;
    this.clock.advanceSeconds(deltaSeconds);

    // Process print jobs
    if (this.printJobsList.some((j) => j.status === "queued" || j.status === "printing")) {
      this.printJobsList = PrintService.processQueue(this.printJobsList);
    }

    const timeOfDaySeconds =
      (this.clock.now().getUTCHours() * 3600 +
        this.clock.now().getUTCMinutes() * 60 +
        this.clock.now().getUTCSeconds()) %
      86400;

    // 2. Sample environmental profiles if defined on scenario
    if ("profiles" in this.currentScenario && Array.isArray(this.currentScenario.profiles)) {
      const profiles = this.currentScenario.profiles;
      for (const zone of this.buildingState.zones) {
        const occProfile = ProfileSampler.findProfile(profiles, zone.id, "occupancy");
        const tempProfile = ProfileSampler.findProfile(profiles, zone.id, "temperature_c");
        const daylightProfile = ProfileSampler.findProfile(profiles, zone.id, "daylight_lux");

        const sampleOccupancy = occProfile
          ? ProfileSampler.sample(occProfile, timeOfDaySeconds, zone.occupancy.occupied ? 1 : 0)
          : undefined;

        const sampleTemp =
          tempProfile && zone.climate
            ? ProfileSampler.sample(tempProfile, timeOfDaySeconds, zone.climate.currentTemperature)
            : undefined;

        const sampleDaylight =
          daylightProfile && zone.lighting
            ? ProfileSampler.sample(daylightProfile, timeOfDaySeconds, zone.lighting.daylightLux)
            : undefined;

        const changes: Partial<SimulationInput> = {};
        if (sampleOccupancy !== undefined) {
          changes.occupied = sampleOccupancy > 0;
        }
        if (sampleTemp !== undefined) {
          changes.currentTemperature = Number(sampleTemp.toFixed(1));
        }
        if (sampleDaylight !== undefined) {
          changes.daylightLux = Math.round(sampleDaylight);
        }

        if (Object.keys(changes).length > 0) {
          this.updateZoneInput(zone.id, changes);
        }
      }
    }

    // 3. Apply scheduled discrete events
    const timeline =
      "timeline" in this.currentScenario
        ? this.currentScenario.timeline
        : this.currentScenario.events || [];

    const currentEvents = timeline.filter((e) => {
      const at = "atSecond" in e ? e.atSecond : 0;
      return at > this.elapsedSeconds - deltaSeconds && at <= this.elapsedSeconds;
    });

    for (const event of currentEvents) {
      if (event.zoneId) {
        this.updateZoneInput(event.zoneId, event.changes as SimulationInput);
      }

      if (event.activityEvent) {
        const newAct = createSmartActivity({
          timestamp: this.clock.formatTime(),
          category: event.activityEvent.category,
          title: event.activityEvent.title,
          reason: event.activityEvent.reason,
          action: event.activityEvent.action,
          impact: event.activityEvent.wattsSaved
            ? { wattsSaved: event.activityEvent.wattsSaved }
            : undefined,
          source: "automation",
        });
        this.activities.unshift(newAct);
        this.notifyActivity(newAct);
      }
    }

    // 4. Recalculate energy and integrate over deltaSeconds
    this.recalculateBuildingEnergy(deltaSeconds);

    // 5. Record telemetry snapshots
    this.recordHistorySnapshot();

    // 6. Record persistent sample if recording
    if (this.isRecording && this.currentRunId) {
      for (const z of this.buildingState.zones) {
        this.recordedSamples.push({
          runId: this.currentRunId,
          simTimeSeconds: this.elapsedSeconds,
          zoneKey: z.id,
          occupied: z.occupancy.occupied ? 1 : 0,
          occupancyCount: z.occupancy.occupied ? 1 : 0,
          temperatureC: z.climate?.currentTemperature ?? 23.0,
          daylightLux: z.lighting?.daylightLux ?? 0,
          requestedBrightnessPct: z.lighting
            ? (z.lighting.requestedBrightnessPct ?? z.lighting.brightness)
            : 0,
          dimmerVoltageV: z.lighting
            ? (z.lighting.dimmerVoltageV ?? z.lighting.brightness / 10)
            : 0,
          driverCurrentMa: z.lighting
            ? (z.lighting.driverCurrentMa ?? 300 * (z.lighting.brightness / 100))
            : 0,
          fixturePowerW: z.lighting ? (z.lighting.fixturePowerW ?? z.lighting.actualPowerW) : 0,
          artificialLux: z.lighting?.artificialLux ?? 0,
          totalLux: z.lighting?.currentLux ?? 0,
          baselinePowerW: z.lighting?.baselinePowerW ?? 144,
          energyActualKwh: this.energyState.energyActualKwh,
          energyBaselineKwh: this.energyState.energyBaselineKwh,
        });
      }
    }

    // 7. Notify UI
    this.notify();
  }

  /**
   * Runs a complete 24-hour simulation fast
   */
  public async runFullDayFast(stepSeconds = 60): Promise<SimulationSample[]> {
    this.pause();
    this.reset();
    const runId = `fast_run_${Date.now().toString(36)}`;
    this.startRecording(runId);

    const totalDuration = 86400;
    const totalSteps = Math.ceil(totalDuration / stepSeconds);

    for (let i = 0; i < totalSteps; i++) {
      this.tick(stepSeconds);
    }

    const samples = this.stopRecording();
    this.notify();
    return samples;
  }

  public updateZoneInput(zoneId: string, input: SimulationInput): void {
    const zoneIndex = this.buildingState.zones.findIndex((z) => z.id === zoneId);
    if (zoneIndex === -1) return;

    const currentZone = this.buildingState.zones[zoneIndex];
    const newOccupied =
      input.occupied !== undefined ? input.occupied : currentZone.occupancy.occupied;
    const newAbsence =
      input.absenceMinutes !== undefined
        ? input.absenceMinutes
        : currentZone.occupancy.absenceMinutes;

    let zoneConfig: ScenarioZoneDefinition["config"] | undefined;
    if ("zones" in this.currentScenario && Array.isArray(this.currentScenario.zones)) {
      const zDef = (this.currentScenario.zones as ScenarioZoneDefinition[]).find(
        (z) => z.id === zoneId || z.zoneKey === zoneId,
      );
      zoneConfig = zDef?.config;
    }

    const dimmerCurve = zoneConfig?.dimmerCurveId
      ? this.activeCurves.get(zoneConfig.dimmerCurveId)
      : null;
    const powerCurve = zoneConfig?.powerCurveId
      ? this.activeCurves.get(zoneConfig.powerCurveId)
      : null;
    const luxCurve = zoneConfig?.luxCurveId ? this.activeCurves.get(zoneConfig.luxCurveId) : null;

    let newLighting = currentZone.lighting;
    if (newLighting) {
      const daylightLux =
        input.daylightLux !== undefined ? input.daylightLux : newLighting.daylightLux;
      const mode = input.mode !== undefined ? input.mode : newLighting.mode;
      const manualBrightness =
        input.brightnessOverride !== undefined
          ? input.brightnessOverride
          : mode === "manual"
            ? newLighting.brightness
            : undefined;

      const manualOverrideUntil =
        mode === "manual"
          ? new Date(this.clock.now().getTime() + 30 * 60 * 1000).toISOString().substring(11, 16)
          : null;

      newLighting = calculateLightingState({
        occupied: newOccupied,
        absenceMinutes: newAbsence,
        daylightLux,
        targetLux: newLighting.targetLux,
        nominalPowerW: newLighting.nominalPowerW,
        mode,
        manualBrightness,
        manualOverrideUntil,
        fixtureCount: zoneConfig?.fixtureCount || 1,
        lightingModel: zoneConfig?.lightingModel || "legacy-linear-v1",
        dimmerCurve,
        powerCurve,
        luxCurve,
      });
    }

    let newClimate = currentZone.climate;
    if (newClimate) {
      const targetTemp = input.targetTemperature ?? newClimate.targetTemperature;
      let currentTemp = input.currentTemperature ?? newClimate.currentTemperature;

      if (input.targetTemperature !== undefined) {
        currentTemp = stepTemperatureTowardsTarget(currentTemp, targetTemp, 0.1);
      }

      newClimate = calculateClimateState({
        currentTemperature: currentTemp,
        targetTemperature: targetTemp,
        minComfortTemperature: newClimate.minComfortTemperature,
        maxComfortTemperature: newClimate.maxComfortTemperature,
        mode: input.climateMode ?? newClimate.mode,
      });
    }

    const newOccupancy = {
      occupied: newOccupied,
      lastChangedAt: this.clock.formatTime(),
      lastMotionTimestamp: newOccupied
        ? this.clock.formatTime()
        : currentZone.occupancy.lastMotionTimestamp || currentZone.occupancy.lastChangedAt,
      absenceMinutes: newAbsence,
    };

    const updatedZone: Zone = {
      ...currentZone,
      occupancy: newOccupancy,
      lighting: newLighting,
      climate: newClimate,
    };

    this.buildingState.zones[zoneIndex] = updatedZone;
  }

  public triggerUpcomingMeeting(): void {
    this.recommendation = {
      id: "rec-meeting-precondition",
      title: "Quarterly Strategy Review Preconditioning",
      description:
        "Meeting scheduled in 12 mins in Meeting Room A. Precooling recommended to reach 23.0°C.",
      actionLabel: "Start Precooling (23.0°C)",
      skipLabel: "Dismiss",
      zoneId: "zone-meeting-a",
      targetTemp: 23.0,
    };
    this.notify();
  }

  public applyManualOverride(
    zoneId: string,
    override: { brightness?: number; targetTemp?: number; durationMinutes?: number },
  ): void {
    const input: SimulationInput = { mode: "manual" };
    if (override.brightness !== undefined) {
      input.brightnessOverride = override.brightness;
    }
    if (override.targetTemp !== undefined) {
      input.targetTemperature = override.targetTemp;
    }
    this.updateZoneInput(zoneId, input);

    const act = createSmartActivity({
      timestamp: this.clock.formatTime(),
      category: override.brightness !== undefined ? "lighting" : "climate",
      title: "Manual override active",
      reason: `User set manual setpoint for ${override.durationMinutes || 30} mins.`,
      action: `Set ${override.brightness !== undefined ? `brightness to ${override.brightness}%` : `temp to ${override.targetTemp}°C`}`,
      source: "user",
    });
    this.activities.unshift(act);
    this.notifyActivity(act);
  }

  public clearManualOverride(zoneId: string): void {
    this.updateZoneInput(zoneId, { mode: "auto" });
    const act = createSmartActivity({
      timestamp: this.clock.formatTime(),
      category: "system",
      title: "Manual override expired / cancelled",
      reason: "System reverted to automated optimization policy.",
      action: "Switched zone to auto mode.",
      source: "automation",
    });
    this.activities.unshift(act);
    this.notifyActivity(act);
  }

  public acceptRecommendation(id?: string): void {
    if (this.recommendation && (!id || this.recommendation.id === id)) {
      this.updateZoneInput(this.recommendation.zoneId, {
        targetTemperature: this.recommendation.targetTemp,
      });

      const act = createSmartActivity({
        timestamp: this.clock.formatTime(),
        category: "climate",
        title: "Preconditioning accepted",
        reason: "User accepted recommendation for upcoming scheduled meeting.",
        action: `Adjusted setpoint to ${this.recommendation.targetTemp}°C.`,
        source: "user",
      });
      this.activities.unshift(act);
      this.notifyActivity(act);
      this.recommendation = null;
      this.notify();
    }
  }

  public dismissRecommendation(): void {
    this.recommendation = null;
    this.notify();
  }

  private recalculateBuildingEnergy(deltaSeconds = 1): void {
    let totalActualW = 0;
    let totalBaselineW = 0;

    for (const zone of this.buildingState.zones) {
      if (zone.lighting) {
        totalActualW += zone.lighting.fixturePowerW ?? zone.lighting.actualPowerW;
        totalBaselineW += zone.lighting.baselinePowerW;
      }
    }

    // Add device powers
    const deviceSummary = calculateBuildingDevicePower(this.getDevices());
    totalActualW += deviceSummary.currentPowerW;
    totalBaselineW += deviceSummary.nominalPowerW;

    const actualEnergyIncrementKwh = (totalActualW * deltaSeconds) / 3600000;
    const baselineEnergyIncrementKwh = (totalBaselineW * deltaSeconds) / 3600000;

    const actualKwh = this.energyState.energyActualKwh + actualEnergyIncrementKwh;
    const baselineKwh = this.energyState.energyBaselineKwh + baselineEnergyIncrementKwh;
    const savedKwh = Math.max(0, baselineKwh - actualKwh);
    const savingsPercent = calculateSavingsPercent(baselineKwh, actualKwh);

    this.energyState = {
      actualPowerW: Math.round(totalActualW),
      baselinePowerW: Math.round(totalBaselineW),
      savedPowerW: Math.max(0, Math.round(totalBaselineW - totalActualW)),
      energyBaselineKwh: Number(baselineKwh.toFixed(3)),
      energyActualKwh: Number(actualKwh.toFixed(3)),
      energySavedKwh: Number(savedKwh.toFixed(3)),
      savingsPercent,
      moneySaved: Number((savedKwh * 0.22).toFixed(2)),
      moneySavedEur: Number((savedKwh * 0.22).toFixed(2)),
      co2AvoidedKg: Number((savedKwh * 0.38).toFixed(2)),
      automatedActions: this.energyState.automatedActions,
    };
  }

  private buildInitialBuilding(scenario: DemoScenario | ScenarioDefinition): Building {
    const zonesList =
      "initialState" in scenario && scenario.initialState?.zones
        ? scenario.initialState.zones
        : "zones" in scenario && Array.isArray(scenario.zones)
          ? scenario.zones.map((z) => ({
              id: z.id,
              name: z.name,
              type: z.type,
              occupied: true,
              absenceMinutes: 0,
              daylightLux: 250,
              targetLux: z.config?.targetLux || 500,
              nominalPowerW: z.config?.nominalPowerW || 144,
              currentTemperature: 23.0,
              targetTemperature: z.config?.targetTemperature || 23.0,
            }))
          : [];

    const zones: Zone[] = zonesList.map((z) => {
      const lighting = calculateLightingState({
        occupied: z.occupied,
        absenceMinutes: z.absenceMinutes,
        daylightLux: z.daylightLux,
        targetLux: z.targetLux,
        nominalPowerW: z.nominalPowerW,
        mode: "auto",
      });

      const climate = calculateClimateState({
        currentTemperature: z.currentTemperature,
        targetTemperature: z.targetTemperature,
      });

      return {
        id: z.id,
        name: z.name,
        type: z.type,
        occupancy: {
          occupied: z.occupied,
          lastChangedAt: this.clock.formatTime(),
          lastMotionTimestamp: this.clock.formatTime(),
          absenceMinutes: z.absenceMinutes,
        },
        lighting,
        climate,
      };
    });

    return {
      id: "building-hq",
      name: "Witmind HQ - Smart Office",
      zones,
    };
  }

  private buildInitialEnergy(scenario: DemoScenario | ScenarioDefinition): OptimizationImpact {
    const baseEnergy =
      "initialState" in scenario && scenario.initialState?.energy
        ? scenario.initialState.energy
        : { energyBaselineKwh: 24.5, energyActualKwh: 18.6, automatedActions: 12 };

    const baselineKwh = baseEnergy.energyBaselineKwh;
    const actualKwh = baseEnergy.energyActualKwh;
    const savedKwh = Math.max(0, baselineKwh - actualKwh);
    const savingsPercent = calculateSavingsPercent(baselineKwh, actualKwh);

    return {
      actualPowerW: 340,
      baselinePowerW: 552,
      savedPowerW: 212,
      energyBaselineKwh: baselineKwh,
      energyActualKwh: actualKwh,
      energySavedKwh: Number(savedKwh.toFixed(3)),
      savingsPercent,
      moneySaved: Number((savedKwh * 0.22).toFixed(2)),
      moneySavedEur: Number((savedKwh * 0.22).toFixed(2)),
      co2AvoidedKg: Number((savedKwh * 0.38).toFixed(2)),
      automatedActions: baseEnergy.automatedActions,
    };
  }

  private buildInitialActivities(): SmartActivity[] {
    return [
      createSmartActivity({
        timestamp: "09:45",
        category: "lighting",
        title: "Daylight Harvesting Active",
        reason: "External sunlight reached 250 lux in Open Office.",
        action: "Dimmed artificial lighting to 75%.",
        impact: { wattsSaved: 36 },
        source: "automation",
      }),
      createSmartActivity({
        timestamp: "09:15",
        category: "climate",
        title: "Temperature Setpoint Nominal",
        reason: "Zone stabilized inside comfort band (22.5°C - 23.5°C).",
        action: "HVAC cooling output reduced to maintenance level.",
        source: "automation",
      }),
    ];
  }

  private checkInitialRecommendation(scenario: DemoScenario | ScenarioDefinition): void {
    const meeting = "initialState" in scenario ? scenario.initialState?.upcomingMeeting : null;
    if (meeting) {
      this.recommendation = {
        id: "rec-meeting-precondition",
        title: `Upcoming Meeting: ${meeting.title}`,
        description: `${meeting.title} begins at ${meeting.scheduledAt}. Preconditioning recommended to reach 23.0°C before attendees arrive.`,
        actionLabel: "Start Precooling (23.0°C)",
        skipLabel: "Dismiss",
        zoneId: meeting.zoneId,
        targetTemp: 23.0,
      };
    } else {
      this.recommendation = null;
    }
  }

  private initHistory(): void {
    this.history = [];
    this.recordHistorySnapshot();
  }

  private recordHistorySnapshot(): void {
    const primaryZone = this.buildingState.zones[0];
    const snapshot: TelemetrySnapshot = {
      time: this.clock.formatTime(),
      baselineKwh: this.energyState.energyBaselineKwh,
      actualKwh: this.energyState.energyActualKwh,
      daylightLux: primaryZone?.lighting?.daylightLux ?? 0,
      brightness: primaryZone?.lighting
        ? (primaryZone.lighting.requestedBrightnessPct ?? primaryZone.lighting.brightness)
        : 0,
      temperature: primaryZone?.climate?.currentTemperature ?? 23.0,
      dimmerVoltageV: primaryZone?.lighting?.dimmerVoltageV,
      driverCurrentMa: primaryZone?.lighting?.driverCurrentMa,
      fixturePowerW: primaryZone?.lighting?.fixturePowerW,
      totalLux: primaryZone?.lighting?.currentLux,
    };

    this.history.push(snapshot);
    if (this.history.length > 60) {
      this.history.shift();
    }
  }
}

export const demoEngine = new DemoEngine(normalDayScenario);
