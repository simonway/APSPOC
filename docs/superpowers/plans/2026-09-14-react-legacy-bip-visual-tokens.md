# React Legacy/BIP Visual Tokens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the React workbench's colors, surfaces, borders, shadows, and semantic status treatments with the legacy APSPOC palette and the YonBIP/TinperNext light enterprise-workbench direction without changing layout, component structure, or interaction behavior.

**Architecture:** Keep the existing React component tree and Ant Design integration unchanged. Centralize the visual language in `frontend/src/styles.css` root tokens, then replace current blue-gradient and ad-hoc color usage with those tokens and a small number of semantic surface/status tokens. The legacy static UI remains the source for brand red and semantic status colors; YonBIP/TinperNext supplies the light blue-gray canvas, white surfaces, restrained borders, dark utility rail, compact typography, and clear primary/secondary emphasis.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, Ant Design 5, CSS custom properties.

---

## Visual contract

Use these values as the single source of truth for this phase:

```css
--color-primary: #e14c46;
--color-primary-strong: #cb3a34;
--color-primary-soft: #fff2f1;
--color-background: #f3f5f8;
--color-background-soft: #f7f9fc;
--color-surface: #ffffff;
--color-surface-soft: #fafbfd;
--color-rail: #253044;
--color-rail-active: #3a465b;
--color-text-primary: #1f2329;
--color-text-secondary: #5f6b7a;
--color-text-muted: #8c97a6;
--color-border: #e7ebf0;
--color-border-strong: #d7dde6;
--color-success: #00a870;
--color-success-soft: #ecfbf4;
--color-warning: #ff7d00;
--color-warning-soft: #fff7e8;
--color-danger: #d9363e;
--color-danger-soft: #fff2f0;
--color-info: #3478f6;
--color-info-soft: #eef3ff;
--shadow-panel: 0 8px 22px rgba(15, 23, 42, 0.04);
--shadow-float: 0 18px 42px rgba(15, 23, 42, 0.09);
```

Do not add gradients, large decorative imagery, new component APIs, or new layout patterns in this phase. Preserve existing responsive breakpoints and interaction selectors.

## File map

- Modify: `frontend/src/styles.css` — define the legacy/BIP/TinperNext visual tokens and replace current blue-first surfaces, gradients, borders, shadows, links, rails, dashboard cards, KPI cards, import cards, and jobs-center detail styles.
- Create: `frontend/src/styles.tokens.test.ts` — verify the required CSS custom-property contract and guard against the old blue-primary token returning.
- Modify: `frontend/src/App.test.tsx` — add one integration assertion that the authenticated workbench root exposes the new theme class/token hook if a stable hook is needed; otherwise keep behavior tests unchanged.
- Modify: `frontend/src/features/workspace/ScheduleJobsPanel.tsx` only if a status color is hard-coded in JSX after the CSS-token pass; prefer existing Ant Design semantic tags and avoid component restructuring.
- Do not modify: React component hierarchy, navigation behavior, API/hook logic, backend code, legacy static frontend, or unrelated Phase 4/UAT files.

## Task 1: Establish the visual token contract

**Files:**
- Create: `frontend/src/styles.tokens.test.ts`
- Read: `frontend/src/styles.css`

- [ ] **Step 1: Write the failing token contract test.**

Create a Node-environment Vitest test that reads the stylesheet source and checks the required root declarations. Keep the test source-level because CSS custom properties are not reliably exposed by jsdom before the stylesheet is mounted.

```ts
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
});
```

- [ ] **Step 2: Run the token test and verify the expected red failure.**

Run:

```bash
cd frontend && npm test -- --run src/styles.tokens.test.ts
```

Expected: FAIL because the current stylesheet still defines `--color-primary: #1677ff` and lacks the new semantic tokens.

- [ ] **Step 3: Commit the failing contract test.**

```bash
git add frontend/src/styles.tokens.test.ts
git commit -m "test: specify legacy bip visual tokens"
```

## Task 2: Replace root tokens and global surfaces

**Files:**
- Modify: `frontend/src/styles.css:1-16,53-70,172-250,333-338`
- Test: `frontend/src/styles.tokens.test.ts`

- [ ] **Step 1: Replace the root token block.**

Update `:root` to the exact visual contract above. Keep the existing font stack and base font size. Add the missing soft-surface and semantic status tokens; do not remove existing variable names that are still referenced unless every reference is updated in the same change.

- [ ] **Step 2: Remove blue-first page decoration.**

Change `.app-shell` from the blue gradient to `background: var(--color-background);`. Change `.top-nav` to a light BIP-style header: light blue-gray/white surface, dark primary text, a subtle bottom border, and the legacy red used only for active/brand emphasis. Preserve height, spacing, sticky positioning, and all existing selectors.

Use this target shape:

```css
.app-shell {
  min-height: 100vh;
  background: var(--color-background);
}

.top-nav {
  color: var(--color-text-primary);
  background: rgba(255, 255, 255, 0.96);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-panel);
}
```

- [ ] **Step 3: Align rails and shared cards.**

Keep the left rail dark, but use `--color-rail` and `--color-rail-active`; change the active inset indicator from blue to `--color-primary`. Make the right tool rail a white/soft-surface panel with the shared border token. Make `.dashboard-card` use the white surface, standard border, and `--shadow-panel` rather than a white translucent border and blue-tinted shadow.

- [ ] **Step 4: Run the token test and existing shell tests.**

Run:

```bash
cd frontend && npm test -- --run src/styles.tokens.test.ts src/App.test.tsx
```

Expected: token tests and existing App behavior tests pass; no navigation or interaction assertions change.

- [ ] **Step 5: Commit the global token/surface change.**

```bash
git add frontend/src/styles.css frontend/src/styles.tokens.test.ts
git commit -m "feat: align react workbench with legacy bip palette"
```

## Task 3: Align component-level emphasis and semantic states

**Files:**
- Modify: `frontend/src/styles.css:272-523,534-700,702-876`
- Test: `frontend/src/styles.tokens.test.ts`
- Test: `frontend/src/App.test.tsx`

- [ ] **Step 1: Extend the failing token test for component color usage.**

Add assertions that the stylesheet routes key UI surfaces through the new tokens rather than hard-coded blue values:

```ts
it("uses semantic tokens for primary workbench surfaces", () => {
  expect(styles).toContain("background: var(--color-primary-soft);");
  expect(styles).toContain("background: var(--color-success-soft);");
  expect(styles).toContain("background: var(--color-warning-soft);");
  expect(styles).toContain("background: var(--color-danger-soft);");
  expect(styles).toContain("border: 1px solid var(--color-border);");
});
```

- [ ] **Step 2: Replace dashboard and jobs-center accent colors.**

Update, without changing layout:

- `.eyebrow`, `.legacy-inline-link`, focus rings, and active controls to use `--color-primary` / `--color-primary-strong`.
- `.value-banner-card` and detail surfaces to use `--color-info-soft` or `--color-primary-soft` with no blue/orange gradient.
- `.jobs-version-detail` left border to `--color-primary` and background to `--color-surface-soft`.
- `.jobs-release-note` to `--color-warning`.
- Import batch cards and file controls to use `--color-border`, `--color-surface`, and `--color-info-soft`.
- Existing red/amber/green KPI gradients to flat semantic surfaces or restrained solid semantic colors. Preserve readable white text where a dark status surface remains; do not change KPI labels or values.

- [ ] **Step 3: Align Ant Design primary color at the provider boundary.**

In `frontend/src/App.tsx`, replace the current `colorPrimary: "#2563EB"` with the legacy brand value `"#E14C46"` and use the shared radius already implied by the current UI. Do not change providers, routes, state, or component structure.

- [ ] **Step 4: Add a visible integration assertion for the primary theme.**

In `frontend/src/App.test.tsx`, add a stable assertion around the `ConfigProvider`/root marker only if implementation adds one. Prefer asserting behavior through existing buttons and keep color assertions in `styles.tokens.test.ts`; do not snapshot Ant Design internals.

- [ ] **Step 5: Run focused tests.**

Run:

```bash
cd frontend && npm test -- --run src/styles.tokens.test.ts src/App.test.tsx src/features/workspace/useScheduleJobs.test.ts
cd frontend && npm run build
```

Expected: all selected tests pass and Vite build succeeds; the existing bundle-size warning may remain.

- [ ] **Step 6: Commit semantic component styling.**

```bash
git add frontend/src/styles.css frontend/src/App.tsx frontend/src/styles.tokens.test.ts frontend/src/App.test.tsx
git commit -m "feat: apply bip semantic colors across workbench"
```

## Task 4: Visual verification and regression check

**Files:**
- No intended source changes; modify only if a test or visual check identifies a directly related color regression.

- [ ] **Step 1: Start or reuse the local application.**

Use the existing project startup path:

```bash
./startup.sh
```

Verify:

```bash
curl -fsS http://127.0.0.1:8080/
curl -fsS http://127.0.0.1:8081/actuator/health
curl -fsS http://127.0.0.1:8000/health
```

- [ ] **Step 2: Inspect the React workbench in the browser.**

Check the authenticated dashboard, `排程任务`, and `数据导入` screens at desktop and narrow widths. Confirm:

- the canvas is light gray/blue-gray rather than saturated blue;
- top navigation is light with dark text and red active emphasis;
- the left rail remains dark and its active marker is red;
- cards are white with subtle gray borders and restrained shadows;
- success/warning/danger states use green/orange/red and remain readable;
- no layout, navigation, loading, or action behavior changed.

Use the existing screenshot/runtime workflow if available; do not add a new browser driver for this color-only phase.

- [ ] **Step 3: Run the full verification suite.**

Run:

```bash
cd frontend && npm test -- --run
cd frontend && npm run build
cd ../backend && mvn -q test
cd .. && graphify update .
git diff --check HEAD~3
```

Expected: frontend tests pass, build succeeds with only the known bundle-size warning, backend suite passes with only the known Mockito warning, graphify updates successfully, and diff check is clean.

- [ ] **Step 4: Review scope and commit any direct fix.**

Confirm only `frontend/src/styles.css`, `frontend/src/App.tsx`, token tests, and directly related test files changed. Do not stage `.runtime`, `.superpowers`, screenshots, backend files, or unrelated work. If a visual fix is required, commit it separately with:

```bash
git add frontend/src/styles.css frontend/src/App.tsx frontend/src/styles.tokens.test.ts frontend/src/App.test.tsx
git commit -m "fix: polish bip workbench visual alignment"
```

## Acceptance criteria

1. The React workbench uses the legacy red brand and YonBIP/TinperNext light enterprise surfaces.
2. Blue is no longer the primary brand color; blue remains only as a secondary informational accent where useful.
3. Existing React layout, component structure, navigation, API behavior, and interactions are unchanged.
4. Jobs, import, scenario, login, loading, error, success, warning, and danger states remain visually distinguishable.
5. Token contract tests, full frontend tests, build, backend tests, and graphify update pass.
6. The second-phase TinperNext layout/component/interaction redesign remains separate and unimplemented by this plan.
