import dotenv from "dotenv";
dotenv.config();

export const PORT = process.env.PORT || "3000";

// El dashboard Angular se sirve desde este mismo Express (misma origin), así
// que en el caso normal no hace falta habilitar CORS para nada. Esto solo
// importa si algo externo (otro dominio) necesita pegarle a la API — por
// default queda cerrado. Ver Server/.env.example.
export const ALLOWED_ORIGINS = (process.env.LINKBOX_ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
