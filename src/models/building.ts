import type { Zone } from "./zone";

export interface Building {
  id: string;
  name: string;
  zones: Zone[];
}
