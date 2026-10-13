#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "================================================"
echo "  Painel de Gestão Financeira - Apple Numbers   "
echo "================================================"

# Get local IP
IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "localhost")

echo "💻 Acesso no computador:  http://localhost:8000"
echo "📱 Acesso no Tablet/Wi-Fi: http://${IP}:8000"
echo "================================================"

# Open browser on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
  (sleep 1 && open "http://localhost:8000") &
fi

exec .venv/bin/python -m uvicorn backend.app:app --host 0.0.0.0 --port 8000 --reload
