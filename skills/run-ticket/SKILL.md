---
name: run-ticket
description: Run one ticket through the autonomous pipeline — plan, implement on a task branch, verify gates, adversarial review, merge on approval. The heart of tars.
disable-model-invocation: true
---

# Run Ticket

Drive one ticket through the full autonomous loop. You (the orchestrator) coordinate sub-agents; you do not write product code yourself.

**Argument:** a ticket issue number (e.g. `/run-ticket 14`). Tickets are GitHub issues; status is tracked with labels (`tars:ready`, `tars:in-progress`, `tars:blocked`; closed = done). If the project uses the local-files fallback instead, the same loop applies with ticket files under `docs/tickets/` and a `**Status:**` line in place of labels.

## The loop

### 0. Pre-flight
- `gh issue view <N> --comments` — read the ticket fully. It should be a sub-issue of a PRD issue; the body's **Parent PRD** section names it. View the PRD issue too — it's the spec the planner and reviewer judge against.
- Check its **Blocked by** references: every blocking issue must be closed. If not, stop and name the open blockers.
- Check the acceptance criteria are machine-checkable. Vague criteria → stop, invoke `grilling` with the user to sharpen them (update the issue body after).
- `gh issue edit <N> --remove-label tars:ready --add-label tars:in-progress`
- Create branch `task/<N>-<slug>` from an up-to-date `main`.

### 1. Plan
Spawn the **planner** sub-agent with the issue number. It posts its implementation plan as an issue comment. If it ends `<status>BLOCKED</status>` with an ambiguity, surface the question to the user and stop.

### 2. Implement
Spawn the **implementer** sub-agent with the issue number and the gate commands from CLAUDE.md. It works test-first (pass it the `tdd` skill's seam and anti-pattern rules), commits on the task branch, and ends with a completion signal:
- `<status>COMPLETE</status>` — gates green, criteria checked
- `<status>BLOCKED</status>` + reason — gates still failing after 5 fix iterations

BLOCKED → show the user the failure verbatim and stop.

### 3. Review
Spawn the **reviewer** sub-agent with the issue number and diff range `main...HEAD`. It re-runs the gates itself and posts its review as an issue comment, ending with:
- `<verdict>APPROVE</verdict>`
- `<verdict>REJECT</verdict>` + numbered findings (file:line, defect, required change)

REJECT → return to step 2 with the findings pasted into the implementer's prompt. Maximum **3 implement–review cycles**; after the third REJECT, `gh issue edit <N> --add-label tars:blocked`, report all findings, and stop for the user.

### 4. Merge
On APPROVE:
- Merge `task/<N>-<slug>` into `main` (`--no-ff`, so ticket boundaries stay visible in history) with message `feat: <ticket title> (#<N>)`.
- Delete the task branch.
- `gh issue close <N>` — unchecked acceptance-criterion boxes get checked first via a final comment confirming each was verified.
- Append one line to `docs/PROGRESS.md`: ticket #, branch, one-sentence outcome.

### 5. Report
One screen to the user: verdict, cycles used, gates run, what to demo. Then name the next runnable tickets — open `tars:ready` issues whose blockers are all closed (`gh issue list --label tars:ready`). Do not auto-start the next ticket — the user decides, or says "run the frontier".

## Hard rules for the orchestrator
- One ticket at a time per working tree. To run independent tickets concurrently, use `/run-frontier` — it gives each ticket its own git worktree and serializes merges.
- Never merge without `<verdict>APPROVE</verdict>` from the reviewer sub-agent. Your own reading of the diff is not approval.
- Never edit the acceptance criteria mid-loop to make a failing ticket pass. Criteria change = stop, back to the user.
