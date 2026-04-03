import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import requests
from fastapi import APIRouter
from config_manager import load_config, save_config
from ws_manager import manager

router = APIRouter(prefix="/api/weather", tags=["weather"])


@router.get("")
def get_weather():
    config = load_config()
    weather_cfg = config.get("weather", {})

    if not weather_cfg.get("enabled", False):
        return {"enabled": False}

    api_key = weather_cfg.get("api_key", "d294b6e594db19b11580209d4ab003fd")
    city = weather_cfg.get("city", "510116")
    show_days = weather_cfg.get("show_days", 1)

    # Always use extensions=all to get temperature range
    url = f"https://restapi.amap.com/v3/weather/weatherInfo?key={api_key}&city={city}&extensions=all"

    try:
        r = requests.get(url, timeout=10)
        data = r.json()
    except Exception:
        return {"enabled": True, "error": "请求天气接口失败"}

    if data.get("status") != "1":
        return {"enabled": True, "error": data.get("info", "接口返回错误")}

    result = {"enabled": True, "days": show_days}

    forecasts = data.get("forecasts", [])
    if forecasts:
        casts = forecasts[0].get("casts", [])
        result["list"] = []
        labels = ["今天", "明天", "后天"]
        count = 3 if show_days == 3 else 1
        for i, day in enumerate(casts[:count]):
            result["list"].append({
                "label": labels[i] if i < len(labels) else day["date"],
                "weather": day["dayweather"],
                "temp_min": day["nighttemp"],
                "temp_max": day["daytemp"],
            })

    return result


@router.get("/config")
def get_weather_config():
    config = load_config()
    return config.get("weather", {
        "enabled": False,
        "show_days": 1,
        "api_key": "d294b6e594db19b11580209d4ab003fd",
        "city": "510116",
    })


@router.put("/config")
async def update_weather_config(data: dict):
    config = load_config()
    if "weather" not in config:
        config["weather"] = {}
    for key in ["enabled", "show_days", "api_key", "city"]:
        if key in data:
            config["weather"][key] = data[key]
    save_config(config)
    await manager.broadcast({"type": "config", "data": load_config()})
    return {"success": True}
