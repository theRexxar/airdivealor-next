#!/bin/sh
# Start the right process for this service. Railway runs the same image for "web" and "worker":
#   APP_ROLE=worker, or a Railway service whose name contains "worker" → the media worker
#   anything else                                                   → the website + CMS
# So the worker keeps running the worker on every deploy, whichever config file the service reads.
ROLE="${APP_ROLE:-}"
if [ -z "$ROLE" ]; then
  case "$(printf '%s' "${RAILWAY_SERVICE_NAME:-}" | tr '[:upper:]' '[:lower:]')" in
    *worker*) ROLE=worker ;;
    *) ROLE=web ;;
  esac
fi
echo "[start] role: $ROLE (APP_ROLE=${APP_ROLE:-unset}, service=${RAILWAY_SERVICE_NAME:-local})"
if [ "$ROLE" = "worker" ]; then
  exec npm run worker
fi
exec npx next start -H 0.0.0.0 -p "${PORT:-3000}"
