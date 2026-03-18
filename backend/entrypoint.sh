#!/bin/bash
# Use the PORT environment variable if set by the environment (e.g., Cloud Run),
# otherwise, default to 8000 for local development.
UVICORN_PORT=${PORT:-8000}
echo "Starting Uvicorn on port: $UVICORN_PORT"
exec uvicorn app.main:app --host 0.0.0.0 --port "$UVICORN_PORT"
