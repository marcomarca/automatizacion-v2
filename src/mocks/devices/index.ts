import type { MockDevice } from "../../models/device";
import { lobbyDevices } from "./lobby.devices";
import { officesDevices } from "./offices.devices";
import { showroomDevices } from "./showroom.devices";

export * from "./showroom.devices";
export * from "./lobby.devices";
export * from "./offices.devices";

export const allMockDevices: MockDevice[] = [
  ...showroomDevices,
  ...lobbyDevices,
  ...officesDevices,
];
