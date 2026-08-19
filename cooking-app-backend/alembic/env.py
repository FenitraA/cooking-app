# ruff: noqa: F401

from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context
from app.db.database import Base
from app.core.config import settings

from app.models import (
    app_user,
    role,
    user_role,
    endpoint_access,
    api_endpoint,
    refresh_token,
    state,
    ingredient,
    ingredient_type,
    ingredient_stock,
    meal,
    recipe,
    meal_ingredient,
    planning_recipe,
    recipe_ingredient,
    household,
    seller,
    ingredient_unit,
    unit_group,
    shopping,
    shopping_item,
    item_category,
    item_to_buy
)

# Alembic config object
config = context.config

# Choose DB URL depending on environment
config.set_main_option("sqlalchemy.url", settings.ONLINE_DEV_DATABASE_URL)

# Logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline():
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online():
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        future=True,
    )

    async with connectable.connect() as connection:

        def do_run_migrations(sync_conn):
            context.configure(
                connection=sync_conn,
                target_metadata=target_metadata,
                compare_type=True,
            )
            with context.begin_transaction():
                context.run_migrations()

        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    import asyncio

    asyncio.run(run_migrations_online())
