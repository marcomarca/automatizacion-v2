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
  it("strictly prohibits views from directly importing from src/mocks/ (PLAN-v2 Section 6.1)", () => {
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
});
