import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, ForeignKey, func, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str | None] = mapped_column(String, nullable=True)
    auto_title: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    status: Mapped[str] = mapped_column(String, default="active", nullable=False)
    purpose_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship("User", back_populates="projects")
    agents: Mapped[list["Agent"]] = relationship("Agent", back_populates="project", cascade="all, delete-orphan", order_by="Agent.display_order")
    canvas_snapshots: Mapped[list["CanvasSnapshot"]] = relationship("CanvasSnapshot", back_populates="project", cascade="all, delete-orphan")
    canvas_elements: Mapped[list["CanvasElement"]] = relationship("CanvasElement", back_populates="project", cascade="all, delete-orphan")
    uploaded_assets: Mapped[list["UploadedAsset"]] = relationship("UploadedAsset", back_populates="project", cascade="all, delete-orphan")
    agent_responses: Mapped[list["AgentResponse"]] = relationship("AgentResponse", back_populates="project", cascade="all, delete-orphan")
    detail_view_results: Mapped[list["DetailViewResult"]] = relationship("DetailViewResult", back_populates="project", cascade="all, delete-orphan")
    export_records: Mapped[list["ExportRecord"]] = relationship("ExportRecord", back_populates="project", cascade="all, delete-orphan")
    events: Mapped[list["ProjectEvent"]] = relationship("ProjectEvent", back_populates="project", cascade="all, delete-orphan")
