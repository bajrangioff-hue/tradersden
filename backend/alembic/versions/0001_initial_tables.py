"""Initial database schema.

Revision ID: 0001
Revises:
Create Date: 2026-05-18
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=True),
        sa.Column("display_name", sa.String(100), nullable=True),
        sa.Column("avatar_url", sa.String(500), nullable=True),
        sa.Column("google_id", sa.String(255), nullable=True, unique=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_table(
        "refresh_tokens",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("token_hash", sa.String(255), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_refresh_tokens_user_id", "refresh_tokens", ["user_id"])
    op.create_table(
        "trades",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("symbol", sa.String(20), nullable=False),
        sa.Column("direction", sa.String(6), nullable=False),
        sa.Column("entry_price", sa.Numeric(12, 4), nullable=False),
        sa.Column("exit_price", sa.Numeric(12, 4), nullable=True),
        sa.Column("quantity", sa.Numeric(12, 4), nullable=False),
        sa.Column("entry_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("exit_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("stop_loss", sa.Numeric(12, 4), nullable=True),
        sa.Column("take_profit", sa.Numeric(12, 4), nullable=True),
        sa.Column("pnl", sa.Numeric(12, 2), nullable=True),
        sa.Column("pnl_pct", sa.Numeric(8, 4), nullable=True),
        sa.Column("outcome", sa.String(11), nullable=True),
        sa.Column("commission", sa.Numeric(10, 2), server_default=sa.text("0")),
        sa.Column("fees", sa.Numeric(10, 2), server_default=sa.text("0")),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("setup_tags", sa.ARRAY(sa.String()), nullable=True),
        sa.Column("session", sa.String(20), nullable=True),
        sa.Column("grade_at_entry", sa.String(3), nullable=True),
        sa.Column("confluence_score", sa.Numeric(5, 1), nullable=True),
        sa.Column("screenshot_paths", sa.ARRAY(sa.String()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_trades_user_symbol", "trades", ["user_id", "symbol"])
    op.create_index("idx_trades_entry_time", "trades", ["user_id", "entry_time"])
    op.create_index("idx_trades_outcome", "trades", ["user_id", "outcome"])
    op.create_table(
        "confluence_levels",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("symbol", sa.String(20), nullable=False),
        sa.Column("level_type", sa.String(20), nullable=False),
        sa.Column("price", sa.Numeric(12, 4), nullable=False),
        sa.Column("high", sa.Numeric(12, 4), nullable=True),
        sa.Column("low", sa.Numeric(12, 4), nullable=True),
        sa.Column("direction", sa.String(10), nullable=True),
        sa.Column("confluence_score", sa.Numeric(5, 1), nullable=True),
        sa.Column("strength", sa.String(10), nullable=True),
        sa.Column("source_modules", sa.ARRAY(sa.String()), nullable=True),
        sa.Column("time_frame", sa.String(5), nullable=True),
        sa.Column("detected_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("is_mitigated", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("is_favorite", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_cl_user_symbol_time", "confluence_levels", ["user_id", "symbol", "detected_at"])
    op.create_table(
        "saved_setups",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("symbol", sa.String(20), nullable=False),
        sa.Column("title", sa.String(200), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("analysis_snapshot", sa.JSONB(), nullable=False),
        sa.Column("level_ids", sa.ARRAY(sa.Uuid()), server_default=sa.text("'{}'")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "watchlist_items",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("symbol", sa.String(20), nullable=False),
        sa.Column("display_order", sa.Integer(), server_default=sa.text("0")),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "symbol", name="uq_watchlist_user_symbol"),
    )
    op.create_table(
        "tags",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(50), nullable=False),
        sa.Column("color", sa.String(7), server_default=sa.text("'#6366f1'")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "name", name="uq_tag_user_name"),
    )
    op.create_table(
        "trade_tags",
        sa.Column("trade_id", sa.Uuid(), nullable=False),
        sa.Column("tag_id", sa.Uuid(), nullable=False),
        sa.PrimaryKeyConstraint("trade_id", "tag_id"),
    )
    op.create_table(
        "user_preferences",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("preferences", sa.JSONB(), server_default=sa.text("'{}'")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("user_id"),
    )


def downgrade() -> None:
    op.drop_table("user_preferences")
    op.drop_table("trade_tags")
    op.drop_table("tags")
    op.drop_table("watchlist_items")
    op.drop_table("saved_setups")
    op.drop_table("confluence_levels")
    op.drop_index("idx_trades_outcome", table_name="trades")
    op.drop_index("idx_trades_entry_time", table_name="trades")
    op.drop_index("idx_trades_user_symbol", table_name="trades")
    op.drop_table("trades")
    op.drop_index("ix_refresh_tokens_user_id", table_name="refresh_tokens")
    op.drop_table("refresh_tokens")
    op.drop_table("users")
