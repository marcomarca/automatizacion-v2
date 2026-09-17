import type { MockScene } from "../../models/scene";
import { lobbyScenes } from "./lobby.scenes";
import { showroomScenes } from "./showroom.scenes";

export * from "./showroom.scenes";
export * from "./lobby.scenes";

export const allMockScenes: MockScene[] = [...showroomScenes, ...lobbyScenes];
