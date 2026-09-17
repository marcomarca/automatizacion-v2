import type { Product } from "../models/product";
import { demoStore } from "./demo.store";

export class ProductStore {
  getAll(): Product[] {
    return demoStore.engine.getProducts();
  }

  getBySpaceId(spaceId: string): Product[] {
    return demoStore.engine.getProductsBySpace(spaceId);
  }

  getById(id: string): Product | undefined {
    return demoStore.engine.getProducts().find((p) => p.id === id);
  }

  subscribe(listener: () => void): () => void {
    return demoStore.subscribe(listener);
  }
}

export const productStore = new ProductStore();
