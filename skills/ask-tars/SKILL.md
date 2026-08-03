---
name: ask-tars
description: Guided tars setup — interviews you about the things a repo scan can't decide (gates, env files, ports/databases, GitHub vs local), then applies the full bootstrap. The friendly front-end to /setup-tars.
disable-model-invocation: true
---

# Ask tars

Set up tars in the current project **by conversation**. You ask a few sharp questions, the user answers, and the project comes out bootstrapped. Use this when the user wants to be walked through setup rather than have it done to them; `setup-tars` is the same checklist without the interview.

## Process

### 1. Scan first, ask never what you can infer

Silently inspect the repo before asking anything:

- Stack and package manager (`package.json` + lockfile, `go.mod`, `pyproject.toml`, `Cargo.toml`) → propose gate commands, don't ask what they should be
- Existing `CLAUDE.md`, `CONTEXT.md`, `docs/` — never overwrite; note what exists
- `.env*` files (which are gitignored? `git check-ignore`) — these are what worktrees will need copied
- `gh auth status` and a GitHub remote

Show the user a one-paragraph summary of what you found: "Go project, `gh` authed, GitHub remote present, `.env` and `.env.local` gitignored, no CLAUDE.md yet."

### 2. Ask only the decisions

One batch of questions, only for what the scan couldn't decide:

1. **Gates** — "I'll use `<proposed commands>` as the quality gates. Good, or adjust?"
2. **Parallelism** — "When `/run-frontier` runs 3 tickets in parallel worktrees, do your gates or app start servers or touch real databases? If so, what per-worktree overrides should apply?" (suggest `PORT=3<N>` / test DB suffix `_wt<N>` if they're unsure)
3. **Env files** — "These gitignored env files exist: <list>. Copy all of them into new worktrees, or only some?"
4. **Issue tracker** — only if the scan found no GitHub remote: "Create one (`gh repo create`), or use local files under `docs/`?"

Ask conversationally — no interrogation. If the user says "just use sensible defaults," proceed with your proposals and note what you chose.

### 3. Apply

Run the **setup-tars checklist** with the user's answers: labels (`tars:prd`, `tars:draft`, `tars:ticket`, pipeline states), `CLAUDE.md` (gates + Parallel tickets section with the agreed overrides), `CONTEXT.md` (ask for 3–5 domain terms — this one always needs the user), `docs/specs/`, `docs/adr/`, `docs/PROGRESS.md`. Idempotent: skip anything that exists.

### 4. Report and point forward

One screen: what was created, what was skipped, what conventions were recorded. Then the next move: "Tell me about your first feature and I'll grill you on it (`grill-me`), or go straight to `/to-spec` if it's already clear."

## Hard rules

- Infer before asking; every question must be something the scan genuinely couldn't decide.
- Never overwrite an existing file or label — report and skip.
- The gate commands the user confirms are verbatim law — they go into CLAUDE.md exactly as agreed.
