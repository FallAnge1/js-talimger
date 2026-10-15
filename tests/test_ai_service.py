"""Gemini шақыруының қайталау және қосалқы модельге көшу логикасы (желіге шықпай тексеріледі)."""

import json
import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import ai_service  # noqa: E402


class FakeResp:
    def __init__(self, status, text=""):
        self.status_code = status
        self._text = text

    def json(self):
        return {"candidates": [{"content": {"parts": [{"text": self._text}]}}]}


@pytest.fixture
def calls(monkeypatch):
    log = {"urls": [], "replies": []}

    def fake_post(url, **kwargs):
        log["urls"].append(url.split("/models/")[1].split(":")[0])
        return log["replies"].pop(0)

    monkeypatch.setenv("GEMINI_API_KEY", "test")
    monkeypatch.setenv("GEMINI_MODEL", "main-model")
    monkeypatch.setenv("GEMINI_FALLBACK_MODELS", "lite-model")
    monkeypatch.setattr(ai_service.requests, "post", fake_post)
    monkeypatch.setattr(ai_service.time, "sleep", lambda s: None)
    return log


def test_quota_error_switches_to_fallback_model(calls):
    calls["replies"] = [FakeResp(429), FakeResp(200, json.dumps({"ok": 1}))]
    model, text = ai_service._call_gemini("prompt")
    assert calls["urls"] == ["main-model", "lite-model"]
    assert model == "lite-model"


def test_overload_is_retried_on_same_model_first(calls):
    calls["replies"] = [FakeResp(503), FakeResp(200, "{}")]
    model, _ = ai_service._call_gemini("prompt")
    assert calls["urls"] == ["main-model", "main-model"]
    assert model == "main-model"


def test_timeout_switches_to_fallback_model(calls, monkeypatch):
    def fake_post(url, **kwargs):
        model = url.split("/models/")[1].split(":")[0]
        calls["urls"].append(model)
        if model == "main-model":
            raise ai_service.requests.Timeout()
        return FakeResp(200, "{}")

    monkeypatch.setattr(ai_service.requests, "post", fake_post)
    model, _ = ai_service._call_gemini("prompt")
    assert calls["urls"] == ["main-model", "lite-model"]
    assert model == "lite-model"


def test_all_models_unavailable_raises_ai_error(calls):
    calls["replies"] = [FakeResp(429), FakeResp(429)]
    with pytest.raises(ai_service.AIError):
        ai_service._call_gemini("prompt")
