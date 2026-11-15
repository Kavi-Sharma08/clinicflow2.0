"""Stage 2: train, compare, calibrate and save the specialization model.

Run from the ai-service/ folder (after analyze_dataset.py):

    python train.py

Pipeline
  1. Load dataset/clinicflow_cleaned.csv (symptom text only is used as input).
  2. Hold out a TEST set with StratifiedGroupKFold: near-duplicate paraphrases
     (same `group`) never straddle train/test.
  3. Compare candidate models with grouped, stratified 5-fold CV on the
     development part (macro-F1, NOT training accuracy).
  4. Calibrate the winner (sigmoid) and measure calibration out-of-fold.
  5. Choose an abstention threshold from out-of-fold predictions.
  6. Evaluate once on the held-out test set; write plots + report.
  7. Probe short/casual/unknown inputs (tests/probe_cases.json).
  8. Refit on ALL data and save with Joblib.

Nothing here is medically validated.
"""
import argparse
import json
import re
import warnings
from datetime import datetime, timezone
from pathlib import Path

import joblib
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
import sklearn
from sklearn.calibration import CalibratedClassifierCV
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (accuracy_score, classification_report,
                             confusion_matrix, f1_score)
from sklearn.model_selection import StratifiedGroupKFold
from sklearn.naive_bayes import ComplementNB
from sklearn.svm import LinearSVC

from app.text_utils import clean_text, known_token_count

warnings.filterwarnings("ignore")
ROOT = Path(__file__).parent
DATA = ROOT / "dataset" / "clinicflow_cleaned.csv"
MODELS = ROOT / "models"
REPORTS = ROOT / "reports"
MODELS.mkdir(exist_ok=True)
REPORTS.mkdir(exist_ok=True)

MODEL_VERSION = "1.0"
SEED = 42
TARGET_SELECTIVE_ACCURACY = 0.90   # accepted predictions should be >= 90% right (OOF)
MIN_KNOWN_TOKENS = 2               # unknown-symptom guard used by the API


def make_vectorizer() -> TfidfVectorizer:
    # The vectorizer cleans raw text itself, so the API can pass raw user text.
    return TfidfVectorizer(preprocessor=clean_text, ngram_range=(1, 2),
                           sublinear_tf=True, min_df=2, max_df=0.9)


CANDIDATES = {
    "LogReg C=1": lambda: LogisticRegression(C=1, max_iter=3000, class_weight="balanced"),
    "LogReg C=10": lambda: LogisticRegression(C=10, max_iter=3000, class_weight="balanced"),
    "LogReg C=100": lambda: LogisticRegression(C=100, max_iter=3000, class_weight="balanced"),
    "LinearSVC C=0.3": lambda: LinearSVC(C=0.3, class_weight="balanced"),
    "LinearSVC C=1": lambda: LinearSVC(C=1, class_weight="balanced"),
    "ComplementNB a=0.1": lambda: ComplementNB(alpha=0.1),
    "ComplementNB a=0.5": lambda: ComplementNB(alpha=0.5),
}


_SENT = re.compile(r"[.!?]+")
_CLAUSE = re.compile(r"[,;]| - ")


def make_crops(texts, labels, groups, per_row=3, seed=SEED):
    """Short 'user-style' fragments cut from long descriptions.

    Real users type a few words, the dataset has ~60-word narratives. Each
    crop is 1-3 consecutive clauses of one description. Crops inherit the
    parent's label AND group, so they can never leak across a split.
    """
    rng = np.random.default_rng(seed)
    out_t, out_y, out_g = [], [], []
    for text, lab, grp in zip(texts, labels, groups):
        clauses = [c.strip() for s_ in _SENT.split(text) for c in _CLAUSE.split(s_)
                   if len(c.split()) >= 2]
        if len(clauses) < 2:
            continue
        for _ in range(per_row):
            n = int(rng.integers(1, 4))
            start = int(rng.integers(0, max(1, len(clauses) - n + 1)))
            out_t.append(" ".join(clauses[start:start + n]))
            out_y.append(lab)
            out_g.append(grp)
    return np.array(out_t), np.array(out_y), np.array(out_g)


AUGMENT = False  # experiment only (--augment). It did NOT help, so it is off by default.


def augmented(idx, raw_text, y, groups):
    """Training rows = full descriptions + their short crops."""
    if not AUGMENT:
        return raw_text[idx], y[idx], groups[idx]
    ct, cy, cg = make_crops(raw_text[idx], y[idx], groups[idx])
    return (np.concatenate([raw_text[idx], ct]), np.concatenate([y[idx], cy]),
            np.concatenate([groups[idx], cg]))


def fit_calibrated(model, X, y, groups, seed=SEED):
    """Fit `model` with sigmoid calibration using GROUP-aware inner folds."""
    inner = list(StratifiedGroupKFold(3, shuffle=True, random_state=seed)
                 .split(X, y, groups))
    return CalibratedClassifierCV(model, method="sigmoid", cv=inner).fit(X, y)


def expected_calibration_error(prob, y_true_idx, bins=10):
    conf = prob.max(1)
    pred = prob.argmax(1)
    correct = (pred == y_true_idx).astype(float)
    edges = np.linspace(0, 1, bins + 1)
    ece = 0.0
    for lo, hi in zip(edges[:-1], edges[1:]):
        m = (conf > lo) & (conf <= hi)
        if m.any():
            ece += m.mean() * abs(correct[m].mean() - conf[m].mean())
    return ece


def multiclass_brier(prob, y_true_idx):
    onehot = np.eye(prob.shape[1])[y_true_idx]
    return float(((prob - onehot) ** 2).sum(1).mean())


def to_full_proba(cal, vec, texts, class_idx, n_classes):
    """predict_proba aligned to the global class order."""
    P = np.zeros((len(texts), n_classes))
    p = cal.predict_proba(vec.transform(texts))
    for j, c in enumerate(cal.classes_):
        P[:, class_idx[c]] = p[:, j]
    return P


def selective(P, yi, t):
    pred, conf = P.argmax(1), P.max(1)
    acc = conf >= t
    return acc.mean(), ((pred[acc] == yi[acc]).mean() if acc.any() else float("nan"))


def main() -> None:
    global AUGMENT
    ap = argparse.ArgumentParser()
    ap.add_argument("--augment", action="store_true",
                    help="experiment: also train on short crops (did not help; does not save a model)")
    args = ap.parse_args()
    AUGMENT = args.augment
    suffix = "_augmented_experiment" if AUGMENT else ""

    df = pd.read_csv(DATA)
    X_raw, y, groups = df.symptom_description.values, df.primary_specialty.values, df.group.values
    classes = sorted(set(y))
    K = len(classes)
    class_idx = {c: i for i, c in enumerate(classes)}
    yi = np.array([class_idx[c] for c in y])

    def crops_of(idx, seed):
        ct, cy, _ = make_crops(X_raw[idx], y[idx], groups[idx], seed=seed)
        return ct, np.array([class_idx[c] for c in cy])

    out = ["# Model evaluation report (generated by train.py)\n",
           f"- Rows: {len(df)}; classes: {K}; near-duplicate groups: {df.group.nunique()}",
           f"- scikit-learn {sklearn.__version__}; seed {SEED}; model version {MODEL_VERSION}",
           f"- Short-fragment training augmentation: {'ON (experiment)' if AUGMENT else 'OFF (shipped configuration)'}",
           "- Input = raw `symptom_description` text only. Leaky columns are not used.",
           "- NOT clinically validated. Scores come from a small, templated, probably synthetic dataset.",
           "- 'full' = original long descriptions; 'short' = 1-3 clause fragments cut from descriptions "
           "(a stand-in for brief user input, NOT real user text).\n"]

    # ---- 1. held-out test split (group-aware, stratified) ------------------
    splitter = StratifiedGroupKFold(5, shuffle=True, random_state=SEED)
    dev_idx, test_idx = next(splitter.split(X_raw, y, groups))
    assert not set(groups[dev_idx]) & set(groups[test_idx]), "group leakage!"
    out.append("## Split\n")
    out.append(f"- Development rows: {len(dev_idx)}; held-out test rows: {len(test_idx)} "
               f"(no shared near-duplicate group)")
    out.append(f"- Classes missing from test set: {sorted(set(classes) - set(y[test_idx])) or 'none'}\n")

    # ---- 2. model comparison via grouped CV on dev ---------------------------
    cv = StratifiedGroupKFold(5, shuffle=True, random_state=SEED + 1)
    rows = []
    for name, factory in CANDIDATES.items():
        ff, fs = [], []
        for tr, va in cv.split(X_raw[dev_idx], y[dev_idx], groups[dev_idx]):
            tr, va = dev_idx[tr], dev_idx[va]
            Xt, yt, _ = augmented(tr, X_raw, y, groups)
            vec = make_vectorizer().fit(Xt)
            m = factory().fit(vec.transform(Xt), yt)
            ff.append(f1_score(y[va], m.predict(vec.transform(X_raw[va])), average="macro"))
            ct, cyi = crops_of(va, SEED + 7)
            fs.append(f1_score(cyi, [class_idx[c] for c in m.predict(vec.transform(ct))], average="macro"))
        rows.append({"model": name, "f1_full": np.mean(ff), "f1_short": np.mean(fs),
                     "f1_short_std": np.std(fs), "score": (np.mean(ff) + np.mean(fs)) / 2})
        print(f"{name:20s} full {np.mean(ff):.3f}  short {np.mean(fs):.3f} +/- {np.std(fs):.3f}")
    comp = pd.DataFrame(rows).sort_values("score", ascending=False)
    comp.to_csv(REPORTS / f"model_comparison{suffix}.csv", index=False)
    best_name = comp.iloc[0]["model"]
    out.append("## Model comparison (grouped stratified 5-fold CV on development set, macro-F1)\n")
    out.append(comp.rename(columns={"score": "mean(full, short)"}).round(4).to_markdown(index=False))
    out.append(f"\nSelected: **{best_name}** (highest mean of full and short macro-F1). "
               "Candidates within one standard deviation are statistically indistinguishable.\n")
    print("Selected:", best_name)

    # ---- 3. out-of-fold calibrated probabilities on dev ----------------------
    factory = CANDIDATES[best_name]
    P_full = np.zeros((len(dev_idx), K))
    P_short, y_short = [], []
    oof_cv = StratifiedGroupKFold(5, shuffle=True, random_state=SEED + 2)
    for tr, va in oof_cv.split(X_raw[dev_idx], y[dev_idx], groups[dev_idx]):
        tr_g, va_g = dev_idx[tr], dev_idx[va]
        Xt, yt, gt = augmented(tr_g, X_raw, y, groups)
        vec = make_vectorizer().fit(Xt)
        cal = fit_calibrated(factory(), vec.transform(Xt), yt, gt)
        P_full[va] = to_full_proba(cal, vec, X_raw[va_g], class_idx, K)
        ct, cyi = crops_of(va_g, SEED + 11)
        P_short.append(to_full_proba(cal, vec, ct, class_idx, K)); y_short.append(cyi)
    P_short, y_short = np.vstack(P_short), np.concatenate(y_short)
    y_dev = yi[dev_idx]
    out.append("## Calibration (out-of-fold, development set)\n")
    for lab, P, yy in (("full", P_full, y_dev), ("short", P_short, y_short)):
        out.append(f"- {lab}: accuracy {accuracy_score(yy, P.argmax(1)):.3f}; macro-F1 "
                   f"{f1_score(yy, P.argmax(1), average='macro'):.3f}; "
                   f"ECE {expected_calibration_error(P, yy):.3f}; Brier {multiclass_brier(P, yy):.3f}")
    out.append("")

    # ---- 4. abstention threshold (tuned on SHORT-style out-of-fold data) -----
    grid = np.round(np.arange(0.20, 0.96, 0.01), 2)
    threshold = None
    curve = []
    for t in grid:
        cov, sel = selective(P_short, y_short, t)
        curve.append((t, cov, sel))
        if threshold is None and cov > 0 and sel >= TARGET_SELECTIVE_ACCURACY:
            threshold = float(t)
    threshold = threshold if threshold is not None else 0.50
    out.append("## Abstention threshold\n")
    out.append(f"- Chosen on short-fragment out-of-fold predictions: smallest threshold with "
               f"selective accuracy >= {TARGET_SELECTIVE_ACCURACY:.0%} -> **{threshold:.2f}**")
    for t in (0.3, 0.4, 0.5, 0.6, 0.7):
        cov, sel = selective(P_short, y_short, t)
        out.append(f"  - threshold {t:.1f}: coverage {cov:.0%}, accuracy when shown {sel:.3f}")
    out.append("")
    conf_s, pred_s = P_short.max(1), P_short.argmax(1)
    plt.figure(figsize=(5, 5))
    edges = np.linspace(0, 1, 11)
    xs, ys_ = [], []
    for lo, hi in zip(edges[:-1], edges[1:]):
        m = (conf_s > lo) & (conf_s <= hi)
        if m.sum() >= 5:
            xs.append(conf_s[m].mean()); ys_.append((pred_s[m] == y_short[m]).mean())
    plt.plot([0, 1], [0, 1], "--", color="gray", label="perfect")
    plt.plot(xs, ys_, "o-", color="#2a6f97", label="model (out-of-fold, short input)")
    plt.axvline(threshold, color="#c1121f", ls=":", label=f"abstain below {threshold:.2f}")
    plt.xlabel("stated confidence"); plt.ylabel("actual accuracy")
    plt.title("Reliability diagram"); plt.legend(); plt.tight_layout()
    plt.savefig(REPORTS / f"calibration_curve{suffix}.png", dpi=150); plt.close()

    # ---- 5. held-out test evaluation (used once) ------------------------------
    Xt, yt, gt = augmented(dev_idx, X_raw, y, groups)
    vec = make_vectorizer().fit(Xt)
    cal = fit_calibrated(factory(), vec.transform(Xt), yt, gt)
    Pt = to_full_proba(cal, vec, X_raw[test_idx], class_idx, K)
    ct, cyi = crops_of(test_idx, SEED + 13)
    Ps = to_full_proba(cal, vec, ct, class_idx, K)
    y_test = yi[test_idx]
    out.append("## Held-out test set (group-aware split, evaluated once)\n")
    for lab, P, yy in (("full", Pt, y_test), ("short", Ps, cyi)):
        pred = P.argmax(1)
        top3 = np.mean([yy[i] in np.argsort(-P[i])[:3] for i in range(len(yy))])
        cov, sel = selective(P, yy, threshold)
        out.append(f"- **{lab}** (n={len(yy)}): accuracy **{accuracy_score(yy, pred):.3f}**, macro-F1 "
                   f"**{f1_score(yy, pred, average='macro'):.3f}**, top-3 {top3:.3f}; at threshold "
                   f"{threshold:.2f}: coverage {cov:.1%}, accuracy when shown {sel:.3f}; "
                   f"ECE {expected_calibration_error(P, yy):.3f}")
        rep = classification_report(yy, pred, labels=range(K), target_names=classes,
                                    output_dict=True, zero_division=0)
        pd.DataFrame(rep).T.round(3).to_csv(REPORTS / f"classification_report_{lab}{suffix}.csv")
        out.append(f"\n### Class-wise precision / recall / F1 ({lab})\n")
        out.append(pd.DataFrame(rep).T.round(3).to_markdown()); out.append("")
        cm = confusion_matrix(yy, pred, labels=range(K))
        plt.figure(figsize=(10, 8))
        sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", xticklabels=classes, yticklabels=classes, cbar=False)
        plt.xlabel("predicted"); plt.ylabel("true"); plt.title(f"Confusion matrix (held-out test, {lab})")
        plt.xticks(rotation=45, ha="right"); plt.tight_layout()
        plt.savefig(REPORTS / f"confusion_matrix_{lab}{suffix}.png", dpi=150); plt.close()
    out.append("- Caveat: test data is the same templated style as training data; short fragments are "
               "derived from it. Neither predicts accuracy on real user text (see probe section).\n")
    acc_t = accuracy_score(y_test, Pt.argmax(1)); f1_t = f1_score(y_test, Pt.argmax(1), average="macro")

    # ---- 6. probe: short / casual / unknown inputs ---------------------------
    probe = json.loads((ROOT / "tests" / "probe_cases.json").read_text())
    Xa, ya, ga = augmented(np.arange(len(df)), X_raw, y, groups)
    full_vec = make_vectorizer().fit(Xa)
    full_cal = fit_calibrated(factory(), full_vec.transform(Xa), ya, ga)

    def predict_text(text):
        known = known_token_count(full_vec.vocabulary_, text)
        p = full_cal.predict_proba(full_vec.transform([text]))[0]
        order = np.argsort(-p)
        return known, full_cal.classes_[order[0]], float(p[order[0]]), [full_cal.classes_[k] for k in order[:3]]

    n = len(probe["cases"]); top1 = top3p = shown = shown_correct = 0
    probe_rows = []
    for case in probe["cases"]:
        known, lab, cf, top = predict_text(case["text"])
        abstain = known < MIN_KNOWN_TOKENS or cf < threshold
        ok = lab == case["expected"]
        top1 += ok; top3p += case["expected"] in top
        if not abstain:
            shown += 1; shown_correct += ok
        probe_rows.append((case["text"], case["expected"], lab, round(cf, 2), ", ".join(top), "abstain" if abstain else "shown"))
    unk_rows, unk_abstain = [], 0
    for text in probe["unknown_inputs"]:
        known, lab, cf, _ = predict_text(text)
        abstain = known < MIN_KNOWN_TOKENS or cf < threshold
        unk_abstain += abstain
        unk_rows.append((text, lab, round(cf, 2), "abstain" if abstain else "SHOWN"))
    nu = len(probe["unknown_inputs"])
    out.append("## Probe: short, casual and unknown inputs (author-written, not validated, never tuned on)\n")
    out.append(f"- {n} short symptom phrases: top-1 correct {top1}/{n} ({top1/n:.0%}); "
               f"expected specialty within top-3 {top3p}/{n} ({top3p/n:.0%})")
    out.append(f"- Suggestions shown after abstention rules: {shown}/{n}; top-1 correct among shown: {shown_correct}/{shown}")
    out.append(f"- {nu} unknown/non-medical inputs: abstained {unk_abstain}/{nu}\n")
    out.append("| input | expected | top-1 | confidence | top-3 | outcome |\n|---|---|---|---|---|---|")
    out += [f"| {a} | {b} | {c} | {d} | {e} | {f} |" for a, b, c, d, e, f in probe_rows]
    out.append("\nUnknown inputs:\n\n| input | predicted | confidence | outcome |\n|---|---|---|---|")
    out += [f"| {a} | {b} | {c} | {d} |" for a, b, c, d in unk_rows]
    print(f"probe top1 {top1}/{n}, top3 {top3p}/{n}, shown {shown} (correct {shown_correct}), unknown abstained {unk_abstain}/{nu}")

    # ---- 7. save the final model (fit on ALL rows) ---------------------------
    if not AUGMENT:
        artifact = {
            "model_version": MODEL_VERSION,
            "trained_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "algorithm": best_name,
            "vectorizer": full_vec,
            "classifier": full_cal,
            "classes": list(full_cal.classes_),
            "abstain_threshold": threshold,
            "min_known_tokens": MIN_KNOWN_TOKENS,
            "sklearn_version": sklearn.__version__,
        }
        joblib.dump(artifact, MODELS / "specialty_model.joblib", compress=3)
        meta = {k: v for k, v in artifact.items() if k not in ("vectorizer", "classifier")}
        meta.update({"test_accuracy_full": round(acc_t, 4), "test_macro_f1_full": round(f1_t, 4),
                     "disclaimer": "Prototype trained on a small unverified dataset. Not medically validated."})
        (MODELS / "model_metadata.json").write_text(json.dumps(meta, indent=2))
        out.append("\n## Saved artifacts\n")
        out.append("- `models/specialty_model.joblib` (vectorizer + calibrated classifier, refit on all rows)")
        out.append("- `models/model_metadata.json`")
    (REPORTS / f"evaluation_report{suffix}.md").write_text("\n".join(out) + "\n", encoding="utf-8")
    print(f"\nTest(full) acc {acc_t:.3f}, macro-F1 {f1_t:.3f}, threshold {threshold:.2f}")


if __name__ == "__main__":
    main()
