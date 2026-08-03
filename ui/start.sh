#!/usr/bin/env bash
# start.sh — start the tars dashboard in the background, idempotently.
# Safe to run repeatedly: if it's already running, just reports the URL.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

PID_FILE="$DIR/.tars-ui.pid"
LOG_FILE="$DIR/.tars-ui.log"
PORT_FILE="$DIR/.tars-ui.port"

if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  port="$(cat "$PORT_FILE" 2>/dev/null || echo "?")"
  echo "already running (pid $(cat "$PID_FILE")) at http://127.0.0.1:$port"
  exit 0
fi
rm -f "$PID_FILE" "$PORT_FILE"

[[ -d node_modules ]] || npm install

port_free() {
  ! (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null
}

port=3000
while ! port_free "$port"; do
  port=$((port + 1))
done

: > "$LOG_FILE"
if command -v setsid >/dev/null 2>&1; then
  setsid nohup npm run dev -- -p "$port" >"$LOG_FILE" 2>&1 &
else
  nohup npm run dev -- -p "$port" >"$LOG_FILE" 2>&1 &
fi
pid=$!
disown
echo "$pid" >"$PID_FILE"
echo "$port" >"$PORT_FILE"

url="http://127.0.0.1:$port"
for _ in $(seq 1 30); do
  if curl -fs -o /dev/null "$url" 2>/dev/null; then
    echo "started (pid $pid) at $url"
    if command -v xdg-open >/dev/null 2>&1; then
      xdg-open "$url" >/dev/null 2>&1 &
    elif command -v open >/dev/null 2>&1; then
      open "$url" >/dev/null 2>&1 &
    fi
    exit 0
  fi
  sleep 0.5
done

echo "started (pid $pid), but it hasn't responded yet — check $LOG_FILE"
