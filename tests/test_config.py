import importlib
import sys
from pathlib import Path

import pytest

from app.core.config import (
    MIN_SECRET_KEY_LENGTH,
    get_secret_key,
    get_settings,
    validate_secret_key,
)

REPO_ROOT = Path(__file__).resolve().parents[1]

VALID_SECRET = "a" * MIN_SECRET_KEY_LENGTH


@pytest.fixture(autouse=True)
def clear_cached_settings():
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def test_config_reads_values_from_environment(monkeypatch):
    monkeypatch.setenv("SECRET_KEY", VALID_SECRET)
    monkeypatch.setenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
    monkeypatch.setenv("COOKIE_SECURE", "true")
    monkeypatch.setenv("MODEL_VERSION", "v2")

    settings = get_settings()

    assert settings.secret_key == VALID_SECRET
    assert settings.access_token_expire_minutes == 30
    assert settings.cookie_secure is True
    assert settings.model_version == "v2"


def test_optional_api_keys_default_to_empty(monkeypatch):
    monkeypatch.setenv("SECRET_KEY", VALID_SECRET)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("OPENWEATHER_API_KEY", raising=False)

    settings = get_settings()

    assert settings.gemini_api_key == ""
    assert settings.openweather_api_key == ""


def test_planned_provider_keys_default_to_empty(monkeypatch):
    monkeypatch.setenv("SECRET_KEY", VALID_SECRET)
    for name in (
        "CHAPA_PUBLIC_KEY",
        "CHAPA_SECRET_KEY",
        "CHAPA_WEBHOOK_SECRET",
        "EMAIL_API_KEY",
        "EMAIL_FROM",
        "SMS_API_KEY",
        "SMS_SENDER_ID",
    ):
        monkeypatch.delenv(name, raising=False)

    settings = get_settings()

    assert settings.chapa_public_key == ""
    assert settings.chapa_secret_key == ""
    assert settings.chapa_webhook_secret == ""
    assert settings.email_api_key == ""
    assert settings.email_from == ""
    assert settings.sms_api_key == ""
    assert settings.sms_sender_id == ""


def test_missing_secret_key_fails_startup_with_runtime_error(monkeypatch):
    monkeypatch.delenv("SECRET_KEY", raising=False)

    with pytest.raises(RuntimeError):
        get_settings()


def test_short_secret_key_is_rejected(monkeypatch):
    monkeypatch.setenv("SECRET_KEY", "short")

    with pytest.raises(RuntimeError):
        get_settings()


def test_get_settings_is_cached_but_get_secret_key_is_live(monkeypatch):
    monkeypatch.setenv("SECRET_KEY", VALID_SECRET)
    assert get_settings().secret_key == VALID_SECRET

    rotated = "b" * MIN_SECRET_KEY_LENGTH
    monkeypatch.setenv("SECRET_KEY", rotated)

    # Settings are a validated snapshot, not a live view of the environment.
    assert get_settings().secret_key == VALID_SECRET
    # get_secret_key() is the live reader used for signing and verification.
    assert get_secret_key() == rotated


def test_rotating_the_secret_key_invalidates_existing_tokens(monkeypatch):
    from jose import JWTError
    from jose import jwt as jose_jwt

    from app.services.auth_service import create_access_token

    monkeypatch.setenv("SECRET_KEY", VALID_SECRET)
    stale_token = create_access_token({"sub": "user-1", "role": "farmer"})

    monkeypatch.setenv("SECRET_KEY", "b" * MIN_SECRET_KEY_LENGTH)
    fresh_token = create_access_token({"sub": "user-1", "role": "farmer"})

    with pytest.raises(JWTError):
        jose_jwt.decode(stale_token, get_secret_key(), algorithms=["HS256"])

    payload = jose_jwt.decode(fresh_token, get_secret_key(), algorithms=["HS256"])
    assert payload["sub"] == "user-1"


def test_algorithm_must_be_an_allowed_hmac_algorithm(monkeypatch):
    monkeypatch.setenv("SECRET_KEY", VALID_SECRET)
    monkeypatch.setenv("ALGORITHM", "none")

    with pytest.raises(RuntimeError, match="Invalid ai-service configuration"):
        get_settings()


def test_access_token_expiry_must_be_positive(monkeypatch):
    monkeypatch.setenv("SECRET_KEY", VALID_SECRET)
    monkeypatch.setenv("ACCESS_TOKEN_EXPIRE_MINUTES", "0")

    with pytest.raises(RuntimeError, match="Invalid ai-service configuration"):
        get_settings()


def test_cors_origins_are_split_and_trimmed(monkeypatch):
    monkeypatch.setenv("SECRET_KEY", VALID_SECRET)
    monkeypatch.setenv("CORS_ORIGINS", "http://localhost:3000, https://app.example.com ,")

    origins = get_settings().cors_origin_list

    assert origins == ["http://localhost:3000", "https://app.example.com"]


@pytest.mark.parametrize("value", [None, "", "short-secret", "a" * (MIN_SECRET_KEY_LENGTH - 1)])
def test_validate_secret_key_rejects_weak_values(value):
    with pytest.raises(ValueError, match="SECRET_KEY must be set"):
        validate_secret_key(value)


def test_validate_secret_key_accepts_exact_minimum():
    assert validate_secret_key(VALID_SECRET) == VALID_SECRET


def test_weather_service_imports_without_a_weather_model():
    """weather_service used to import a nonexistent app.models.weather, which
    broke app startup because main.py includes the weather router."""
    source = (REPO_ROOT / "ai-service/app/services/weather_service.py").read_text(
        encoding="utf-8"
    )

    assert "app.models.weather" not in source


def test_requirements_declare_packages_the_code_imports():
    requirements = (REPO_ROOT / "ai-service/requirements.txt").read_text(encoding="utf-8")

    assert "requests" in requirements
    assert "pydantic-settings" in requirements


def test_database_module_does_not_require_a_secret_key(monkeypatch):
    """Alembic and the data-collection scripts import app.database with only
    DATABASE_URL set, so a required SECRET_KEY here would break migrations."""
    url = "postgresql://postgres:postgres@localhost:5432/x"
    monkeypatch.delenv("SECRET_KEY", raising=False)
    monkeypatch.setenv("DATABASE_URL", url)

    # Drop any copy imported earlier in the session so the assertion sees a
    # module built from the environment this test set up.
    sys.modules.pop("app.database", None)
    try:
        module = importlib.import_module("app.database")
        assert module.DATABASE_URL == url
    finally:
        sys.modules.pop("app.database", None)
        get_settings.cache_clear()


def test_main_derives_cors_origins_from_settings():
    """CORS_ORIGINS was documented and tested but main.py still hardcoded the
    list, so the setting had no effect."""
    source = (REPO_ROOT / "ai-service/app/main.py").read_text(encoding="utf-8")

    assert "settings.cors_origin_list" in source
    assert "http://localhost:3000" not in source
