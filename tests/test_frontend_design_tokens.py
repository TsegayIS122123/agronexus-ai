"""Guard against design-token drift between the TypeScript source and Tailwind.

A duplicated ``frontend/lib/theme.js`` once held a *different* token set from
``frontend/lib/theme.ts``. Because ``tailwind.config.js`` loaded the JavaScript
copy, ``transitionDuration``, ``transitionTimingFunction``, and ``zIndex`` were
defined for TypeScript consumers but never reached Tailwind -- so every
``duration-*`` and ``z-*`` class built from the token system silently did
nothing. The duplicate has been removed and ``theme.ts`` is the single source,
which makes this test the thing that fails if that ever regresses.
"""

import re
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[1]
THEME_TS = REPO_ROOT / "frontend/lib/theme.ts"
TAILWIND_CONFIG = REPO_ROOT / "frontend/tailwind.config.js"
THEME_JS = REPO_ROOT / "frontend/lib/theme.js"

# Keys the token system is required to expose. These are the groups that
# disappeared from Tailwind's view when the token file was duplicated.
REQUIRED_TOKEN_GROUPS = (
    "colors",
    "fontFamily",
    "fontSize",
    "spacing",
    "borderRadius",
    "boxShadow",
    "transitionDuration",
    "transitionTimingFunction",
    "zIndex",
)


def _top_level_keys(source: str) -> set[str]:
    """Return the two-space-indented keys of TAILWIND_EXTENSION."""
    marker = source.index("TAILWIND_EXTENSION")
    body = source[marker:]
    return set(re.findall(r"^ {2}([A-Za-z][A-Za-z0-9]*):", body, re.MULTILINE))


@pytest.fixture(scope="module")
def theme_source() -> str:
    return THEME_TS.read_text(encoding="utf-8")


@pytest.fixture(scope="module")
def tailwind_config_source() -> str:
    return TAILWIND_CONFIG.read_text(encoding="utf-8")


def test_javascript_token_duplicate_is_not_reintroduced():
    """A second token file would let Tailwind and components drift again."""
    assert not THEME_JS.exists(), (
        "frontend/lib/theme.js must not come back. frontend/lib/theme.ts is the "
        "single source of truth; tailwind.config.js loads it directly."
    )


def test_tailwind_config_reads_the_typescript_token_source(tailwind_config_source):
    assert "require('./lib/theme')" in tailwind_config_source
    assert "require('./lib/theme.js')" not in tailwind_config_source
    assert "theme: {" in tailwind_config_source
    assert "extend: TAILWIND_EXTENSION" in tailwind_config_source


@pytest.mark.parametrize("group", REQUIRED_TOKEN_GROUPS)
def test_theme_defines_required_token_group(group, theme_source):
    keys = _top_level_keys(theme_source)
    assert group in keys, (
        f"theme.ts is missing the '{group}' token group, so Tailwind would not "
        f"generate classes for it. Present: {sorted(keys)}"
    )


def test_ethiopic_font_stack_is_preserved(theme_source):
    """The Ethiopic stack lived only in the deleted theme.js; losing it would
    silently break Amharic and Tigrinya rendering."""
    assert "ethiopic:" in theme_source
    assert "NotoSansEthiopic" in theme_source
    assert "AbyssinicaSIL" in theme_source


def test_skip_link_target_exists_in_root_layout():
    """SkipLink.tsx navigates to #main-content. If <main> has no such id the
    skip link is inert and WCAG 2.4.1 (Bypass Blocks) fails."""
    layout = (REPO_ROOT / "frontend/app/layout.tsx").read_text(encoding="utf-8")

    assert 'id="main-content"' in layout
    assert "tabIndex={-1}" in layout


def test_frontend_declares_lint_and_typecheck_scripts():
    """README documents `format -> lint -> type check -> tests`; the scripts had
    to exist for that to be runnable."""
    import json

    scripts = json.loads(
        (REPO_ROOT / "frontend/package.json").read_text(encoding="utf-8")
    )["scripts"]

    assert scripts.get("typecheck") == "tsc --noEmit"
    assert "lint" in scripts


def test_compose_defines_frontend_service_with_service_hostname():
    """The rewrite runs inside the container, so it must address ai-service by
    compose name. localhost would resolve to the frontend container itself."""
    import yaml

    compose = yaml.safe_load(
        (REPO_ROOT / "docker-compose.yml").read_text(encoding="utf-8")
    )
    services = compose["services"]

    assert "frontend" in services
    frontend = services["frontend"]
    assert frontend["ports"] == ["3000:3000"]
    assert frontend["environment"]["AI_SERVICE_URL"] == "http://ai-service:8000"
    assert "ai-service" in frontend["depends_on"]
