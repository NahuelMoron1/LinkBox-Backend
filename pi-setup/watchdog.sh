#!/bin/bash
# watchdog.sh - Mantiene Chromium abierto en modo kiosco mostrando el dashboard.
# Gestionado por PM2 (ver ecosystem.config.js). Si Chromium se cierra por
# cualquier motivo (cierre accidental, Alt+F4, crash, etc.) este script
# lo vuelve a lanzar automáticamente en unos segundos.

export DISPLAY=:0

URL="http://localhost:3000"

CHROMIUM_FLAGS=(
  --kiosk
  --noerrdialogs
  --disable-infobars
  --disable-session-crashed-bubble
  --disable-pinch
  --overscroll-history-navigation=0
  --no-first-run
  --disable-translate
  --disable-features=TranslateUI
  --check-for-update-interval=31536000
  --autoplay-policy=no-user-gesture-required
)

while true; do
  if ! pgrep -f "chromium.*--kiosk" > /dev/null; then
    chromium-browser "${CHROMIUM_FLAGS[@]}" "$URL" &
  fi
  sleep 5
done
