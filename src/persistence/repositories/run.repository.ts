import type {
  RunActivity,
  RunSummary,
  SimulationRun,
  SimulationSample,
} from "../../models/scenario";

export interface RunRepository {
  create(run: SimulationRun): Promise<void>;
  appendSamples(runId: string, samples: SimulationSample[]): Promise<void>;
  appendActivities(runId: string, activities: RunActivity[]): Promise<void>;
  complete(runId: string, summary: RunSummary): Promise<void>;
  list(): Promise<SimulationRun[]>;
  get(runId: string): Promise<SimulationRun | null>;
  getSamples(runId: string): Promise<SimulationSample[]>;
  getActivities(runId: string): Promise<RunActivity[]>;
  delete(runId: string): Promise<void>;
}
