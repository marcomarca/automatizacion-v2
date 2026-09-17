export type ActivityCategory =
  | "energy"
  | "lighting"
  | "climate"
  | "occupancy"
  | "automation"
  | "scene"
  | "device"
  | "system";

export type ActivitySource =
  | "automation"
  | "recommendation"
  | "user"
  | "manual"
  | "scene"
  | "system";

export interface SmartActivity {
  id: string;
  timestamp: string;
  category: ActivityCategory;
  title: string;
  reason: string;
  action: string;
  spaceId?: string;
  deviceId?: string;
  impact?: {
    wattsSaved?: number;
    energySavedKwh?: number;
    moneySaved?: number;
    savingsPercent?: number;
  };
  source: ActivitySource;
  metadata?: Record<string, unknown>;
}
