// @vitest-environment node

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const styles = readFileSync(new URL("./styles.css", import.meta.url), "utf8");

const requiredTokens = {
  "--color-primary": "#e14c46",
  "--color-primary-strong": "#cb3a34",
  "--color-background": "#f3f5f8",
  "--color-surface": "#ffffff",
  "--color-rail": "#253044",
  "--color-text-primary": "#1f2329",
  "--color-text-secondary": "#5f6b7a",
  "--color-border": "#e7ebf0",
  "--color-success": "#00a870",
  "--color-warning": "#ff7d00",
  "--color-danger": "#d9363e",
};

describe("React workbench visual tokens", () => {
  it("defines the legacy and YonBIP-aligned palette", () => {
    for (const [name, value] of Object.entries(requiredTokens)) {
      expect(styles).toContain(`${name}: ${value};`);
    }
  });

  it("does not use the previous blue primary as the root brand token", () => {
    expect(styles).not.toContain("--color-primary: #1677ff;");
  });

  it("uses semantic tokens for primary workbench surfaces", () => {
    expect(styles).toContain("background: var(--color-primary-soft);");
    expect(styles).toContain("background: var(--color-success-soft);");
    expect(styles).toContain("background: var(--color-warning-soft);");
    expect(styles).toContain("background: var(--color-danger-soft);");
    expect(styles).toContain("border: 1px solid var(--color-border);");
  });
});
