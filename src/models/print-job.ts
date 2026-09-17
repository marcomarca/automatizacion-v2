export type PrintJobStatus = "queued" | "printing" | "completed" | "failed" | "cancelled";

export interface MockPrintJob {
  id: string;
  documentName: string;
  pages: number;
  printerName: string;
  spaceId: string;
  status: PrintJobStatus;
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
}
