import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import uuid
import os

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from config_manager import load_config, save_config, UPLOADS_DIR
from ws_manager import manager

router = APIRouter(prefix="/api/wallpapers", tags=["wallpapers"])


@router.get("")
def list_wallpapers():
    config = load_config()
    return {
        "images": config["wallpaper"]["images"],
        "auto_rotate": config["wallpaper"]["auto_rotate"],
        "rotate_interval": config["wallpaper"]["rotate_interval"],
    }


@router.post("")
async def upload_wallpaper(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in (".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"):
        raise HTTPException(status_code=400, detail="不支持的图片格式")

    image_id = uuid.uuid4().hex[:12]
    filename = f"{image_id}{ext}"
    filepath = UPLOADS_DIR / filename

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    config = load_config()
    config["wallpaper"]["images"].append(
        {"id": image_id, "filename": filename, "original_name": file.filename}
    )
    save_config(config)

    await manager.broadcast({"type": "config", "data": load_config()})
    return {"id": image_id, "filename": filename, "original_name": file.filename}


@router.delete("/{image_id}")
async def delete_wallpaper(image_id: str):
    config = load_config()
    images = config["wallpaper"]["images"]
    target = next((img for img in images if img["id"] == image_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="图片不存在")

    filepath = UPLOADS_DIR / target["filename"]
    if filepath.exists():
        filepath.unlink()

    config["wallpaper"]["images"] = [img for img in images if img["id"] != image_id]
    save_config(config)

    await manager.broadcast({"type": "config", "data": load_config()})
    return {"success": True}


@router.get("/{image_id}/file")
def get_wallpaper_file(image_id: str):
    config = load_config()
    target = next((img for img in config["wallpaper"]["images"] if img["id"] == image_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="图片不存在")

    filepath = UPLOADS_DIR / target["filename"]
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="文件不存在")

    return FileResponse(filepath, media_type="image/jpeg")


@router.put("/config")
async def update_wallpaper_config(data: dict):
    config = load_config()
    if "auto_rotate" in data:
        config["wallpaper"]["auto_rotate"] = data["auto_rotate"]
    if "rotate_interval" in data:
        config["wallpaper"]["rotate_interval"] = data["rotate_interval"]
    save_config(config)

    await manager.broadcast({"type": "config", "data": load_config()})
    return {"success": True}