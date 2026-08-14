# ====================================================
# 🔥 Nyx Panel — Multi-Stage Production Dockerfile
# Optimized for Railway.app, Render, Fly.io & Self-Hosted Docker
# ====================================================

# --- Stage 1: Build Frontend SPA ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# --- Stage 2: Build Backend API ---
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
COPY backend/prisma ./prisma/
RUN npm install
RUN npx prisma generate
COPY backend/ ./
RUN npm run build

# --- Stage 3: Production Runtime ---
FROM node:20-slim AS runner

# Install essential tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    unzip \
    ca-certificates \
    procps \
    iptables \
    tzdata \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built frontend static files to expected relative path
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Copy backend dependencies and compiled code
WORKDIR /app/backend
COPY --from=backend-builder /app/backend/package*.json ./
COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/prisma ./prisma

# Pre-download official Xray-core Linux x86_64 binary
RUN mkdir -p /app/backend/bin && \
    curl -sL https://github.com/XTLS/Xray-core/releases/latest/download/Xray-linux-64.zip -o /tmp/xray.zip && \
    unzip -q /tmp/xray.zip -d /app/backend/bin/ && \
    chmod +x /app/backend/bin/xray && \
    rm -f /tmp/xray.zip

# Create persistent data directory
RUN mkdir -p /data

# Copy entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Environment Defaults
ENV NODE_ENV=production \
    PORT=3000 \
    PAAS_MODE=true \
    DATA_DIR=/data \
    DATABASE_URL="file:/data/nyx.db"

EXPOSE 3000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
