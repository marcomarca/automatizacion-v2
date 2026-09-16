import type { DeviceProfile, SourceReference } from "../../models/scenario";

export interface DeviceRepository {
  listProfiles(): Promise<DeviceProfile[]>;
  getProfile(id: string): Promise<DeviceProfile | null>;
  saveProfile(profile: DeviceProfile): Promise<void>;
  deleteProfile(id: string): Promise<void>;

  listSources(): Promise<SourceReference[]>;
  getSource(id: string): Promise<SourceReference | null>;
  saveSource(source: SourceReference): Promise<void>;
}
