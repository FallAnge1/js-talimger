"""Деңгейлік жол: диагностикалық тест → ЖИ таңдаған тапсырма → қорытынды тест."""

import csv
import io
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import ai_service  # noqa: E402
from test_app import GOOD_ANSWER, ai_calls, app, client, login_participant  # noqa: E402,F401

from app import make_response_id  # noqa: E402
from tasks_data import POST_TEST, TEST, level_for_score  # noqa: E402


def answers_for(test, n_correct):
    """Алғашқы n_correct сұраққа дұрыс, қалғанына қате жауап."""
    out = {}
    for i, q in enumerate(test["questions"]):
        out[q["id"]] = str(q["correct"] if i < n_correct else (q["correct"] + 1) % len(q["options"]))
    return out


def test_levels_by_score():
    assert [level_for_score(s) for s in (0, 4, 5, 7, 8, 10)] == ["low", "low", "mid", "mid", "high", "high"]


def test_practical_task_locked_without_pretest(client, ai_calls):
    login_participant(client, pretest=False)
    resp = client.get("/task/P1")
    assert resp.status_code == 302 and "/test" in resp.headers["Location"]
    assert client.get("/posttest").status_code == 302


def test_pretest_assigns_task_of_level_by_ai(client, app, ai_calls):
    ai_calls["select_reply"] = json.dumps({"task_ids": ["A2"], "reason": "Циклдерді бекітуге көмектеседі."}, ensure_ascii=False)
    login_participant(client, pretest=False)
    page = client.post("/test", data=answers_for(TEST, 3), follow_redirects=True).get_data(as_text=True)
    a = app.store.get("assignments", "JS-001")
    assert a["level"] == "low" and a["task_ids"] == ["A2"] and a["chosen_by"] == "ai"
    assert "Бастапқы" in page and "Циклдерді бекітуге көмектеседі." in page
    # ЖИ-ге тек осы деңгейдің тапсырмалары және әлсіз тақырыптар жіберіледі
    prompt = ai_calls["select_prompts"][0]
    assert "A1:" in prompt and "P1:" not in prompt and "C1:" not in prompt
    # басқа деңгейдің тапсырмасы ашылмайды
    resp = client.get("/task/C1")
    assert resp.status_code == 302 and resp.headers["Location"].endswith("/tasks")
    assert client.get("/task/A2").status_code == 200


def test_invalid_ai_choice_falls_back_to_topic_match(client, app, ai_calls):
    ai_calls["select_reply"] = json.dumps({"task_ids": ["Z9"], "reason": "?"})
    login_participant(client, pretest=False)
    client.post("/test", data=answers_for(TEST, 9))  # жоғары деңгей, тек DOM (q10) қате
    a = app.store.get("assignments", "JS-001")
    assert a["level"] == "high" and a["chosen_by"] == "auto" and a["task_ids"] == ["C3"]  # C3 — DOM тапсырмасы


def test_ai_unavailable_still_assigns(client, app, ai_calls):
    ai_calls["select_reply"] = ai_service.AIError("HTTP 503")
    login_participant(client, pretest=False)
    client.post("/test", data=answers_for(TEST, 6))
    a = app.store.get("assignments", "JS-001")
    assert a["level"] == "mid" and a["chosen_by"] == "auto" and len(a["task_ids"]) == 1


def test_posttest_flow_and_level_change(client, app, ai_calls):
    ai_calls["select_reply"] = json.dumps({"task_ids": ["A2"], "reason": "ok"})
    login_participant(client, pretest=False)
    client.post("/test", data=answers_for(TEST, 3))
    # тапсырма орындалмай тұрып қорытынды тест жабық
    resp = client.get("/posttest")
    assert resp.status_code == 302 and resp.headers["Location"].endswith("/tasks")

    client.post("/task/A2", data={"answer": "function sumTo(n) { let s = 0; for (let i = 1; i <= n; i++) s += i; return s; }"})
    assert client.get("/posttest").status_code == 200
    page = client.post("/posttest", data=answers_for(POST_TEST, 8), follow_redirects=True).get_data(as_text=True)
    post = app.store.get("post_test_results", "JS-001")
    assert post["score"] == 8 and post["level"] == "high" and post["test_id"] == "TEST2"
    assert "Деңгей көтерілді" in page and "+5 балл" in page
    # қайта тапсыру нәтижені өзгертпейді
    client.post("/posttest", data=answers_for(POST_TEST, 1))
    assert app.store.get("post_test_results", "JS-001")["score"] == 8

    client.post("/researcher/login", data={"password": "test-pass"})
    text = client.get("/researcher/export/tests.csv").get_data(as_text=True).lstrip("﻿")
    row = next(csv.DictReader(io.StringIO(text), delimiter=";"))
    assert (row["pre_score"], row["pre_level"], row["assigned_tasks"], row["post_score"], row["post_level"],
            row["score_gain"], row["level_change"]) == ("3", "low", "A2", "8", "high", "5", "2")
    stats = client.get("/researcher").get_data(as_text=True)
    assert "1 / 1" in stats and "көтерілді" in stats


def test_feedback_page_offers_posttest(client, ai_calls):
    login_participant(client, tasks=("P1",))
    client.post("/task/P1", data={"answer": GOOD_ANSWER})
    page = client.get(f"/feedback/{make_response_id('JS-001', 'P1')}").get_data(as_text=True)
    assert "Келесі қадам: қорытынды тест" in page
