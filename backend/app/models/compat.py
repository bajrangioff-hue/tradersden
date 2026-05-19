"""Database-agnostic type aliases — works with PostgreSQL and SQLite.

Usage:
    from app.models.compat import UUID_TYPE, JSON_TYPE, ARRAY_TYPE

    id: Mapped[uuid.UUID] = mapped_column(UUID_TYPE, primary_key=True)
    data: Mapped[dict] = mapped_column(JSON_TYPE)
    tags: Mapped[list[str]] = mapped_column(ARRAY_TYPE)
"""

from sqlalchemy import JSON, Uuid, TypeDecorator
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB as PG_JSONB, ARRAY as PG_ARRAY


class _UUID(TypeDecorator):
    """UUID: native PG type on PostgreSQL, CHAR(32) elsewhere."""

    impl = Uuid
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        return dialect.type_descriptor(Uuid())


class _JSON(TypeDecorator):
    """JSON: JSONB on PostgreSQL, native JSON elsewhere."""

    impl = JSON
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_JSONB())
        return dialect.type_descriptor(JSON())


class _Array(TypeDecorator):
    """String array: native ARRAY on PostgreSQL, JSON array elsewhere."""

    impl = JSON
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_ARRAY(JSON))
        return dialect.type_descriptor(JSON())

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if dialect.name == "postgresql":
            return value
        if isinstance(value, list):
            import json
            return json.dumps(value, default=str)
        return value

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if dialect.name == "postgresql":
            return value
        if isinstance(value, str):
            import json
            try:
                return json.loads(value)
            except (json.JSONDecodeError, TypeError):
                return value
        return value


UUID_TYPE = _UUID
JSON_TYPE = _JSON
ARRAY_TYPE = _Array
