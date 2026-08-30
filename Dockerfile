# Nyx Panel — Hardened multi-stage production image

# --- Stage 1: Build Frontend ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# --- Stage 2: Build Backend ---
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
COPY backend/prisma ./prisma/
RUN npm ci
RUN npx prisma generate
COPY backend/ ./
RUN npm run build

# --- Stage 3: Runtime ---
FROM node:20-slim AS runner

RUN apt-get update && apt-get install -y --no-install-recommends     ca-certificates     curl     unzip     tzdata     && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

WORKDIR /app/backend
COPY --from=backend-builder /app/backend/package*.json ./
COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/prisma ./prisma

# Official Xray release, x86_64 only in this image.
RUN mkdir -p /app/backend/bin &&     curl -fL --retry 3 --proto '=https' --tlsv1.2       https://github.com/XTLS/Xray-core/releases/latest/download/Xray-linux-64.zip       -o /tmp/xray.zip &&     unzip -q /tmp/xray.zip -d /app/backend/bin/ &&     chmod 0755 /app/backend/bin/xray &&     rm -f /tmp/xray.zip

RUN mkdir -p /data /tmp/nyx &&     chown -R 10001:10001 /app /data /tmp/nyx

COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod 0755 /app/docker-entrypoint.sh

ENV NODE_ENV=production     PORT=3000     PAAS_MODE=true     DATA_DIR=/data     DATABASE_URL="file:/data/nyx.db"

EXPOSE 3000

USER 10001:10001

ENTRYPOINT ["/app/docker-entrypoint.sh"]
