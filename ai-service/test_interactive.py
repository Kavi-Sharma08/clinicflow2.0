"""Interactive model test script.

Run from ai-service/:
    python test_interactive.py
"""
import json
import sys
from pathlib import Path

# Add parent directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from app.predict import SpecialtyModel

def run_automated_suite(model: SpecialtyModel):
    probe_path = Path(__file__).parent / "tests" / "probe_cases.json"
    if not probe_path.exists():
        print("probe_cases.json not found.")
        return

    with open(probe_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    cases = data.get("cases", [])
    print(f"\n==========================================")
    print(f"  RUNNING TEST CASES ({len(cases)} medical queries)")
    print(f"==========================================\n")

    correct = 0
    for idx, c in enumerate(cases, 1):
        res = model.predict(c["text"])
        suggestions = res.get("suggestions", [])
        top_pred = suggestions[0]["specialty"] if suggestions else "(ABSTAINED)"
        top_conf = suggestions[0]["confidence"] if suggestions else 0.0

        is_match = (top_pred == c["expected"])
        if is_match:
            correct += 1
            status = "✓ PASS"
        else:
            status = "✗ FAIL"

        print(f"[{status}] Case {idx:2d}: \"{c['text']}\"")
        print(f"         Predicted: {top_pred} ({top_conf*100:.1f}%) | Expected: {c['expected']}")

    acc = (correct / len(cases)) * 100
    print(f"\n>>> Total Score: {correct}/{len(cases)} ({acc:.1f}% accuracy)")

    print(f"\n==========================================")
    print(f"  TESTING NON-MEDICAL / GIBBERISH INPUTS")
    print(f"  (Model should safely ABSTAIN from guessing)")
    print(f"==========================================\n")

    unknowns = data.get("unknown_inputs", [])
    for u in unknowns:
        res = model.predict(u)
        abstained = res.get("abstained")
        reason = res.get("reason")
        status = "✓ PASS (Abstained)" if abstained else "✗ FAIL (Did not abstain)"
        print(f"[{status}] Input: \"{u}\" -> reason: {reason}")


def interactive_mode(model: SpecialtyModel):
    print("\n==========================================")
    print("  INTERACTIVE CLINICFLOW AI TESTER")
    print("  Type any symptoms (or 'exit' to quit)")
    print("==========================================\n")

    while True:
        try:
            user_input = input("Enter symptoms > ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nExiting.")
            break

        if not user_input:
            continue
        if user_input.lower() in ("exit", "quit", "q"):
            print("Exiting test.")
            break

        res = model.predict(user_input)

        if res.get("abstained"):
            print(f"  -> Model ABSTAINED (Refused to guess). Reason: {res.get('reason')}")
            print("     (Symptoms were too vague, non-medical, or confidence was below 50%)\n")
        else:
            if res.get("urgent"):
                print("  -> ⚠️  FLAGGED AS URGENT / EMERGENCY MEDICINE")
            print("  -> Top Recommended Specialties:")
            for s in res.get("suggestions", []):
                bar = "█" * int(s["confidence"] * 20)
                print(f"     • {s['specialty']:<20} {s['confidence']*100:>5.1f}% | {bar}")
            print()


if __name__ == "__main__":
    print("Loading saved model from models/specialty_model.joblib...")
    try:
        model = SpecialtyModel()
        print(f"Model v{model.version} loaded successfully!")
    except Exception as e:
        print(f"Error loading model: {e}")
        sys.exit(1)

    print("\nSelect testing option:")
    print("1) Run automated test suite (42 medical symptoms + 8 junk inputs)")
    print("2) Interactive tester (type your own symptoms)")
    print("3) Run both")

    try:
        choice = input("\nEnter choice (1, 2, or 3) [default: 3]: ").strip()
    except (KeyboardInterrupt, EOFError):
        choice = "1"

    if choice == "1":
        run_automated_suite(model)
    elif choice == "2":
        interactive_mode(model)
    else:
        run_automated_suite(model)
        interactive_mode(model)
