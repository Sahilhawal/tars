# CLAUDE.md

## Pipeline

This project is built with **tars** — an agent pipeline. Specs and tickets are GitHub issues (`tars:*` labels). Work happens on `task/<issue>-<slug>` branches, merges to `main` only after reviewer APPROVE and green gates.

## Quality gates

Run these verbatim; a change is not done until the relevant gates pass:

<!-- setup-tars fills these in per stack, e.g.
- Go: `go build ./... && go vet ./... && go test -race ./...`
- TS: `npx tsc --noEmit && npx eslint . && npx vitest run`
-->

## Parallel tickets (/run-frontier)

- Worktrees live in `../<repo>.worktrees/task-<N>-<slug>` — never inside this repo
- Gitignored `.env*` files are copied from the main checkout into each worktree on creation; dependencies are installed per worktree

<!-- setup-tars: if gates/app need servers or databases, record per-worktree overrides here, e.g.
- Each worktree sets PORT=3<N> and uses test database <db>_wt<N>
If not, state "gates are in-process; no per-worktree overrides needed".
-->

## Conventions

- Conventional commits (`feat:`, `fix:`, `test:`, `chore:`)
- Tests at public seams only; expected values from an independent source of truth, never recomputed like the code
- Domain vocabulary lives in `CONTEXT.md` — use it in code, tests, specs
- ADRs in `docs/adr/` record architecture decisions; code must not contradict them
- Never disable or weaken a test, lint rule, or gate to make it pass
