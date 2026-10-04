"""Internal service authentication for routes backend proxies.

This sits **alongside** ``role_guard``, it does not replace or weaken it. The
cookie path in ``role_guard.get_current_user`` is unchanged and remains the only
way a browser-originated request can authenticate.

Why a second mechanism exists at all: the backend holds a bearer session for the
user, not ai-service's ``access_token`` cookie. The cookie is ``HttpOnly``, is
issued only by ai-service's own ``/api/v1/auth/login`` (which nothing calls any
more), and is signed with a different key than the backend's ``JWT_SECRET`` —
verified on disk. So the backend has no credential ai-service would accept, and
the only ways out are to share a user credential or to give the backend its own.

This is the second option, narrowed as far as it goes:

- a separate secret (``INTERNAL_SERVICE_SECRET``), never ``SECRET_KEY``;
- ``typ: "internal"`` is required, so a user token cannot pass;
- the acting user is identified by ``X-Internal-Service-User`` and must exist in
  the database, so the header cannot name a phantom account;
- roles are taken from the database row, never from the token.

The signature is the trust boundary: the header alone grants nothing.
"""

from fastapi import Depends, Header, HTTPException, Request
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.internal_token import get_internal_service_secret
from app.database import get_db
from app.models.user import User

INTERNAL_TOKEN_HEADER = "X-Internal-Service-Token"
INTERNAL_USER_HEADER = "X-Internal-Service-User"

# A service token exists to cross one network hop, not to serve as a session.
INTERNAL_TOKEN_TYPE = "internal"


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(status_code=401, detail=detail)


def decode_internal_token(token: str, secret: str) -> dict:
    """Verify an internal token and return its claims.

    Split out from the dependency so it can be tested without a database.
    """
    try:
        payload = jwt.decode(token, secret, algorithms=[get_settings().algorithm])
    except JWTError:
        raise _unauthorized("Invalid internal service token")

    if payload.get("typ") != INTERNAL_TOKEN_TYPE:
        # A user access token signed with a colliding key must not be accepted.
        raise _unauthorized("Invalid internal service token")

    if not payload.get("sub"):
        raise _unauthorized("Invalid internal service token")

    return payload


def get_internal_service_user(
    request: Request,
    db: Session = Depends(get_db),
    x_internal_service_token: str | None = Header(
        default=None, alias=INTERNAL_TOKEN_HEADER
    ),
    x_internal_service_user: str | None = Header(
        default=None, alias=INTERNAL_USER_HEADER
    ),
) -> User:
    """Authenticate a backend-originated request without touching the cookie.

    Reads the token from the header only. It never falls back to
    ``request.cookies``, so a browser cannot reach an internal-only route by
    presenting a cookie, and the two mechanisms stay independent.
    """
    secret = get_internal_service_secret()
    if secret is None:
        # Fail closed: an unconfigured secret must not mean "no check".
        raise _unauthorized("Internal service authentication is not configured")

    if not x_internal_service_token:
        raise _unauthorized("Missing internal service token")

    payload = decode_internal_token(x_internal_service_token, secret)

    # The header names the user the backend has already authenticated. It is
    # only trusted once the signature above has been checked, and the row must
    # still exist here.
    acting_user_id = x_internal_service_user or payload.get("sub")
    user = db.query(User).filter(User.id == acting_user_id).first()
    if user is None:
        raise _unauthorized("User not found")

    return user


def require_internal_role(allowed_roles: list[str]):
    """Role gate for internal callers, mirroring ``require_role``'s shape.

    Roles come from the database row, so an internal token cannot assert a role
    the account does not hold.
    """

    def dependency(user: User = Depends(get_internal_service_user)) -> User:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied. Required role: {allowed_roles}",
            )
        return user

    return dependency