#!/bin/bash
# run-update.sh - Aplica la actualización aprobada por el usuario.
# Imprime "STATUS:step" en stdout. El backend lee esas líneas y las
# retransmite por Socket.io al dashboard Angular.
# Salida 0 = OK, salida 1 = falló (versión anterior restaurada automáticamente).

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
FRONTEND_DIR="$(cd "$SERVER_DIR/../frontend" 2>/dev/null && pwd 2>/dev/null || echo "")"
BRANCH="Dashboard_Only"

step() { echo "STATUS:$1"; }

# Guardar hash actual para rollback
BACKEND_HASH=$(git -C "$SERVER_DIR" rev-parse HEAD 2>/dev/null || echo "")

# ── 1. Descargar cambios ────────────────────────────────────────────────────
step "downloading"
if ! git -C "$SERVER_DIR" pull origin "$BRANCH" --quiet 2>/dev/null; then
  echo "STATUS:error:git_pull"
  exit 1
fi

# ── 2. Validar compilación sin tocar archivos compilados ────────────────────
step "validating"
cd "$SERVER_DIR"
if ! npx tsc --noEmit 2>/dev/null; then
  echo "STATUS:error:compilation"
  # Revertir fuente — los archivos .js compilados siguen intactos
  if [ -n "$BACKEND_HASH" ]; then
    git -C "$SERVER_DIR" reset --hard "$BACKEND_HASH" --quiet 2>/dev/null
  fi
  exit 1
fi

# ── 3. Frontend (archivos estáticos — sin compilar) ─────────────────────────
if [ -n "$FRONTEND_DIR" ] && [ -d "$FRONTEND_DIR" ]; then
  step "frontend"
  git -C "$FRONTEND_DIR" pull origin main --quiet 2>/dev/null || true
fi

# ── 4. Compilar TypeScript definitivamente ──────────────────────────────────
step "compiling"
if ! npx tsc 2>/dev/null; then
  echo "STATUS:error:compile_final"
  if [ -n "$BACKEND_HASH" ]; then
    git -C "$SERVER_DIR" reset --hard "$BACKEND_HASH" --quiet 2>/dev/null
  fi
  exit 1
fi

# ── 5. Reiniciar via PM2 ─────────────────────────────────────────────────────
step "restarting"
pm2 restart linkbox --silent 2>/dev/null || true

step "done"
exit 0
