export type SpaceCapability =
  | "overview"
  | "lighting"
  | "climate"
  | "energy"
  | "scenes"
  | "products"
  | "visualization";

export interface Space {
  id: string;
  name: string;
  description?: string;
  zoneIds: string[];
  capabilities: SpaceCapability[];
  metadata?: Record<string, unknown>;
}
