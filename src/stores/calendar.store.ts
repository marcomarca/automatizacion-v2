import type { MockCalendarDay } from "../models/calendar";
import { demoStore } from "./demo.store";

export class CalendarStore {
  private static instance: CalendarStore;

  private constructor() {}

  public static getInstance(): CalendarStore {
    if (!CalendarStore.instance) {
      CalendarStore.instance = new CalendarStore();
    }
    return CalendarStore.instance;
  }

  public subscribe(listener: () => void): () => void {
    return demoStore.subscribe(listener);
  }

  public getAll(): MockCalendarDay[] {
    return demoStore.engine.getCalendar();
  }

  public getActiveEvents(): MockCalendarDay[] {
    return demoStore.engine.getCalendar().filter((d) => d.description);
  }

  public getByDate(date: string): MockCalendarDay | undefined {
    return demoStore.engine.getCalendar().find((d) => d.date === date);
  }

  public isWorkingDay(date: string): boolean {
    const day = this.getByDate(date);
    return day ? day.workingDay : true;
  }

  public updateDay(day: MockCalendarDay): void {
    demoStore.engine.updateCalendarDay(day);
  }

  public toggleWorkingDay(date: string): void {
    const existing = this.getByDate(date);
    if (existing) {
      this.updateDay({
        ...existing,
        workingDay: !existing.workingDay,
      });
    } else {
      this.updateDay({
        date,
        workingDay: false,
        description: "Modificado manualmente",
      });
    }
  }
}

export const calendarStore = CalendarStore.getInstance();
