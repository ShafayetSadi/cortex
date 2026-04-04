from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool

from alembic import context

# ---------------------------------------------------------------------------
# Alembic config object – gives access to values in alembic.ini
# ---------------------------------------------------------------------------
config = context.config

# Set up Python logging from the ini file (if present)
if config.config_file_name is not None:
    fileConfig(config.config_file_name, disable_existing_loggers=False)

# ---------------------------------------------------------------------------
# Import app models so Alembic can autogenerate migrations
# ---------------------------------------------------------------------------
import app.models  # noqa: E402, F401 – ensure all models are registered on Base
from app.core.config import settings  # noqa: E402
from app.core.database import Base  # noqa: E402

target_metadata = Base.metadata

# ---------------------------------------------------------------------------
# Override the sqlalchemy.url from app settings so we never have to hard-code
# a database URL inside alembic.ini
# ---------------------------------------------------------------------------
config.set_main_option("sqlalchemy.url", settings.database_url)


# ---------------------------------------------------------------------------
# Offline migration – emits SQL to stdout, no live DB connection needed
# ---------------------------------------------------------------------------
def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        # Render ALTER statements for column changes (SQLite-safe via batch)
        render_as_batch=True,
    )

    with context.begin_transaction():
        context.run_migrations()


# ---------------------------------------------------------------------------
# Online migration – uses a live connection from the engine
# ---------------------------------------------------------------------------
def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            # render_as_batch=True is required for SQLite, which does not
            # support ALTER COLUMN / DROP COLUMN natively.
            render_as_batch=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
