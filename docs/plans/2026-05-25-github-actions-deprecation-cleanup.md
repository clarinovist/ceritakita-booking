# GitHub Actions Deprecation Cleanup Plan

> For Hermes: keep this as a narrow workflow-maintenance change. No app/runtime behavior changes beyond the workflow toolchain.

Goal: remove current GitHub Actions deprecation warnings from `ceritakita-booking` CI/CD while preserving existing release/build/deploy behavior.

Architecture:
- Keep the existing single workflow shape (`release-please` + `build-and-push` + `deploy`).
- Upgrade action versions to Node 24-compatible releases.
- Replace the deprecated `google-github-actions/release-please-action` namespace with the supported `googleapis/release-please-action` namespace.

Tech stack: GitHub Actions, GHCR, Docker buildx, appleboy SSH deploy.

Observed evidence:
- Current workflow file: `.github/workflows/build.yml`
- Current warnings from live runs:
  - `google-github-actions/release-please-action@v4` is deprecated; recommended replacement is `googleapis/release-please-action`
  - Node 20 action deprecation warnings for:
    - `google-github-actions/release-please-action@v4`
    - `actions/checkout@v4`
    - `docker/setup-buildx-action@v3`
    - `docker/login-action@v3`
    - `docker/build-push-action@v5`
- Latest safe upstreams checked during audit:
  - `googleapis/release-please-action@v5.0.0` → `runs.using: node24`
  - `actions/checkout@v6.0.2` → `runs.using: node24`
  - `docker/setup-buildx-action@v4.1.0` → `runs.using: node24`
  - `docker/login-action@v4.2.0` → `runs.using: node24`
  - `docker/build-push-action@v7.2.0` → `runs.using: node24`
  - `appleboy/ssh-action@v1.2.5` is composite-based and safe to update opportunistically

Files to change:
- Modify: `.github/workflows/build.yml`
- Create: `docs/plans/2026-05-25-github-actions-deprecation-cleanup.md`

Non-goals:
- Do not redesign the deploy script.
- Do not split workflows yet.
- Do not change repo secrets, deploy host, or runtime image tags.

---

## Task 1: Replace deprecated release-please action namespace

Objective: remove the explicit deprecation warning while keeping the release-please job behavior.

Files:
- Modify: `.github/workflows/build.yml`

Change:
- from `google-github-actions/release-please-action@v4`
- to `googleapis/release-please-action@v5`

Verification:
- Workflow YAML still parses
- release job still has same `with: release-type: node`

Commit message:
- `ci: replace deprecated release-please action`

---

## Task 2: Upgrade Node-20-based actions to Node-24-compatible versions

Objective: remove Node 20 runtime deprecation warnings without changing workflow intent.

Files:
- Modify: `.github/workflows/build.yml`

Changes:
- `actions/checkout@v4` → `@v6`
- `docker/setup-buildx-action@v3` → `@v4`
- `docker/login-action@v3` → `@v4`
- `docker/build-push-action@v5` → `@v7`
- `appleboy/ssh-action@v1.0.3` → `@v1.2.5`

Verification:
- Workflow YAML still parses
- build/deploy job structure unchanged

Commit message:
- `ci: upgrade workflow actions for node24`

---

## Task 3: Validate locally and ship through normal PR flow

Objective: make the smallest workflow-only PR and verify GitHub executes it successfully.

Commands:
- inspect diff
- commit only workflow + plan doc
- push branch
- open PR
- merge when clean

Expected:
- workflow run succeeds on `main`
- warning set should materially drop or disappear

---

## Task 4: Post-merge verification

Objective: confirm CI/CD still builds and deploys normally.

Commands:
- `gh run list --repo clarinovist/ceritakita-booking --branch main --limit 3 --json ...`
- `gh run view <run-id> --json jobs,conclusion`
- optionally inspect annotations/logs for residual deprecation warnings
- verify VPS app still healthy after deploy

Success criteria:
- run conclusion `success`
- no `google-github-actions/release-please-action is deprecated` warning
- no Node 20 deprecation warnings for upgraded actions
- VPS deployment still succeeds unchanged

Risks and mitigations:
- Risk: upstream action majors may have input changes.
  - Mitigation: keep config minimal and audit upstream README/action.yml before changing.
- Risk: release-please behavior shift between major versions.
  - Mitigation: only preserve existing `release-type: node` path and verify the release job completes in CI.
