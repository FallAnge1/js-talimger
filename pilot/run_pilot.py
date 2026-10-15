"""Модельдік жауаптарды нақты ЖИ (Gemini) арқылы талдап, педагог бағасымен салыстырады.

Іске қосу (жоба қалтасынан, GEMINI_API_KEY бапталған болуы тиіс):
    python pilot/run_pilot.py            # барлық жауапты қайта талдау
    python pilot/run_pilot.py --resume   # тек жаңа және сәтсіз жауаптарды талдау

Нәтижелер:
    pilot/pilot_results.json — толық нәтиже (есеп пен ЖИ журналын құрастыру үшін);
    pilot/pilot_results.csv  — анонимдендірілген CSV деректер үлгісі.
"""

import csv
import json
import os
import sys
import time
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import ai_service  # noqa: E402
from envfile import load_env_file  # noqa: E402
from model_answers import MODEL_ANSWERS  # noqa: E402
from tasks_data import PRACTICAL_TASKS  # noqa: E402

OUT_DIR = os.path.dirname(os.path.abspath(__file__))
TASKS = {t["task_id"]: t for t in PRACTICAL_TASKS}


def main():
    load_env_file()
    if os.environ.get("AI_PROVIDER", "gemini") == "mock":
        print("AI_PROVIDER=mock: нақты ЖИ нәтижесі емес, есепке пайдаланбаңыз.")
    json_path = os.path.join(OUT_DIR, "pilot_results.json")
    previous = {}
    if "--resume" in sys.argv and os.path.exists(json_path):
        with open(json_path, encoding="utf-8") as f:
            previous = {r["model_answer_id"]: r for r in json.load(f)}
    results = []
    for i, m in enumerate(MODEL_ANSWERS, start=1):
        task = TASKS[m["task_id"]]
        prev = previous.get(m["id"])
        if (prev and prev["ai_status"] in ("done", "invalid") and prev["answer_text"] == m["answer"]
                and prev.get("prompt_version") == ai_service.PROMPT_VERSION):
            prev.update(response_code=f"R{i:02d}", teacher_score=m["teacher_score"], teacher_note=m["teacher_note"], kind=m["kind"])
            prev["diff"] = prev["teacher_score"] - prev["ai_score"] if prev.get("ai_score") is not None else None
            results.append(prev)
            print(f"{prev['response_code']} бұрынғы нәтиже сақталды")
            continue
        row = {
            "response_code": f"R{i:02d}",
            "model_answer_id": m["id"],
            "task_id": m["task_id"],
            "task_version": task["version"],
            "kind": m["kind"],
            "answer_text": m["answer"],
            "teacher_score": m["teacher_score"],
            "teacher_note": m["teacher_note"],
            "max_score": task["max_score"],
            "requested_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "attempts": (prev.get("attempts", 1) if prev else 0) + 1,
            "failed_attempts": (prev.get("failed_attempts", []) if prev else [])
            + ([prev["problems"][0]] if prev and prev["ai_status"] == "failed" else []),
        }
        try:
            res = ai_service.analyze_answer(task, m["answer"])
            fb = res["feedback"] or {}
            row.update(
                ai_status=res["status"],
                model=res["model"],
                prompt_version=res["prompt_version"],
                ai_score=fb.get("suggested_score"),
                strengths=fb.get("strengths", []),
                errors=fb.get("errors", []),
                recommendation=fb.get("recommendation", ""),
                criteria_scores=fb.get("criteria_scores", []),
                needs_review=fb.get("needs_review"),
                problems=res["problems"],
                raw_text=res["raw_text"],
            )
        except ai_service.AIError as exc:
            row.update(ai_status="failed", ai_score=None, problems=[str(exc)])
        row["diff"] = (
            row["teacher_score"] - row["ai_score"] if row.get("ai_score") is not None else None
        )
        results.append(row)
        print(f"{row['response_code']} {m['task_id']} {m['kind']}: ЖИ={row.get('ai_score')} педагог={m['teacher_score']} [{row['ai_status']}]")
        time.sleep(4)  # тегін лимитті (минутына сұраныс саны) асырмау үшін

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    with open(os.path.join(OUT_DIR, "pilot_results.csv"), "w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f)
        w.writerow(["response_code", "task_id", "task_version", "kind", "answer_text", "ai_status", "model",
                    "prompt_version", "ai_score", "teacher_score", "max_score", "diff_teacher_minus_ai",
                    "ai_errors", "teacher_note"])
        for r in results:
            w.writerow([r["response_code"], r["task_id"], r["task_version"], r["kind"], r["answer_text"],
                        r["ai_status"], r.get("model", ""), r.get("prompt_version", ""),
                        "" if r.get("ai_score") is None else r["ai_score"], r["teacher_score"], r["max_score"],
                        "" if r["diff"] is None else r["diff"], " | ".join(r.get("errors", [])), r["teacher_note"]])

    ok = sum(r["ai_status"] == "done" for r in results)
    compared = [r for r in results if r["diff"] is not None]
    print(f"\nСәтті ЖИ талдауы: {ok}/{len(results)}")
    if compared:
        mad = sum(abs(r["diff"]) for r in compared) / len(compared)
        print(f"ЖИ мен педагог бағасының орташа абсолют айырмасы: {mad:.2f} балл")
    print("Нәтижелер pilot/ қалтасына жазылды.")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
