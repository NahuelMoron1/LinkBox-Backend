# LinkBox Dashboard — imagen única (backend Node + build de Angular servido como estático).
# Ver PLAN_LinkBox_Dashboard_Only.md sección 1 y 3.
#
# El build context para esta imagen es la carpeta padre que contiene tanto
# "Server" como "LinkBoxApp" como subcarpetas hermanas (ver CI workflow:
# ambos repos se checkoutean uno junto al otro antes del `docker build`).
#
#   docker build -f Server/Dockerfile --build-arg APP_VERSION=v1.4.0 .

# ---------- Stage 1: build del frontend Angular ----------
FROM node:20-alpine AS frontend-build
WORKDIR /frontend
COPY LinkBoxApp/package.json LinkBoxApp/package-lock.json ./
RUN npm ci
COPY LinkBoxApp/ ./
RUN npx ng build --configuration production

# ---------- Stage 2: build del backend Node/TypeScript ----------
FROM node:20-alpine AS backend-build
WORKDIR /app
COPY Server/package.json Server/package-lock.json ./
RUN npm ci
COPY Server/tsconfig.json ./
COPY Server/src ./src
RUN npm run build

# ---------- Stage 3: runtime ----------
FROM node:20-alpine AS runtime
ARG APP_VERSION=0.0.0-dev
ENV NODE_ENV=production
ENV PORT=3000
ENV ANGULAR_DIST_PATH=/app/public

WORKDIR /app

COPY Server/package.json Server/package-lock.json ./
RUN npm ci --omit=dev

COPY --from=backend-build /app/dist ./dist
COPY --from=frontend-build /frontend/dist/link-box-app/browser ./public

RUN echo "$APP_VERSION" > /app/VERSION

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "dist/index.js"]
