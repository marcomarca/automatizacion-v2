export interface Product {
  id: string;
  name: string;
  family: string;
  spaceId: string;
  specifications: Record<string, string | number>;
  controlledDeviceIds: string[];
  description?: string;
  metadata?: Record<string, unknown>;
}
