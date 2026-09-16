import type { OptimizationImpact } from "../models";
import { demoStore } from "./demo.store";

export const EnergyStore = {
  getOverview(): OptimizationImpact {
    return demoStore.getEnergy();
  },

  subscribe(callback: () => void): () => void {
    return demoStore.subscribe(callback);
  },
};
