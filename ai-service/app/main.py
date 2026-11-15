"""ClinicFlow AI service (FastAPI).

Run from the ai-service folder:
    uvicorn app.main:app --host 127.0.0.1 --port 8000
"""
from __future__ import annotations

import os
import secrets
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

from app.predict import SpecialtyModel

API_KEY = os.getenv("AI_SERVICE_API_KEY", "").strip()  # optional shared secret with the Node server
_state: dict[str, SpecialtyModel] = {}


@asynccontextmanager
async def lifespan(_: FastAPI):
    _state["model"] = SpecialtyModel()  # load once at startup, not per request
    yield
    _state.clear()


app = FastAPI(title="ClinicFlow AI Service", version="1.0", lifespan=lifespan)


def require_key(x_api_key: str | None = Header(default=None)) -> None:
    if API_KEY and not secrets.compare_digest(x_api_key or "", API_KEY):
        raise HTTPException(status_code=401, detail="Invalid API key")


class PredictIn(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)


@app.get("/health")
def health():
    model = _state.get("model")
    return {"status": "ok" if model else "loading", "model_version": model.version if model else None}


@app.post("/predict", dependencies=[Depends(require_key)])
def predict(body: PredictIn):
    return _state["model"].predict(body.text)
