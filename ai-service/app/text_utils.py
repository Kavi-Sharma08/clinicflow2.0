"""Text cleaning shared by training (train.py) and the API (app/predict.py).

Keeping ONE cleaning function for both is important: if training and serving
clean text differently, the model silently performs worse in production.

We deliberately do not remove stop-words: words like "not", "no", "without"
change the meaning of a symptom ("no chest pain"), and TF-IDF already
down-weights very common words.
"""
import re

_NON_LETTERS = re.compile(r"[^a-z\s]")
_SPACES = re.compile(r"\s+")


def clean_text(text: str) -> str:
    """Lower-case, keep letters only, collapse whitespace."""
    if not isinstance(text, str):
        return ""
    text = text.lower().replace("'", "")  # "can't" -> "cant"
    text = _NON_LETTERS.sub(" ", text)
    return _SPACES.sub(" ", text).strip()


from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS


def known_token_count(vocabulary: dict, text: str) -> int:
    """How many distinct, meaningful (non stop-word) words of `text` the model knows.

    Used as an unknown-symptom guard: "my car will not start" or "asdfgh"
    contain (almost) no words the model learned, so we abstain.
    """
    tokens = set(clean_text(text).split()) - ENGLISH_STOP_WORDS
    return sum(1 for t in tokens if t in vocabulary)
