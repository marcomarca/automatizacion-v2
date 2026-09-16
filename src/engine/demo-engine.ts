import type { SimulationInput } from "../api/contracts/data-adapter";
import { allScenarios, normalDayScenario } from "../mocks/scenarios";
import type { Building, OptimizationImpact, SmartActivity, Zone } from "../models";
import { createSmartActivity } from "../services/activity.service";
import { calculateClimateState, stepTemperatureTowardsTarget } from "../services/climate.service";
import { calculateSavingsPercent } from "../services/energy.service";
import { calculateLightingState } from "../services/lighting.service";
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
}

export interface DemoEngineListener {
  onStateChanged?: () => void;
  onActivityAdded?: (activity: SmartActivity) => void;
}

export class DemoEngine {
  public clock: DemoClock;
  private currentScenario: DemoScenario;
  private status: EngineStatus = "idle";
  private speed = 1; // 1x, 5x, 10x
  private elapsedSeconds = 0;
  private intervalTimer: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<DemoEngineListener> = new Set();
  private simulatedError = false;

  // Internal state
  private buildingState: Building;
  private energyState: OptimizationImpact;
  private activities: SmartActivity[] = [];
  private history: TelemetrySnapshot[] = [];
  private recommendation: {
    id: string;
    title: string;
    description: string;
    actionLabel: string;
    skipLabel: string;
    zoneId: string;
    targetTemp: number;
  } | null = null;

  constructor(initialScenario: DemoScenario = normalDayScenario) {
    this.currentScenario = initialScenario;
    this.clock = new DemoClock(initialScenario.initialClockTime);
    this.buildingState = this.buildInitialBuilding(initialScenario);
    this.energyState = this.buildInitialEnergy(initialScenario);
    this.activities = this.buildInitialActivities();
    this.checkInitialRecommendation(initialScenario);
    this.initHistory();
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

  public getCurrentScenario(): DemoScenario {
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

  public loadScenario(scenarioId: string): void {
    const scenario = allScenarios[scenarioId];
    if (!scenario) {
      console.warn(`Scenario ${scenarioId} not found`);
      return;
    }
    this.pause();
    this.currentScenario = scenario;
    this.reset();
  }

  public reset(): void {
    this.pause();
    this.elapsedSeconds = 0;
    this.clock.set(this.currentScenario.initialClockTime);
    this.buildingState = this.buildInitialBuilding(this.currentScenario);
    this.energyState = this.buildInitialEnergy(this.currentScenario);
    this.activities = this.buildInitialActivities();
    this.checkInitialRecommendation(this.currentScenario);
    this.initHistory();
    this.notify();
  }

  public start(): void {
    if (this.status === "running") return;
    this.status = "running";
    const intervalMs = Math.max(100, Math.round(1000 / this.speed));
    this.intervalTimer = setInterval(() => {
      this.tick();
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

  public tick(): void {
    this.elapsedSeconds += 1;
    this.clock.advanceSeconds(1);

    // Process deterministic timeline events
    const currentEvents = this.currentScenario.timeline.filter(
      (e) => e.atSecond === this.elapsedSeconds,
    );

    for (const event of currentEvents) {
      if (event.zoneId) {
        this.updateZoneInput(event.zoneId, event.changes);
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

    this.recalculateBuildingEnergy();
    this.recordHistorySnapshot();
    this.notify();
  }

  public updateZoneInput(zoneId: string, input: SimulationInput): void {
    const zoneIndex = this.buildingState.zones.findIndex((z) => z.id === zoneId);
    if (zoneIndex === -1) return;

    const currentZone = this.buildingState.zones[zoneIndex];
    const newOccupied = input.occupied ?? currentZone.occupancy.occupied;
    const newAbsence = input.absenceMinutes ?? currentZone.occupancy.absenceMinutes;

    // Lighting updates
    let newLighting = currentZone.lighting;
    if (newLighting) {
      const daylightLux = input.daylightLux ?? newLighting.daylightLux;
      const mode = input.mode ?? newLighting.mode;
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
      });
    }

    // Climate updates
    let newClimate = currentZone.climate;
    if (newClimate) {
      const currentTemperature = input.currentTemperature ?? newClimate.currentTemperature;
      const climateMode = input.climateMode ?? newClimate.mode;

      newClimate = calculateClimateState({
        currentTemperature,
        targetTemperature: newClimate.targetTemperature,
        minComfortTemperature: newClimate.minComfortTemperature,
        maxComfortTemperature: newClimate.maxComfortTemperature,
        mode: climateMode,
      });
    }

    const updatedZone: Zone = {
      ...currentZone,
      occupancy: {
        occupied: newOccupied,
        absenceMinutes: newAbsence,
        lastChangedAt: this.clock.formatFull(),
      },
      lighting: newLighting,
      climate: newClimate,
    };

    const newZones = [...this.buildingState.zones];
    newZones[zoneIndex] = updatedZone;

    this.buildingState = {
      ...this.buildingState,
      zones: newZones,
    };

    this.recalculateBuildingEnergy();
    this.recordHistorySnapshot();
    this.notify();
  }

  public triggerUpcomingMeeting(
    title = "Strategy Meeting",
    scheduledAt = "15:00",
    zoneId = "zone-meeting-a",
    roomTemp = 26.1,
  ): void {
    this.recommendation = {
      id: "rec-meeting-precondition",
      title: `Upcoming meeting: ${title}`,
      description: `Scheduled at ${scheduledAt} (in 12 min). Current room temperature is ${roomTemp}°C (target 23°C). Witmind recommends starting HVAC now.`,
      actionLabel: "Precondition",
      skipLabel: "Skip",
      zoneId,
      targetTemp: 23.0,
    };
    this.notify();
  }

  public acceptRecommendation(): void {
    if (!this.recommendation) return;
    const zoneId = this.recommendation.zoneId;
    const targetTemp = this.recommendation.targetTemp;

    const zone = this.buildingState.zones.find((z) => z.id === zoneId);
    if (zone?.climate) {
      const newTemp = stepTemperatureTowardsTarget(
        zone.climate.currentTemperature,
        targetTemp,
        0.8,
      );
      this.updateZoneInput(zoneId, {
        currentTemperature: newTemp,
        climateMode: "auto",
      });

      const act = createSmartActivity({
        timestamp: this.clock.formatTime(),
        category: "climate",
        title: "Preconditioning accepted",
        reason: "User confirmed meeting preparation recommendation.",
        action: `HVAC active. Temperature adjusted to ${newTemp}°C.`,
        source: "user",
      });
      this.activities.unshift(act);
      this.notifyActivity(act);
    }
    this.recommendation = null;
    this.notify();
  }

  public dismissRecommendation(): void {
    this.recommendation = null;
    this.notify();
  }

  private recalculateBuildingEnergy(): void {
    let totalNominal = 0;
    let totalActual = 0;

    for (const zone of this.buildingState.zones) {
      if (zone.lighting) {
        totalNominal += zone.lighting.nominalPowerW;
        totalActual += zone.lighting.actualPowerW;
      }
    }

    const baselineKwh = this.energyState.energyBaselineKwh;
    const savedWatts = Math.max(0, totalNominal - totalActual);
    const savedKwh = Number(
      (this.energyState.energySavedKwh + (savedWatts / 1000) * 0.05).toFixed(2),
    );
    const actualKwh = Number(Math.max(0, baselineKwh - savedKwh).toFixed(2));
    const savingsPercent = calculateSavingsPercent(totalNominal, totalActual);

    this.energyState = {
      energyBaselineKwh: baselineKwh,
      energyActualKwh: actualKwh,
      energySavedKwh: savedKwh,
      savingsPercent,
      moneySaved: Number((savedKwh * 0.18).toFixed(2)),
      automatedActions: this.energyState.automatedActions + 1,
    };
  }

  private initHistory(): void {
    const primaryZone = this.buildingState.zones[0];
    const initialDaylight = primaryZone?.lighting?.daylightLux ?? 250;
    const initialBrightness = primaryZone?.lighting?.brightness ?? 75;
    const initialTemp = primaryZone?.climate?.currentTemperature ?? 23.0;

    this.history = [
      {
        time: "08:00",
        baselineKwh: 5.0,
        actualKwh: 3.8,
        daylightLux: 50,
        brightness: 100,
        temperature: 21.8,
      },
      {
        time: "10:00",
        baselineKwh: 12.0,
        actualKwh: 9.2,
        daylightLux: 180,
        brightness: 75,
        temperature: 22.4,
      },
      {
        time: "12:00",
        baselineKwh: 18.5,
        actualKwh: 14.1,
        daylightLux: 450,
        brightness: 35,
        temperature: 23.1,
      },
      {
        time: this.clock.formatTime(),
        baselineKwh: this.energyState.energyBaselineKwh,
        actualKwh: this.energyState.energyActualKwh,
        daylightLux: initialDaylight,
        brightness: initialBrightness,
        temperature: initialTemp,
      },
    ];
  }

  private recordHistorySnapshot(): void {
    const primaryZone = this.buildingState.zones[0];
    const daylightLux = primaryZone?.lighting?.daylightLux ?? 250;
    const brightness = primaryZone?.lighting?.brightness ?? 75;
    const temperature = primaryZone?.climate?.currentTemperature ?? 23.0;

    const snapshot: TelemetrySnapshot = {
      time: this.clock.formatTime(),
      baselineKwh: this.energyState.energyBaselineKwh,
      actualKwh: this.energyState.energyActualKwh,
      daylightLux,
      brightness,
      temperature,
    };

    if (this.history.length > 12) {
      this.history.shift();
    }
    this.history.push(snapshot);
  }

  private buildInitialBuilding(scenario: DemoScenario): Building {
    const zones: Zone[] = scenario.initialState.zones.map((z) => {
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
        mode: "auto",
      });

      return {
        id: z.id,
        name: z.name,
        type: z.type,
        occupancy: {
          occupied: z.occupied,
          absenceMinutes: z.absenceMinutes,
          lastChangedAt: scenario.initialClockTime,
        },
        lighting,
        climate,
      };
    });

    return {
      id: "building-main",
      name: "Witmind HQ - Smart Office",
      zones,
    };
  }

  private buildInitialEnergy(scenario: DemoScenario): OptimizationImpact {
    const baseline = scenario.initialState.energy.energyBaselineKwh;
    const actual = scenario.initialState.energy.energyActualKwh;
    const saved = Number((baseline - actual).toFixed(2));
    const percent = calculateSavingsPercent(baseline, actual);

    return {
      energyBaselineKwh: baseline,
      energyActualKwh: actual,
      energySavedKwh: saved,
      savingsPercent: percent,
      moneySaved: Number((saved * 0.18).toFixed(2)),
      automatedActions: scenario.initialState.energy.automatedActions,
    };
  }

  private buildInitialActivities(): SmartActivity[] {
    return [
      createSmartActivity({
        timestamp: this.clock.formatTime(),
        category: "system",
        title: "Simulation Initialized",
        reason: `Scenario '${this.currentScenario.name}' loaded.`,
        action: "Baseline energy and zone setpoints applied.",
        source: "automation",
      }),
    ];
  }

  private checkInitialRecommendation(scenario: DemoScenario): void {
    if (scenario.initialState.upcomingMeeting) {
      const meeting = scenario.initialState.upcomingMeeting;
      this.recommendation = {
        id: "rec-meeting-precondition",
        title: `Upcoming meeting: ${meeting.title}`,
        description: `Scheduled at ${meeting.scheduledAt} (in 12 min). Current room temperature is ${meeting.roomTemperature}°C (target 23°C). Witmind recommends starting HVAC now.`,
        actionLabel: "Precondition",
        skipLabel: "Skip",
        zoneId: meeting.zoneId,
        targetTemp: 23.0,
      };
    } else {
      this.recommendation = null;
    }
  }
}
