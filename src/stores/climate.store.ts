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

export class ClimateStoreClass {
  getZones(): Zone[] {
    return demoStore.getClimateZones();
  }

  getClimateZones(): Zone[] {
    return demoStore.getClimateZones();
  }

  getZoneById(id: string): Zone | undefined {
    return demoStore.getClimateZones().find((z) => z.id === id);
  }

  getRecommendation() {
    return demoStore.getRecommendation();
  }

  acceptRecommendation(): void {
    demoStore.acceptRecommendation();
  }

  dismissRecommendation(): void {
    demoStore.dismissRecommendation();
  }

  subscribe(callback: () => void): () => void {
    return demoStore.subscribe(callback);
  }
}

export const climateStore = new ClimateStoreClass();
