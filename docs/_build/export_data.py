"""Құжаттарды құрастыруға қажет деректерді кодтан JSON-ға шығарады (тапсырмалар, ЖИ нұсқаулығы, пилот нәтижесі)."""

import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, ROOT)
sys.path.insert(0, os.path.join(ROOT, "pilot"))

import ai_service  # noqa: E402
from model_answers import MODEL_ANSWERS  # noqa: E402
from tasks_data import LEVELS, POST_TEST, PRACTICAL_TASKS, TEST  # noqa: E402

def load_pilot(name):
    path = os.path.join(ROOT, "pilot", name)
    if not os.path.exists(path):
        return None
    with open(path, encoding="utf-8") as f:
        rows = json.load(f)
    if any(r.get("model") == "mock" for r in rows) or not any(r.get("ai_status") == "done" for r in rows):
        return None  # mock немесе толық сәтсіз іске қосу есепке кірмейді
    return rows


# v1 — сұраныстың алғашқы нұсқасы; pilot_results.json — соңғы іске қосу (v2 болуы мүмкін)
pilot_v1 = load_pilot("pilot_results_v1.json")
latest = load_pilot("pilot_results.json")
if pilot_v1 is None:
    pilot_v1 = latest
pilot_v2 = latest if latest and latest[0].get("prompt_version") != (pilot_v1 or [{}])[0].get("prompt_version") else None
pilot = pilot_v1

data = {
    "test": TEST,
    "tasks": PRACTICAL_TASKS,
    "system_instruction": ai_service.SYSTEM_INSTRUCTION,
    "prompt_version": ai_service.PROMPT_VERSION,
    "default_model": os.environ.get("GEMINI_MODEL", "gemini-3.8-flash"),
    "sample_prompt": ai_service.build_prompt(next(t for t in PRACTICAL_TASKS if t["task_id"] == "P1"), MODEL_ANSWERS[1]["answer"]),
    "post_test": POST_TEST,
    "levels": LEVELS,
    "select_instruction": ai_service.SELECT_INSTRUCTION,
    "select_prompt_version": ai_service.SELECT_PROMPT_VERSION,
    "hint_instruction": ai_service.HINT_INSTRUCTION,
    "hint_prompt_version": ai_service.HINT_PROMPT_VERSION,
    "model_answers": MODEL_ANSWERS,
    "pilot": pilot,
    "pilot_v2": pilot_v2,
    "fallback_model": os.environ.get("GEMINI_FALLBACK_MODELS", "gemini-3.1-flash-lite"),
}
with open(os.path.join(HERE, "data.json"), "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
print("data.json жазылды; пилот v1:", "бар" if pilot else "жоқ", "| v2:", "бар" if pilot_v2 else "жоқ")
