import type { Product } from "../../models/product";
import { showroomProducts } from "./showroom.products";

export * from "./showroom.products";

export const allMockProducts: Product[] = [...showroomProducts];
