import type { Space } from "../models/space";
import { demoStore } from "./demo.store";

export class SpaceStore {
  private static instance: SpaceStore;

  private constructor() {}

  public static getInstance(): SpaceStore {
    if (!SpaceStore.instance) {
      SpaceStore.instance = new SpaceStore();
    }
    return SpaceStore.instance;
  }

  public subscribe(listener: () => void): () => void {
    return demoStore.subscribe(listener);
  }

  public getAll(): Space[] {
    return demoStore.engine.getSpaces();
  }

  public getById(id: string): Space | undefined {
    return demoStore.engine.getSpace(id);
  }
}

export const spaceStore = SpaceStore.getInstance();
