"""
Global rate limiting support using slowapi.
Provides Limiter instance with IP key retrieval.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["30/minute"],
)

