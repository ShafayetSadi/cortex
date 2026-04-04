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
    with op.batch_alter_table("documents") as batch_op:
        batch_op.add_column(sa.Column("embedding", sa.JSON(), nullable=True))
        batch_op.drop_column("summary_embedding")
        batch_op.drop_column("summary")


def downgrade() -> None:
    with op.batch_alter_table("documents") as batch_op:
        batch_op.add_column(sa.Column("summary", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("summary_embedding", sa.JSON(), nullable=True))
        batch_op.drop_column("embedding")
