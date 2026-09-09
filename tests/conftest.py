import os
import sys
from pathlib import Path

os.environ.setdefault("SECRET_KEY", "test-secret-key-that-is-at-least-32-chars")
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))
