# tars UI

Local, read-only dashboard for tars projects — see the root [`README.md`](../README.md#-dashboard-optional) for what this is and why. Normally you never touch this folder directly — `/setup-tars-ui` installs and starts it for you. This doc is for running it by hand.

## Run it

```bash
./start.sh   # installs deps if needed, starts in the background, opens your browser
./stop.sh    # stops it
```

`start.sh` is idempotent — re-running it while already up just prints the existing URL instead of starting a second instance. It picks the first free port from 3000 up and binds to `127.0.0.1` only. State lives in `.tars-ui.pid` / `.tars-ui.port` / `.tars-ui.log` (gitignored) next to these scripts.

For interactive development instead (hot reload, logs in your own terminal):

```bash
npm install
npm run dev
```

## How it reads data

- `~/.config/tars/projects.json` — the project registry, written by `/setup-tars`. See `lib/registry.ts`.
- `git worktree list --porcelain`, run per project. See `lib/git.ts`.
- `gh issue list` / `gh issue view` / `gh api .../sub_issues`, run per project. See `lib/gh.ts`. Requires `gh` to already be authenticated for whichever repo you're viewing — this app never handles credentials itself.

No writes, no auth of its own — it's a viewer over state tars already produces. It doesn't survive a machine reboot on its own; re-run `/setup-tars-ui` (or `./start.sh`) after one.
