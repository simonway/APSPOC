# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

### Added

- formal version governance approvals with `APPROVED` and `REJECTED` states, plus backend `approve / reject` APIs and audit events
- backend-enforced `Admin / Planner / Approver / Viewer` role model carried through login session payloads and UI action visibility
- durable schedule job lifecycle with `CREATED / QUEUED / RUNNING / SUCCEEDED / FAILED / TIMEOUT / CANCELLED`
- job `cancel / retry` APIs and restart-time resume from persisted request snapshots
- inventory coverage markers on version Gantt data so demands fulfilled by opening stock stay visible during UAT review
- `earliness` objective weight through sample package, backend request snapshots, and solver objective wiring

### Changed

- release verification now covers four-role authentication, approval/reject/publish/rollback governance flow, and `UAT_v1_sample_package` end-to-end smoke
- README and release documents now align on the Phase 2 roadmap-closure wording and reference the `2026-05-11` release smoke acceptance record
- Snow Beer UAT sample package and smoke notes now reflect the business-facing walkthrough for inventory coverage and near-due scheduling
- UAT smoke tooling now auto-detects `utf-8-sig / utf-8 / gb18030 / gbk` package CSV files instead of requiring manual transcoding

### Fixed

- Excel template export no longer relies on POI column autosizing, which removes the local `ModelImportServiceTest` JVM crash and restores green backend full-suite test runs
- persisted version snapshots now retain `inventoryDemands.priority`, allowing inventory coverage replay to match the original demand ordering
- current-code backend smoke now verifies the fresh version behavior instead of relying on older snapshots generated before the new UAT features were wired in

## 0.1.0 - 2026-04-27

### Added

- login, session persistence, logout, and account credential update for the local APS workspace
- version governance flow with `DRAFT`, `READY_FOR_RELEASE`, `RELEASED`, `ARCHIVED`, and `ROLLED_BACK` statuses
- governance APIs for release note save, submit-for-release, publish, rollback, audit history, version history, and version diff
- model import endpoints for resources, tasks, and downtimes, plus Excel template export
- local startup and stop scripts for frontend, backend, solver, and optional infra bootstrap
- release regression automation via `scripts/verify-release.sh`, `scripts/release_smoke.py`, and GitHub Actions

### Changed

- frontend evolved into a static bilingual scheduling workspace with version list, governance panels, and richer Gantt interaction
- Gantt draft interaction now supports drag/resize, cross-row moves, undo via `Ctrl+Z`, task lock/unlock, and change-to-Gantt navigation from version diff
- trial solve now carries draft pinned/unpinned state so unlocked tasks can be rescheduled correctly
- version list now supports draft count display, single delete, and bulk delete flows
- README now documents runtime verification, startup/restart guidance, release verification, and troubleshooting

### Fixed

- version diff task selection now reveals the related row or task in the right-side Gantt
- unlocking a task now rebuilds the Gantt lane so drag handles and pointer interactions are restored immediately
- version diff now shows directional lock-state changes instead of a generic pinned-state message
