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
}


def _ensure_dirs():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


def load_config() -> dict:
    _ensure_dirs()
    if CONFIG_PATH.exists():
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    save_config(DEFAULT_CONFIG)
    return DEFAULT_CONFIG.copy()


def save_config(config: dict):
    _ensure_dirs()
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(config, f, ensure_ascii=False, indent=2)
