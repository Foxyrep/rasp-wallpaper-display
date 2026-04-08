# ====== Stage 1: Build frontends ======
FROM docker.mirrors.ustc.edu.cn/library/node:20-alpine AS frontend-builder
WORKDIR /build

# Build display page
COPY frontend/display/package.json frontend/display/package-lock.json* ./display/
RUN cd display && npm install --registry=https://registry.npmmirror.com
COPY frontend/display/ ./display/
RUN cd display && npm run build

# Build control panel
COPY frontend/control/package.json frontend/control/package-lock.json* ./control/
RUN cd control && npm install --registry=https://registry.npmmirror.com
COPY frontend/control/ ./control/
RUN cd control && npm run build

# ====== Stage 2: Runtime ======
FROM docker.mirrors.ustc.edu.cn/library/python:3.11-slim-bookworm

# Use mirrors for apt and pip
RUN sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list.d/debian.sources 2>/dev/null || \
    sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list 2>/dev/null || true
RUN pip config set global.index-url https://mirrors.aliyun.com/pypi/simple/ && \
    pip config set global.trusted-host mirrors.aliyun.com

# Install nginx
RUN apt-get update && \
    apt-get install -y --no-install-recommends nginx && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy backend code
COPY backend/ /app/backend/

# Copy built frontends from builder stage
COPY --from=frontend-builder /build/display/dist /app/frontend/display
COPY --from=frontend-builder /build/control/dist /app/frontend/control

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy entrypoint
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Create data and uploads directories
RUN mkdir -p /app/data /app/uploads/wallpapers

# Expose ports
EXPOSE 5000 8000 8001

# Volume for persistent data
VOLUME ["/app/data", "/app/uploads"]

WORKDIR /app

ENTRYPOINT ["/app/entrypoint.sh"]
