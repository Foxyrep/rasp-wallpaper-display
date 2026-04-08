import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi import APIRouter
from config_manager import load_config, save_config
from ws_manager import manager

router = APIRouter(prefix="/api/soundviz", tags=["soundviz"])


@router.get("")
def get_soundviz_config():
    config = load_config()
    return config["soundviz"]


@router.put("")
async def update_soundviz_config(data: dict):
    config = load_config()
    if "style" in data:
        config["soundviz"]["style"] = data["style"]
    if "color" in data:
        config["soundviz"]["color"] = data["color"]
    if "sensitivity" in data:
        config["soundviz"]["sensitivity"] = float(data["sensitivity"])
    save_config(config)

    await manager.broadcast({"type": "config", "data": load_config()})
    return {"success": True}
