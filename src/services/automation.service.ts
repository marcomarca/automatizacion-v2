import type { MockAutomation } from "../models/automation";

export interface AutomationExecutionResult {
  automationId: string;
  automationName: string;
  executedAt: string;
  actionsAppliedCount: number;
  message?: string;
}

export class AutomationService {
  /**
   * Toggles the enabled state of an automation.
   */
  static toggleEnabled(automation: MockAutomation): MockAutomation {
    return {
      ...automation,
      enabled: !automation.enabled,
    };
  }

  /**
   * Evaluates automation execution and produces a result snapshot.
   */
  static execute(automation: MockAutomation, timestamp: string): AutomationExecutionResult {
    return {
      automationId: automation.id,
      automationName: automation.name,
      executedAt: timestamp,
      actionsAppliedCount: automation.actions.length,
      message: `Automatización "${automation.name}" ejecutada con éxito (${automation.actions.length} acciones aplicadas).`,
    };
  }
}
