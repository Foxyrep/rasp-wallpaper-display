import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi import APIRouter
from config_manager import load_config, save_config
from ws_manager import manager

router = APIRouter(prefix="/api/clock", tags=["clock"])


@router.get("")
def get_clock_config():
    config = load_config()
    return config["clock"]


@router.put("")
async def update_clock_config(data: dict):
    config = load_config()
    if "style" in data:
        config["clock"]["style"] = data["style"]
    if "show_date" in data:
        config["clock"]["show_date"] = data["show_date"]
    if "show_weekday" in data:
        config["clock"]["show_weekday"] = data["show_weekday"]
    save_config(config)

    await manager.broadcast({"type": "config", "data": load_config()})
    return {"success": True}