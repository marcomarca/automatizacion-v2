import type { PhysicalCurve } from "../../models/scenario";

export interface CurveRepository {
  list(): Promise<PhysicalCurve[]>;
  get(id: string): Promise<PhysicalCurve | null>;
  save(curve: PhysicalCurve): Promise<void>;
  delete(id: string): Promise<void>;
}
