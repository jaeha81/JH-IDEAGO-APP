from datetime import datetime
from pydantic import BaseModel


class CanvasElement(BaseModel):
    id: str
    type: str
    data: dict
    z_index: int = 0
    position_x: float = 0.0
    position_y: float = 0.0


class CanvasState(BaseModel):
    version: int = 1
    width: float = 2560
    height: float = 1920
    background: str = "#FFFFFF"
    elements: list[CanvasElement] = []


class CanvasSaveRequest(BaseModel):
    state_json: CanvasState


class CanvasSnapshotOut(BaseModel):
    snapshot_id: str
    snapshot_num: int
    state_json: CanvasState
    trigger: str
    created_at: datetime


class CanvasSnapshotBrief(BaseModel):
    snapshot_id: str
    snapshot_num: int
    trigger: str
    created_at: datetime
