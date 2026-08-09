# Changelog

Notable changes to tars. Format loosely follows [Keep a Changelog](https://keepachangelog.com/). This file starts at 0.3.0 — for anything earlier, `git log` is the record.

## [0.3.0]

### Added

- `/grill-choices` — audits the technical choices already baked into a codebase (stack, architecture, key libraries), one at a time, and offers to write the ones that survive as ADRs. The backward-looking companion to `/grill-me`.
- `/teach` — a persistent local workspace for learning a topic over multiple sessions: mission, glossary, lessons, reference docs, learning records. Ported from Matt Pocock's skills repo; adds a mastery-check gate before a lesson's insight becomes a learning record, reusing `grilling`'s interview pattern instead of taking coverage as evidence of learning. The one tars skill that isn't about shipping code.
- `/render-prd <N>` — renders a PRD and its nested tickets as a single self-contained HTML file (no build step, no server) and asks before opening it. Purely on-demand — not called automatically by `/to-spec` or `/to-tickets`.
- `LICENSE` (MIT), matching the license of the projects tars's own skill lineage is credited to.

### Changed

- Dropped the `install.sh` symlink install path. Plugin-marketplace install (`/plugin install tars@tars`) is now the only supported way to get tars, matching Matt Pocock's skills repo — there's no install-time hook in Claude Code's plugin system to build a symlink-vs-plugin dual path around cleanly.

### Fixed

- Restored `/` slash-command autocomplete visibility for user-invoked skills (`ask-tars`, `brainstorm`, `grill-me`, `handoff`, `run-ticket`, `setup-tars`, `to-spec`, `to-tickets`, `writing-great-skills`) — `disable-model-invocation: true` had been hiding them from autocomplete entirely, not just blocking automatic invocation. `run-frontier` keeps it, deliberately, as the highest-blast-radius skill.
