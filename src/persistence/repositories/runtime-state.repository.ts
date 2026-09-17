export interface RuntimeStateRepository {
  getState<T>(key: string): Promise<T | null>;
  setState<T>(key: string, value: T): Promise<void>;
  deleteState(key: string): Promise<void>;
  getAllKeys(): Promise<string[]>;
}
