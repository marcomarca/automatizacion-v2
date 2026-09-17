import { describe, expect, it } from "bun:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function scanDirectory(dir: string): string[] {
  let files: string[] = [];
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files = files.concat(scanDirectory(full));
    } else if (full.endsWith(".ts")) {
      files.push(full);
    }
  }
  return files;
}

describe("Architecture Boundary Tests", () => {
  it("strictly prohibits views from directly importing from src/mocks/", () => {
    const viewsDir = join(process.cwd(), "src", "views");
    const viewFiles = scanDirectory(viewsDir);

    expect(viewFiles.length).toBeGreaterThan(0);

    for (const file of viewFiles) {
      const content = readFileSync(file, "utf8");
      const hasMockImport =
        content.includes('from "../../mocks') ||
        content.includes('from "../mocks') ||
        content.includes("from '.../../mocks") ||
        content.includes("from '@/mocks") ||
        content.includes("/mocks/");

      expect(hasMockImport).toBe(false);
    }
  });

  it("strictly prohibits stores and views from importing from legacy ejemplo-guia", () => {
    const srcDir = join(process.cwd(), "src");
    const srcFiles = scanDirectory(srcDir);

    for (const file of srcFiles) {
      const content = readFileSync(file, "utf8");
      expect(content.includes("ejemplo-guia")).toBe(false);
    }
  });

  it("strictly prohibits direct calls to Home Assistant WebSocket or REST in active domain stores", () => {
    const storesDir = join(process.cwd(), "src", "stores");
    const storeFiles = scanDirectory(storesDir);

    for (const file of storeFiles) {
      const content = readFileSync(file, "utf8");
      expect(content.includes("home-assistant.adapter")).toBe(false);
      expect(content.includes("hassUrl")).toBe(false);
    }
  });
});
