#!/usr/bin/env bash
# install.sh — link tars skills and agents into Claude Code.
#
# Default: user-level install (~/.claude), making tars available in EVERY project.
# Per-project:  ./install.sh --project /path/to/project
set -euo pipefail

TARS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="$HOME/.claude"

if [[ "${1:-}" == "--project" ]]; then
  [[ -z "${2:-}" ]] && { echo "usage: $0 --project <path>"; exit 1; }
  TARGET="$(cd "$2" && pwd)/.claude"
fi

mkdir -p "$TARGET/skills" "$TARGET/agents"

for skill in "$TARS_DIR"/skills/*/; do
  name="$(basename "$skill")"
  ln -sfn "$skill" "$TARGET/skills/$name"
  echo "skill:  $name -> $TARGET/skills/$name"
done

for agent in "$TARS_DIR"/agents/*.md; do
  name="$(basename "$agent")"
  ln -sfn "$agent" "$TARGET/agents/$name"
  echo "agent:  $name -> $TARGET/agents/$name"
done

echo
echo "Done. Skills: /ask-tars /grill-me /to-spec /to-tickets /run-ticket /run-frontier /code-review /handoff /setup-tars"
echo "In each project, run /setup-tars once to bootstrap it."
