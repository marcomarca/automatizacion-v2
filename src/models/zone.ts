import type { ClimateState } from "./climate";
import type { LightingState } from "./lighting";
import type { OccupancyState } from "./occupancy";

export type ZoneType = "office" | "showroom" | "meeting" | "corridor";

export interface Zone {
  id: string;
  name: string;
  type: ZoneType;
  occupancy: OccupancyState;
  lighting?: LightingState;
  climate?: ClimateState;
}
