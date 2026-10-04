"""Coverage for the backend-to-ai-service internal service token.

The point of these tests is the *separation*: the new mechanism must not become
a second way in for a browser, and it must not weaken the cookie path that
``role_guard`` already enforces.
"""

import pytest
from fastapi import HTTPException
from jose import jwt

from app.core.internal_token import (
    INTERNAL_SECRET_ERROR,
    get_internal_service_secret,
    validate_internal_secret,
)
from app.services.internal_guard import (
    INTERNAL_TOKEN_HEADER,
    INTERNAL_USER_HEADER,
    INTERNAL_TOKEN_TYPE,
    decode_internal_token,
)

INTERNAL_SECRET = "i" * 64
USER_SECRET = "u" * 64


def make_internal_token(secret=INTERNAL_SECRET, **overrides):
    claims = {"sub": "user-1", "typ": INTERNAL_TOKEN_TYPE, "aud": "ai-service"}
    claims.update(overrides)
    return jwt.encode(claims, secret, algorithm="HS256")


# --- key separation -------------------------------------------------------


def test_internal_secret_requires_minimum_length():
    with pytest.raises(ValueError, match="INTERNAL_SERVICE_SECRET must be set"):
        validate_internal_secret("too-short")


def test_internal_secret_is_optional(monkeypatch):
    """Unset must mean 'not configured', not 'refuse to boot'."""
    monkeypatch.delenv("INTERNAL_SERVICE_SECRET", raising=False)
    assert get_internal_service_secret() is None


def test_internal_secret_blank_is_treated_as_unset(monkeypatch):
    monkeypatch.setenv("INTERNAL_SERVICE_SECRET", "   ")
    assert get_internal_service_secret() is None


def test_internal_secret_reads_the_environment(monkeypatch):
    monkeypatch.setenv("INTERNAL_SERVICE_SECRET", INTERNAL_SECRET)
    assert get_internal_service_secret() == INTERNAL_SECRET


# --- token verification ---------------------------------------------------


def test_accepts_a_token_signed_with_the_internal_secret():
    payload = decode_internal_token(make_internal_token(), INTERNAL_SECRET)
    assert payload["sub"] == "user-1"
    assert payload["typ"] == INTERNAL_TOKEN_TYPE


def test_rejects_a_token_signed_with_a_different_key():
    """The property that makes a user access token useless here."""
    token = make_internal_token(secret=USER_SECRET)
    with pytest.raises(HTTPException) as exc:
        decode_internal_token(token, INTERNAL_SECRET)
    assert exc.value.status_code == 401


def test_rejects_a_token_that_is_not_marked_internal():
    """A validly-signed token of the wrong type must still be refused."""
    token = make_internal_token(typ="access")
    with pytest.raises(HTTPException) as exc:
        decode_internal_token(token, INTERNAL_SECRET)
    assert exc.value.status_code == 401


def test_rejects_a_token_without_a_subject():
    token = make_internal_token(sub=None)
    with pytest.raises(HTTPException) as exc:
        decode_internal_token(token, INTERNAL_SECRET)
    assert exc.value.status_code == 401


def test_rejects_a_garbage_token():
    with pytest.raises(HTTPException) as exc:
        decode_internal_token("not-a-jwt", INTERNAL_SECRET)
    assert exc.value.status_code == 401


def test_error_message_does_not_leak_which_check_failed():
    """A missing token and a forged one must be indistinguishable to a caller."""
    messages = set()
    for token in ("not-a-jwt", make_internal_token(secret=USER_SECRET)):
        with pytest.raises(HTTPException) as exc:
            decode_internal_token(token, INTERNAL_SECRET)
        messages.add(exc.value.detail)
    assert messages == {"Invalid internal service token"}


# --- the dependency itself ------------------------------------------------


def test_dependency_fails_closed_when_the_secret_is_unconfigured(monkeypatch):
    """An unconfigured secret must reject, never skip the check."""
    from app.services import internal_guard

    monkeypatch.delenv("INTERNAL_SERVICE_SECRET", raising=False)
    monkeypatch.setattr(
        internal_guard, "get_internal_service_secret", lambda: None
    )

    with pytest.raises(HTTPException) as exc:
        internal_guard.get_internal_service_user(
            request=None,
            db=None,
            x_internal_service_token=make_internal_token(),
            x_internal_service_user="user-1",
        )
    assert exc.value.status_code == 401


def test_dependency_rejects_a_missing_token(monkeypatch):
    from app.services import internal_guard

    monkeypatch.setattr(
        internal_guard, "get_internal_service_secret", lambda: INTERNAL_SECRET
    )

    with pytest.raises(HTTPException) as exc:
        internal_guard.get_internal_service_user(
            request=None, db=None, x_internal_service_token=None,
            x_internal_service_user="user-1",
        )
    assert exc.value.status_code == 401


def test_dependency_never_reads_the_cookie():
    """A cookie must not be an alternate route into an internal-only dependency.

    The signature has no ``request.cookies`` access at all; this asserts that
    stays true rather than relying on it by inspection.
    """
    import inspect

    from app.services import internal_guard

    source = inspect.getsource(internal_guard)
    assert "request.cookies" not in source
    assert "cookies.get" not in source


def test_role_guard_cookie_path_is_untouched():
    """The existing browser path must still be cookie-only.

    The bridge is additive. If role_guard ever started accepting the internal
    header, a browser could reach a user route with a service credential, which
    is the confusion the two mechanisms exist to prevent.
    """
    import inspect

    from app.services import role_guard

    source = inspect.getsource(role_guard)
    assert 'request.cookies.get("access_token")' in source
    assert INTERNAL_TOKEN_HEADER not in source
    assert "internal" not in source


def test_header_names_are_the_documented_ones():
    assert INTERNAL_TOKEN_HEADER == "X-Internal-Service-Token"
    assert INTERNAL_USER_HEADER == "X-Internal-Service-User"
    assert INTERNAL_SECRET_ERROR.startswith("INTERNAL_SERVICE_SECRET must be set")