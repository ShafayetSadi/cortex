"""rag schema

Revision ID: a3f9e2b1c847
Revises: f58fd8dee6d4
Create Date: 2026-04-03 00:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "a3f9e2b1c847"
down_revision: Union[str, Sequence[str], None] = "f58fd8dee6d4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("documents", sa.Column("embedding", sa.JSON(), nullable=True))
    op.drop_column("documents", "summary_embedding")
    op.drop_column("documents", "summary")


def downgrade() -> None:
    op.add_column("documents", sa.Column("summary", sa.Text(), nullable=True))
    op.add_column("documents", sa.Column("summary_embedding", sa.JSON(), nullable=True))
    op.drop_column("documents", "embedding")
