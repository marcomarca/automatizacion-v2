import type { ActivityCategory, SmartActivity } from "../models";
import { filterActivitiesByCategory } from "../services/activity.service";
import { demoStore } from "./demo.store";

export const ActivityStore = {
  getActivities(category: "all" | ActivityCategory = "all"): SmartActivity[] {
    return filterActivitiesByCategory(demoStore.getActivities(), category);
  },

  subscribe(callback: () => void): () => void {
    return demoStore.subscribe(callback);
  },
};

export class ActivityStoreClass {
  getAll(category: "all" | ActivityCategory = "all"): SmartActivity[] {
    return filterActivitiesByCategory(demoStore.getActivities(), category);
  }

  getByCategory(category: ActivityCategory): SmartActivity[] {
    return filterActivitiesByCategory(demoStore.getActivities(), category);
  }

  subscribe(callback: () => void): () => void {
    return demoStore.subscribe(callback);
  }
}

export const activityStore = new ActivityStoreClass();
