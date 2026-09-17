import type { MockNotification } from "../models/notification";
import { demoStore } from "./demo.store";

export class NotificationStore {
  private static instance: NotificationStore;

  private constructor() {}

  public static getInstance(): NotificationStore {
    if (!NotificationStore.instance) {
      NotificationStore.instance = new NotificationStore();
    }
    return NotificationStore.instance;
  }

  public subscribe(listener: () => void): () => void {
    return demoStore.subscribe(listener);
  }

  public getAll(): MockNotification[] {
    return demoStore.engine.getNotifications();
  }

  public getById(id: string): MockNotification | undefined {
    return demoStore.engine.getNotifications().find((n) => n.id === id);
  }

  public getUnreadCount(): number {
    return demoStore.engine.getNotifications().filter((n) => !n.read).length;
  }

  public markAsRead(id: string): void {
    demoStore.engine.markNotificationRead(id);
  }

  public clearAll(): void {
    demoStore.engine.clearNotifications();
  }
}

export const notificationStore = NotificationStore.getInstance();
