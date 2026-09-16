export type ActivityCategory = "energy" | "lighting" | "climate" | "occupancy" | "system";

export interface SmartActivity {
  id: string;
  timestamp: string;
  category: ActivityCategory;
  title: string;
  reason: string;
  action: string;
  impact?: {
    wattsSaved?: number;
    energySavedKwh?: number;
    moneySaved?: number;
    savingsPercent?: number;
  };
  source: "automation" | "recommendation" | "user";
}
