export type NotificationLevel = "info" | "warning" | "error" | "success";

export interface MockNotification {
  id: string;
  timestamp: string;
  level: NotificationLevel;
  title: string;
  message: string;
  read: boolean;
  category?: string;
  source?: string;
  metadata?: Record<string, unknown>;
}
