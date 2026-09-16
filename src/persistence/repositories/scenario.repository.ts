import type { ScenarioDefinition } from "../../models/scenario";

export interface ScenarioRepository {
  list(): Promise<ScenarioDefinition[]>;
  get(id: string): Promise<ScenarioDefinition | null>;
  save(scenario: ScenarioDefinition): Promise<void>;
  clone(id: string, newName: string): Promise<ScenarioDefinition>;
  delete(id: string): Promise<void>;
}
