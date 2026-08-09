---
name: run-frontier
description: Run all unblocked tickets in parallel — one git worktree per ticket, planners first to detect file overlap, serialized PR creation. Pass a PRD issue number to scope to its sub-issues. The AFK mode of tars.
disable-model-invocation: true
---

# Run Frontier

The parallel, AFK version of `/run-ticket`. Computes the **frontier** — open `tars:ready` tickets whose blockers are all closed — and runs independent tickets concurrently, each in its own git worktree. You (the orchestrator) coordinate; sub-agents do the work.

## The protocol

### 1. Compute the frontier
`gh issue list --label tars:ready --state open` — for each, read its **Blocked by** references; a ticket is runnable only if every blocker is closed.

If the user passed a PRD issue number (e.g. `/run-frontier 12`), scope the frontier to that PRD's sub-issues:

```
gh api repos/{owner}/{repo}/issues/12/sub_issues --jq '.[].number'
```

List the frontier to the user: ticket #, title, one-line scope.

### 2. Plan all frontier tickets first
For each runnable ticket, spawn a **planner** sub-agent (they may run in parallel). Each posts its `## Implementation Plan` comment ending with `<status>COMPLETE</status>`.

### 3. Partition by file overlap
Compare the planners' **Files to create/modify** lists across tickets:
- **No overlap** → safe to run in parallel (max 3 concurrent).
- **Overlap** → sequence them; run the one with more dependents first, the other joins the next frontier round.
Tell the user the partition: "parallel: #5, #7 · queued: #9 (touches server/main.go, overlaps #7)".

### 4. Run each ticket in its own worktree

Worktrees live **outside the repo**, grouped under one sibling directory — never inside the working tree (no `.gitignore` noise, no watchers indexing 3 extra `node_modules`):

```
git worktree add ../<repo>.worktrees/task-<N>-<slug> -b task/<N>-<slug> main
```

**Bootstrap each worktree before spawning its loop** — a fresh worktree has no gitignored files and no dependencies:

1. **Copy env files.** Any gitignored `.env*` file (root or nested) from the main checkout, preserving paths:

   ```
   for f in $(find . -name '.env*' -type f -not -path '*/node_modules/*' -not -path '*/.git/*'); do
     git check-ignore -q "$f" && cp --parents "$f" ../<repo>.worktrees/task-<N>-<slug>/
   done
   ```

2. **Apply per-worktree overrides** if CLAUDE.md records them (ports, test databases — see `/setup-tars`): e.g. `PORT=3<N>` appended to the worktree's `.env`, test database suffixed `_wt<N>`. Without this, parallel gates collide on the same port or database.

3. **Install dependencies** by lockfile — `pnpm i --frozen-lockfile`, `npm ci`, `yarn install --frozen-lockfile`, `go mod download`. Never copy `node_modules` between worktrees.

Then run the standard `/run-ticket` loop (steps 2–3: implementer → reviewer, max 3 cycles) **with that worktree as the working directory**. Each loop is an independent background agent. Label flips as usual (`tars:in-progress`), so the kanban shows all in-flight tickets.

A ticket that exhausts its cycles gets `tars:blocked`; its worktree stays for inspection. Others continue — one blocked ticket never halts the frontier.

### 5. Serialize the PRs
Work is parallel; opening PRs is not. When a ticket earns `<verdict>APPROVE</verdict>`:
1. In its worktree: `git fetch origin main && git rebase main` (or `git rebase main` against local main)
2. Re-run the full gates post-rebase — red gates bounce the ticket back to the implementer with the failure
3. `git push -u origin task/<N>-<slug>`
4. `gh pr create --base main --head task/<N>-<slug> --title "feat: <ticket title> (#<N>)" --body "Closes #<N>."`, then `gh issue edit <N> --remove-label tars:in-progress --add-label tars:in-review`
5. `git worktree remove ../<repo>.worktrees/task-<N>-<slug>`, log the PR link to `docs/PROGRESS.md` — when the group dir is empty, remove `../<repo>.worktrees/` too

Leave the branch and issue alone otherwise — merging (and the resulting issue close via `Closes #<N>`) is the user's call. Only one PR opened at a time. If two tickets approve simultaneously, open PRs in ticket-number order.

### 6. Report and recompute
One screen: which tickets have PRs open (with links), which blocked (with findings), current frontier. A ticket's blockers only clear once its blocking ticket is actually **merged** on GitHub, not just PR'd — so the next round may be waiting on you, not on tars. Newly unblocked tickets form the next frontier — ask the user before starting the next round (or continue automatically if they said "AFK" / "run until done", checking back once you've merged the blocking PRs).

## Hard rules
- Never run two tickets touching the same files in parallel — the planner file lists are the overlap oracle, not vibes.
- Never open PRs in parallel. PR creation is a queue of one.
- Never open a PR without a fresh post-rebase gate pass and reviewer APPROVE.
- Never merge to `main`. That's the user's call, always — tars stops at opening the PR.
- Worktrees live in `../<repo>.worktrees/` — never inside the repo's working tree. Each must be bootstrapped (env files, per-worktree port/DB overrides, dependency install) before its loop starts.
- Parallelism cap: 3. The user may lower it, never raise it past 3 without explicitly saying so.
