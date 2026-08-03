#!/usr/bin/env bash
# stop.sh — stop the tars dashboard if it's running.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$DIR/.tars-ui.pid"
PORT_FILE="$DIR/.tars-ui.port"

if [[ ! -f "$PID_FILE" ]] || ! kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo "not running"
  rm -f "$PID_FILE" "$PORT_FILE"
  exit 0
fi

pid="$(cat "$PID_FILE")"
# Try to kill the whole process group first (setsid gave it one); fall back
# to the single pid if that's not how it was started or the group is gone.
kill -- "-$pid" 2>/dev/null || kill "$pid" 2>/dev/null || true
rm -f "$PID_FILE" "$PORT_FILE"
echo "stopped (was pid $pid)"
