import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import asyncio

from fastapi import APIRouter
from config_manager import load_config, save_config
from ws_manager import manager

router = APIRouter(prefix="/api/system", tags=["system"])


@router.get("")
def get_system_config():
    config = load_config()
    return {
        "mode": config["mode"],
        "auto_switch": config["auto_switch"],
        "auto_switch_duration": config["auto_switch_duration"],
    }


@router.put("")
async def update_system_config(data: dict):
    config = load_config()
    if "mode" in data:
        config["mode"] = data["mode"]
    if "auto_switch" in data:
        config["auto_switch"] = data["auto_switch"]
    if "auto_switch_duration" in data:
        config["auto_switch_duration"] = data["auto_switch_duration"]
    save_config(config)
    await manager.broadcast({"type": "config", "data": load_config()})
    return {"success": True}