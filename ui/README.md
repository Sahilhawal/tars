# tars UI

Local, read-only dashboard for tars projects — see the root [`README.md`](../README.md#-dashboard-optional) for what this is and why.

## Develop

```bash
npm install
npm run dev
```

Opens on `http://localhost:3000`, bound to `127.0.0.1` only (see the `dev`/`start` scripts in `package.json`).

## How it reads data

- `~/.config/tars/projects.json` — the project registry, written by `/setup-tars`. See `lib/registry.ts`.
- `git worktree list --porcelain`, run per project. See `lib/git.ts`.
- `gh issue list` / `gh issue view` / `gh api .../sub_issues`, run per project. See `lib/gh.ts`. Requires `gh` to already be authenticated for whichever repo you're viewing — this app never handles credentials itself.

No writes, no background processes, no auth of its own — it's a viewer over state tars already produces.
