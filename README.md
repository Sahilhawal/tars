# tars

An agent pipeline for Claude Code: spec-driven, ticket-by-ticket, adversarially reviewed, gate-enforced. Seeded from [mattpocock/skills](https://github.com/mattpocock/skills), reworked around GitHub Issues and an autonomous sub-agent loop.

## The idea

You don't write code. You write **specs** and **tickets** with machine-checkable acceptance criteria — then `/run-ticket` drives a loop of sub-agents that plan, implement (test-first, on a task branch), and adversarially review, merging only when quality gates pass and the reviewer approves. Humans steer at spec and milestone level.

## The flow

```
/setup-tars      once per project: CLAUDE.md, CONTEXT.md, gates, GitHub labels
/grill-me        stress-test your idea — the agent interviews you relentlessly
/to-spec         conversation → spec (docs/specs/, versioned with the code)
/to-tickets      spec → tracer-bullet tickets with blocking edges (tars:ticket issues)
/run-ticket 14   the loop: planner → implementer → gates → reviewer → merge
/run-frontier    AFK mode: all unblocked tickets in parallel worktrees, serialized merges
/code-review     two-axis review (standards + spec) of any branch, on demand
/handoff         compact the session into a handoff doc for a fresh agent
```

## The loop (`/run-ticket`)

```
ticket ─▶ planner sub-agent     posts implementation plan (issue comment)
       ─▶ implementer sub-agent TDD on task/<N> branch, runs gates
              │ gates red ×5 → BLOCKED, escalate to human
       ─▶ reviewer sub-agent    re-runs gates, hunts vacuous tests/races/scope creep
              │ REJECT → back to implementer (max 3 cycles) → tars:blocked
       ─▶ APPROVE → merge --no-ff to main, close issue, log PROGRESS.md
```

Completion is machine-readable: `<status>COMPLETE|BLOCKED</status>`, `<verdict>APPROVE|REJECT</verdict>` — no vibes, no "looks done".

## Install

```bash
./install.sh                    # user-level: available in every project
./install.sh --project <path>   # single project only
```

Requires [Claude Code](https://claude.ai/code) and the `gh` CLI (specs/tickets are GitHub issues; local-file fallback exists).

## Layout

- `skills/` — the workflow (user-invoked orchestrators + model-invoked disciplines)
- `agents/` — the sub-agent contracts: planner, implementer, reviewer
- `templates/` — CLAUDE.md / CONTEXT.md seeds for new projects

## Credits

Skill format, grilling, tdd, code-review, to-spec/to-tickets lineage: Matt Pocock's [skills](https://github.com/mattpocock/skills) (MIT). Completion signals, branch strategy, and structured verdicts inspired by [sandcastle](https://github.com/mattpocock/sandcastle).
