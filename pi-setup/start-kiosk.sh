#!/bin/bash
# start-kiosk.sh - Se ejecuta al iniciar la sesión gráfica (vía kiosk.desktop).
# Prepara la pantalla para modo kiosco y arranca los procesos PM2
# (servidor LinkBox + watchdog de Chromium).

export DISPLAY=:0

# Esperar a que el escritorio esté listo
sleep 5

# Apagar protector de pantalla / DPMS / bloqueo de pantalla
xset s off
xset s noblank
xset -dpms

# Ocultar el cursor del mouse cuando está inactivo (requiere: sudo apt install unclutter)
unclutter -idle 0.5 -root &

# Restaurar los procesos PM2 guardados (servidor + watchdog del kiosco)
pm2 resurrect
