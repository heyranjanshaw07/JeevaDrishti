"""GPT backend for Experiment 2 (direct detection).
The *interface* is intentionally minimal: a single `detect_objects` method that
returns the raw JSON string produced by the model. Parsing & metric handling
is done upstream by *exp2.py*.
"""
from __future__ import annotations

import json
import time
from typing import Any, Dict, List, Optional

import requests

__all__ = ["GPTAPI"]


class _RateLimiter:
    def __init__(self, max_requests: int, time_window: float):
        self.max_requests = max_requests
        self.time_window = time_window
        self.requests = 0
        self.start = time.time()

    def wait(self):
        now = time.time()
        if now - self.start > self.time_window:
            self.start = now; self.requests = 0
        if self.requests >= self.max_requests:
            time.sleep(max(0, self.time_window - (now - self.start)))
            self.start = time.time(); self.requests = 0
        self.requests += 1


class GPTAPI:
    """Thin wrapper around *chat completions* for image‑based detection prompts.

    Parameters
    ----------
    api_key : str
        Your OpenAI API key (inherited from environment by *exp2.py*).
    model   : str
        Model name, e.g. "gpt-4o-2024-08-06".
    temperature, p_factor : float
        Sampling params forwarded to the API.
    retries, delay : int | float
        Retry logic on non‑2xx responses or malformed payloads.
    """

    _ENDPOINT = "https://api.openai.com/v1/chat/completions"

    def __init__(self, api_key: str, model: str, *, temperature: float = 1.0, p_factor: float = 1.0,
                 retries: int = 8, delay: float = 4.0):
        self._headers = {"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"}
        self._model = model
        self._temp = temperature
        self._top_p = p_factor
        self._retries = retries
        self._delay = delay
        self._rl = _RateLimiter(max_requests=20, time_window=1)

    # -----------------------------------------------------------------
    def detect_objects(self, inputs: Dict[str, str], examples: Optional[List[Dict[str, Any]]] = None) -> str:
        """Synchronously call the model and return **raw** content (string)."""
        self._rl.wait()

        content: List[Dict[str, Any]] = [{"type": "text", "text": inputs["prompt"]}]
        if examples:
            content.extend(examples)
        content.extend([
            {"type": "text", "text": inputs["prompt"]},
            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{inputs['image']}", "detail": "high"}},
        ])

        payload = {
            "model": self._model,
            "temperature": self._temp,
            "top_p": self._top_p,
            "messages": [{"role": "user", "content": content}],
        }

        for attempt in range(self._retries):
            try:
                resp = requests.post(self._ENDPOINT, headers=self._headers, json=payload, timeout=60)
                if resp.status_code == 200:
                    data = resp.json()
                    return data["choices"][0]["message"]["content"]
                raise RuntimeError(f"HTTP {resp.status_code}: {resp.text[:200]}")
            except Exception as exc:
                if attempt + 1 == self._retries:
                    raise
                time.sleep(self._delay)

