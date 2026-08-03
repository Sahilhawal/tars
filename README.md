<div align="center">

<img src="assets/tars.svg" alt="TARS" width="180">

**T A R S**

**An autonomous agent pipeline for [Claude Code](https://claude.ai/code).**

Spec-driven. Ticket-by-ticket. Adversarially reviewed. Gate-enforced.

*Honesty parameter: 100%. Your code merges when it earns it.*

![claude code plugin](https://img.shields.io/badge/Claude_Code-plugin-blueviolet)
![requires gh cli](https://img.shields.io/badge/requires-gh%20cli-black)
![version](https://img.shields.io/badge/version-0.2.0-green)

</div>

---

## 🤖 What is tars?

You don't write code. You write **specs** and **tickets** with machine-checkable acceptance criteria — then tars drives a loop of sub-agents that plan, implement (test-first, on a task branch), and adversarially review each ticket, merging only when quality gates pass and the reviewer approves.

Humans steer at the spec and milestone level. TARS does the rowing.

Every step leaves an audit trail on GitHub: PRDs are parent issues, tickets are sub-issues, plans and reviews are issue comments, and completion is machine-readable — `<status>COMPLETE|BLOCKED</status>`, `<verdict>APPROVE|REJECT</verdict>`. No vibes, no "looks done".

## 🌊 The flow

```
/ask-tars        guided setup — interviews you about your project, then bootstraps it
/brainstorm      rough idea → sharper version: grounded in your codebase, with suggestions
/grill-me        stress-test your idea — the agent interviews you relentlessly
/to-spec         conversation → spec: drafted in docs/specs/, published on approval as a PRD issue
/to-tickets      PRD → tracer-bullet tickets with blocking edges (sub-issues of the PRD)
/run-ticket 14   the loop: planner → implementer → gates → reviewer → merge
/run-frontier    AFK mode: unblocked tickets in parallel worktrees (max 3), serialized merges
/code-review     two-axis review (standards + spec) of any branch, on demand
/handoff         compact the session into a handoff doc for a fresh agent
```

The issue tree on GitHub mirrors the plan:

```
🔶 #12  PRD: User authentication            ← tars:prd
 ├─ #14  Login form end-to-end             ← tars:ticket, blocked by: none
 ├─ #15  Session middleware                ← blocked by #14
 └─ #16  Password reset flow               ← blocked by #14
```

## 🔁 The loop (`/run-ticket`)

```
ticket ─▶ planner sub-agent      posts implementation plan (issue comment)
       ─▶ implementer sub-agent  TDD on task/<N> branch, runs the gates
              │ gates red ×5 → BLOCKED, escalate to human
       ─▶ reviewer sub-agent     re-runs gates, hunts vacuous tests/races/scope creep
              │ REJECT → back to implementer (max 3 cycles) → tars:blocked
       ─▶ APPROVE → merge --no-ff to main, close issue, log PROGRESS.md
```

## 🛰️ AFK mode (`/run-frontier`)

Computes the **frontier** — tickets whose blockers are all closed — and runs independent tickets concurrently:

- Each ticket gets its own **git worktree** at `../<repo>.worktrees/task-<N>-<slug>` (never inside your repo)
- Worktrees are **bootstrapped automatically**: gitignored `.env*` files copied over, dependencies installed, per-worktree port/database overrides applied (so 3 parallel test runs don't collide)
- Planners run **first**, and their file lists are the overlap oracle — two tickets touching the same files never run in parallel
- Merges are **serialized**: work is parallel, the merge point is a queue of one
- Parallelism cap: **3**

Scope it to one PRD with `/run-frontier 12`, or say "run until done" and walk away.

## 📦 Install

### As a plugin — recommended

Available in every project, updates with the repo:

```
/plugin marketplace add Sahilhawal/tars
/plugin install tars@tars
```

Every push to `main` is a new version — refresh with `/plugin marketplace update tars`. Plugin skills are namespaced: `/tars:ask-tars`, `/tars:run-ticket`, etc.

### Symlink install — for hacking on tars itself

```bash
git clone https://github.com/Sahilhawal/tars && cd tars
./install.sh                    # user-level: available in every project
./install.sh --project <path>   # single project only
```

Links the working tree into `~/.claude/skills` and `~/.claude/agents` so edits take effect immediately. Skills are unprefixed (`/run-ticket`).

**Don't use both** — you'd get every skill twice.

## 🚀 Quickstart

In any project:

1. **`/ask-tars`** (or `/setup-tars` if you prefer the direct path) — scans your repo, agrees gate commands with you, creates the GitHub labels, `CLAUDE.md`, `CONTEXT.md`, and `docs/` structure. Once per project.
2. **`/brainstorm`** — bring a rough idea; leave with a sharper, codebase-grounded version of it.
3. **`/grill-me`** — the sharpened idea gets interviewed until it survives.
4. **`/to-spec`** — the conversation becomes a spec in `docs/specs/`. Approve it and it publishes as the **PRD issue**.
5. **`/to-tickets`** — the PRD breaks into tracer-bullet ticket sub-issues, each with machine-checkable acceptance criteria and declared blockers.
6. **`/run-ticket 14`** — or `/run-frontier` and go make coffee. ☕

## 🧱 What tars creates in your project

| Artifact | Where | Purpose |
|---|---|---|
| PRDs | GitHub issues (`tars:prd`) | The parent spec each feature hangs off |
| Tickets | GitHub sub-issues (`tars:ticket`) | Tracer-bullet slices with blocking edges |
| Plans & reviews | Issue comments | The audit trail, in the open |
| Gates | `CLAUDE.md` | Commands agents run verbatim — red gates, no merge |
| Glossary | `CONTEXT.md` | Domain vocabulary shared by code, tests, and agents |
| Decisions | `docs/adr/` | Architecture decisions code must not contradict |
| History | `docs/PROGRESS.md` | One line per merged ticket |

Labels: `tars:prd` · `tars:draft` (PRD under rework) · `tars:ticket` · `tars:ready` / `tars:in-progress` / `tars:blocked`.

No GitHub remote? Everything degrades to local files under `docs/` — you'll be told when it happens.

## 🧠 The agents

| Agent | Job | Rule it lives by |
|---|---|---|
| **planner** | Ticket → implementation plan (issue comment) | Read-only on the codebase. Plans, never writes. |
| **implementer** | TDD on the task branch until gates are green | Expected values from an independent source of truth, never recomputed like the code. |
| **reviewer** | Adversarial diff review, re-runs the gates | Default posture is REJECT. Approval is earned. |

## 🛠️ Requirements

- [Claude Code](https://claude.ai/code)
- [`gh` CLI](https://cli.github.com/), authenticated (PRDs and tickets are GitHub issues + sub-issues; local-file fallback exists)

## 📁 Layout

- `.claude-plugin/` — plugin + marketplace manifests (this repo is its own marketplace)
- `skills/` — the workflow (user-invoked orchestrators + model-invoked disciplines)
- `agents/` — the sub-agent contracts: planner, implementer, reviewer
- `templates/` — CLAUDE.md / CONTEXT.md seeds for new projects
- `install.sh` — symlink installer for the dev path

## ❓ FAQ

**Does it write code without me?**
Yes — that's the point. You approve the spec, the ticket breakdown, and nothing else unless something blocks. Every merge required green gates and an adversarial reviewer's explicit APPROVE.

**What stops it from going off the rails?**
Machine-checkable acceptance criteria, gates that run verbatim, a reviewer whose default answer is REJECT, a 3-cycle cap before escalation, and a rule that acceptance criteria never change mid-loop to make a failing ticket pass.

**Can I run tickets in parallel?**
`/run-frontier` — up to 3, each in its own bootstrapped worktree, merges serialized. One blocked ticket never halts the frontier.

**Why "tars"?**
Named after the robot, not the archive format. It does exactly what its settings say it will.

## 🙏 Credits

Skill format, grilling, tdd, code-review, and to-spec/to-tickets lineage: Matt Pocock's [skills](https://github.com/mattpocock/skills) (MIT). Completion signals, branch strategy, and structured verdicts inspired by [sandcastle](https://github.com/mattpocock/sandcastle).
