from datetime import datetime
from pydantic import BaseModel


class AssetOut(BaseModel):
    asset_id: str
    original_name: str
    mime_type: str
    storage_url: str
    thumbnail_url: str | None
    file_size_bytes: int
    uploaded_at: datetime


class AssetUrlRefresh(BaseModel):
    asset_id: str
    url: str
    expires_at: datetime
