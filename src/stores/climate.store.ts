import type { Zone } from "../models";
import { demoStore } from "./demo.store";

export const ClimateStore = {
  getClimateZones(): Zone[] {
    return demoStore.getClimateZones();
  },

  getRecommendation() {
    return demoStore.getRecommendation();
  },

  acceptRecommendation(): void {
    demoStore.acceptRecommendation();
  },

  dismissRecommendation(): void {
    demoStore.dismissRecommendation();
  },

  subscribe(callback: () => void): () => void {
    return demoStore.subscribe(callback);
  },
};
