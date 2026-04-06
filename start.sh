#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== 树莓派壁纸展示器 启动脚本 ==="

# Cleanup function
cleanup() {
    echo ""
    echo "正在停止所有服务..."
    [ -n "$BACKEND_PID" ] && kill $BACKEND_PID 2>/dev/null
    [ -n "$DISPLAY_PID" ] && kill $DISPLAY_PID 2>/dev/null
    [ -n "$CONTROL_PID" ] && kill $CONTROL_PID 2>/dev/null
    echo "已停止"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Check and install backend dependencies
if [ ! -d "backend/.venv" ] && [ ! -d "venv" ]; then
    echo "安装后端依赖..."
    cd backend
    pip install -r requirements.txt
    cd "$SCRIPT_DIR"
fi

# Check and install frontend dependencies
if [ ! -d "frontend/display/node_modules" ]; then
    echo "安装显示页面依赖..."
    cd frontend/display
    npm install
    cd "$SCRIPT_DIR"
fi

if [ ! -d "frontend/control/node_modules" ]; then
    echo "安装控制面板依赖..."
    cd frontend/control
    npm install
    cd "$SCRIPT_DIR"
fi

# Start backend
echo "启动后端服务 (端口 5000)..."
cd backend
python main.py &
BACKEND_PID=$!
cd "$SCRIPT_DIR"

# Wait for backend to be ready
echo "等待后端服务就绪..."
for i in $(seq 1 30); do
    if curl -sf http://0.0.0.0:5000/api/system > /dev/null 2>&1; then
        echo "后端服务已就绪"
        break
    fi
    sleep 1
done

# Start display page
echo "启动显示页面 (端口 8000)..."
cd frontend/display
npm run dev &
DISPLAY_PID=$!
cd "$SCRIPT_DIR"

# Start control panel
echo "启动控制面板 (端口 8001)..."
cd frontend/control
npm run dev &
CONTROL_PID=$!
cd "$SCRIPT_DIR"

echo ""
echo "=== 所有服务已启动 ==="
echo "后端服务: http://0.0.0.0:5000"
echo "显示页面: http://0.0.0.0:8000"
echo "控制面板: http://0.0.0.0:8001"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo ""

# Open display page in browser (fullscreen, not kiosk)
# Only if DISPLAY is available (GUI environment running)
if [ -n "$DISPLAY" ]; then
    BROWSER=$(which chromium-browser 2>/dev/null || which chromium 2>/dev/null || which firefox 2>/dev/null || echo "")
    if [ -n "$BROWSER" ]; then
        # Remove stale chromium lock file if exists
        rm -f ~/.config/chromium/SingletonLock 2>/dev/null
        if [[ "$BROWSER" == *"chromium"* ]]; then
            "$BROWSER" --start-fullscreen http://0.0.0.0:8000 &
            sleep 1
            "$BROWSER" http://0.0.0.0:8001 &
        else
            "$BROWSER" http://0.0.0.0:8000 &
            sleep 1
            "$BROWSER" http://0.0.0.0:8001 &
        fi
    fi
else
    echo "提示: 未检测到图形环境 (DISPLAY)，跳过自动打开浏览器"
    echo "请在其他设备上访问控制面板: http://<树莓派IP>:8001"
fi

# Wait for any process to exit
wait
