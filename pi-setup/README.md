# LinkBox - Configuración de kiosco en Raspberry Pi

Esta carpeta contiene todo lo necesario para que la Raspberry Pi arranque
directamente en el dashboard de LinkBox, a pantalla completa, sin mouse ni
teclado, y se mantenga ahí sin que el usuario pueda salir accidentalmente.

## Arquitectura

```
Boot Pi → autologin a escritorio → kiosk.desktop (autostart)
        → start-kiosk.sh
            - desactiva protector de pantalla / DPMS
            - oculta el cursor (unclutter)
            - pm2 resurrect → arranca:
                - "linkbox"        → servidor Node/Express (dist/index.js)
                - "linkbox-kiosk"  → watchdog.sh (relanza Chromium si se cierra)
```

Capas de protección (de afuera hacia adentro):

1. **Flags de Chromium** (`--kiosk --noerrdialogs --disable-infobars
   --disable-pinch --overscroll-history-navigation=0` etc.) — evitan diálogos
   de error, gestos de zoom/navegación accidentales y la UI normal del navegador.
2. **Atajos de teclado de Openbox deshabilitados** (Alt+F4, Alt+Tab, tecla
   Super, etc.) — ver sección 4.
3. **Menú contextual deshabilitado dentro de la app Angular**
   (`document.addEventListener('contextmenu', ...)`, implementado en el
   `DashboardPageComponent`).
4. **Watchdog gestionado por PM2** (`watchdog.sh`) — si por cualquier motivo
   Chromium se cierra, se vuelve a abrir solo en unos segundos.

---

## 1. Requisitos previos

En la Raspberry Pi (Raspberry Pi OS Desktop):

```bash
sudo apt update
sudo apt install -y unclutter
sudo npm install -g pm2
```

Configurar autologin al escritorio:

```bash
sudo raspi-config
# System Options → Boot / Auto Login → Desktop Autologin
```

---

## 2. Permisos para WiFi (nmcli sin contraseña)

El widget de WiFi del dashboard usa `nmcli` mediante `sudo`. Para que no pida
contraseña:

```bash
sudo cp nmcli-sudoers /etc/sudoers.d/linkbox-nmcli
sudo chmod 0440 /etc/sudoers.d/linkbox-nmcli
sudo visudo -c
```

---

## 3. PM2 (servidor + watchdog de Chromium)

Ajustar las rutas (`cwd`) en `ecosystem.config.js` si el proyecto no está en
`/home/pi/linkbox`. Luego, desde la carpeta `Server`:

```bash
cd /home/pi/linkbox/Server
npm install
npm run build

chmod +x pi-setup/watchdog.sh pi-setup/start-kiosk.sh

pm2 start pi-setup/ecosystem.config.js
pm2 save
```

`pm2 save` guarda la lista de procesos para que `pm2 resurrect` (llamado desde
`start-kiosk.sh`) los restaure al iniciar sesión.

---

## 4. Autostart al iniciar sesión

Copiar `kiosk.desktop` a la carpeta de autostart del usuario:

```bash
mkdir -p ~/.config/autostart
cp pi-setup/kiosk.desktop ~/.config/autostart/
chmod +x pi-setup/start-kiosk.sh
```

Si el proyecto no está en `/home/pi/linkbox`, actualizar la ruta `Exec=` de
`kiosk.desktop` para que apunte a `start-kiosk.sh`.

---

## 5. Deshabilitar atajos de teclado de Openbox

Raspberry Pi OS usa Openbox/LXDE-pi. El archivo de configuración suele estar
en:

```
~/.config/openbox/lxde-pi-rc.xml
```

(si no existe, copiarlo desde `/etc/xdg/openbox/lxde-pi-rc.xml`).

Dentro de la sección `<keyboard>`, **eliminar o comentar** los `<keybind>`
que permiten salir del kiosco o cambiar de ventana, por ejemplo:

```xml
<!-- Cerrar ventana -->
<keybind key="A-F4"> ... </keybind>

<!-- Cambiar entre ventanas -->
<keybind key="A-Tab"> ... </keybind>
<keybind key="A-S-Tab"> ... </keybind>

<!-- Menú de aplicaciones / tecla Super -->
<keybind key="W-space"> ... </keybind>

<!-- Mostrar escritorio -->
<keybind key="A-d"> ... </keybind>

<!-- Terminal -->
<keybind key="A-F2"> ... </keybind>
<keybind key="C-A-t"> ... </keybind>
```

También conviene deshabilitar el menú del click derecho en el escritorio
(sección `<mouse>` → `<context name="Root">`), aunque con Chromium ocupando
toda la pantalla no debería ser visible.

Después de editar, reiniciar Openbox o reiniciar la Pi:

```bash
openbox --reconfigure
```

---

## 6. Probar

Reiniciar la Pi y verificar que:

- Arranca directo en el dashboard, sin escritorio visible.
- `pm2 list` muestra `linkbox` y `linkbox-kiosk` como `online`.
- Cerrar Chromium manualmente (si hay teclado conectado) → vuelve a abrirse
  solo en ~5 segundos.
- El widget de WiFi puede escanear y conectarse a una red sin pedir password
  de `sudo`.
