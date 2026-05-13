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

# Require Python 3.10+ (google-genai >= 1.48 dropped 3.9 support)
# Prefer python3.11 / python3.12 / python3.10 from Homebrew if available,
# then fall back to whatever PYTHON env var or python3 resolves to.
if [ -z "${PYTHON:-}" ]; then
  for candidate in python3.12 python3.11 python3.10; do
    if command -v "$candidate" &>/dev/null; then
      PYTHON="$candidate"
      break
    fi
  done
  PYTHON="${PYTHON:-python3}"
fi

PY_VER=$("$PYTHON" -c "import sys; print(sys.version_info[:2])")
if [[ "$PY_VER" < "(3, 10)" ]]; then
  echo "❌  Python 3.10+ is required (found $("$PYTHON" --version))."
  echo "   Install via Homebrew:  brew install python@3.11"
  echo "   Then re-run:           rm -rf .venv && ./run.sh"
  exit 1
fi

# If the existing venv is Python < 3.10, nuke and recreate it
if [ -d "$VENV_DIR" ]; then
  VENV_PY_VER=$("$VENV_DIR/bin/python" -c "import sys; print(sys.version_info[:2])" 2>/dev/null || echo "(0, 0)")
  if [[ "$VENV_PY_VER" < "(3, 10)" ]]; then
    echo "→ Existing venv is Python < 3.10 — recreating with $("$PYTHON" --version)"
    rm -rf "$VENV_DIR"
  fi
fi

if [ ! -d "$VENV_DIR" ]; then
  echo "→ Creating virtualenv with $("$PYTHON" --version) at $VENV_DIR"
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
