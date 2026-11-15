"""Run from ai-service/:  python tests/smoke_test.py   (no web framework needed)"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.predict import SpecialtyModel  # noqa: E402

m = SpecialtyModel()
assert m.predict("knee pain when walking")["suggestions"][0]["specialty"] == "Orthopedics"
assert m.predict("itchy red rash on my arms")["suggestions"][0]["specialty"] == "Dermatology"
assert m.predict("my car will not start")["abstained"] is True
assert m.predict("asdfgh")["abstained"] is True
print("ai-service smoke test OK")
