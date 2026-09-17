import type { MockScene } from "../models/scene";
import { demoStore } from "./demo.store";

export class SceneStore {
  private static instance: SceneStore;

  private constructor() {}

  public static getInstance(): SceneStore {
    if (!SceneStore.instance) {
      SceneStore.instance = new SceneStore();
    }
    return SceneStore.instance;
  }

  public subscribe(listener: () => void): () => void {
    return demoStore.subscribe(listener);
  }

  public getAll(): MockScene[] {
    return demoStore.engine.getScenes();
  }

  public getById(id: string): MockScene | undefined {
    return demoStore.engine.getScenes().find((s) => s.id === id);
  }

  public getBySpace(spaceId: string): MockScene[] {
    return demoStore.engine.getScenesBySpace(spaceId);
  }

  public run(sceneId: string): void {
    demoStore.engine.runScene(sceneId);
  }

  public activateScene(sceneId: string): void {
    this.run(sceneId);
  }
}

export const sceneStore = SceneStore.getInstance();
