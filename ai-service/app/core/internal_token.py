"""Signing key for the backend-to-ai-service internal service token.

This is deliberately **not** ``SECRET_KEY``. A token signed with ``SECRET_KEY``
would be indistinguishable from a user session cookie, and an internal service
token must never be usable as a user credential (or vice versa). Keeping the
keys separate means leaking one does not forge the other.

Read live per call, matching ``get_secret_key``, so rotating the value takes
effect without a restart.
"""

import os

MIN_INTERNAL_SECRET_LENGTH = 32
INTERNAL_SECRET_ERROR = (
    "INTERNAL_SERVICE_SECRET must be set and contain at least "
    f"{MIN_INTERNAL_SECRET_LENGTH} characters"
)


def validate_internal_secret(value: str | None) -> str:
    """Return ``value`` if it is a usable internal signing key, else raise."""
    if not value or len(value) < MIN_INTERNAL_SECRET_LENGTH:
        raise ValueError(INTERNAL_SECRET_ERROR)
    return value


def get_internal_service_secret() -> str | None:
    """Return ``INTERNAL_SERVICE_SECRET``, or ``None`` when it is not configured.

    Unlike ``SECRET_KEY`` this is optional. Development runs the browser-facing
    Next rewrite with no credential at all today, so a hard failure here would
    stop the service booting for a reason unrelated to the current prototype.
    An unconfigured secret makes the internal dependency reject every token
    (fail closed) rather than accept anything.
    """
    value = os.getenv("INTERNAL_SERVICE_SECRET")
    if not value or not value.strip():
        return None
    return validate_internal_secret(value)


def internal_secret_is_configured() -> bool:
    """Whether an internal token could be verified right now."""
    return get_internal_service_secret() is not None