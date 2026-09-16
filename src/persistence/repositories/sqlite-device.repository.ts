import type { DeviceProfile, SourceReference } from "../../models/scenario";
import type { DatabaseClient } from "../database";
import type { DeviceRepository } from "./device.repository";

interface DeviceRow {
  id: string;
  device_type: string;
  manufacturer: string | null;
  model: string | null;
  name: string;
  config_json: string;
  source_reference_id: string | null;
  created_at: string;
  updated_at: string;
}

interface SourceRow {
  id: string;
  source_kind: string;
  title: string;
  publisher: string | null;
  url: string | null;
  retrieved_at: string | null;
  notes: string;
}

export class SqliteDeviceRepository implements DeviceRepository {
  constructor(private db: DatabaseClient) {}

  public async listProfiles(): Promise<DeviceProfile[]> {
    const rows = await this.db.query<DeviceRow>("SELECT * FROM device_profiles ORDER BY name ASC");
    return rows.map((r) => ({
      id: r.id,
      deviceType: r.device_type,
      manufacturer: r.manufacturer,
      model: r.model,
      name: r.name,
      config: JSON.parse(r.config_json || "{}"),
      sourceReferenceId: r.source_reference_id,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  public async getProfile(id: string): Promise<DeviceProfile | null> {
    const rows = await this.db.query<DeviceRow>("SELECT * FROM device_profiles WHERE id = ?", [id]);
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      deviceType: r.device_type,
      manufacturer: r.manufacturer,
      model: r.model,
      name: r.name,
      config: JSON.parse(r.config_json || "{}"),
      sourceReferenceId: r.source_reference_id,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  public async saveProfile(profile: DeviceProfile): Promise<void> {
    const now = new Date().toISOString();
    await this.db.exec(
      `INSERT OR REPLACE INTO device_profiles (
        id, device_type, manufacturer, model, name,
        config_json, source_reference_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        profile.id,
        profile.deviceType,
        profile.manufacturer || null,
        profile.model || null,
        profile.name,
        JSON.stringify(profile.config || {}),
        profile.sourceReferenceId || null,
        profile.createdAt || now,
        now,
      ],
    );
  }

  public async deleteProfile(id: string): Promise<void> {
    await this.db.exec("DELETE FROM device_profiles WHERE id = ?", [id]);
  }

  public async listSources(): Promise<SourceReference[]> {
    const rows = await this.db.query<SourceRow>(
      "SELECT * FROM source_references ORDER BY title ASC",
    );
    return rows.map((r) => ({
      id: r.id,
      sourceKind: r.source_kind as SourceReference["sourceKind"],
      title: r.title,
      publisher: r.publisher,
      url: r.url,
      retrievedAt: r.retrieved_at,
      notes: r.notes || "",
    }));
  }

  public async getSource(id: string): Promise<SourceReference | null> {
    const rows = await this.db.query<SourceRow>("SELECT * FROM source_references WHERE id = ?", [
      id,
    ]);
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      sourceKind: r.source_kind as SourceReference["sourceKind"],
      title: r.title,
      publisher: r.publisher,
      url: r.url,
      retrievedAt: r.retrieved_at,
      notes: r.notes || "",
    };
  }

  public async saveSource(source: SourceReference): Promise<void> {
    await this.db.exec(
      `INSERT OR REPLACE INTO source_references (
        id, source_kind, title, publisher, url, retrieved_at, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        source.id,
        source.sourceKind,
        source.title,
        source.publisher || null,
        source.url || null,
        source.retrievedAt || null,
        source.notes || "",
      ],
    );
  }
}
