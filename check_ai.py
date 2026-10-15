"""Серверден ЖИ API-іне қысқа сынақ сұранысын жіберу (әдістемелік нұсқаулық, 9-бөлім, 3–4-қадам).

Қолданылуы (GEMINI_API_KEY орта айнымалысы бапталған болуы тиіс):
    python check_ai.py
    python check_ai.py P2 "function findMax(a) { let m = 0; for (const x of a) if (x > m) m = x; return m; }"
Нәтиже ЖИ қолдану журналына жауап үлгісі ретінде қосылуы мүмкін.
"""

import json
import sys

import ai_service
from envfile import load_env_file
from tasks_data import PRACTICAL_TASKS

SAMPLE = "function getEvenNumbers(numbers) {\n  return numbers.filter(n => n % 2 === 0);\n}\nfilter әдісі шартқа сай элементтерді жаңа массивке жинайды."


def main():
    load_env_file()
    task_id = sys.argv[1] if len(sys.argv) > 1 else "P1"
    answer = sys.argv[2] if len(sys.argv) > 2 else SAMPLE
    task = next(t for t in PRACTICAL_TASKS if t["task_id"] == task_id)
    try:
        result = ai_service.analyze_answer(task, answer)
    except ai_service.AIError as exc:
        print("ЖИ сервисіне қосылу сәтсіз:", exc)
        sys.exit(1)
    print("Модель:", result["model"], "| сұраныс нұсқасы:", result["prompt_version"], "| мәртебе:", result["status"])
    if result["problems"]:
        print("Құрылым қателері:", result["problems"])
    print(json.dumps(result["feedback"], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
