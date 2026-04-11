"""add superadmin role

Revision ID: h3i4j5k6l7m8
Revises: g2h3i4j5k6l7
Create Date: 2026-04-11 00:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "h3i4j5k6l7m8"
down_revision: Union[str, Sequence[str], None] = "g2h3i4j5k6l7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # SQLite stores enums as VARCHAR, so no DDL change needed.
    # For PostgreSQL, alter the enum type to add the new value.
    conn = op.get_bind()
    if conn.dialect.name == "postgresql":
        op.execute("ALTER TYPE user_roles ADD VALUE IF NOT EXISTS 'superadmin'")


def downgrade() -> None:
    # Removing an enum value from PostgreSQL requires a full type rebuild;
    # for SQLite there is nothing to do.
    pass
