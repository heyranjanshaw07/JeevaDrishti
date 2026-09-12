"""Anthropic backend for Experiment 2 (direct detection)."""
from __future__ import annotations

import time
import requests
from typing import Any, Dict, List, Optional


__all__ = ["AnthropicAPI"]


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


class AnthropicAPI:
    """Anthropic wrapper mirroring the Exp2 Gemini interface, with optional thinking budget."""

    _BASE = "https://api.anthropic.com/v1/messages"

    def __init__(self, api_key: str, model: str, *,
                 max_tokens: int = 8096,
                 temperature: float = 1.0, p_factor: float = 1.0,
                 thinking_budget: Optional[int] = None,
                 retries: int = 8,
                 delay: float = 5.0):
        self._api_key = api_key
        self._model = model
        self.max_tokens = max_tokens
        self._thinking_budget = thinking_budget
        self.temperature = temperature
        self.p_factor = p_factor
        self._retries = retries
        self._delay = delay
        self._rl = _RateLimiter(max_requests=5, time_window=1)
        self._url = self._BASE
        self._headers = {
            "Content-Type": "application/json",
            "x-api-key": self._api_key,
            "anthropic-version": "2023-06-01",
        }

    # -----------------------------------------------------------------
    def detect_objects(self, inputs: Dict[str, str], examples: Optional[List[Dict[str, Any]]] = None) -> str:
        """Submit a prompt + image (with optional examples) and return raw text result."""
        self._rl.wait()

        messages: List[Dict[str, Any]] = []
        if examples:
            messages.extend(examples)

        # Main prompt + image
        messages.append({
            "role": "user",
            "content": [
                {"type": "text", "text": inputs["prompt"]},
                {"type": "image", "source": {
                    "type": "base64",
                    "media_type": "image/jpeg",
                    "data": inputs["image"],
                }},
            ],
        })

        payload: Dict[str, Any] = {
            "model": self._model,
            "messages": messages,
            "temperature": self.temperature,
            "top_p": self.p_factor,
            "max_tokens": self.max_tokens
        }

        if self._thinking_budget:
            payload["thinking"] = {
                "type": "enabled",
                "budget_tokens": self._thinking_budget,
            }

        for attempt in range(self._retries):
            try:
                resp = requests.post(self._url, headers=self._headers, json=payload, timeout=60)
                if resp.status_code == 200:
                    data = resp.json()
                    if "content" in data and data["content"]:
                        if self._thinking_budget:
                            return data["content"][1]["text"].strip()
                        else:
                            return data["content"][0]["text"].strip()
                    raise RuntimeError(f"Unexpected API response format: {data}")
                raise RuntimeError(f"HTTP {resp.status_code}: {resp.text[:200]}")
            except Exception:
                if attempt + 1 == self._retries:
                    raise
                time.sleep(self._delay)
