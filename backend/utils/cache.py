import json
from pathlib import Path
from functools import wraps

CACHE_DIR = Path(".cache")
CACHE_DIR.mkdir(exist_ok=True)


def cache_response(key: str, data):
    path = CACHE_DIR / f"{key}.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f)


def load_cached(key: str):
    path = CACHE_DIR / f"{key}.json"
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None


def cached(ttl_seconds: int = 3600):
    # ttl not used in this simple version
    def deco(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            key = (
                func.__name__
                + "_"
                + "_".join(map(str, args))
                + "_"
                + "_".join(f"{k}:{v}" for k, v in kwargs.items())
            )
            key_safe = key.replace(" ", "_").replace("/", "_")[:200]
            cached_data = load_cached(key_safe)
            if cached_data is not None:
                return cached_data
            res = func(*args, **kwargs)
            try:
                cache_response(key_safe, res)
            except Exception:
                pass
            return res

        return wrapper

    return deco
