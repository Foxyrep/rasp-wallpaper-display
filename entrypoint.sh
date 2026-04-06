#!/bin/bash
set -e

# Start backend
cd /app/backend
python main.py &
BACKEND_PID=$!

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
for i in $(seq 1 30); do
    if curl -sf http://127.0.0.1:5000/api/system > /dev/null 2>&1; then
        echo "Backend is ready"
        break
    fi
    sleep 1
done

# Start nginx (foreground not needed — we use daemon mode + wait)
nginx

echo "=== All services started ==="
echo "Backend:    http://0.0.0.0:5000"
echo "Display:    http://0.0.0.0:8000"
echo "Control:    http://0.0.0.0:8001"

# Shutdown handler
cleanup() {
    echo "Shutting down..."
    nginx -s stop 2>/dev/null
    kill $BACKEND_PID 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM

# Keep container alive
wait
