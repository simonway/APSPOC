// @vitest-environment node

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { appTheme } from "./theme";

const styles = readFileSync(new URL("./styles.css", import.meta.url), "utf8");

const requiredTokens = {
  "--color-primary": "#e14c46",
  "--color-primary-strong": "#cb3a34",
  "--color-primary-soft": "#fff2f1",
  "--color-primary-text": "#a82f2b",
  "--color-primary-text-strong": "#7f1d1d",
  "--color-primary-hover": "#ffe4e2",
  "--color-primary-focus-ring": "rgba(225, 76, 70, 0.16)",
  "--color-background": "#f3f5f8",
  "--color-background-soft": "#f7f9fc",
  "--color-surface": "#ffffff",
  "--color-surface-soft": "#fafbfd",
  "--color-rail": "#253044",
  "--color-rail-active": "#3a465b",
  "--color-text-primary": "#1f2329",
  "--color-text-secondary": "#5f6b7a",
  "--color-text-muted": "#8c97a6",
  "--color-border": "#e7ebf0",
  "--color-border-strong": "#d7dde6",
  "--color-success": "#00a870",
  "--color-success-soft": "#ecfbf4",
  "--color-success-text": "#006b49",
  "--color-success-text-strong": "#00553a",
  "--color-warning": "#ff7d00",
  "--color-warning-soft": "#fff7e8",
  "--color-warning-text": "#914600",
  "--color-warning-text-strong": "#753800",
  "--color-danger": "#d9363e",
  "--color-danger-soft": "#fff2f0",
  "--color-danger-text": "#a4262c",
  "--color-danger-text-strong": "#861f24",
  "--color-info": "#3478f6",
  "--color-info-soft": "#eef3ff",
  "--color-info-text": "#1e56b3",
  "--color-info-text-strong": "#17458f",
  "--shadow-panel": "0 8px 22px rgba(15, 23, 42, 0.04)",
  "--shadow-float": "0 18px 42px rgba(15, 23, 42, 0.09)",
} as const;

type TokenName = keyof typeof requiredTokens;

function rootDeclarations(source: string) {
  const rootBlock = source.match(/:root\s*\{([\s\S]*?)\n\}/)?.[1];
  if (!rootBlock) {
    throw new Error("Expected a :root token block");
  }

  return Object.fromEntries(
    [...rootBlock.matchAll(/^\s*(--[\w-]+)\s*:\s*([^;]+);\s*$/gm)].map(([, name, value]) => [name, value.trim()]),
  );
}

function selectorBlock(source: string, selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const block = source.match(new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\n\\}`, "m"))?.[1];
  if (!block) {
    throw new Error(`Expected ${selector} selector block`);
  }

  return block;
}

function contrastRatio(foreground: string, background: string) {
  const luminance = (hex: string) => {
    const normalize = (offset: number) => {
      const channel = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    };
    return (0.2126 * normalize(1)) + (0.7152 * normalize(3)) + (0.0722 * normalize(5));
  };

  const foregroundLuminance = luminance(foreground);
  const backgroundLuminance = luminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

const rootTokens = rootDeclarations(styles) as Record<TokenName, string>;

function token(name: TokenName) {
  return rootTokens[name];
}

function expectSelectorDeclaration(selector: string, declaration: string) {
  expect(selectorBlock(styles, selector)).toContain(declaration);
}

describe("React workbench visual tokens", () => {
  it("defines the exact legacy and YonBIP-aligned root contract", () => {
    expect(rootTokens).toMatchObject(requiredTokens);
  });

  it("does not use the previous blue primary as the root brand token", () => {
    expect(rootTokens["--color-primary"]).not.toBe("#1677ff");
  });

  it("attaches semantic tokens to their intended workbench selectors", () => {
    expectSelectorDeclaration(".brand-mark", "background: var(--color-primary-soft);");
    expectSelectorDeclaration(".health-pill", "background: var(--color-success-soft);");
    expectSelectorDeclaration(".kpi-card-amber", "background: var(--color-warning-soft);");
    expectSelectorDeclaration(".kpi-card-red", "background: var(--color-danger-soft);");
    expectSelectorDeclaration(".dashboard-card", "border: 1px solid var(--color-border);");
    expectSelectorDeclaration(".dashboard-card", "box-shadow: var(--shadow-panel);");
    expectSelectorDeclaration(".right-tool-button:hover,\n.right-tool-button:focus-visible", "box-shadow: 0 0 0 3px var(--color-primary-focus-ring);");
  });

  it("provides AA contrast for all semantic text tokens on their soft surfaces", () => {
    const semanticPairs: Array<[TokenName, TokenName]> = [
      ["--color-primary-text", "--color-primary-soft"],
      ["--color-primary-text-strong", "--color-primary-soft"],
      ["--color-success-text", "--color-success-soft"],
      ["--color-success-text-strong", "--color-success-soft"],
      ["--color-warning-text", "--color-warning-soft"],
      ["--color-warning-text-strong", "--color-warning-soft"],
      ["--color-danger-text", "--color-danger-soft"],
      ["--color-danger-text-strong", "--color-danger-soft"],
      ["--color-info-text", "--color-info-soft"],
      ["--color-info-text-strong", "--color-info-soft"],
    ];

    for (const [foreground, background] of semanticPairs) {
      expect(contrastRatio(token(foreground), token(background))).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("routes semantic text and interaction states through readable tokens", () => {
    expectSelectorDeclaration(".health-pill", "color: var(--color-success-text-strong);");
    expectSelectorDeclaration(".jobs-release-note", "color: var(--color-warning-text);");
    expectSelectorDeclaration(".kpi-card-blue strong", "color: var(--color-info-text-strong);");
    expectSelectorDeclaration(".kpi-card-amber strong", "color: var(--color-warning-text-strong);");
    expectSelectorDeclaration(".kpi-card-red strong", "color: var(--color-danger-text-strong);");
    expectSelectorDeclaration(".value-banner-card p", "color: var(--color-info-text);");
    expectSelectorDeclaration(".legacy-link", "color: var(--color-primary-text);");
    expectSelectorDeclaration(".legacy-link:focus-visible,\n.legacy-link:hover", "color: var(--color-primary-text-strong);");
    expectSelectorDeclaration(".legacy-link:focus-visible,\n.legacy-link:hover", "background: var(--color-primary-hover);");
  });

  it("keeps Ant Design semantic colors aligned with the CSS contract", () => {
    expect(appTheme.token?.colorPrimary.toLowerCase()).toBe(token("--color-primary"));
    expect(appTheme.token?.colorSuccess.toLowerCase()).toBe(token("--color-success"));
    expect(appTheme.token?.colorWarning.toLowerCase()).toBe(token("--color-warning"));
    expect(appTheme.token?.colorError.toLowerCase()).toBe(token("--color-danger"));
    expect(appTheme.token?.colorInfo.toLowerCase()).toBe(token("--color-info"));
  });
});
