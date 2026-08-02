---
name: setup-tars
description: Bootstrap tars in the current project — CLAUDE.md, CONTEXT.md, docs structure, GitHub labels, gate commands. Run once per project.
disable-model-invocation: true
---

# Setup tars

Bootstrap the current project so the tars loop can run in it. Idempotent: never overwrite a file or label that exists — report it and skip.

## Process

1. **Discover the stack.** Inspect the repo (package.json, go.mod, etc.) to determine languages and toolchains. Facts come from the environment, not from asking.

2. **Verify GitHub.** `gh auth status` and a GitHub remote must both exist — specs and tickets live as issues. If `gh` is missing or unauthenticated, tell the user to fix it (`gh auth login`) before continuing. If the repo has no GitHub remote, ask the user whether to create one (`gh repo create`) or fall back to local files under `docs/`.

3. **Create the labels** (skip any that exist):
   - `tars:spec` — a spec/PRD issue
   - `tars:draft` / `tars:approved` — spec approval state
   - `tars:ticket` — an implementable ticket
   - `tars:ready` / `tars:in-progress` / `tars:blocked` — ticket pipeline state

4. **Agree the gates.** Propose the project's gate commands and confirm them with the user:
   - Go: `go build ./...`, `go vet ./...`, `go test -race ./...`
   - TypeScript: `npx tsc --noEmit`, `npx eslint .`, `npx vitest run`
   Adjust to what the repo actually has. These exact commands go into CLAUDE.md — agents and hooks run them verbatim.

5. **Create the structure:**
   - `CLAUDE.md` — the gate commands, conventions (conventional commits, branch naming `task/<issue>-<slug>`), and the standing rule that no change merges with red gates.
   - `CONTEXT.md` — domain glossary stub. Ask the user for 3–5 core domain terms with one-line definitions to seed it.
   - `docs/adr/` and `docs/PROGRESS.md` (header `# Progress`, section `## Log`).

6. **Report** what was created and the next move: grill the user about the first feature, then `/to-spec`.
