export type AppRoute =
  | { kind: "overview" }
  | { kind: "spaces" }
  | {
      kind: "space";
      spaceId: string;
      section?: string;
    }
  | {
      kind: "system";
      systemId: string;
      section?: string;
    }
  | {
      kind: "operation";
      operationId: string;
    }
  | { kind: "mock-lab" }
  | { kind: "not-found" };

/**
 * Parses a browser hash string (e.g., "#/spaces/showroom/lighting") into a typed AppRoute.
 */
export function parseRoute(hash: string): AppRoute {
  const clean = hash.replace(/^#\/?/, "").trim();
  if (!clean || clean === "overview") {
    return { kind: "overview" };
  }

  const segments = clean.split("/").filter(Boolean);
  const root = segments[0]?.toLowerCase();

  switch (root) {
    case "overview":
      return { kind: "overview" };

    case "spaces":
      if (segments.length === 1) {
        return { kind: "spaces" };
      }
      return {
        kind: "space",
        spaceId: segments[1],
        section: segments[2],
      };

    case "space":
      if (segments.length >= 2) {
        return {
          kind: "space",
          spaceId: segments[1],
          section: segments[2],
        };
      }
      return { kind: "spaces" };

    case "systems":
    case "system":
      if (segments.length >= 2) {
        return {
          kind: "system",
          systemId: segments[1],
          section: segments[2],
        };
      }
      return { kind: "system", systemId: "lighting" };

    // Direct system shortcuts: #/lighting, #/climate, #/energy, #/automations
    case "lighting":
    case "climate":
    case "energy":
    case "automations":
      return {
        kind: "system",
        systemId: root,
        section: segments[1],
      };

    case "operations":
    case "operation":
      if (segments.length >= 2) {
        return {
          kind: "operation",
          operationId: segments[1],
        };
      }
      return { kind: "operation", operationId: "activity" };

    // Direct operation shortcuts: #/activity, #/notifications, #/calendar, #/recording, #/printing
    case "activity":
    case "notifications":
    case "calendar":
    case "recording":
    case "printing":
      return {
        kind: "operation",
        operationId: root,
      };

    case "simulator":
    case "mock-lab":
      return { kind: "mock-lab" };

    default:
      return { kind: "not-found" };
  }
}

/**
 * Converts a typed AppRoute into its canonical hash string.
 */
export function routeToHash(route: AppRoute): string {
  switch (route.kind) {
    case "overview":
      return "#/overview";

    case "spaces":
      return "#/spaces";

    case "space":
      return route.section
        ? `#/spaces/${route.spaceId}/${route.section}`
        : `#/spaces/${route.spaceId}`;

    case "system":
      return route.section
        ? `#/systems/${route.systemId}/${route.section}`
        : `#/systems/${route.systemId}`;

    case "operation":
      return `#/operations/${route.operationId}`;

    case "mock-lab":
      return "#/mock-lab";

    case "not-found":
      return "#/not-found";
  }
}

/**
 * Checks if a given route target matches the active route.
 */
export function isRouteActive(current: AppRoute, target: Partial<AppRoute>): boolean {
  if (target.kind && current.kind !== target.kind) return false;

  if (current.kind === "space" && target.kind === "space") {
    if (target.spaceId && current.spaceId !== target.spaceId) return false;
    if (target.section && current.section !== target.section) return false;
  }

  if (current.kind === "system" && target.kind === "system") {
    if (target.systemId && current.systemId !== target.systemId) return false;
    if (target.section && current.section !== target.section) return false;
  }

  if (current.kind === "operation" && target.kind === "operation") {
    if (target.operationId && current.operationId !== target.operationId) return false;
  }

  return true;
}
