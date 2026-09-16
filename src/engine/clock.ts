export class DemoClock {
  private currentTime: Date;
  private listeners: Set<(time: Date) => void> = new Set();

  constructor(initialTimeStr = "2026-09-16T14:00:00Z") {
    this.currentTime = new Date(initialTimeStr);
  }

  public now(): Date {
    return new Date(this.currentTime.getTime());
  }

  public set(time: Date | string): void {
    this.currentTime = typeof time === "string" ? new Date(time) : new Date(time.getTime());
    this.notify();
  }

  public advanceSeconds(seconds: number): void {
    this.currentTime = new Date(this.currentTime.getTime() + seconds * 1000);
    this.notify();
  }

  public advanceMinutes(minutes: number): void {
    this.advanceSeconds(minutes * 60);
  }

  public formatTime(): string {
    const hours = this.currentTime.getUTCHours().toString().padStart(2, "0");
    const minutes = this.currentTime.getUTCMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  public formatFull(): string {
    return this.currentTime.toISOString();
  }

  public subscribe(listener: (time: Date) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.now());
    }
  }
}
