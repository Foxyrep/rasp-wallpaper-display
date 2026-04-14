import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi import APIRouter
from config_manager import load_config, save_config
from ws_manager import manager

router = APIRouter(prefix="/api/soundviz", tags=["soundviz"])


def _clamp_float(value, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, float(value)))


def _clamp_int(value, minimum: int, maximum: int) -> int:
    return max(minimum, min(maximum, int(value)))


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
        config["soundviz"]["sensitivity"] = _clamp_float(data["sensitivity"], 0.5, 3.0)
    if "performance_mode" in data:
        mode = str(data["performance_mode"])
        if mode in {"power_save", "balanced", "quality"}:
            config["soundviz"]["performance_mode"] = mode
    if "fps" in data:
        config["soundviz"]["fps"] = _clamp_int(data["fps"], 15, 60)
    if "render_scale" in data:
        config["soundviz"]["render_scale"] = _clamp_float(data["render_scale"], 0.5, 1.0)
    save_config(config)

    await manager.broadcast({"type": "config", "data": load_config()})
    return {"success": True}
