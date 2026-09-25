"""
Rate limiter for public guest endpoints to prevent spam, denial-of-service, and scraping.
Uses a thread-safe sliding-window rate tracking mechanism.
"""

from collections import defaultdict
from datetime import datetime, timezone
import threading
from fastapi import HTTPException, Request, status

_LOCK = threading.Lock()
# Mapping of (action, ip) -> list of timestamp floats
_REQUEST_HISTORY: dict[tuple[str, str], list[float]] = defaultdict(list)


def check_rate_limit(
    request: Request,
    action: str,
    max_requests: int = 10,
    window_seconds: int = 60,
) -> None:
    """
    Checks sliding window rate limit for client IP.
    Raises HTTP 429 Too Many Requests if rate is exceeded.
    """
    client_ip = (
        request.headers.get("x-forwarded-for", "").split(",")[0].strip()
        or (request.client.host if request.client else "unknown_client")
    )
    now = datetime.now(timezone.utc).timestamp()
    cutoff = now - window_seconds
    key = (action, client_ip)

    with _LOCK:
        history = _REQUEST_HISTORY[key]
        # Discard entries older than the window
        _REQUEST_HISTORY[key] = [t for t in history if t > cutoff]

        if len(_REQUEST_HISTORY[key]) >= max_requests:
            retry_after = int(window_seconds - (now - _REQUEST_HISTORY[key][0]))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded for {action}. Please try again in {max(1, retry_after)} seconds.",
                headers={"Retry-After": str(max(1, retry_after))},
            )

        _REQUEST_HISTORY[key].append(now)


def reset_rate_limits() -> None:
    """Helper for unit and integration test fixtures."""
    with _LOCK:
        _REQUEST_HISTORY.clear()

