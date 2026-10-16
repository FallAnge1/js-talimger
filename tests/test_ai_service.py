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


# ---------- қосалқы тегін ЖИ (Groq) ----------

class FakeChat:
    def __init__(self, status, content=""):
        self.status_code = status
        self._content = content

    def json(self):
        return {"choices": [{"message": {"content": self._content}}]}


@pytest.fixture
def backup(monkeypatch):
    log = {"bodies": [], "gemini": 0}

    def fake_gemini(prompt, system=None, schema=None, temperature=0.2):
        log["gemini"] += 1
        raise ai_service.AIError("Gemini API қатесі: HTTP 429")

    def fake_post(url, json=None, headers=None, timeout=None):
        log["bodies"].append(json)
        if "replies" in log:
            return log["replies"].pop(0)
        return log["reply"]

    monkeypatch.setenv("GROQ_API_KEY", "test")
    monkeypatch.setenv("BACKUP_AI_MODEL", "test-model")
    monkeypatch.delenv("AI_FORCE_BACKUP", raising=False)
    monkeypatch.delenv("BACKUP_AI_KEY", raising=False)
    monkeypatch.delenv("BACKUP_AI_MODELS", raising=False)
    monkeypatch.setattr(ai_service, "_call_gemini", fake_gemini)
    monkeypatch.setattr(ai_service.time, "sleep", lambda s: None)
    monkeypatch.setattr(ai_service.requests, "post", fake_post)
    return log


def test_backup_used_when_gemini_fails(backup):
    backup["reply"] = FakeChat(200, '{"hint": "Кеңес"}')
    model, text = ai_service._call_ai("prompt", system="SYS", schema=ai_service.HINT_SCHEMA)
    assert model == "groq:test-model" and text == '{"hint": "Кеңес"}'
    body = backup["bodies"][0]
    assert body["response_format"] == {"type": "json_object"}
    assert body["messages"][0]["content"].startswith("SYS") and '"hint"' in body["messages"][0]["content"]


def test_backup_feedback_is_validated_like_gemini(backup):
    import json as _json
    from tasks_data import PRACTICAL_TASKS

    reply = {"strengths": ["ok"], "errors": [], "recommendation": "Жарайсыз", "criteria_scores": [],
             "suggested_score": 8, "needs_review": False}
    backup["reply"] = FakeChat(200, _json.dumps(reply, ensure_ascii=False))
    result = ai_service.analyze_answer(PRACTICAL_TASKS[0], "function f(){ return 1; }")
    assert result["status"] == "done" and result["model"] == "groq:test-model"
    assert result["feedback"]["suggested_score"] == 8


def test_both_providers_fail_raises_combined_error(backup):
    backup["reply"] = FakeChat(429)
    with pytest.raises(ai_service.AIError) as err:
        ai_service._call_ai("prompt")
    assert "Gemini" in str(err.value) and "Қосалқы ЖИ" in str(err.value)


def test_no_backup_key_keeps_gemini_error(backup, monkeypatch):
    monkeypatch.delenv("GROQ_API_KEY")
    with pytest.raises(ai_service.AIError) as err:
        ai_service._call_ai("prompt")
    assert backup["bodies"] == [] and "Gemini" in str(err.value)


def test_force_backup_skips_gemini(backup, monkeypatch):
    monkeypatch.setenv("AI_FORCE_BACKUP", "1")
    backup["reply"] = FakeChat(200, "{}")
    ai_service._call_ai("prompt")
    assert backup["gemini"] == 0 and len(backup["bodies"]) == 1


def test_backup_model_chain_on_rate_limit(backup, monkeypatch):
    monkeypatch.setenv("BACKUP_AI_MODELS", "big-model, second-model")
    backup["replies"] = [FakeChat(429), FakeChat(200, "{}")]
    model, _ = ai_service._call_ai("prompt")
    assert [b["model"] for b in backup["bodies"]] == ["big-model", "second-model"]
    assert model == "groq:second-model"


def test_backup_retries_invalid_json_once(backup, monkeypatch):
    monkeypatch.setenv("BACKUP_AI_MODELS", "big-model")
    backup["replies"] = [FakeChat(400), FakeChat(200, "{}")]
    model, _ = ai_service._call_ai("prompt")
    assert len(backup["bodies"]) == 2 and model == "groq:big-model"


def test_default_chain_excludes_unsafe_model(backup, monkeypatch):
    monkeypatch.delenv("BACKUP_AI_MODEL")
    backup["replies"] = [FakeChat(429), FakeChat(429)]
    with pytest.raises(ai_service.AIError):
        ai_service._call_ai("prompt")
    used = [b["model"] for b in backup["bodies"]]
    assert used == ["openai/gpt-oss-120b", "qwen/qwen3.8-27b"] and "openai/gpt-oss-20b" not in used


def test_probe_reports_each_model(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "g")
    monkeypatch.setenv("GEMINI_MODEL", "main")
    monkeypatch.setenv("GEMINI_FALLBACK_MODELS", "lite")
    monkeypatch.setenv("GROQ_API_KEY", "k")
    monkeypatch.setenv("BACKUP_AI_MODELS", "big,small")
    monkeypatch.setattr(ai_service.time, "sleep", lambda s: None)

    def fake_post(url, json=None, headers=None, timeout=None):
        if "generativelanguage" in url:
            return FakeResp(429) if "/main:" in url else FakeResp(200, '{"ok": true}')
        return FakeChat(200, '{"ok": true}') if json["model"] == "big" else FakeChat(429)

    monkeypatch.setattr(ai_service.requests, "post", fake_post)
    res = ai_service.probe()
    assert [(r["provider"], r["model"], r["ok"]) for r in res] == [
        ("Gemini", "main", False), ("Gemini", "lite", True), ("Groq", "big", True), ("Groq", "small", False)]
