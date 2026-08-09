---
name: status
description: Report what's happening right now in the tars pipeline — which ticket(s) are running, what step they're on, and how long since the last update. Reads the shared status log so the user never has to tail it manually. Use whenever the user asks "where's ticket <N>", "is it stuck", "what's running", "status of the frontier", "any progress", or similar — during or between /run-ticket and /run-frontier runs.
---

# Status

Answer "where is it" without the user tailing anything themselves.

## Process
1. Read the shared log: `cat "$(git rev-parse --git-common-dir)/tars-status.log" 2>/dev/null`. Missing or empty → say so plainly: no run has logged anything yet.
2. If the user named a ticket, filter to lines containing `#<N>`; otherwise consider every distinct ticket number that appears.
3. For each ticket in scope, take its **last** matching line — that's its current step. Diff its timestamp against `date '+%Y-%m-%d %H:%M:%S'` (now) to report elapsed time in plain language ("started 4 min ago", "last update 22 min ago") — never just echo the raw timestamp.
4. Cross-check against the real state: `gh issue view <N> --json labels,state -q '.state, .labels[].name'`. The log is a live trace, not authoritative — labels and closed/open state are.

## Output
One line per in-scope ticket: `#<N> · <role> · <last step> · <elapsed> ago`. If a ticket's last log line is stale relative to how long that kind of step normally takes (an implementer with no update in 20+ minutes mid gate-fix, say), flag it as **possibly** stuck — don't assert it. The log only has checkpoints, not a heartbeat, so silence isn't proof of a hang; a slow gate command explains it just as well.

If the user asked about a specific ticket and it has no log lines at all, but its label shows `tars:in-progress` or `tars:in-review`, say the run predates this logging (or started in a session where it wasn't wired up) rather than implying nothing is happening.

## Hard rules
- Read-only: `cat`, `tail`, `gh issue view`. Never edit the log, labels, or issues.
- Don't fabricate progress or a trajectory. Report exactly what the last matching line says, not what you infer should come next.
