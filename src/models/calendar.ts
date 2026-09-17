export interface MockCalendarDay {
  date: string; // YYYY-MM-DD
  workingDay: boolean;
  openingTime?: string; // HH:MM
  closingTime?: string; // HH:MM
  description?: string;
  holidayName?: string;
  note?: string;
}

export interface CalendarSummary {
  year: number;
  month: number;
  totalDays: number;
  workingDays: number;
  nonWorkingDays: number;
}
