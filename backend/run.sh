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
fi

# shellcheck disable=SC1091
source "$VENV_DIR/bin/activate"

# Always sync deps so new packages in requirements.txt are picked up automatically
pip install --quiet --upgrade pip
pip install --quiet -r "$SCRIPT_DIR/requirements.txt"

if [ ! -f "$SCRIPT_DIR/.env" ]; then
  echo "⚠️  $SCRIPT_DIR/.env not found. Copy .env.example and fill in GEMINI_API_KEY."
fi

exec python3 "$SCRIPT_DIR/server.py"
