---
name: run-ticket
description: Run one ticket through the autonomous pipeline — plan, implement on a task branch, verify gates, adversarial review, open a PR on approval. The heart of tars.
---

# Run Ticket

Drive one ticket through the full autonomous loop. You (the orchestrator) coordinate sub-agents; you do not write product code yourself.

**Argument:** a ticket issue number (e.g. `/run-ticket 14`), optionally followed by `--worktree` (e.g. `/run-ticket 14 --worktree`) to run this ticket in its own git worktree instead of the current working tree — use this when another session is already active in the current one and you don't want the two to collide. Tickets are GitHub issues; status is tracked with labels (`tars:ready`, `tars:in-progress`, `tars:blocked`; closed = done). If the project uses the local-files fallback instead, the same loop applies with ticket files under `docs/tickets/` and a `**Status:**` line in place of labels.

## Progress log

Every step below, and every sub-agent it spawns, appends a line to a shared status log at `$(git rev-parse --git-common-dir)/tars-status.log` — one file, disposable, not part of the audit trail (GitHub issues remain the source of truth). The user shouldn't need to read this file directly — if they ask where things are, use the `status` skill to answer from it. (It can also be tailed directly: `tail -f "$(git rev-parse --git-common-dir)/tars-status.log"`.)

## The loop

### 0. Pre-flight
- `gh issue view <N> --comments` — read the ticket fully. It should be a sub-issue of a PRD issue; the body's **Parent PRD** section names it. View the PRD issue too — it's the spec the planner and reviewer judge against.
- Check its **Blocked by** references: every blocking issue must be closed. If not, stop and name the open blockers.
- Check the acceptance criteria are machine-checkable. Vague criteria → stop, invoke `grilling` with the user to sharpen them (update the issue body after).
- `gh issue edit <N> --remove-label tars:ready --add-label tars:in-progress`
- **Branch and working tree:**
  - Default: create branch `task/<N>-<slug>` from an up-to-date `main`, in the current working tree.
  - `--worktree` passed: create a dedicated worktree instead, so this ticket never touches whatever the current working tree is already doing — `git worktree add ../<repo>.worktrees/task-<N>-<slug> -b task/<N>-<slug> main`. Bootstrap it exactly as `/run-frontier`'s step 4 does (copy gitignored `.env*` files, apply any per-worktree port/DB overrides from CLAUDE.md, install dependencies by lockfile — never copy `node_modules`). Every step below then runs with that worktree as the working directory.
- Log it: `echo "$(date '+%Y-%m-%d %H:%M:%S') #<N> orchestrator: starting run-ticket" >> "$(git rev-parse --git-common-dir)/tars-status.log"`

### 1. Plan
Log `#<N> orchestrator: spawning planner`, then spawn the **planner** sub-agent with the issue number. It posts its implementation plan as an issue comment. If it ends `<status>BLOCKED</status>` with an ambiguity, surface the question to the user and stop.

### 2. Implement
Log `#<N> orchestrator: spawning implementer`, then spawn the **implementer** sub-agent with the issue number and the gate commands from CLAUDE.md. It works test-first (pass it the `tdd` skill's seam and anti-pattern rules), commits on the task branch, and ends with a completion signal:
- `<status>COMPLETE</status>` — gates green, criteria checked
- `<status>BLOCKED</status>` + reason — gates still failing after 5 fix iterations

BLOCKED → show the user the failure verbatim and stop.

### 3. Review
Log `#<N> orchestrator: spawning reviewer (cycle <c>/3)`, then spawn the **reviewer** sub-agent with the issue number and diff range `main...HEAD`. It re-runs the gates itself and posts its review as an issue comment, ending with:
- `<verdict>APPROVE</verdict>`
- `<verdict>REJECT</verdict>` + numbered findings (file:line, defect, required change)

REJECT → return to step 2 with the findings pasted into the implementer's prompt. Maximum **3 implement–review cycles**; after the third REJECT, `gh issue edit <N> --add-label tars:blocked`, report all findings, and stop for the user.

### 4. Open PR
On APPROVE:
- Unchecked acceptance-criterion boxes get checked first via a final issue comment confirming each was verified.
- Push the task branch: `git push -u origin task/<N>-<slug>`.
- `gh pr create --base main --head task/<N>-<slug> --title "feat: <ticket title> (#<N>)" --body "Closes #<N>."` — the `Closes #<N>` keyword auto-closes the ticket when the PR is merged.
- `gh issue edit <N> --remove-label tars:in-progress --add-label tars:in-review`.
- Append one line to `docs/PROGRESS.md`: ticket #, branch, PR link, one-sentence outcome.
- Ran with `--worktree`: `git worktree remove ../<repo>.worktrees/task-<N>-<slug>` — when the group dir is empty, remove `../<repo>.worktrees/` too.
- Log `#<N> orchestrator: PR opened`.

tars never merges. Opening the PR is the last automated step — merging `task/<N>-<slug>` into `main` is yours, whenever you're ready. When you do, the project's `tars-cleanup` GitHub Actions workflow (installed by `setup-tars`) takes over: it strips the `tars:in-review` label GitHub's auto-close leaves stale, and closes the parent PRD once every sub-issue under it is closed.

### 5. Report
One screen to the user: verdict, cycles used, gates run, the PR link, what to demo. Then name the next runnable tickets — open `tars:ready` issues whose blockers are all closed (`gh issue list --label tars:ready`). Note that a blocker only clears once its ticket's PR is actually merged, not just opened. Do not auto-start the next ticket — the user decides, or says "run the frontier".

## Hard rules for the orchestrator
- One ticket at a time per working tree. Pass `--worktree` to isolate a single ticket in its own worktree (e.g. another session is already active in the current one). To run several tickets concurrently, use `/run-frontier` — it gives each ticket its own git worktree and serializes PR creation.
- Never open a PR without `<verdict>APPROVE</verdict>` from the reviewer sub-agent. Your own reading of the diff is not approval.
- Never merge to `main`. That's the user's call, always.
- Never edit the acceptance criteria mid-loop to make a failing ticket pass. Criteria change = stop, back to the user.
