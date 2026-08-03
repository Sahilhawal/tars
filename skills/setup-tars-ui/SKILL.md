---
name: setup-tars-ui
description: Set up and start the tars dashboard — installs the browser UI's dependencies and launches it in the background so it can list your registered projects, their worktrees, and PRDs. Use when the user wants to set up, install, start, enable, or open the tars UI/dashboard.
---

# Setup tars UI

Get the local dashboard (`ui/`) installed and running. Re-running this skill (e.g. after `/plugin marketplace update tars`) is safe — installing is idempotent and starting is a no-op if it's already up.

## Process

1. **Locate the plugin's `ui/` directory.** It ships alongside `skills/` in the same tars install, not inside the current project. Try, in order, until one resolves:
   - `echo "$CLAUDE_PLUGIN_ROOT"` — if set and `$CLAUDE_PLUGIN_ROOT/ui/package.json` exists, that's it.
   - Search for it: `find ~/.claude ~/.config/claude -maxdepth 6 -path '*/.claude-plugin/plugin.json' 2>/dev/null` (and `$CLAUDE_CONFIG_DIR` too, if that's set), then check each candidate's `plugin.json` for `"name": "tars"` and confirm a sibling `ui/package.json` exists.
   - If neither resolves, ask the user for the path to their tars checkout rather than guessing.

2. **Install dependencies.** `cd` into the located `ui/` and run `npm install`. Idempotent — safe to re-run even if `node_modules` already exists (dependencies may have changed since last run).

3. **Confirm the registry.** Check `~/.config/tars/projects.json`. If it doesn't exist yet, tell the user the dashboard will start empty until they run `/setup-tars` in at least one project — don't create it yourself, that's `/setup-tars`'s job.

4. **Start it.** Run `./start.sh` from `ui/` — it backgrounds the dev server (`nohup` + `setsid` where available, so it survives this session ending), picks a free port starting at 3000, waits for it to respond, and opens it in the default browser. It's idempotent: if already running, it reports the existing URL instead of starting a second instance. Report the URL it prints back to the user.

## Hard rules

- Start it via `ui/start.sh`, never by hand-rolling your own `nohup`/background invocation — the script owns the pidfile/port bookkeeping that makes re-runs idempotent.
- Never write to `~/.config/tars/projects.json` — that file is owned by `/setup-tars`.
- To stop it, run `ui/stop.sh` — mention this if the user asks how to shut it down, but don't stop it unprompted.
