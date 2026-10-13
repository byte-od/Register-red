#!/usr/bin/env bash
DIR="/Users/juliocesarreisfilho/Projects/register-red"
cd "$DIR"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] >>> Starting Register-red 24h Daemon..." >> "$DIR/uvicorn.log"

while true; do
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] >>> Launching Uvicorn on 0.0.0.0:8000..." >> "$DIR/uvicorn.log"
    "$DIR/.venv/bin/python" -m uvicorn backend.app:app --host 0.0.0.0 --port 8000 >> "$DIR/uvicorn.log" 2>&1
    EXIT_CODE=$?
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] >>> Uvicorn exited with code $EXIT_CODE. Auto-restarting in 2s..." >> "$DIR/uvicorn.log"
    sleep 2
done
