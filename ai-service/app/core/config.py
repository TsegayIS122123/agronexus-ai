"""Single source of truth for ai-service environment configuration.

Every environment variable the service reads is declared, validated, and
resolved here. Modules import from this module instead of calling
``os.getenv`` directly, so a missing or malformed value fails once at startup
with an actionable message instead of deep inside a request handler.
"""

import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from pydantic import Field, ValidationError, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# ai-service/.env, resolved from this file rather than the working directory so
# imports behave the same under uvicorn, alembic, pytest, and a bare `python -c`.
ENV_PATH = Path(__file__).resolve().parents[2] / ".env"

load_dotenv(ENV_PATH)

MIN_SECRET_KEY_LENGTH = 32
SECRET_KEY_ERROR = (
    f"SECRET_KEY must be set and contain at least {MIN_SECRET_KEY_LENGTH} characters"
)

# ALGORITHM is operator-controlled, so it is pinned to symmetric signing only.
# "none" and any asymmetric algorithm would let a misconfigured deployment
# accept unsigned or attacker-chosen tokens.
ALLOWED_ALGORITHMS = ("HS256", "HS384", "HS512")
ALGORITHM_ERROR = f"ALGORITHM must be one of {', '.join(ALLOWED_ALGORITHMS)}"

DEFAULT_DATABASE_URL = "postgresql://postgres:postgres@localhost:5436/agronexus"
DEFAULT_ALGORITHM = "HS256"
DEFAULT_ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24
DEFAULT_MODEL_PATH = "../data/models/disease-detection"
DEFAULT_MODEL_VERSION = "v1"
DEFAULT_CORS_ORIGINS = "http://localhost:3000,http://localhost:3001"


def validate_secret_key(value: str | None) -> str:
    """Return ``value`` if it is a usable signing key, else raise ``ValueError``."""
    if not value or len(value) < MIN_SECRET_KEY_LENGTH:
        raise ValueError(SECRET_KEY_ERROR)
    return value


class Settings(BaseSettings):
    """Validated view of the service environment.

    Field aliases are the literal environment variable names so resolution
    stays explicit instead of relying on case-folding rules.
    """

    model_config = SettingsConfigDict(
        env_file=None,
        extra="ignore",
        case_sensitive=True,
    )

    database_url: str = Field(
        default=DEFAULT_DATABASE_URL, validation_alias="DATABASE_URL"
    )

    secret_key: str = Field(validation_alias="SECRET_KEY")
    algorithm: str = Field(default=DEFAULT_ALGORITHM, validation_alias="ALGORITHM")
    access_token_expire_minutes: int = Field(
        default=DEFAULT_ACCESS_TOKEN_EXPIRE_MINUTES,
        validation_alias="ACCESS_TOKEN_EXPIRE_MINUTES",
    )
    cookie_secure: bool = Field(default=False, validation_alias="COOKIE_SECURE")
    cors_origins: str = Field(
        default=DEFAULT_CORS_ORIGINS, validation_alias="CORS_ORIGINS"
    )

    gemini_api_key: str = Field(default="", validation_alias="GEMINI_API_KEY")
    openweather_api_key: str = Field(
        default="", validation_alias="OPENWEATHER_API_KEY"
    )

    model_path: str = Field(default=DEFAULT_MODEL_PATH, validation_alias="MODEL_PATH")
    model_version: str = Field(
        default=DEFAULT_MODEL_VERSION, validation_alias="MODEL_VERSION"
    )

    # Planned, not yet used. Declared so the service keeps one configuration
    # surface; inert until Phase 3 (notifications) and Phase 4 (Chapa) wire
    # real providers. Empty string means "not configured", not a failure.
    chapa_public_key: str = Field(default="", validation_alias="CHAPA_PUBLIC_KEY")
    chapa_secret_key: str = Field(default="", validation_alias="CHAPA_SECRET_KEY")
    chapa_webhook_secret: str = Field(
        default="", validation_alias="CHAPA_WEBHOOK_SECRET"
    )
    email_api_key: str = Field(default="", validation_alias="EMAIL_API_KEY")
    email_from: str = Field(default="", validation_alias="EMAIL_FROM")
    sms_api_key: str = Field(default="", validation_alias="SMS_API_KEY")
    sms_sender_id: str = Field(default="", validation_alias="SMS_SENDER_ID")

    @field_validator("secret_key")
    @classmethod
    def _check_secret_key(cls, value: str) -> str:
        return validate_secret_key(value)

    @field_validator("algorithm")
    @classmethod
    def _check_algorithm(cls, value: str) -> str:
        if value not in ALLOWED_ALGORITHMS:
            raise ValueError(ALGORITHM_ERROR)
        return value

    @field_validator("access_token_expire_minutes")
    @classmethod
    def _check_expiry(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("ACCESS_TOKEN_EXPIRE_MINUTES must be greater than 0")
        return value

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


def get_database_url() -> str:
    """Return ``DATABASE_URL`` with its default applied.

    Deliberately does not validate the rest of the environment: Alembic and the
    data-collection scripts only need a connection string, and should not be
    forced to supply a signing key just to import ``app.database``.
    """
    return os.getenv("DATABASE_URL") or DEFAULT_DATABASE_URL


def get_secret_key() -> str:
    """Return ``SECRET_KEY`` from the current environment, validated per call.

    Read live rather than from cached settings so a rotated key takes effect
    without a restart, and so validation can be exercised in isolation.
    """
    try:
        return validate_secret_key(os.getenv("SECRET_KEY"))
    except ValueError as exc:
        raise RuntimeError(str(exc)) from exc


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return the validated settings singleton.

    Raises ``RuntimeError`` on invalid configuration so the service fails at
    import time with a readable cause rather than a bare pydantic traceback.
    """
    try:
        return Settings()
    except ValidationError as exc:
        raise RuntimeError(f"Invalid ai-service configuration:\n{exc}") from exc
