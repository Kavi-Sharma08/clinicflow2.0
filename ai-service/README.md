# ClinicFlow AI service – specialization model

Run from this folder:

    pip install -r requirements.txt
    python analyze_dataset.py     # merges + cleans the 2 CSVs in dataset/
    python train.py               # trains, evaluates, saves models/specialty_model.joblib (~10 s)

Quick test of the saved model:

    python -c "import joblib,numpy as np;a=joblib.load('models/specialty_model.joblib');t='knee pain when walking';p=a['classifier'].predict_proba(a['vectorizer'].transform([t]))[0];print([(a['classes'][i],round(float(p[i]),2)) for i in np.argsort(-p)[:3]])"

Suggestions below confidence 0.50 must be treated as "no reliable suggestion".
Prototype only; not medically validated.

## Run as an API (used by the ClinicFlow server)

    uvicorn app.main:app --host 127.0.0.1 --port 8000

- `GET  /health`  -> `{"status":"ok","model_version":"1.0"}`
- `POST /predict` with `{"text":"knee pain when walking"}` -> suggestions, or `abstained: true`

Optional: set `AI_SERVICE_API_KEY` here and in the Node server's `.env` so only the server can call it.
The model file is git-ignored; commit/deploy `models/specialty_model.joblib` yourself or run `python train.py` on the host.
Use scikit-learn 1.9.1 (pinned) so the saved model loads.
