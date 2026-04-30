#!/usr/bin/env bash
# Start the Veelo backend.
#
# On first run this script creates a local virtualenv at backend/.venv and
# installs dependencies from requirements.txt. Subsequent runs reuse it.
#
# Override the Python interpreter with PYTHON env var if needed:
#   PYTHON=python3.11 ./run.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_DIR="$SCRIPT_DIR/.venv"
PYTHON="${PYTHON:-python3}"

if [ ! -d "$VENV_DIR" ]; then
  echo "→ Creating virtualenv at $VENV_DIR"
  "$PYTHON" -m venv "$VENV_DIR"
  # shellcheck disable=SC1091
  source "$VENV_DIR/bin/activate"
  echo "→ Installing dependencies"
  pip install --upgrade pip
  pip install -r "$SCRIPT_DIR/requirements.txt"
else
  # shellcheck disable=SC1091
  source "$VENV_DIR/bin/activate"
fi

if [ ! -f "$SCRIPT_DIR/.env" ]; then
  echo "⚠️  $SCRIPT_DIR/.env not found. Copy .env.example and fill in GEMINI_API_KEY."
fi

exec python3 "$SCRIPT_DIR/server.py"
