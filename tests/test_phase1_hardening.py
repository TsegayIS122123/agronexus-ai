import pytest
from fastapi import Response
from starlette.requests import Request
from pydantic import ValidationError
from types import SimpleNamespace
from uuid import uuid4
from pathlib import Path
from unittest.mock import patch

from app.schemas.user import UserRegister
from app.services.auth_service import create_access_token, get_secret_key, set_access_cookie
from app.services.marketplace_service import update_order_status
from app.services.role_guard import get_current_user


def valid_registration(**overrides):
    data = {
        "name": "Test Farmer",
        "email": "farmer@example.com",
        "phone": "+251911234567",
        "password": "strong-password",
        "language": "en",
        "role": "farmer",
    }
    data.update(overrides)
    return data


def test_public_registration_rejects_admin_role():
    with pytest.raises(ValidationError):
        UserRegister(**valid_registration(role="admin"))


@pytest.mark.parametrize("role", ["farmer", "processor", "consumer"])
def test_public_registration_accepts_supported_roles(role):
    user = UserRegister(**valid_registration(role=role))
    assert user.role == role


@pytest.mark.parametrize("value", [None, "short-secret"])
def test_secret_key_requires_at_least_32_characters(monkeypatch, value):
    if value is None:
        monkeypatch.delenv("SECRET_KEY", raising=False)
    else:
        monkeypatch.setenv("SECRET_KEY", value)

    with pytest.raises(RuntimeError, match="SECRET_KEY must be set"):
        get_secret_key()


def test_access_token_is_set_in_http_only_cookie():
    response = Response()
    set_access_cookie(response, "test-token")

    cookie = response.headers["set-cookie"]
    assert "access_token=test-token" in cookie
    assert "HttpOnly" in cookie
    assert "SameSite=lax" in cookie


class FakeQuery:
    def __init__(self, order):
        self.order = order

    def filter(self, *args):
        return self

    def first(self):
        return self.order


class FakeSession:
    def __init__(self, order):
        self.order = order

    def query(self, model):
        return FakeQuery(self.order)

    def commit(self):
        pass

    def refresh(self, order):
        pass


def make_pending_order():
    return SimpleNamespace(
        buyer_id=uuid4(),
        seller_id=uuid4(),
        status="pending",
        confirmed_at=None,
        delivered_at=None,
    )


def test_order_status_allows_actual_owner_regardless_of_role_name():
    order = make_pending_order()
    updated = update_order_status(FakeSession(order), "order-id", "confirmed", str(order.buyer_id), "farmer")
    assert updated.status == "confirmed"


def test_order_status_rejects_non_owner_even_with_marketplace_role():
    order = make_pending_order()
    with pytest.raises(ValueError, match="Not authorized"):
        update_order_status(FakeSession(order), "order-id", "confirmed", str(uuid4()), "farmer")


def test_database_schema_is_migration_managed():
    main_source = Path("ai-service/app/main.py").read_text(encoding="utf-8")
    migration_files = list(Path("ai-service/alembic/versions").glob("*.py"))

    assert "create_all" not in main_source
    assert migration_files


def test_disease_heuristic_fallback_is_explicit():
    from app.services.disease.detector import DiseaseDetector

    detector = DiseaseDetector.__new__(DiseaseDetector)
    detector.model_version = "v1"
    detector.model = None
    detector._HAS_CV2 = False

    result = detector._smart_detection(None, "teff")

    assert result["fallback_mode"] is True
    assert result["model_version"] == "v1"


def test_login_cookie_round_trip_authorizes_current_user():
    user_id = uuid4()
    token = create_access_token({"sub": str(user_id), "role": "farmer"})
    request = Request({
        "type": "http",
        "headers": [(b"cookie", f"access_token={token}".encode())],
    })
    user = SimpleNamespace(id=user_id, role="farmer")

    class UserQuery(FakeQuery):
        pass

    class UserSession:
        def query(self, model):
            return UserQuery(user)

    assert get_current_user(request, UserSession()).id == user_id