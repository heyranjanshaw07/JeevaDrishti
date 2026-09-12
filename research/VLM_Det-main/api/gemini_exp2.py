"""Gemini backend for Experiment 2 (direct detection)."""
from __future__ import annotations

import time
from typing import Any, Dict, List, Optional

import requests

__all__ = ["GeminiAPI"]


class _RateLimiter:
    def __init__(self, max_requests: int, time_window: float):
        self.max_requests = max_requests
        self.time_window = time_window
        self.requests = 0
        self.start = time.time()

    def wait(self):
        now = time.time()
        if now - self.start > self.time_window:
            self.start = now
            self.requests = 0
        if self.requests >= self.max_requests:
            time.sleep(max(0, self.time_window - (now - self.start)))
            self.start = time.time()
            self.requests = 0
        self.requests += 1


class GeminiAPI:
    """Google Gemini wrapper mirroring the GPTAPI interface (Exp2 style)."""

    _BASE = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

    def __init__(self, api_key: str, model: str, *,
                 temperature: float = 1.0,
                 p_factor: float = 1.0,
                 thinking_budget: Optional[int] = None,
                 retries: int = 8,
                 delay: float = 5.0):
        self._api_key = api_key
        self._model = model
        self._temp = temperature
        self._top_p = p_factor
        self._thinking_budget = thinking_budget
        self._retries = retries
        self._delay = delay
        self._rl = _RateLimiter(max_requests=15, time_window=5)
        self._url = self._BASE.format(model=model)

    # -----------------------------------------------------------------
    def detect_objects(self, inputs: Dict[str, str], examples: Optional[List[Dict[str, Any]]] = None) -> str:
        self._rl.wait()

        parts: List[Dict[str, Any]] = [{"text": inputs["prompt"]}]
        if examples:
            parts.extend(examples)
        parts.extend([
            {"text": inputs["prompt"]},
            {"inline_data": {"mime_type": "image/jpeg", "data": inputs["image"]}},
        ])

        payload: Dict[str, Any] = {
            "contents": [{"parts": parts}],
            "generationConfig": {
                "temperature": self._temp,
                "topP": self._top_p,
                "maxOutputTokens": 4096,
                "response_mime_type": "application/json",
            },
        }

        if self._thinking_budget:
            payload["generationConfig"]["thinkingConfig"] = {
                "thinkingBudget": self._thinking_budget
            }

        url = f"{self._url}?key={self._api_key}"
        for attempt in range(self._retries):
            try:
                resp = requests.post(
                    url,
                    headers={"Content-Type": "application/json"},
                    json=payload,
                    timeout=60,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    return data["candidates"][0]["content"]["parts"][0]["text"]
                raise RuntimeError(f"HTTP {resp.status_code}: {resp.text[:200]}")
            except Exception:
                if attempt + 1 == self._retries:
                    raise
                time.sleep(self._delay)
