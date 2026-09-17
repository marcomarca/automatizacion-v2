import type { MockAutomation } from "../models/automation";
import { demoStore } from "./demo.store";

export class AutomationStore {
  private static instance: AutomationStore;

  private constructor() {}

  public static getInstance(): AutomationStore {
    if (!AutomationStore.instance) {
      AutomationStore.instance = new AutomationStore();
    }
    return AutomationStore.instance;
  }

  public subscribe(listener: () => void): () => void {
    return demoStore.subscribe(listener);
  }

  public getAll(): MockAutomation[] {
    return demoStore.engine.getAutomations();
  }

  public getById(id: string): MockAutomation | undefined {
    return demoStore.engine.getAutomations().find((a) => a.id === id);
  }

  public toggle(id: string): void {
    demoStore.engine.toggleAutomation(id);
  }

  public toggleAutomation(id: string): void {
    this.toggle(id);
  }

  public run(id: string): void {
    demoStore.engine.runAutomation(id);
  }
}

export const automationStore = AutomationStore.getInstance();
