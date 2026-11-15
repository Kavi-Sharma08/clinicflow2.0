"""Model loading + prediction used by the API (app/main.py).

Serving rules mirror train.py: raw text goes straight into the saved
vectorizer (it cleans text itself), and we ABSTAIN when the text has too few
known words or the top confidence is below the threshold saved with the model.
"""
from __future__ import annotations

import json
from pathlib import Path

import joblib
import numpy as np

from app.text_utils import known_token_count

ROOT = Path(__file__).resolve().parent.parent
MODEL_PATH = ROOT / "models" / "specialty_model.joblib"
META_PATH = ROOT / "models" / "model_metadata.json"

DISCLAIMER = (
    "Automated suggestion from a prototype model. It is not a diagnosis and not "
    "medical advice. If this may be an emergency, call your local emergency number."
)


class SpecialtyModel:
    def __init__(self, path: Path = MODEL_PATH) -> None:
        artifact = joblib.load(path)
        self.vectorizer = artifact["vectorizer"]
        self.classifier = artifact["classifier"]
        self.classes: list[str] = list(artifact["classes"])
        self.threshold: float = float(artifact["abstain_threshold"])
        self.min_known: int = int(artifact["min_known_tokens"])
        self.version: str = str(artifact["model_version"])
        self.meta = json.loads(META_PATH.read_text()) if META_PATH.exists() else {}

    def predict(self, text: str, top_k: int = 3) -> dict:
        text = (text or "").strip()
        known = known_token_count(self.vectorizer.vocabulary_, text)
        base = {"model_version": self.version, "disclaimer": DISCLAIMER}

        if known < self.min_known:
            return {**base, "abstained": True, "reason": "not_enough_symptom_detail", "suggestions": []}

        proba = self.classifier.predict_proba(self.vectorizer.transform([text]))[0]
        order = np.argsort(-proba)[:top_k]
        suggestions = [
            {"specialty": str(self.classifier.classes_[i]), "confidence": round(float(proba[i]), 4)}
            for i in order
        ]
        if suggestions[0]["confidence"] < self.threshold:
            return {**base, "abstained": True, "reason": "low_confidence", "suggestions": []}

        return {
            **base,
            "abstained": False,
            "reason": None,
            # Emergency Medicine is not a bookable clinic specialty: the UI shows an urgent notice.
            "urgent": suggestions[0]["specialty"] == "Emergency Medicine",
            "suggestions": suggestions,
        }
