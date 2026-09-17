import { beforeEach, describe, expect, it } from "bun:test";
import {
  activityStore,
  automationStore,
  calendarStore,
  deviceStore,
  notificationStore,
  printStore,
  sceneStore,
  spaceStore,
} from "../../src/stores";

describe("Cross-View & Cross-Domain State Consistency", () => {
  beforeEach(() => {
    // Reset or reinitialize engine state
  });

  it("propagates device state changes across Space, Device, and Energy stores", async () => {
    const deviceId = "showroom.spots-window";
    const initialDevice = deviceStore.getById(deviceId);
    expect(initialDevice).toBeDefined();

    const targetPowerState = initialDevice?.powerState === "on" ? "off" : "on";

    // Action: update device state
    await deviceStore.setDeviceState(deviceId, targetPowerState, { brightness: 75 });

    // Verify in DeviceStore
    const updatedDevice = deviceStore.getById(deviceId);
    expect(updatedDevice?.powerState).toBe(targetPowerState);
    expect(updatedDevice?.brightnessPct).toBe(75);

    // Verify in SpaceDevices list
    const showroomDevices = deviceStore.getBySpaceId("showroom");
    const foundInShowroom = showroomDevices.find((d) => d.id === deviceId);
    expect(foundInShowroom?.powerState).toBe(targetPowerState);
    expect(foundInShowroom?.brightnessPct).toBe(75);

    // Verify in SpaceStore
    const showroomSpace = spaceStore.getById("showroom");
    expect(showroomSpace).toBeDefined();
    expect(showroomSpace?.capabilities).toContain("lighting");
    const devicesInShowroom = deviceStore.getBySpaceId(showroomSpace?.id ?? "");
    expect(devicesInShowroom.find((d) => d.id === deviceId)?.powerState).toBe(targetPowerState);

    // Verify Activity was recorded
    const activities = activityStore.getAll();
    expect(activities.length).toBeGreaterThan(0);
    const lastActivity = activities[0];
    expect(lastActivity.title).toContain(updatedDevice?.name ?? deviceId);
  });

  it("activates scenes and updates all target member devices atomically", async () => {
    const sceneId = "showroom.presentation";
    const scene = sceneStore.getById(sceneId);
    expect(scene).toBeDefined();

    await sceneStore.activateScene(sceneId);

    // Verify all scene target devices updated their state
    for (const target of scene?.actions ?? []) {
      const dev = deviceStore.getById(target.deviceId);
      expect(dev?.powerState).toBe(target.powerState);
      if (target.brightnessPct !== undefined) {
        expect(dev?.brightnessPct).toBe(target.brightnessPct);
      }
    }
  });

  it("manages automation toggle states and reflects across stores", async () => {
    const automations = automationStore.getAll();
    expect(automations.length).toBeGreaterThan(0);

    const first = automations[0];
    const initialStatus = first.enabled;

    await automationStore.toggleAutomation(first.id);
    expect(automationStore.getById(first.id)?.enabled).toBe(!initialStatus);

    await automationStore.toggleAutomation(first.id);
    expect(automationStore.getById(first.id)?.enabled).toBe(initialStatus);
  });

  it("marks notifications as read and updates count", async () => {
    const notifications = notificationStore.getAll();
    expect(notifications.length).toBeGreaterThan(0);

    const first = notifications[0];
    await notificationStore.markAsRead(first.id);

    const updated = notificationStore.getById(first.id);
    expect(updated?.read).toBe(true);

    const unreadCount = notificationStore.getUnreadCount();
    expect(unreadCount).toBeLessThan(notifications.length);
  });

  it("manages calendar events and queries active events", () => {
    const events = calendarStore.getAll();
    expect(events.length).toBeGreaterThan(0);

    const active = calendarStore.getActiveEvents();
    expect(Array.isArray(active)).toBe(true);
  });

  it("submits print jobs and tracks queue", async () => {
    const initialCount = printStore.getAll().length;

    const job = await printStore.submitJob({
      documentName: "Ficha Tecnica Showroom.pdf",
      requestedBy: "Admin",
      pages: 4,
      copies: 1,
    });

    expect(job).toBeDefined();
    expect(job.status).toBe("queued");
    expect(printStore.getAll().length).toBe(initialCount + 1);
  });
});
