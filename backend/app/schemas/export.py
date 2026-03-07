from datetime import datetime
from pydantic import BaseModel


class ExportRequest(BaseModel):
    include_history: bool = True
    include_detail_views: bool = True
    notes: str | None = None


class ExportRecordOut(BaseModel):
    export_id: str
    status: str
    download_url: str | None = None
    expires_at: datetime | None = None
    manifest: dict | None = None
    error_message: str | None = None
    created_at: datetime
    completed_at: datetime | None = None


class ExportRecordBrief(BaseModel):
    export_id: str
    status: str
    created_at: datetime
    completed_at: datetime | None = None
    expires_at: datetime | None = None
