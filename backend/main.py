import json

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from config_manager import load_config
from ws_manager import manager
from routers import system, wallpaper, clock

app = FastAPI(title="Rasp Wallpaper Display")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(system.router)
app.include_router(wallpaper.router)
app.include_router(clock.router)


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    config = load_config()
    await ws.send_text(json.dumps({"type": "config", "data": config}, ensure_ascii=False))
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(ws)


@app.post("/api/notify")
async def notify_display():
    config = load_config()
    await manager.broadcast({"type": "config", "data": config})
    return {"success": True}


@app.get("/api/config")
async def get_full_config():
    return load_config()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="localhost", port=5000)
