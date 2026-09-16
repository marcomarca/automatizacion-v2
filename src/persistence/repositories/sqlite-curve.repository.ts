import type { CurvePoint, PhysicalCurve, SourceReference } from "../../models/scenario";
import type { DatabaseClient } from "../database";
import type { CurveRepository } from "./curve.repository";

interface CurveRow {
  id: string;
  device_profile_id: string | null;
  name: string;
  input_variable: string;
  input_unit: string;
  output_variable: string;
  output_unit: string;
  interpolation: string;
  extrapolation: string;
  status: string;
  source_reference_id: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface CurvePointRow {
  id: string;
  curve_id: string;
  x: number;
  y: number;
  source_kind: string;
  source_reference_id: string | null;
  notes: string;
}

export class SqliteCurveRepository implements CurveRepository {
  constructor(private db: DatabaseClient) {}

  public async list(): Promise<PhysicalCurve[]> {
    const rows = await this.db.query<CurveRow>("SELECT * FROM curves ORDER BY name ASC");
    const curves: PhysicalCurve[] = [];
    for (const row of rows) {
      const curve = await this.get(row.id);
      if (curve) curves.push(curve);
    }
    return curves;
  }

  public async get(id: string): Promise<PhysicalCurve | null> {
    const cRows = await this.db.query<CurveRow>("SELECT * FROM curves WHERE id = ?", [id]);
    if (cRows.length === 0) return null;
    const c = cRows[0];

    const ptRows = await this.db.query<CurvePointRow>(
      "SELECT * FROM curve_points WHERE curve_id = ? ORDER BY x ASC",
      [id],
    );

    const points: CurvePoint[] = ptRows.map((pt) => ({
      id: pt.id,
      curveId: pt.curve_id,
      x: pt.x,
      y: pt.y,
      sourceKind: pt.source_kind as SourceReference["sourceKind"],
      sourceReferenceId: pt.source_reference_id,
      notes: pt.notes,
    }));

    return {
      id: c.id,
      deviceProfileId: c.device_profile_id,
      name: c.name,
      inputVariable: c.input_variable,
      inputUnit: c.input_unit,
      outputVariable: c.output_variable,
      outputUnit: c.output_unit,
      interpolation: c.interpolation as "linear" | "step",
      extrapolation: c.extrapolation as "clamp",
      status: c.status as PhysicalCurve["status"],
      sourceReferenceId: c.source_reference_id,
      notes: c.notes,
      points,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    };
  }

  public async save(curve: PhysicalCurve): Promise<void> {
    const now = new Date().toISOString();
    await this.db.transaction(async () => {
      await this.db.exec(
        `INSERT OR REPLACE INTO curves (
          id, device_profile_id, name, input_variable, input_unit,
          output_variable, output_unit, interpolation, extrapolation,
          status, source_reference_id, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          curve.id,
          curve.deviceProfileId || null,
          curve.name,
          curve.inputVariable,
          curve.inputUnit,
          curve.outputVariable,
          curve.outputUnit,
          curve.interpolation || "linear",
          curve.extrapolation || "clamp",
          curve.status || "modelled",
          curve.sourceReferenceId || null,
          curve.notes || "",
          curve.createdAt || now,
          now,
        ],
      );

      await this.db.exec("DELETE FROM curve_points WHERE curve_id = ?", [curve.id]);
      for (const pt of curve.points) {
        const ptId = pt.id || `${curve.id}_${pt.x}`;
        await this.db.exec(
          `INSERT INTO curve_points (
            id, curve_id, x, y, source_kind, source_reference_id, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            ptId,
            curve.id,
            pt.x,
            pt.y,
            pt.sourceKind || "modelled",
            pt.sourceReferenceId || null,
            pt.notes || "",
          ],
        );
      }
    });
  }

  public async delete(id: string): Promise<void> {
    await this.db.transaction(async () => {
      await this.db.exec("DELETE FROM curve_points WHERE curve_id = ?", [id]);
      await this.db.exec("DELETE FROM curves WHERE id = ?", [id]);
    });
  }
}
