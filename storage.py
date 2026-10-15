"""Деректер қоры қабаты.

Негізгі режим — Firebase Firestore (бұлттық ДҚ). Firebase кілті бапталмаған жағдайда
әзірлеу мен тестілеуге арналған жергілікті JSON файл қолданылады.

Жинақтар: tasks, responses, ai_feedback, teacher_review, test_results.
"""

import json
import os
import threading


class LocalStore:
    """Әзірлеуге арналған жергілікті сақтау (JSON файлы). Бұлтта қолданылмайды."""

    name = "local"

    def __init__(self, path):
        self.path = path
        self.lock = threading.Lock()
        if path and os.path.exists(path):
            with open(path, encoding="utf-8") as f:
                self.data = json.load(f)
        else:
            self.data = {}

    def _save(self):
        if not self.path:
            return
        os.makedirs(os.path.dirname(self.path), exist_ok=True)
        tmp = self.path + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(self.data, f, ensure_ascii=False, indent=2)
        os.replace(tmp, self.path)

    def get(self, collection, doc_id):
        with self.lock:
            doc = self.data.get(collection, {}).get(doc_id)
            return dict(doc) if doc is not None else None

    def set(self, collection, doc_id, data, merge=False):
        with self.lock:
            col = self.data.setdefault(collection, {})
            if merge and doc_id in col:
                col[doc_id].update(data)
            else:
                col[doc_id] = dict(data)
            self._save()

    def create(self, collection, doc_id, data):
        """Құжат жоқ болса ғана жазады. Жазылса True, бұрыннан бар болса False қайтарады."""
        with self.lock:
            col = self.data.setdefault(collection, {})
            if doc_id in col:
                return False
            col[doc_id] = dict(data)
            self._save()
            return True

    def list(self, collection):
        with self.lock:
            return [dict(d) for d in self.data.get(collection, {}).values()]

    def query(self, collection, field, value):
        return [d for d in self.list(collection) if d.get(field) == value]


class FirestoreStore:
    """Firebase Firestore бұлттық деректер қоры."""

    name = "firestore"

    def __init__(self, cred_info=None, cred_path=None):
        import firebase_admin
        from firebase_admin import credentials, firestore

        cred = credentials.Certificate(cred_info if cred_info else cred_path)
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)
        self.db = firestore.client()

    def get(self, collection, doc_id):
        snap = self.db.collection(collection).document(doc_id).get()
        return snap.to_dict() if snap.exists else None

    def set(self, collection, doc_id, data, merge=False):
        self.db.collection(collection).document(doc_id).set(data, merge=merge)

    def create(self, collection, doc_id, data):
        from google.api_core.exceptions import AlreadyExists

        try:
            self.db.collection(collection).document(doc_id).create(data)
            return True
        except AlreadyExists:
            return False

    def list(self, collection):
        return [d.to_dict() for d in self.db.collection(collection).stream()]

    def query(self, collection, field, value):
        from google.cloud.firestore_v1.base_query import FieldFilter

        docs = self.db.collection(collection).where(filter=FieldFilter(field, "==", value)).stream()
        return [d.to_dict() for d in docs]


def create_store():
    """Орта айнымалыларына қарай сақтау түрін таңдайды.

    FIREBASE_CREDENTIALS_JSON — сервистік аккаунт кілтінің JSON мәтіні (Render үшін ыңғайлы);
    GOOGLE_APPLICATION_CREDENTIALS — сол кілт файлының жолы.
    STORAGE=local — Firebase-ті қолданбай, жергілікті файлмен жұмыс істеу.
    """
    mode = os.environ.get("STORAGE", "auto").lower()
    cred_json = os.environ.get("FIREBASE_CREDENTIALS_JSON")
    cred_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")

    if mode != "local" and (cred_json or cred_path):
        info = json.loads(cred_json) if cred_json else None
        return FirestoreStore(cred_info=info, cred_path=cred_path)
    if mode == "firestore":
        raise RuntimeError("STORAGE=firestore, бірақ Firebase кілті берілмеген.")

    path = os.environ.get("LOCAL_DB_PATH", os.path.join("instance", "local_db.json"))
    return LocalStore(path)
