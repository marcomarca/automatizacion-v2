import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Build and Template Integrity", () => {
  it("contains root app-shell and semantic metadata in index.html", () => {
    const htmlPath = join(process.cwd(), "index.html");
    const html = readFileSync(htmlPath, "utf-8");
    expect(html).toContain("<app-shell></app-shell>");
    expect(html).toContain("Witmind");
    expect(html).toContain("viewport");
  });

  it("contains design tokens with all required structural variables", () => {
    const tokensPath = join(process.cwd(), "src", "styles", "tokens.css");
    const css = readFileSync(tokensPath, "utf-8");
    expect(css).toContain("--color-primary");
    expect(css).toContain("--color-bg-app");
    expect(css).toContain("--touch-target-min");
  });
});
