---
name: run-frontier
description: Run all unblocked tickets in parallel — one git worktree per ticket, planners first to detect file overlap, serialized merges into main. The AFK mode of tars.
disable-model-invocation: true
---

# Run Frontier

The parallel, AFK version of `/run-ticket`. Computes the **frontier** — open `tars:ready` tickets whose blockers are all closed — and runs independent tickets concurrently, each in its own git worktree. You (the orchestrator) coordinate; sub-agents do the work.

## The protocol

### 1. Compute the frontier
`gh issue list --label tars:ready --state open` — for each, read its **Blocked by** references; a ticket is runnable only if every blocker is closed. List the frontier to the user: ticket #, title, one-line scope.

### 2. Plan all frontier tickets first
For each runnable ticket, spawn a **planner** sub-agent (they may run in parallel). Each posts its `## Implementation Plan` comment ending with `<status>COMPLETE</status>`.

### 3. Partition by file overlap
Compare the planners' **Files to create/modify** lists across tickets:
- **No overlap** → safe to run in parallel (max 3 concurrent).
- **Overlap** → sequence them; run the one with more dependents first, the other joins the next frontier round.
Tell the user the partition: "parallel: #5, #7 · queued: #9 (touches server/main.go, overlaps #7)".

### 4. Run each ticket in its own worktree
Per parallel ticket:
```
git worktree add .worktrees/task-<N> -b task/<N>-<slug> main
```
Then run the standard `/run-ticket` loop (steps 2–3: implementer → reviewer, max 3 cycles) **with that worktree as the working directory**. Each loop is an independent background agent. Label flips as usual (`tars:in-progress`), so the kanban shows all in-flight tickets.

A ticket that exhausts its cycles gets `tars:blocked`; its worktree stays for inspection. Others continue — one blocked ticket never halts the frontier.

### 5. Serialize the merges
Work is parallel; merging is not. When a ticket earns `<verdict>APPROVE</verdict>`:
1. In its worktree: `git fetch origin main && git rebase main` (or `git rebase main` against local main)
2. Re-run the full gates post-rebase — red gates bounce the ticket back to the implementer with the failure
3. In the main checkout: `git merge --no-ff task/<N>-<slug>` — never a conflict, the rebase absorbed it
4. `git worktree remove .worktrees/task-<N>`, delete the branch, `gh issue close <N>`, log to `docs/PROGRESS.md`

Only one merge in flight at a time. If two tickets approve simultaneously, merge in ticket-number order.

### 6. Report and recompute
One screen: which tickets merged, which blocked (with findings), current frontier. Newly unblocked tickets form the next frontier — ask the user before starting the next round (or continue automatically if they said "AFK" / "run until done").

## Hard rules
- Never run two tickets touching the same files in parallel — the planner file lists are the overlap oracle, not vibes.
- Never merge in parallel. The merge point is a queue of one.
- Never merge without a fresh post-rebase gate pass and reviewer APPROVE.
- `.worktrees/` must be in `.gitignore`.
- Parallelism cap: 3. The user may lower it, never raise it past 3 without explicitly saying so.
