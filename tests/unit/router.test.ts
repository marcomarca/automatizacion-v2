import { describe, expect, it } from "bun:test";
import { type AppRoute, isRouteActive, parseRoute, routeToHash } from "../../src/app/routes";

describe("Hierarchical Router Parsing & Serialization (PLAN-v3 Section 7-8)", () => {
  it("parses empty and overview hashes to overview route", () => {
    expect(parseRoute("")).toEqual({ kind: "overview" });
    expect(parseRoute("#")).toEqual({ kind: "overview" });
    expect(parseRoute("#/")).toEqual({ kind: "overview" });
    expect(parseRoute("#/overview")).toEqual({ kind: "overview" });
  });

  it("parses spaces list route", () => {
    expect(parseRoute("#/spaces")).toEqual({ kind: "spaces" });
  });

  it("parses space and nested sections", () => {
    expect(parseRoute("#/spaces/showroom")).toEqual({
      kind: "space",
      spaceId: "showroom",
      section: undefined,
    });
    expect(parseRoute("#/spaces/showroom/lighting")).toEqual({
      kind: "space",
      spaceId: "showroom",
      section: "lighting",
    });
    expect(parseRoute("#/spaces/offices/climate")).toEqual({
      kind: "space",
      spaceId: "offices",
      section: "climate",
    });
  });

  it("parses systems routes with shortcuts and sections", () => {
    expect(parseRoute("#/systems/lighting")).toEqual({
      kind: "system",
      systemId: "lighting",
      section: undefined,
    });
    expect(parseRoute("#/climate")).toEqual({
      kind: "system",
      systemId: "climate",
      section: undefined,
    });
    expect(parseRoute("#/systems/energy")).toEqual({
      kind: "system",
      systemId: "energy",
      section: undefined,
    });
    expect(parseRoute("#/automations")).toEqual({
      kind: "system",
      systemId: "automations",
      section: undefined,
    });
  });

  it("parses operations routes with shortcuts", () => {
    expect(parseRoute("#/operations/activity")).toEqual({
      kind: "operation",
      operationId: "activity",
    });
    expect(parseRoute("#/notifications")).toEqual({
      kind: "operation",
      operationId: "notifications",
    });
    expect(parseRoute("#/calendar")).toEqual({
      kind: "operation",
      operationId: "calendar",
    });
    expect(parseRoute("#/recording")).toEqual({
      kind: "operation",
      operationId: "recording",
    });
    expect(parseRoute("#/printing")).toEqual({
      kind: "operation",
      operationId: "printing",
    });
  });

  it("parses mock-lab and simulator routes", () => {
    expect(parseRoute("#/mock-lab")).toEqual({ kind: "mock-lab" });
    expect(parseRoute("#/simulator")).toEqual({ kind: "mock-lab" });
  });

  it("serializes AppRoutes back to valid hash strings", () => {
    expect(routeToHash({ kind: "overview" })).toBe("#/overview");
    expect(routeToHash({ kind: "spaces" })).toBe("#/spaces");
    expect(routeToHash({ kind: "space", spaceId: "showroom", section: "lighting" })).toBe(
      "#/spaces/showroom/lighting",
    );
    expect(routeToHash({ kind: "system", systemId: "climate" })).toBe("#/systems/climate");
    expect(routeToHash({ kind: "operation", operationId: "activity" })).toBe(
      "#/operations/activity",
    );
    expect(routeToHash({ kind: "mock-lab" })).toBe("#/mock-lab");
  });

  it("correctly identifies active routes", () => {
    const current: AppRoute = {
      kind: "space",
      spaceId: "showroom",
      section: "lighting",
    };

    expect(isRouteActive(current, { kind: "space" })).toBe(true);
    expect(isRouteActive(current, { kind: "space", spaceId: "showroom" })).toBe(true);
    expect(
      isRouteActive(current, { kind: "space", spaceId: "showroom", section: "lighting" }),
    ).toBe(true);
    expect(isRouteActive(current, { kind: "space", spaceId: "lobby" })).toBe(false);
    expect(isRouteActive(current, { kind: "overview" })).toBe(false);
  });
});
