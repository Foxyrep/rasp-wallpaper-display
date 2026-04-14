import json
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
CONFIG_PATH = DATA_DIR / "config.json"
UPLOADS_DIR = BASE_DIR / "uploads" / "wallpapers"

DEFAULT_CONFIG = {
    "mode": "wallpaper",
    "auto_switch": False,
    "auto_switch_duration": 30,
    "wallpaper": {
        "images": [],
        "auto_rotate": True,
        "rotate_interval": 60,
    },
    "clock": {
        "style": "circle12",
        "show_date": True,
        "show_weekday": True,
    },
    "weather": {
        "enabled": False,
        "show_days": 1,  # 1 = 今天, 3 = 三天
        "api_key": "d294b6e594db19b11580209d4ab003fd",
        "city": "510116",
    },
    "soundviz": {
        "style": "bar",       # "bar" | "circular" | "wave"
        "color": "#00ff88",
        "sensitivity": 1.0,
        "performance_mode": "balanced",  # "power_save" | "balanced" | "quality"
        "fps": 30,
        "render_scale": 0.8,
    },
}


def _ensure_dirs():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


def _deep_merge(base: dict, override: dict) -> dict:
    result = base.copy()
    for key, value in override.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = _deep_merge(result[key], value)
        else:
            result[key] = value
    return result


def load_config() -> dict:
    _ensure_dirs()
    if CONFIG_PATH.exists():
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            saved = json.load(f)
        return _deep_merge(DEFAULT_CONFIG, saved)
    save_config(DEFAULT_CONFIG)
    return DEFAULT_CONFIG.copy()


def save_config(config: dict):
    _ensure_dirs()
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(config, f, ensure_ascii=False, indent=2)
