import type { Building, Zone } from "../models";
import { demoStore } from "./demo.store";

export const BuildingStore = {
  getBuilding(): Building {
    return demoStore.getBuilding();
  },

  getZone(id: string): Zone | undefined {
    return demoStore.getBuilding().zones.find((z) => z.id === id);
  },

  subscribe(callback: () => void): () => void {
    return demoStore.subscribe(callback);
  },
};
