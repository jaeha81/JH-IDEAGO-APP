"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-03-09

Creates all tables for IDEAGO MVP:
  users, projects, agents, canvas_snapshots, canvas_elements,
  uploaded_assets, agent_responses, detail_view_results,
  export_records, project_events
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- users ---
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.Text(), unique=True, nullable=False),
        sa.Column("hashed_password", sa.Text(), nullable=False),
        sa.Column("display_name", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # --- projects ---
    op.create_table(
        "projects",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.Text(), nullable=True),
        sa.Column("auto_title", sa.Boolean(), default=False, nullable=False),
        sa.Column("status", sa.String(), default="active", nullable=False),
        sa.Column("purpose_note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("idx_projects_user_id", "projects", ["user_id"])

    # --- agents ---
    op.create_table(
        "agents",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role_label", sa.Text(), nullable=False),
        sa.Column("display_order", sa.Integer(), default=0, nullable=False),
        sa.Column("is_active", sa.Boolean(), default=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("idx_agents_project_id", "agents", ["project_id"])

    # --- canvas_snapshots ---
    op.create_table(
        "canvas_snapshots",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("snapshot_num", sa.Integer(), nullable=False),
        sa.Column("state_json", JSONB(), nullable=False),
        sa.Column("trigger", sa.String(), default="auto", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("project_id", "snapshot_num", name="uq_canvas_snapshots_project_num"),
    )
    op.create_index("idx_canvas_snapshots_project_num", "canvas_snapshots", ["project_id", "snapshot_num"])

    # --- uploaded_assets ---
    op.create_table(
        "uploaded_assets",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("original_name", sa.Text(), nullable=False),
        sa.Column("mime_type", sa.Text(), nullable=False),
        sa.Column("storage_key", sa.Text(), unique=True, nullable=False),
        sa.Column("storage_url", sa.Text(), nullable=False),
        sa.Column("thumbnail_key", sa.Text(), nullable=True),
        sa.Column("thumbnail_url", sa.Text(), nullable=True),
        sa.Column("file_size_bytes", sa.BigInteger(), nullable=False),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("idx_uploaded_assets_project", "uploaded_assets", ["project_id"])

    # --- canvas_elements ---
    op.create_table(
        "canvas_elements",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("snapshot_id", UUID(as_uuid=True), sa.ForeignKey("canvas_snapshots.id", ondelete="SET NULL"), nullable=True),
        sa.Column("element_type", sa.String(), nullable=False),
        sa.Column("element_data", JSONB(), nullable=False),
        sa.Column("position_x", sa.Float(), default=0.0, nullable=False),
        sa.Column("position_y", sa.Float(), default=0.0, nullable=False),
        sa.Column("z_index", sa.Integer(), default=0, nullable=False),
        sa.Column("asset_id", UUID(as_uuid=True), sa.ForeignKey("uploaded_assets.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    # Partial index: only active (non-deleted) elements — used by ContextBuilder
    op.create_index(
        "idx_canvas_elements_project_active",
        "canvas_elements",
        ["project_id"],
        postgresql_where=sa.text("deleted_at IS NULL"),
    )

    # --- agent_responses ---
    op.create_table(
        "agent_responses",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("query_id", UUID(as_uuid=True), nullable=False),
        sa.Column("project_id", UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("agent_id", UUID(as_uuid=True), sa.ForeignKey("agents.id", ondelete="SET NULL"), nullable=True),
        sa.Column("user_query", sa.Text(), nullable=False),
        sa.Column("summary_text", sa.Text(), nullable=False),
        sa.Column("full_reasoning", sa.Text(), nullable=True),
        sa.Column("token_count", sa.Integer(), nullable=True),
        sa.Column("model_used", sa.String(), nullable=True),
        sa.Column("context_event_seq_start", sa.BigInteger(), nullable=True),
        sa.Column("context_event_seq_end", sa.BigInteger(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("idx_agent_responses_query_id", "agent_responses", ["query_id"])
    op.create_index("idx_agent_responses_project_time", "agent_responses", ["project_id", "created_at"])

    # --- detail_view_results ---
    op.create_table(
        "detail_view_results",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("triggering_snapshot_id", UUID(as_uuid=True), sa.ForeignKey("canvas_snapshots.id", ondelete="SET NULL"), nullable=True),
        sa.Column("result_type", sa.String(), default="image", nullable=False),
        sa.Column("storage_key", sa.String(), nullable=True),
        sa.Column("storage_url", sa.String(), nullable=True),
        sa.Column("result_json", JSONB(), nullable=True),
        sa.Column("user_prompt", sa.Text(), nullable=True),
        sa.Column("status", sa.String(), default="pending", nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("idx_detail_view_results_project", "detail_view_results", ["project_id"])

    # --- export_records ---
    op.create_table(
        "export_records",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", sa.String(), default="pending", nullable=False),
        sa.Column("storage_key", sa.String(), nullable=True),
        sa.Column("download_url", sa.String(), nullable=True),
        sa.Column("included_snapshot_id", UUID(as_uuid=True), sa.ForeignKey("canvas_snapshots.id", ondelete="SET NULL"), nullable=True),
        sa.Column("export_manifest", JSONB(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("idx_export_records_project", "export_records", ["project_id"])

    # --- project_events (append-only — never UPDATE or DELETE rows) ---
    op.create_table(
        "project_events",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("event_type", sa.String(), nullable=False),
        sa.Column("payload", JSONB(), nullable=False, server_default="{}"),
        sa.Column("sequence_num", sa.BigInteger(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("project_id", "sequence_num", name="uq_project_events_project_seq"),
    )
    # Critical index: AI context builder reads events ordered by sequence_num
    op.create_index("idx_project_events_project_seq", "project_events", ["project_id", "sequence_num"])


def downgrade() -> None:
    op.drop_table("project_events")
    op.drop_table("export_records")
    op.drop_table("detail_view_results")
    op.drop_table("agent_responses")
    op.drop_table("canvas_elements")
    op.drop_table("uploaded_assets")
    op.drop_table("canvas_snapshots")
    op.drop_table("agents")
    op.drop_table("projects")
    op.drop_table("users")
