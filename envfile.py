"""Жергілікті іске қосу үшін .env файлынан орта айнымалыларын жүктеу.

.env файлы репозиторийге жіберілмейді (.gitignore). Бұлтта (Render) айнымалылар панельде беріледі,
сондықтан онда бұл файл жоқ. Бар айнымалылар қайта жазылмайды.
"""

import os

ROOT = os.path.dirname(os.path.abspath(__file__))


def load_env_file(path=os.path.join(ROOT, ".env")):
    if not os.path.exists(path):
        return
    with open(path, encoding="utf-8-sig") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key, value = key.strip(), value.strip().strip('"').strip("'")
            if key and value and key not in os.environ:
                os.environ[key] = value
