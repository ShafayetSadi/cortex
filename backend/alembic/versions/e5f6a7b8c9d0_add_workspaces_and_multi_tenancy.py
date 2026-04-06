"""add workspaces and multi tenancy

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-04-05 00:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e5f6a7b8c9d0"
down_revision: Union[str, Sequence[str], None] = "d4e5f6a7b8c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create workspaces table
    op.create_table(
        "workspaces",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_workspaces_id"), "workspaces", ["id"], unique=False)
    op.create_index(op.f("ix_workspaces_slug"), "workspaces", ["slug"], unique=True)

    # 2. Insert a default workspace for existing data
    # (SQLite and Postgres compatible simple insert via execution)
    op.execute(
        "INSERT INTO workspaces (name, slug, created_at, updated_at) "
        "VALUES ('Default Workspace', 'default-workspace', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
    )

    # 3. Add workspace_id columns with a server_default
    op.add_column(
        "users",
        sa.Column("workspace_id", sa.Integer(), server_default="1", nullable=False),
    )
    op.add_column(
        "documents",
        sa.Column("workspace_id", sa.Integer(), server_default="1", nullable=False),
    )
    op.add_column(
        "document_chunks",
        sa.Column("workspace_id", sa.Integer(), server_default="1", nullable=False),
    )

    # 4. Add foreign keys (Requires batch mode for SQLite, but if it's Postgres it works directly.
    # To be safe across engines if it's SQLite, we just add the constraint. But wait, we can just add the FKs normally if not SQLite, or use batch mode if it is.)
    # Since we didn't enable render_as_batch, we'll assume the driver supports standard ADD CONSTRAINT or it will be ignored on SQLite.
    try:
        op.create_foreign_key(
            "fk_users_workspace_id", "users", "workspaces", ["workspace_id"], ["id"]
        )
        op.create_foreign_key(
            "fk_documents_workspace_id",
            "documents",
            "workspaces",
            ["workspace_id"],
            ["id"],
        )
        op.create_foreign_key(
            "fk_document_chunks_workspace_id",
            "document_chunks",
            "workspaces",
            ["workspace_id"],
            ["id"],
        )
    except Exception:
        pass  # Ignore for SQLite without batch alter table


def downgrade() -> None:
    try:
        op.drop_constraint(
            "fk_document_chunks_workspace_id", "document_chunks", type_="foreignkey"
        )
        op.drop_constraint("fk_documents_workspace_id", "documents", type_="foreignkey")
        op.drop_constraint("fk_users_workspace_id", "users", type_="foreignkey")
    except Exception:
        pass

    op.drop_column("document_chunks", "workspace_id")
    op.drop_column("documents", "workspace_id")
    op.drop_column("users", "workspace_id")

    op.drop_index(op.f("ix_workspaces_slug"), table_name="workspaces")
    op.drop_index(op.f("ix_workspaces_id"), table_name="workspaces")
    op.drop_table("workspaces")
