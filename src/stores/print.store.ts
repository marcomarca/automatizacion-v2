import type { MockPrintJob } from "../models/print-job";
import { demoStore } from "./demo.store";

export class PrintStore {
  private static instance: PrintStore;

  private constructor() {}

  public static getInstance(): PrintStore {
    if (!PrintStore.instance) {
      PrintStore.instance = new PrintStore();
    }
    return PrintStore.instance;
  }

  public subscribe(listener: () => void): () => void {
    return demoStore.subscribe(listener);
  }

  public getAll(): MockPrintJob[] {
    return demoStore.engine.getPrintJobs();
  }

  public createJob(documentName: string, pages: number, spaceId = "showroom"): MockPrintJob {
    return demoStore.engine.createPrintJob(documentName, pages, spaceId);
  }

  public async submitJob(params: {
    documentName: string;
    requestedBy?: string;
    pages: number;
    copies?: number;
    spaceId?: string;
  }): Promise<MockPrintJob> {
    return this.createJob(
      params.documentName,
      params.pages * (params.copies || 1),
      params.spaceId || "showroom",
    );
  }
}

export const printStore = PrintStore.getInstance();
