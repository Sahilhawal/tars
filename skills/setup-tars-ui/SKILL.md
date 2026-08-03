---
name: setup-tars-ui
description: One-time, per-machine setup for the tars dashboard — installs the browser UI's dependencies so it can list your registered projects, their worktrees, and PRDs. Use when the user wants to set up, install, or enable the tars UI/dashboard.
---

# Setup tars UI

Get the local dashboard (`ui/`) ready to run. This is a one-time, per-machine step — it doesn't touch any project, and it never starts a long-running server itself.

## Process

1. **Locate the plugin's `ui/` directory.** It ships alongside `skills/` in the same tars install, not inside the current project. Try, in order, until one resolves:
   - `echo "$CLAUDE_PLUGIN_ROOT"` — if set and `$CLAUDE_PLUGIN_ROOT/ui/package.json` exists, that's it.
   - Search for it: `find ~/.claude ~/.config/claude -maxdepth 6 -path '*/.claude-plugin/plugin.json' 2>/dev/null` (and `$CLAUDE_CONFIG_DIR` too, if that's set), then check each candidate's `plugin.json` for `"name": "tars"` and confirm a sibling `ui/package.json` exists.
   - If neither resolves, ask the user for the path to their tars checkout rather than guessing.

2. **Install dependencies.** `cd` into the located `ui/` and run `npm install`. Idempotent — safe to re-run even if `node_modules` already exists (dependencies may have changed since last run).

3. **Confirm the registry.** Check `~/.config/tars/projects.json`. If it doesn't exist yet, tell the user the dashboard will start empty until they run `/setup-tars` in at least one project — don't create it yourself, that's `/setup-tars`'s job.

4. **Report how to run it.** This skill only installs — it never starts the server. Tell the user: `cd <ui path> && npm run dev`, then open `http://localhost:3000`. Bound to `localhost` only; nothing to configure, no auth.

## Hard rules

- Never start a long-running process yourself, backgrounded or not — running the dashboard is the user's own terminal, same as any local dev server.
- Never write to `~/.config/tars/projects.json` — that file is owned by `/setup-tars`.
