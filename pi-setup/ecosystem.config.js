module.exports = {
  apps: [
    {
      name: "linkbox",
      cwd: "/home/pi/linkbox/Server",
      script: "dist/index.js",
      autorestart: true,
      max_restarts: 10,
    },
    {
      name: "linkbox-kiosk",
      cwd: "/home/pi/linkbox/Server/pi-setup",
      script: "watchdog.sh",
      interpreter: "bash",
      autorestart: true,
    },
  ],
};
