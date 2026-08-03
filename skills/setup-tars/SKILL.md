---
name: setup-tars
description: Bootstrap tars in the current project — CLAUDE.md, CONTEXT.md, docs structure, GitHub labels, gate commands. Run once per project.
disable-model-invocation: true
---

# Setup tars

Bootstrap the current project so the tars loop can run in it. Idempotent: never overwrite a file or label that exists — report it and skip.

## Process

1. **Discover the stack.** Inspect the repo (package.json, go.mod, etc.) to determine languages and toolchains. Facts come from the environment, not from asking.

2. **Verify GitHub.** `gh auth status` and a GitHub remote must both exist — PRDs and tickets live as issues (parent + sub-issues). If `gh` is missing or unauthenticated, tell the user to fix it (`gh auth login`) before continuing. If the repo has no GitHub remote, ask the user whether to create one (`gh repo create`) or fall back to local files under `docs/`.

3. **Create the labels** (skip any that exist):
   - `tars:prd` — a PRD: the parent spec issue that tickets attach to as sub-issues
   - `tars:draft` — on a PRD issue: not approved, `/to-tickets` refuses to break it down
   - `tars:ticket` — an implementable ticket (a sub-issue of a PRD)
   - `tars:ready` / `tars:in-progress` / `tars:blocked` — ticket pipeline state

   (Spec *drafts* live locally in `docs/specs/` until approved, then publish as the PRD issue — so `docs/specs/` still gets created below.)

4. **Agree the gates.** Propose the project's gate commands and confirm them with the user:
   - Go: `go build ./...`, `go vet ./...`, `go test -race ./...`
   - TypeScript: `npx tsc --noEmit`, `npx eslint .`, `npx vitest run`
   Adjust to what the repo actually has. These exact commands go into CLAUDE.md — agents and hooks run them verbatim.

   **Ask about parallelism:** do the gates (or the app) start servers or touch real databases? If so, `/run-frontier`'s parallel worktrees will collide on ports and shared databases. Agree a per-worktree override convention — e.g. `PORT=3<ticket-number>`, test database suffixed `_wt<N>` — and record it in CLAUDE.md under "Parallel tickets". If everything is in-process and ephemeral, say so there instead.

5. **Create the structure:**
   - `CLAUDE.md` — the gate commands, conventions (conventional commits, branch naming `task/<issue>-<slug>`), and the standing rule that no change merges with red gates.
   - `CONTEXT.md` — domain glossary stub. Ask the user for 3–5 core domain terms with one-line definitions to seed it.
   - `docs/specs/`, `docs/adr/` and `docs/PROGRESS.md` (header `# Progress`, section `## Log`).

6. **Report** what was created and the next move: grill the user about the first feature, then `/to-spec`.
