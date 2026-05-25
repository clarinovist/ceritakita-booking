# Server Action Mismatch Hardening Plan

> For Hermes: follow systematic-debugging first, then implement the smallest safe mitigation and ship through normal CI/CD.

Goal: reduce repeated stale-client Server Action mismatch noise after deploys without weakening app behavior or bypassing CI/CD.

Architecture:
- Keep the existing client-side mismatch recovery pattern, but make it idempotent and less loop-prone.
- Reduce cache lifetime for user-interactive App Router pages so stale HTML shells are less likely to survive across deploys.
- Preserve the current server-side stderr suppression so alerts remain quiet, while making the client recovery more deterministic.

Tech stack: Next.js 14 App Router, next-auth middleware, Docker + GHCR + GitHub Actions deploy.

Observed evidence:
- VPS runtime is healthy after deploy: container healthy, `/api/health` returns 200, DB connected.
- Repeated log noise still appears: `Failed to find Server Action "x". This request might be from an older or newer deployment.`
- Existing mitigation already exists in three places:
  - `instrumentation.ts` suppresses stderr noise
  - `components/DeploymentMismatchHandler.tsx` auto-refreshes on client-side error events
  - `app/error.tsx` auto-refreshes when the error boundary catches a mismatch
- Current interactive pages such as `/` and `/login` still return `Cache-Control: s-maxage=31536000, stale-while-revalidate`, which increases the chance of stale HTML surviving across deploy boundaries.
- Current refresh logic uses `window.location.assign(window.location.href)` with no once-per-tab guard, so a stale client can repeatedly trigger refresh attempts until the browser finally lands on fresh HTML.

Files likely to change:
- Modify: `components/DeploymentMismatchHandler.tsx`
- Modify: `app/error.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/login/page.tsx`
- Modify: `app/admin/layout.tsx`

Non-goals:
- Do not redesign auth flow.
- Do not rewrite runtime caching globally for all API routes.
- Do not mutate VPS config directly; deploy through repo + CI/CD only.

---

## Phase 1: Make mismatch recovery idempotent

### Task 1: Extract a once-per-tab deployment recovery helper
Objective: ensure stale-client recovery happens at most once per tab/session instead of refreshing repeatedly.

Files:
- Create: `lib/client/deployment-recovery.ts`
- Modify: `components/DeploymentMismatchHandler.tsx`
- Modify: `app/error.tsx`

Implementation notes:
- Create helper functions around `sessionStorage`:
  - `DEPLOYMENT_MISMATCH_RECOVERY_KEY`
  - `hasDeploymentRecoveryRun()`
  - `markDeploymentRecoveryRun()`
  - `clearDeploymentRecoveryMarker()`
  - `reloadForDeploymentMismatch()`
- `reloadForDeploymentMismatch()` should:
  - return early if `window` is unavailable
  - if marker already exists, return `false`
  - otherwise set the marker and trigger a hard reload via `window.location.replace(window.location.href)`
- In `DeploymentMismatchHandler`, call helper instead of direct `window.location.assign(...)`
- In `app/error.tsx`, use the same helper in both auto-reload and button click paths
- Only log a warning the first time recovery is triggered

Verification:
- TypeScript compiles
- Recovery code path becomes shared and deterministic

Commit message:
- `fix(frontend): make deployment mismatch recovery idempotent`

---

## Phase 2: Shorten cache lifetime on interactive App Router pages

### Task 2: Force dynamic rendering for root login/admin shells
Objective: reduce stale HTML shell reuse on pages where users interact with live state and auth/session-sensitive actions.

Files:
- Modify: `app/layout.tsx`
- Modify: `app/login/page.tsx`
- Modify: `app/admin/layout.tsx`

Implementation notes:
- Add `export const dynamic = 'force-dynamic'` where appropriate for interactive shells.
- Add `export const revalidate = 0` where appropriate for the root app shell / login / admin shell.
- Keep this scoped to interactive shells first; do not sweep all pages unless needed.
- Rationale: lower risk than broad infra changes, and directly targets stale HTML causing client/server action mismatches after deploy.

Verification:
- Local `curl -I` on built app should no longer show year-long stale cache behavior for these shells once deployed.
- App still loads normally and auth redirect behavior remains unchanged.

Commit message:
- `fix(frontend): reduce stale shell caching on interactive routes`

---

## Phase 3: Verify locally

### Task 3: Run local verification
Objective: ensure no regressions before shipping.

Files:
- No new files

Commands:
- `npm run lint`
- `npm run build`

Expected:
- both pass successfully

Optional spot check after local run:
- inspect relevant files to confirm shared helper import usage and dynamic/revalidate exports are present.

Commit message:
- no separate commit if bundled into the two fix commits above; otherwise use `test: verify deployment mismatch hardening`

---

## Phase 4: Ship through CI/CD and verify on VPS

### Task 4: Create branch, commit, push, open PR
Objective: ship via the normal repo workflow.

Commands:
- `git checkout -b fix/server-action-mismatch-hardening`
- stage only changed files
- `git commit ...`
- `git push -u origin fix/server-action-mismatch-hardening`
- `gh pr create ...`

PR scope summary:
- makes mismatch recovery single-shot per tab
- reduces stale interactive shell caching on login/admin/root layouts

### Task 5: Merge after checks and verify VPS
Objective: confirm runtime improvement on nugrohopramono.

Verification commands after merge/deploy:
- `gh run list --repo clarinovist/ceritakita-booking --branch main --limit 3 --json ...`
- `ssh nugrohopramono "docker ps --filter name=ceritakita-booking ..."`
- `ssh nugrohopramono "curl -sSI http://127.0.0.1:3001/ | grep -Ei 'HTTP/|Cache-Control|x-nextjs-cache'"`
- `ssh nugrohopramono "curl -sSI http://127.0.0.1:3001/login | grep -Ei 'HTTP/|Cache-Control|x-nextjs-cache'"`
- `ssh nugrohopramono "docker logs --since 30m ceritakita-booking 2>&1 | grep -c 'Failed to find Server Action' || true"`

Success criteria:
- deploy workflow succeeds
- container remains healthy
- interactive page cache headers are less stale-friendly than before
- mismatch log frequency drops materially after fresh deploy window

---

## Risks and mitigations
- Risk: forcing dynamic rendering on too many pages can reduce cache efficiency.
  - Mitigation: scope only to root/login/admin interactive shells first.
- Risk: once-per-tab recovery could suppress a legitimate second recovery need in the same tab.
  - Mitigation: acceptable tradeoff; prevents refresh loops and the next navigation after a successful reload should be on the current build.
- Risk: warning count may not drop to absolute zero immediately because existing stale tabs/users can still hit the old build for a while.
  - Mitigation: success is lower recurrence and safer recovery, not instant zero.
