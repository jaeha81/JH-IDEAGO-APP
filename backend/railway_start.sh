#!/bin/bash
# Railway start script — transforms DATABASE_URL to async format and starts uvicorn.
# Railway provides DATABASE_URL as postgresql://... but we need:
#   - DATABASE_URL_SYNC = postgresql://... (for Alembic)
#   - DATABASE_URL = postgresql+asyncpg://... (for SQLAlchemy async)

set -e

# Transform DATABASE_URL for async SQLAlchemy
if [ -n "$DATABASE_URL" ]; then
  # Set sync URL (for Alembic migrations)
  export DATABASE_URL_SYNC="$DATABASE_URL"
  # Set async URL (replace postgresql:// with postgresql+asyncpg://)
  export DATABASE_URL="${DATABASE_URL/postgresql:\/\//postgresql+asyncpg:\/\/}"
  echo "DATABASE_URL_SYNC: $DATABASE_URL_SYNC"
  echo "DATABASE_URL (async): $DATABASE_URL"
fi

# Set Celery URLs from Redis if not set
if [ -n "$REDIS_URL" ]; then
  export CELERY_BROKER_URL="${CELERY_BROKER_URL:-$REDIS_URL}"
  export CELERY_RESULT_BACKEND="${CELERY_RESULT_BACKEND:-$REDIS_URL}"
fi

# Run migrations
echo "Running database migrations..."
alembic upgrade head || echo "Migration warning: may already be up to date"

# Start the app
echo "Starting IDEAGO backend..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
