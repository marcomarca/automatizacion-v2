import type { MockPrintJob } from "../models/print-job";

export class PrintService {
  /**
   * Advances queued print jobs towards completion.
   */
  static processQueue(jobs: MockPrintJob[]): MockPrintJob[] {
    return jobs.map((job) => {
      if (job.status === "queued") {
        return {
          ...job,
          status: "printing",
        };
      }
      if (job.status === "printing") {
        return {
          ...job,
          status: "completed",
          completedAt: new Date().toLocaleTimeString(),
        };
      }
      return job;
    });
  }

  /**
   * Creates a new simulated print job.
   */
  static createJob(
    documentName: string,
    pages: number,
    printerName = "HP LaserJet Showroom",
    spaceId = "showroom",
  ): MockPrintJob {
    return {
      id: `print-${Date.now().toString(36)}`,
      documentName,
      pages,
      printerName,
      spaceId,
      status: "queued",
      createdAt: new Date().toLocaleTimeString(),
    };
  }
}
