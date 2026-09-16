import type { ActivityCategory, SmartActivity } from "../models";

export interface CreateActivityParams {
  id?: string;
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
  source?: "automation" | "recommendation" | "user";
}

let activityCounter = 1;

export function createSmartActivity(params: CreateActivityParams): SmartActivity {
  return {
    id: params.id ?? `act-${Date.now()}-${activityCounter++}`,
    timestamp: params.timestamp,
    category: params.category,
    title: params.title,
    reason: params.reason,
    action: params.action,
    impact: params.impact,
    source: params.source ?? "automation",
  };
}

export function filterActivitiesByCategory(
  activities: SmartActivity[],
  category: "all" | ActivityCategory,
): SmartActivity[] {
  if (category === "all") return activities;
  return activities.filter((act) => act.category === category);
}
